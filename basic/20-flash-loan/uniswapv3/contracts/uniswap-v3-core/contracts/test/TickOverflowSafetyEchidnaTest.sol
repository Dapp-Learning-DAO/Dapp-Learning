// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.7.6;

import '../libraries/Tick.sol';

contract TickOverflowSafetyEchidnaTest {
    using Tick for mapping(int24 => Tick.Info);

    int24 private constant MIN_TICK = -16;
    int24 private constant MAX_TICK = 16;
    uint128 private constant MAX_LIQUIDITY = type(uint128).max / 32;

    mapping(int24 => Tick.Info) private ticks;
    int24 private tick = 0;

    // used to track how much total liquidity has been added. should never be negative
    int256 totalLiquidity = 0;
    // half the cap of fee growth has happened, this can overflow
    uint256 private feeGrowthGlobal0X128 = type(uint256).max / 2;
    uint256 private feeGrowthGlobal1X128 = type(uint256).max / 2;
    // how much total growth has happened, this cannot overflow
    uint256 private totalGrowth0 = 0;
    uint256 private totalGrowth1 = 0;

    function increaseFeeGrowthGlobal0X128(uint256 amount) external {
        require(totalGrowth0 + amount > totalGrowth0); // overflow check
        feeGrowthGlobal0X128 += amount; // overflow desired
        totalGrowth0 += amount;
    }

    function increaseFeeGrowthGlobal1X128(uint256 amount) external {
        require(totalGrowth1 + amount > totalGrowth1); // overflow check
        feeGrowthGlobal1X128 += amount; // overflow desired
        totalGrowth1 += amount;
    }

    function setPosition(
        int24 tickLower,
        int24 tickUpper,
        int128 liquidityDelta
    ) external {
        require(tickLower > MIN_TICK);
        require(tickUpper < MAX_TICK);
        require(tickLower < tickUpper);
        bool flippedLower =
            ticks.update(
                tickLower,
                tick,
                liquidityDelta,
                feeGrowthGlobal0X128,
                feeGrowthGlobal1X128,
                0,
                0,
                uint32(block.timestamp),
                false,
                MAX_LIQUIDITY
            );
        bool flippedUpper =
            ticks.update(
                tickUpper,
                tick,
                liquidityDelta,
                feeGrowthGlobal0X128,
                feeGrowthGlobal1X128,
                0,
                0,
                uint32(block.timestamp),
                true,
                MAX_LIQUIDITY
            );

        if (flippedLower) {
            if (liquidityDelta < 0) {
                assert(ticks[tickLower].liquidityGross == 0);
                ticks.clear(tickLower);
            } else assert(ticks[tickLower].liquidityGross > 0);
        }

        if (flippedUpper) {
            if (liquidityDelta < 0) {
                assert(ticks[tickUpper].liquidityGross == 0);
                ticks.clear(tickUpper);
            } else assert(ticks[tickUpper].liquidityGross > 0);
        }

        totalLiquidity += liquidityDelta;
        // requires should have prevented this
        assert(totalLiquidity >= 0);

        if (totalLiquidity == 0) {
            totalGrowth0 = 0;
            totalGrowth1 = 0;
        }
    }

    function moveToTick(int24 target) external {
        require(target > MIN_TICK);
        require(target < MAX_TICK);
        while (tick != target) {
            if (tick < target) {
                if (ticks[tick + 1].liquidityGross > 0)
                    ticks.cross(tick + 1, feeGrowthGlobal0X128, feeGrowthGlobal1X128, 0, 0, uint32(block.timestamp));
                tick++;
            } else {
                if (ticks[tick].liquidityGross > 0)
                    ticks.cross(tick, feeGrowthGlobal0X128, feeGrowthGlobal1X128, 0, 0, uint32(block.timestamp));
                tick--;
            }
        }
    }
}
