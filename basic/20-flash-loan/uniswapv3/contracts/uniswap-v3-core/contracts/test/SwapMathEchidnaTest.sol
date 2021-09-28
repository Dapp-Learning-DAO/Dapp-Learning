// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.7.6;

import '../libraries/SwapMath.sol';

contract SwapMathEchidnaTest {
    function checkComputeSwapStepInvariants(
        uint160 sqrtPriceRaw,
        uint160 sqrtPriceTargetRaw,
        uint128 liquidity,
        int256 amountRemaining,
        uint24 feePips
    ) external pure {
        require(sqrtPriceRaw > 0);
        require(sqrtPriceTargetRaw > 0);
        require(feePips > 0);
        require(feePips < 1e6);

        (uint160 sqrtQ, uint256 amountIn, uint256 amountOut, uint256 feeAmount) =
            SwapMath.computeSwapStep(sqrtPriceRaw, sqrtPriceTargetRaw, liquidity, amountRemaining, feePips);

        assert(amountIn <= type(uint256).max - feeAmount);

        if (amountRemaining < 0) {
            assert(amountOut <= uint256(-amountRemaining));
        } else {
            assert(amountIn + feeAmount <= uint256(amountRemaining));
        }

        if (sqrtPriceRaw == sqrtPriceTargetRaw) {
            assert(amountIn == 0);
            assert(amountOut == 0);
            assert(feeAmount == 0);
            assert(sqrtQ == sqrtPriceTargetRaw);
        }

        // didn't reach price target, entire amount must be consumed
        if (sqrtQ != sqrtPriceTargetRaw) {
            if (amountRemaining < 0) assert(amountOut == uint256(-amountRemaining));
            else assert(amountIn + feeAmount == uint256(amountRemaining));
        }

        // next price is between price and price target
        if (sqrtPriceTargetRaw <= sqrtPriceRaw) {
            assert(sqrtQ <= sqrtPriceRaw);
            assert(sqrtQ >= sqrtPriceTargetRaw);
        } else {
            assert(sqrtQ >= sqrtPriceRaw);
            assert(sqrtQ <= sqrtPriceTargetRaw);
        }
    }
}
