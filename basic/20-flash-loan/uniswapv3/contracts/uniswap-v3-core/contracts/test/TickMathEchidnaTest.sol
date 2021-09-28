// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.7.6;

import '../libraries/TickMath.sol';

contract TickMathEchidnaTest {
    // uniqueness and increasing order
    function checkGetSqrtRatioAtTickInvariants(int24 tick) external pure {
        uint160 ratio = TickMath.getSqrtRatioAtTick(tick);
        assert(TickMath.getSqrtRatioAtTick(tick - 1) < ratio && ratio < TickMath.getSqrtRatioAtTick(tick + 1));
        assert(ratio >= TickMath.MIN_SQRT_RATIO);
        assert(ratio <= TickMath.MAX_SQRT_RATIO);
    }

    // the ratio is always between the returned tick and the returned tick+1
    function checkGetTickAtSqrtRatioInvariants(uint160 ratio) external pure {
        int24 tick = TickMath.getTickAtSqrtRatio(ratio);
        assert(ratio >= TickMath.getSqrtRatioAtTick(tick) && ratio < TickMath.getSqrtRatioAtTick(tick + 1));
        assert(tick >= TickMath.MIN_TICK);
        assert(tick < TickMath.MAX_TICK);
    }
}
