// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

import './AaveUniswapBase.sol';
import './interfaces/uniswap-v3/IUniswapV3Factory.sol';
import './interfaces/uniswap-v3/IUniswapV3Pool.sol';
import './interfaces/aave-v3/IAToken.sol';
import './interfaces/paraswap/IParaSwapAugustus.sol';
import './interfaces/paraswap/IParaSwapAugustusRegistry.sol';
import "./interfaces/balancer-v2/IVault.sol";
import "./interfaces/balancer-v2/IFlashLoanRecipient.sol";

import './libraries/ReserveConfiguration.sol';
import './libraries/TickMath.sol';
import './libraries/WadRayMath.sol';
import './libraries/PercentageMath.sol';
import './libraries/SafeERC20.sol';

// import 'hardhat/console.sol';

contract AaveApePlusV2 is AaveUniswapBase, IFlashLoanRecipient {
    using SafeERC20 for IERC20;
    using WadRayMath for uint256;
    using PercentageMath for uint256;

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

    constructor(
        address lendingPoolAddressesProviderAddress,
        address uniswapRouterAddress,
        IParaSwapAugustusRegistry augustusRegistry
    ) AaveUniswapBase(lendingPoolAddressesProviderAddress, uniswapRouterAddress) {
        require(!augustusRegistry.isValidAugustus(address(0)), 'Not a valid Augustus address');
        AUGUSTUS_REGISTRY = augustusRegistry;
    }

    function getAvailableBorrowInAsset(address borrowAsset, address ape) public view returns (uint256) {
        // availableBorrowsBase V3 USD based
        (, , uint256 availableBorrowsBase, , , ) = LENDING_POOL().getUserAccountData(ape);
        return getAssetAmount(borrowAsset, availableBorrowsBase);
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

        IERC20[] memory flashLoanAssets = new IERC20[](1);
        flashLoanAssets[0] = IERC20(borrowAsset);
        uint256[] memory flashLoanAmounts = new uint256[](1);
        flashLoanAmounts[0] = borrowAmount;

        vault.flashLoan(this, flashLoanAssets, flashLoanAmounts, abi.encode(
            psp,
            apeAsset,
            borrowAsset,
            interestRateMode,
            msg.sender,
            false
        ));
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

        IERC20[] memory flashLoanAssets = new IERC20[](1);
        flashLoanAssets[0] = IERC20(borrowAsset);
        uint256[] memory flashLoanAmounts = new uint256[](1);
        flashLoanAmounts[0] = borrowAmountToRepay;
        
        vault.flashLoan(this, flashLoanAssets, flashLoanAmounts, abi.encode(
            psp,
            apeAsset,
            borrowAsset,
            interestRateMode,
            msg.sender,
            true
        ));

        emit Ape(msg.sender, 'flashUnwind', apeAsset, borrowAsset, borrowAmountToRepay, interestRateMode);
    }


    function _paraSwap(ParaSwapData memory psp) internal returns (bool) {
        IParaSwapAugustus augustus = IParaSwapAugustus(psp.augustus);

        require(AUGUSTUS_REGISTRY.isValidAugustus(address(augustus)), 'INVALID_AUGUSTUS');

        IERC20 assetToSwapFrom = IERC20(psp.srcAsset);
        address tokenTransferProxy = augustus.getTokenTransferProxy();
        assetToSwapFrom.safeApprove(tokenTransferProxy, 0);
        assetToSwapFrom.safeApprove(tokenTransferProxy, psp.srcAmount);

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

    function receiveFlashLoan(
        IERC20[] memory tokens,
        uint256[] memory amounts,
        uint256[] memory feeAmounts,
        bytes memory userData
    ) external override {
        require(msg.sender == address(vault), 'caller is not the vault');
        
        (
            ParaSwapData memory psp,
            address apeAsset,
            address borrowAsset,
            uint256 interestRateMode,
            address apeAddress,
            bool isFlashUnwind
        ) = abi.decode(userData, (ParaSwapData, address, address, uint256, address, bool));
        
        // uint256 flashLoanAmount = amounts[0];
        uint256 repayAmount = amounts[0] + feeAmounts[0];

        IPool _lendingPool = LENDING_POOL();

        if (isFlashUnwind) {
            uint256 swapedBorrowAssetBalance = IERC20(borrowAsset).balanceOf(address(this));

            IERC20(borrowAsset).approve(ADDRESSES_PROVIDER.getPool(), swapedBorrowAssetBalance);
            _lendingPool.repay(borrowAsset, swapedBorrowAssetBalance, interestRateMode, apeAddress);

            uint256 maxCollateralAmount = getAvailableBorrowInAsset(apeAsset, apeAddress);

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
                IERC20(apeAsset).approve(ADDRESSES_PROVIDER.getPool(), apeAssetBalance);
                _lendingPool.supply(apeAsset, apeAssetBalance, apeAddress, 0);
            }

            //flash swap repay
            IERC20(borrowAsset).transfer(msg.sender, repayAmount);
        } else {
            // Swap flashLoanAmount to apeAsset  DAI - > ETH
            _paraSwap(psp);

            uint256 swapedApeAssetBalance = IERC20(apeAsset).balanceOf(address(this));

            IERC20(apeAsset).approve(ADDRESSES_PROVIDER.getPool(), swapedApeAssetBalance);

            _lendingPool.supply(apeAsset, swapedApeAssetBalance, apeAddress, 0);

            // Borrow from Aave
            _lendingPool.borrow(borrowAsset, repayAmount, interestRateMode, 0, apeAddress);
            
            IERC20(borrowAsset).transfer(msg.sender, repayAmount);
            // console.log("repay");
        }
    }
}
