// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

import './AaveUniswapBase.sol';
import './interfaces/uniswap-v3/IUniswapV3Factory.sol';
import './interfaces/uniswap-v3/IUniswapV3Pool.sol';
// import 'hardhat/console.sol';

contract AaveApe is AaveUniswapBase {
    event Ape(address ape, string action, address apeAsset, address borrowAsset, uint256 borrowAmount, uint256 apeAmount, uint256 interestRateMode);

    uint24[4] public v3Fees = [100, 500, 3000, 10000];

    IUniswapV3Factory public constant factory = IUniswapV3Factory(0x1F98431c8aD98523631AE4a59f267346ea31F984); // const value for all chains
  
    constructor(
        address lendingPoolAddressesProviderAddress,
        address uniswapRouterAddress
    ) AaveUniswapBase(lendingPoolAddressesProviderAddress, uniswapRouterAddress) {}

    // Gets the amount available to borrow for a given address for a given asset
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

    // 1. Borrows the maximum amount available of a borrowAsset (in the designated interest rate mode)
    // Note: requires the user to have delegated credit to the Aave Ape Contract
    // 2. Converts it into apeAsset via Uniswap
    // 3. Deposits that apeAsset into Aave on  behalf of the borrower
    function ape(address apeAsset, address borrowAsset, uint256 interestRateMode) public returns (bool) {
        // Get the maximum amount available to borrow in the borrowAsset
        uint256 borrowAmount = getAvailableBorrowInAsset(borrowAsset, msg.sender);

        require(borrowAmount > 0, 'Requires credit on Aave!');

        IPool _lendingPool = LENDING_POOL();

        // Borrow from Aave
        _lendingPool.borrow(borrowAsset, borrowAmount, interestRateMode, 0, msg.sender);

        // Approve the Uniswap Router on the borrowed asset
        IERC20(borrowAsset).approve(UNISWAP_ROUTER_ADDRESS, borrowAmount);

        // Execute trade on Uniswap
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: borrowAsset,
            tokenOut: apeAsset,
            fee: getBestPool(borrowAsset, apeAsset).fee(),
            recipient: address(this),
            deadline: block.timestamp + 50,
            amountIn: borrowAmount,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });

        uint256 outputAmount = UNISWAP_ROUTER.exactInputSingle(params);

        IERC20(apeAsset).approve(ADDRESSES_PROVIDER.getPool(), outputAmount);

        _lendingPool.supply(apeAsset, outputAmount, msg.sender, 0);

        emit Ape(msg.sender, 'open', apeAsset, borrowAsset, borrowAmount, outputAmount, interestRateMode);

        return true;
    }

    function superApe(address apeAsset, address borrowAsset, uint256 interestRateMode, uint levers) public returns (bool) {
        // Call "ape" for the number of levers specified
        for (uint i = 0; i < levers; i++) {
            ape(apeAsset, borrowAsset, interestRateMode);
        }

        return true;
    }

    // Unwind a position (long apeAsset, short borrowAsset)
    function unwindApe(address apeAsset, address borrowAsset, uint256 interestRateMode) public {
        // Get the user's outstanding debt
        (, uint256 stableDebt, uint256 variableDebt, , , , , , ) = getProtocolDataProvider().getUserReserveData(borrowAsset, msg.sender);

        uint256 repayAmount;
        if (interestRateMode == 1) {
            repayAmount = stableDebt;
        } else if (interestRateMode == 2) {
            repayAmount = variableDebt;
        }

        require(repayAmount > 0, 'Requires debt on Aave!');

        // Prepare the flashLoan parameters
        address receiverAddress = address(this);

        address[] memory assets = new address[](1);
        assets[0] = borrowAsset;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = repayAmount;

        // 0 = no debt, 1 = stable, 2 = variable
        uint256[] memory modes = new uint256[](1);
        modes[0] = 0;

        address onBehalfOf = address(this);
        bytes memory params = abi.encode(msg.sender, apeAsset, interestRateMode);
        uint16 referralCode = 0;

        LENDING_POOL().flashLoan(receiverAddress, assets, amounts, modes, onBehalfOf, params, referralCode);
    }

    // This is the function that the Lending pool calls when flashLoan has been called and the funds have been flash transferred
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external returns (bool) {
        require(msg.sender == ADDRESSES_PROVIDER.getPool(), 'only the lending pool can call this function');
        require(initiator == address(this), 'the ape did not initiate this flashloan');

        // Calculate the amount owed back to the lendingPool
        address borrowAsset = assets[0];
        uint256 repayAmount = amounts[0];
        uint256 amountOwing = repayAmount + premiums[0];

        // Decode the parameters
        (address ape, address apeAsset, uint256 rateMode) = abi.decode(params, (address, address, uint256));

        // Close position & repay the flashLoan
        return closePosition(ape, apeAsset, borrowAsset, repayAmount, amountOwing, rateMode);
    }

    function closePosition(
        address ape,
        address apeAsset,
        address borrowAsset,
        uint256 repayAmount,
        uint256 amountOwing,
        uint256 rateMode
    ) internal returns (bool) {

        IPool _lendingPool = LENDING_POOL();

        address _lendingPoolAdress = ADDRESSES_PROVIDER.getPool();
        // Approve the lendingPool to transfer the repay amount
        IERC20(borrowAsset).approve(_lendingPoolAdress, repayAmount);

        // Repay the amount owed
        _lendingPool.repay(borrowAsset, repayAmount, rateMode, ape);

        // Calculate the amount available to withdraw (the smaller of the borrow allowance and the aToken balance)
        uint256 maxCollateralAmount = getAvailableBorrowInAsset(apeAsset, ape);

        DataTypes.ReserveData memory reserve = getAaveAssetReserveData(apeAsset);

        IERC20 _aToken = IERC20(reserve.aTokenAddress);

        if (_aToken.balanceOf(ape) < maxCollateralAmount) {
            maxCollateralAmount = _aToken.balanceOf(ape);
        }

        // transfer the aTokens to this address, then withdraw the Tokens from Aave
        _aToken.transferFrom(ape, address(this), maxCollateralAmount);

        _lendingPool.withdraw(apeAsset, maxCollateralAmount, address(this));

        // Make the swap on Uniswap
        IERC20(apeAsset).approve(UNISWAP_ROUTER_ADDRESS, maxCollateralAmount);

        // Execute trade on Uniswap
        ISwapRouter.ExactOutputSingleParams memory params = ISwapRouter.ExactOutputSingleParams({
            tokenIn: apeAsset,
            tokenOut: borrowAsset,
            fee: getBestPool(apeAsset, borrowAsset).fee(),
            recipient: address(this),
            deadline: block.timestamp + 5,
            amountOut: amountOwing,
            amountInMaximum: maxCollateralAmount, 
            sqrtPriceLimitX96: 0
        });

        uint256 amountIn =  UNISWAP_ROUTER.exactOutputSingle(params);

        // Deposit any leftover back into Aave on behalf of the user
        uint256 leftoverAmount = maxCollateralAmount - amountIn;

        if (leftoverAmount > 0) {
            IERC20(apeAsset).approve(_lendingPoolAdress, leftoverAmount);

            _lendingPool.supply(apeAsset, leftoverAmount, ape, 0);
        }

        // Approve the Aave Lending Pool to recover the flashloaned amount
        IERC20(borrowAsset).approve(_lendingPoolAdress, amountOwing);

        emit Ape(ape, 'close', apeAsset, borrowAsset, amountOwing, amountIn, rateMode);

        return true;
    }

    // get max liquidity pool
    function getBestPool(address token0, address token1) public view returns(IUniswapV3Pool bestPool) {
        uint128 poolLiquidity = 0;
        uint128 maxLiquidity = 0;

        for (uint256 i = 0; i < v3Fees.length; i++) {
            address pool = factory.getPool(token0, token1, v3Fees[i]);

            if (pool == address(0)) {
                continue;
            }

            poolLiquidity = IUniswapV3Pool(pool).liquidity();

            if (maxLiquidity < poolLiquidity) {
                maxLiquidity = poolLiquidity;
                bestPool = IUniswapV3Pool(pool);
            }
        }
    }
}
