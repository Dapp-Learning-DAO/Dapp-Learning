// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

import './AaveUniswapBase.sol';
import './interfaces/uniswap-v3/IUniswapV3Factory.sol';
import './interfaces/uniswap-v3/IUniswapV3Pool.sol';
import './interfaces/aave-v3/IAToken.sol';
import './libraries/ReserveConfiguration.sol';
import './libraries/TickMath.sol';
import './libraries/WadRayMath.sol';
import './libraries/PercentageMath.sol';
// import 'hardhat/console.sol';

contract AaveApePlus is AaveUniswapBase {
    using WadRayMath for uint256;
    using PercentageMath for uint256;

    event Ape(address ape, string action, address apeAsset, address borrowAsset, uint256 borrowAmount, uint256 apeAmount, uint256 interestRateMode);

    uint24[4] public v3Fees = [100, 500, 3000, 10000];

    IUniswapV3Factory public constant factory = IUniswapV3Factory(0x1F98431c8aD98523631AE4a59f267346ea31F984); // const value for all chains
  
    constructor(
        address lendingPoolAddressesProviderAddress,
        address uniswapRouterAddress
    ) AaveUniswapBase(lendingPoolAddressesProviderAddress, uniswapRouterAddress) {}

    // lever up your position
    function flashApe(address apeAsset, address borrowAsset, uint256 borrowAmount,uint256 interestRateMode) external returns (bool) {
        require(borrowAmount > 0, "borrow amount should be greater than 0");
        require(interestRateMode == 1 || interestRateMode == 2, "interestRateMode must be 1 for stable rate or 2 for variable rate");

        //uniswap
        IUniswapV3Pool pool = getBestPool(apeAsset, borrowAsset);

        //DAI/WETH   token0 DAI token1 WETH   zeroForOne false,  borrowAmount 0.1 ETH, balance:  336.6DAI WETH 0,         delta0 0,  delta1 0.1
        //DAI/WETH   token0 DAI token1 WETH   zeroForOne true,   borrowAmount 0.1 DAI, balance:  0DAI     WETH 0.000297,  dele0 0.1  delta1 0
        // borrowAmount > 0 exactInput else exactOutput
        bool zeroForOne = pool.token0() == borrowAsset; // borrowAsset in apeAsset out

        uint160 sqrtPriceX96 = zeroForOne == true ? TickMath.MIN_SQRT_RATIO + 1 : TickMath.MAX_SQRT_RATIO - 1;
        
        //flash swap
        (int256 amount0, int256 amount1) = pool.swap(
            address(this), 
            zeroForOne,
            int256(borrowAmount),
            sqrtPriceX96,
            abi.encode(address(pool), zeroForOne, apeAsset, borrowAsset, interestRateMode, msg.sender, false)
        );

       (, , , , , uint256 newHealthFactor) = LENDING_POOL().getUserAccountData(msg.sender);
        require(newHealthFactor > 1e18, "health factor < 1!");

        emit Ape(msg.sender, 'flashApe', apeAsset, borrowAsset, borrowAmount, zeroForOne == true ? uint256(amount0) : uint256(amount1), interestRateMode);

        //check slippage， minAmountout
        return true;
    }

    function flashUnwind(address apeAsset, address borrowAsset, uint256 borrowAmountToRepay, uint256 interestRateMode) public {
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

        require(debtAmount > 0, 'no debt on Aave!');

        if (borrowAmountToRepay > debtAmount) {
            borrowAmountToRepay = debtAmount;
        }

        // get apeAsset aToken address
        DataTypes.ReserveData memory apeReserve = getAaveAssetReserveData(apeAsset);

        IAToken _aToken = IAToken(apeReserve.aTokenAddress);

        uint256 apeAssetBalance = _aToken.balanceOf(msg.sender);

        // user apeAsset 
        uint256 apeAssetPrice = getPriceOracle().getAssetPrice(apeAsset); 
        (uint256 apeAssetDecimals, , , , , , , , , ) = getProtocolDataProvider().getReserveConfigurationData(apeAsset);

        uint256 borrowAssetPrice = getPriceOracle().getAssetPrice(borrowAsset); 
        (uint256 borrowAssetDecimals, , , , , , , , , ) = getProtocolDataProvider().getReserveConfigurationData(borrowAsset);

        uint apeAssetToDebtAmount = (apeAssetBalance * apeAssetPrice * 10**borrowAssetDecimals) / (10**apeAssetDecimals * borrowAssetPrice);

         //uniswap
        IUniswapV3Pool pool = getBestPool(apeAsset, borrowAsset);

        // consider swap fee, slippage  0.5%    uniswap 3000 是0.3%, aave 3000 是 30% , 50 是 0.5%
        apeAssetToDebtAmount = apeAssetToDebtAmount - apeAssetToDebtAmount.percentMul(pool.fee() / 100 + 50);

        if (apeAssetToDebtAmount < borrowAmountToRepay) {
            borrowAmountToRepay = apeAssetToDebtAmount;
        }

        bool zeroForOne = apeAsset < borrowAsset; // apeAsset in borrowAsset out

        uint160 sqrtPriceX96 = zeroForOne == true ? TickMath.MIN_SQRT_RATIO + 1 : TickMath.MAX_SQRT_RATIO - 1;

        //flash swap
        (int256 amount0, int256 amount1) = pool.swap(
            address(this), 
            zeroForOne, 
            -int256(borrowAmountToRepay), //exactOutput
            sqrtPriceX96, 
            abi.encode(address(pool), zeroForOne, apeAsset, borrowAsset, interestRateMode, msg.sender, true)
        );

        emit Ape(msg.sender, 'flashUnwind', apeAsset, borrowAsset, borrowAmountToRepay, zeroForOne == false ? uint256(amount0) : uint256(amount1), interestRateMode);
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

    function uniswapV3SwapCallback(
        int256 amount0Delta, 
        int256 amount1Delta, 
        bytes calldata data
    ) external {
        // console.log("uniswapV3SwapCallback", uint256(amount0Delta), uint256(amount1Delta));
        (
            address _pool,
            bool zeroForOne,
            address apeAsset,
            address borrowAsset,
            uint256 interestRateMode,
            address apeAddress, // user address
            bool isFlashUnwind
        ) = abi.decode(data, (address, bool, address, address, uint256, address, bool));

        uint256 repayAmount = uint256(amount0Delta > 0 ? amount0Delta: amount1Delta);

        if (repayAmount > 0) {
            IPool _lendingPool = LENDING_POOL();

            if (isFlashUnwind) {
                uint256 swapedBorrowAssetBalance = IERC20(borrowAsset).balanceOf(address(this));
                IERC20(borrowAsset).approve(ADDRESSES_PROVIDER.getPool(), swapedBorrowAssetBalance);
                _lendingPool.repay(borrowAsset, swapedBorrowAssetBalance, interestRateMode, apeAddress);

                DataTypes.ReserveData memory reserve = getAaveAssetReserveData(apeAsset);
                IERC20 _aToken = IERC20(reserve.aTokenAddress);
                // transfer the aTokens to aaveApe, then withdraw the apeAsset from Aave
                _aToken.transferFrom(apeAddress, address(this), repayAmount);
                
                // withdraw all aToken
                _lendingPool.withdraw(apeAsset, repayAmount, address(this));

                //flash swap repay
                IERC20(apeAsset).transfer(msg.sender, repayAmount);
            } else {
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
}
