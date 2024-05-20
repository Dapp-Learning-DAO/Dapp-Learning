// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.5.0;

interface IUniswapV3Pool {
    function slot0() external view returns (
        // the current price
        uint160 sqrtPriceX96,
        // the current tick
        int24 tick,
        // the most-recently updated index of the observations array
        uint16 observationIndex,
        // the current maximum number of observations that are being stored
        uint16 observationCardinality,
        // the next maximum number of observations to store, triggered in observations.write
        uint16 observationCardinalityNext,
        // the current protocol fee as a percentage of the swap fee taken on withdrawal
        // represented as an integer denominator (1/x)%
        uint8 feeProtocol,
        // whether the pool is locked
        bool unlocked
    );

    function increaseObservationCardinalityNext(uint16 observationCardinalityNext) external;

    function observations(uint256 index)
        external
        view
        returns (
            uint32 blockTimestamp,
            int56 tickCumulative,
            uint160 secondsPerLiquidityCumulativeX128,
            bool initialized
        );

    function liquidity() external view returns (uint128);

    function token0() external view returns (address);

    function token1() external view returns (address);

    function fee() external view returns (uint24);

    function observe(uint32[] calldata secondsAgos)
        external
        view
        returns (int56[] memory tickCumulatives, uint160[] memory secondsPerLiquidityCumulativeX128s);

    function flash(address, uint256, uint256, bytes calldata) external;

    function mint(address, int24, int24, uint128, bytes calldata) external;

    function burn(int24, int24, uint128) external returns (uint256, uint256);

    function collect(address, int24, int24, uint128, uint128) external;

    function swap(
        address recipient,
        bool zeroForOne,
        int256 amountSpecified,
        uint160 sqrtPriceLimitX96,
        bytes calldata data
    ) external returns (int256 amount0, int256 amount1);

    function initialize(uint160 sqrtPriceX96) external;
}
