// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

import './interfaces/paraswap/IParaSwapAugustus.sol';
import './interfaces/paraswap/IParaSwapAugustusRegistry.sol';
import "./interfaces/balancer-v2/IVault.sol";
import "./interfaces/balancer-v2/IFlashLoanRecipient.sol";
import "./interfaces/aave-v3/IPool.sol";
import "./interfaces/aave-v3/IPoolAddressesProvider.sol";
import "./interfaces/aave-v3/IPoolDataProvider.sol";
import "./interfaces/aave-v3/IPriceOracleGetter.sol";
import './interfaces/aave-v3/IAToken.sol';
import './interfaces/IERC20.sol';
import './libraries/DataTypes.sol';
import './libraries/ReserveConfiguration.sol';
// import 'hardhat/console.sol';

contract AaveApePlusV2 is IFlashLoanRecipient {

    event Ape(address ape, string action, address apeAsset, address borrowAsset, uint256 borrowAmount, uint256 interestRateMode);

    IVault private constant vault = IVault(0xBA12222222228d8Ba445958a75a0704d566BF2C8); // const value for all chains

    struct ParaSwapData {
        address augustus;
        address srcAsset;
        address destAsset;
        uint256 srcAmount;
        bytes swapCallData;
    }
    
    IParaSwapAugustusRegistry public immutable AUGUSTUS_REGISTRY;
    IPoolAddressesProvider public immutable ADDRESSES_PROVIDER;

    constructor(
        address lendingPoolAddressesProviderAddress,
        IParaSwapAugustusRegistry augustusRegistry
    ) {
        require(!augustusRegistry.isValidAugustus(address(0)), 'Not a valid Augustus address');
        AUGUSTUS_REGISTRY = augustusRegistry;
        ADDRESSES_PROVIDER = IPoolAddressesProvider(lendingPoolAddressesProviderAddress);
    }

    function LENDING_POOL() public view returns (IPool) {
        address _lendingPoolAddress = ADDRESSES_PROVIDER.getPool();
        return IPool(_lendingPoolAddress);
    }

    function getPriceOracle() internal view returns (IPriceOracleGetter) {
        address _priceOracleAddress = ADDRESSES_PROVIDER.getPriceOracle();
        return IPriceOracleGetter(_priceOracleAddress);
    }

    function getProtocolDataProvider() internal view returns (IPoolDataProvider)  {
        return IPoolDataProvider(ADDRESSES_PROVIDER.getPoolDataProvider());
    }

    function getAaveAssetReserveData(address asset) public view returns (DataTypes.ReserveData memory) {
        return LENDING_POOL().getReserveData(asset);
    }
    
    function getMaxCollateralAmount(address apeAsset, address borrowAsset, uint256 borrowAmount) internal view returns (uint256) {

        (uint256 borrowAssetDecimals, , , , , , , , , ) = getProtocolDataProvider().getReserveConfigurationData(borrowAsset);
        uint256 borrowAmountBase =  borrowAmount/ 10 ** borrowAssetDecimals * getPriceOracle().getAssetPrice(borrowAsset);

        uint256 assetAmount = getAssetAmount(apeAsset, borrowAmountBase);
        uint256 maxAmount = assetAmount * 103 / 100;
        return  maxAmount;
    }

    // return asset amount with its decimals
    function getAssetAmount(address asset, uint256 amountIn) public view returns (uint256) {
        //All V3 markets use USD based oracles which return values with 8 decimals.
        uint256 assetPrice = getPriceOracle().getAssetPrice(asset); 
        (uint256 decimals, , , , , , , , , ) = getProtocolDataProvider().getReserveConfigurationData(asset);
        uint256 assetAmount = amountIn * 10**decimals / assetPrice;
        return assetAmount;
    }

    // lever up your position
    function flashApe(address apeAsset, address borrowAsset, uint256 borrowAmount,uint256 interestRateMode, ParaSwapData memory psp) external returns (bool) {
        require(borrowAmount > 0, "borrow amount should be greater than 0");
        require(interestRateMode == 1 || interestRateMode == 2, "interestRateMode must be 1 for stable rate or 2 for variable rate");

        bytes memory params = abi.encode(
            psp,
            apeAsset,
            borrowAsset,
            interestRateMode,
            msg.sender,
            false
        );

        _flashLoan(borrowAsset, borrowAmount, params);

        (, , , , , uint256 newHealthFactor) = LENDING_POOL().getUserAccountData(msg.sender);
        require(newHealthFactor > 1e18, "health factor < 1 !");

        emit Ape(msg.sender, 'flashApe', apeAsset, borrowAsset, borrowAmount, interestRateMode);
        return true;
    }

    function flashUnwind(address apeAsset, address borrowAsset, uint256 borrowAmountToRepay, uint256 interestRateMode, ParaSwapData memory psp) public {
        require(borrowAmountToRepay > 0, "repay amount should be greater than 0");
        require(interestRateMode == 1 || interestRateMode == 2, "interestRateMode must be 1 for stable rate or 2 for variable rate");

        (uint256 apeAssetAToken, , , , , , , ,bool assetAsCollateral) = getProtocolDataProvider().getUserReserveData(apeAsset, msg.sender);

        require(apeAssetAToken > 0, "ape asset balance is 0");
        require(assetAsCollateral, "ape asset is not collateral");
        

        (, uint256 stableDebt, uint256 variableDebt, , , , , , ) = getProtocolDataProvider().getUserReserveData(borrowAsset, msg.sender);
        uint256 debtAmount = stableDebt;
        if (interestRateMode == 2) {
            debtAmount = variableDebt;
        }
        require(borrowAmountToRepay <= debtAmount, "repay amount is greater than debt amount");

        bytes memory params = abi.encode(
            psp,
            apeAsset,
            borrowAsset,
            interestRateMode,
            msg.sender,
            true
        );

        _flashLoan(borrowAsset, borrowAmountToRepay, params);

        emit Ape(msg.sender, 'flashUnwind', apeAsset, borrowAsset, borrowAmountToRepay, interestRateMode);
    }

    function _checkVaultLiquidity(address flashToken, uint256 amount) internal view returns (bool) {
        return IERC20(flashToken).balanceOf(address(vault)) >= amount;
    }

    function _flashLoan(address asset, uint256 amount, bytes memory params) internal {
        if (_checkVaultLiquidity(asset, amount)) {
            // balancer vault flashloan
            IERC20[] memory flashLoanAssets = new IERC20[](1);
            flashLoanAssets[0] = IERC20(asset);
            uint256[] memory flashLoanAmounts = new uint256[](1);
            flashLoanAmounts[0] = amount;
            vault.flashLoan(this, flashLoanAssets, flashLoanAmounts, params);
        } else {
            // aave flashloan
            address[] memory flashLoanAssets = new address[](1);
            flashLoanAssets[0] = asset;
            uint256[] memory flashLoanAmounts = new uint256[](1);
            flashLoanAmounts[0] = amount;
            uint256[] memory modes = new uint256[](1);
            modes[0] = 0;

            address onBehalfOf = address(this);
            uint16 referralCode = 0;

            LENDING_POOL().flashLoan(address(this), flashLoanAssets, flashLoanAmounts, modes, onBehalfOf, params, referralCode);
        }
    }


    function _paraSwap(ParaSwapData memory psp) internal returns (bool) {
        IParaSwapAugustus augustus = IParaSwapAugustus(psp.augustus);

        require(AUGUSTUS_REGISTRY.isValidAugustus(address(augustus)), 'INVALID_AUGUSTUS');

        IERC20 assetToSwapFrom = IERC20(psp.srcAsset);
        address tokenTransferProxy = augustus.getTokenTransferProxy();
        assetToSwapFrom.approve(tokenTransferProxy, psp.srcAmount);

        (bool success, ) = address(augustus).call(psp.swapCallData);
        if (!success) {
            // Copy revert reason from call
            assembly {
                returndatacopy(0, 0, returndatasize())
                revert(0, returndatasize())
            }
        }

        return success;
    }
    
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external returns (bool) {
        require(msg.sender == ADDRESSES_PROVIDER.getPool(), 'only the lending pool can call this function');
        require(initiator == address(this), 'the ape did not initiate this flashloan');

        uint256 repayAmount = amounts[0] + premiums[0];
        _runApe(repayAmount, params, false);

        return true;
    }

    function receiveFlashLoan(
        IERC20[] memory tokens,
        uint256[] memory amounts,
        uint256[] memory feeAmounts,
        bytes memory userData
    ) external override {
        require(msg.sender == address(vault), 'caller is not the vault');
        
        uint256 repayAmount = amounts[0] + feeAmounts[0];
        _runApe(repayAmount, userData, true);
    }

    function _runApe(uint256 repayAmount, bytes memory userData, bool isVaultFlash) internal returns (bool){
        (
            ParaSwapData memory psp,
            address apeAsset,
            address borrowAsset,
            uint256 interestRateMode,
            address apeAddress,
            bool isFlashUnwind
        ) = abi.decode(userData, (ParaSwapData, address, address, uint256, address, bool));
        
        IPool _lendingPool = LENDING_POOL();
        address _lendingPoolAdress = ADDRESSES_PROVIDER.getPool();

        if (isFlashUnwind) {
            uint256 borrowAssetBalance = IERC20(borrowAsset).balanceOf(address(this));

            //aave repay minus fee guarantee flash loan repay amount
            uint256 feeAmount = repayAmount - borrowAssetBalance;
            uint256 repayToPool = borrowAssetBalance - feeAmount;

            IERC20(borrowAsset).approve(_lendingPoolAdress, repayToPool); 
            _lendingPool.repay(borrowAsset, repayToPool, interestRateMode, apeAddress);

            uint256 maxCollateralAmount =  getMaxCollateralAmount(apeAsset, borrowAsset, borrowAssetBalance);

            DataTypes.ReserveData memory reserve = getAaveAssetReserveData(apeAsset);
            IERC20 _aToken = IERC20(reserve.aTokenAddress);

            if (_aToken.balanceOf(apeAddress) < maxCollateralAmount) {
                maxCollateralAmount = _aToken.balanceOf(apeAddress);
            }
            // transfer the aTokens to this address, then withdraw the Tokens from Aave
            _aToken.transferFrom(apeAddress, address(this), maxCollateralAmount);

            _lendingPool.withdraw(apeAsset, maxCollateralAmount, address(this));

            _paraSwap(psp);

            uint256 apeAssetBalance = IERC20(apeAsset).balanceOf(address(this));
            if (apeAssetBalance > 0) {
                IERC20(apeAsset).approve(_lendingPoolAdress, apeAssetBalance);
                _lendingPool.supply(apeAsset, apeAssetBalance, apeAddress, 0);
            }

            if (isVaultFlash) {
                IERC20(borrowAsset).transfer(msg.sender, repayAmount);
            } else {
                IERC20(borrowAsset).approve(_lendingPoolAdress, repayAmount);
            }
        } else {
            // Swap flashLoanAmount to apeAsset  DAI - > ETH
            _paraSwap(psp);

            uint256 apeAssetBalance = IERC20(apeAsset).balanceOf(address(this));
            IERC20(apeAsset).approve(_lendingPoolAdress, apeAssetBalance);
            _lendingPool.supply(apeAsset, apeAssetBalance, apeAddress, 0);

            // Borrow from Aave
            _lendingPool.borrow(borrowAsset, repayAmount, interestRateMode, 0, apeAddress);
            if (isVaultFlash) {
                IERC20(borrowAsset).transfer(msg.sender, repayAmount);
            } else {
                IERC20(borrowAsset).approve(_lendingPoolAdress, repayAmount);
            }
        }

        return true;
    }
}
