# Tick

UniswapV3将连续的价格范围，分割成有限个离散的价格点。每一个价格对应一个 `tick`，用户在设置流动性的价格区间时，只能选择这些离散的价格点中的某一个作为流动性的边界价格。

- tick组成的价格序列既为一串等比数列，公比为 1.0001 ，下一个价格点为当前价格点的 100.01%。

- 为了计算方便，实际上储存的是√P。而使用时，通常使用tick的序号 `i`。

- tick的序号是固定的整数集合，即 区间 [-887272, 887272] 的整数。原因见下方 [tickIndex](#tickIndex)

## Tick(library)

tick的数据结构和相关计算方法

### state

### Info(struct)

```solidity
// info stored for each initialized individual tick
// 每一个初始化之后的 tick 以下列结构储存
struct Info {
    // the total position liquidity that references this tick
    // 该tick上 所有position的流动性累加
    uint128 liquidityGross;
    // amount of net liquidity added (subtracted) when tick is crossed from left to right (right to left),
    // 该tick上 所有position的流动性净值
    int128 liquidityNet;
    // fee growth per unit of liquidity on the _other_ side of this tick (relative to the current tick)
    // 每单位流动性的 手续费数量 outside （相对于当前交易价格的另一边）
    // only has relative meaning, not absolute — the value depends on when the tick is initialized
    // 这只是一个相对的概念，并不是绝对的数值（手续费的计算工具，而并不是实际的手续费）
    // 只有当tick已经初始化后，才会被使用
    uint256 feeGrowthOutside0X128;
    uint256 feeGrowthOutside1X128;
    // the cumulative tick value on the other side of the tick
    // tick 外侧（outside）的 价格 × 时间 累加值
    // 用于 Oracle 的相关计算
    int56 tickCumulativeOutside;
    // the seconds per unit of liquidity on the _other_ side of this tick (relative to the current tick)
    // 每流动性单位的 tick激活时间 (t/L 主要用于计算流动性挖矿的收益) （outside)
    // only has relative meaning, not absolute — the value depends on when the tick is initialized
    // 这只是一个相对的概念，并不是绝对的数值 -- 只有当tick已经初始化后，才会被使用
    uint160 secondsPerLiquidityOutsideX128;
    // the seconds spent on the other side of the tick (relative to the current tick)
    // tick激活时间 （outside）
    // only has relative meaning, not absolute — the value depends on when the tick is initialized
    // 这只是一个相对的概念，并不是绝对的数值 -- 只有当tick已经初始化后，才会被使用
    uint32 secondsOutside;
    // true iff the tick is initialized, i.e. the value is exactly equivalent to the expression liquidityGross != 0
    // tick是否初始化 即 该值完全等同于表达式 liquidityGross != 0 
    // these 8 bits are set to prevent fresh sstores when crossing newly initialized ticks
    // 这个参数的目的是为了防止tick未初始化时，发生更新和存储状态的操作
    bool initialized;
}
```

### tickSpacingToMaxLiquidityPerTick

根据tickSpacing计算每个tick上能承载的最大流动性。

为何需要限制最大流动性：

- 因为每个Pool的总流动性 `liquidity` 是 `uint128` 类型，为了防止`liquidity`数据溢出
- 对每个tick承载的流动性做出限制，而不是监控Pool总流动性

```solidity
/// @notice Derives max liquidity per tick from given tick spacing
/// 根据tick spacing 间隔得出每隔tick上所能承载的最大流动性
/// @dev Executed within the pool constructor
/// 该方法由 Pool 构造函数调用
/// @param tickSpacing The amount of required tick separation, realized in multiples of `tickSpacing`
/// tickSpacing tick 的计算间隔
///     e.g., a tickSpacing of 3 requires ticks to be initialized every 3rd tick i.e., ..., -6, -3, 0, 3, 6, ...
///     即 一个值为3的tickspacing 需要每隔3个对tick进行初始化
/// @return The max liquidity per tick
/// 函数返回每个tick能承载的最大流动性
function tickSpacingToMaxLiquidityPerTick(int24 tickSpacing) internal pure returns (uint128) {
    // 计算正数区间和负数区间 各由多少tick需要被初始化
    // 由于前后两端的间隔可能小于 tickspacing，最后可能出现舍弃两端tick的情况
    // 因此先整除再乘 得出精确的tick数量
    // 注意 minTick 得出的是负数 TickMath.MIN_TICK = -887272
    int24 minTick = (TickMath.MIN_TICK / tickSpacing) * tickSpacing;
    int24 maxTick = (TickMath.MAX_TICK / tickSpacing) * tickSpacing;
    // （正整数数量 - 负整数数量）/ tickspacing + 1 （i = 0）
    uint24 numTicks = uint24((maxTick - minTick) / tickSpacing) + 1;
    // liquidity 是 unit128 类型 type(uint128).max 即为 liquidity的最大值
    return type(uint128).max / numTicks;
}
```

相关代码

- [tickSpacing](./UniswapV3Pool.md#tickSpacing)

### getFeeGrowthInside

```solidity
/// @notice Retrieves fee growth data
/// @param self The mapping containing all tick information for initialized ticks
/// @param tickLower The lower tick boundary of the position
/// @param tickUpper The upper tick boundary of the position
/// @param tickCurrent The current tick
/// @param feeGrowthGlobal0X128 The all-time global fee growth, per unit of liquidity, in token0
/// @param feeGrowthGlobal1X128 The all-time global fee growth, per unit of liquidity, in token1
/// @return feeGrowthInside0X128 The all-time fee growth in token0, per unit of liquidity, inside the position's tick boundaries
/// @return feeGrowthInside1X128 The all-time fee growth in token1, per unit of liquidity, inside the position's tick boundaries
function getFeeGrowthInside(
    mapping(int24 => Tick.Info) storage self,
    int24 tickLower,
    int24 tickUpper,
    int24 tickCurrent,
    uint256 feeGrowthGlobal0X128,
    uint256 feeGrowthGlobal1X128
) internal view returns (uint256 feeGrowthInside0X128, uint256 feeGrowthInside1X128) {
    Info storage lower = self[tickLower];
    Info storage upper = self[tickUpper];

    // calculate fee growth below
    uint256 feeGrowthBelow0X128;
    uint256 feeGrowthBelow1X128;
    if (tickCurrent >= tickLower) {
        feeGrowthBelow0X128 = lower.feeGrowthOutside0X128;
        feeGrowthBelow1X128 = lower.feeGrowthOutside1X128;
    } else {
        feeGrowthBelow0X128 = feeGrowthGlobal0X128 - lower.feeGrowthOutside0X128;
        feeGrowthBelow1X128 = feeGrowthGlobal1X128 - lower.feeGrowthOutside1X128;
    }

    // calculate fee growth above
    uint256 feeGrowthAbove0X128;
    uint256 feeGrowthAbove1X128;
    if (tickCurrent < tickUpper) {
        feeGrowthAbove0X128 = upper.feeGrowthOutside0X128;
        feeGrowthAbove1X128 = upper.feeGrowthOutside1X128;
    } else {
        feeGrowthAbove0X128 = feeGrowthGlobal0X128 - upper.feeGrowthOutside0X128;
        feeGrowthAbove1X128 = feeGrowthGlobal1X128 - upper.feeGrowthOutside1X128;
    }

    feeGrowthInside0X128 = feeGrowthGlobal0X128 - feeGrowthBelow0X128 - feeGrowthAbove0X128;
    feeGrowthInside1X128 = feeGrowthGlobal1X128 - feeGrowthBelow1X128 - feeGrowthAbove1X128;
}
```

### update

```solidity
/// @notice Updates a tick and returns true if the tick was flipped from initialized to uninitialized, or vice versa
/// @param self The mapping containing all tick information for initialized ticks
/// @param tick The tick that will be updated
/// @param tickCurrent The current tick
/// @param liquidityDelta A new amount of liquidity to be added (subtracted) when tick is crossed from left to right (right to left)
/// @param feeGrowthGlobal0X128 The all-time global fee growth, per unit of liquidity, in token0
/// @param feeGrowthGlobal1X128 The all-time global fee growth, per unit of liquidity, in token1
/// @param secondsPerLiquidityCumulativeX128 The all-time seconds per max(1, liquidity) of the pool
/// @param time The current block timestamp cast to a uint32
/// @param upper true for updating a position's upper tick, or false for updating a position's lower tick
/// @param maxLiquidity The maximum liquidity allocation for a single tick
/// @return flipped Whether the tick was flipped from initialized to uninitialized, or vice versa
function update(
    mapping(int24 => Tick.Info) storage self,
    int24 tick,
    int24 tickCurrent,
    int128 liquidityDelta,
    uint256 feeGrowthGlobal0X128,
    uint256 feeGrowthGlobal1X128,
    uint160 secondsPerLiquidityCumulativeX128,
    int56 tickCumulative,
    uint32 time,
    bool upper,
    uint128 maxLiquidity
) internal returns (bool flipped) {
    Tick.Info storage info = self[tick];

    uint128 liquidityGrossBefore = info.liquidityGross;
    uint128 liquidityGrossAfter = LiquidityMath.addDelta(liquidityGrossBefore, liquidityDelta);

    require(liquidityGrossAfter <= maxLiquidity, 'LO');

    flipped = (liquidityGrossAfter == 0) != (liquidityGrossBefore == 0);

    if (liquidityGrossBefore == 0) {
        // by convention, we assume that all growth before a tick was initialized happened _below_ the tick
        if (tick <= tickCurrent) {
            info.feeGrowthOutside0X128 = feeGrowthGlobal0X128;
            info.feeGrowthOutside1X128 = feeGrowthGlobal1X128;
            info.secondsPerLiquidityOutsideX128 = secondsPerLiquidityCumulativeX128;
            info.tickCumulativeOutside = tickCumulative;
            info.secondsOutside = time;
        }
        info.initialized = true;
    }

    info.liquidityGross = liquidityGrossAfter;

    // when the lower (upper) tick is crossed left to right (right to left), liquidity must be added (removed)
    info.liquidityNet = upper
        ? int256(info.liquidityNet).sub(liquidityDelta).toInt128()
        : int256(info.liquidityNet).add(liquidityDelta).toInt128();
}
```

### clear

```solidity
/// @notice Clears tick data
/// @param self The mapping containing all initialized tick information for initialized ticks
/// @param tick The tick that will be cleared
function clear(mapping(int24 => Tick.Info) storage self, int24 tick) internal {
    delete self[tick];
}
```

### cross

```solidity
/// @notice Transitions to next tick as needed by price movement
/// @param self The mapping containing all tick information for initialized ticks
/// @param tick The destination tick of the transition
/// @param feeGrowthGlobal0X128 The all-time global fee growth, per unit of liquidity, in token0
/// @param feeGrowthGlobal1X128 The all-time global fee growth, per unit of liquidity, in token1
/// @param secondsPerLiquidityCumulativeX128 The current seconds per liquidity
/// @param time The current block.timestamp
/// @return liquidityNet The amount of liquidity added (subtracted) when tick is crossed from left to right (right to left)
function cross(
    mapping(int24 => Tick.Info) storage self,
    int24 tick,
    uint256 feeGrowthGlobal0X128,
    uint256 feeGrowthGlobal1X128,
    uint160 secondsPerLiquidityCumulativeX128,
    int56 tickCumulative,
    uint32 time
) internal returns (int128 liquidityNet) {
    Tick.Info storage info = self[tick];
    info.feeGrowthOutside0X128 = feeGrowthGlobal0X128 - info.feeGrowthOutside0X128;
    info.feeGrowthOutside1X128 = feeGrowthGlobal1X128 - info.feeGrowthOutside1X128;
    info.secondsPerLiquidityOutsideX128 = secondsPerLiquidityCumulativeX128 - info.secondsPerLiquidityOutsideX128;
    info.tickCumulativeOutside = tickCumulative - info.tickCumulativeOutside;
    info.secondsOutside = time - info.secondsOutside;
    liquidityNet = info.liquidityNet;
}
```

## TickBitmap(library)

## TickMath(library)

Tick 的数学计算方法

### tickIndex

tick 的序号，用`i`表示。`i = log√1.0001√P` (以√1.0001为底数，√Price的log值)

UniswapV3中的价格（√P）用`sqrtPriceX96`参数表示

- `sqrtPriceX96` (√P) 可以用 `1.0001^i` 表示
- `sqrtPriceX96` 是一个Q64.96的定点数，即 二进制中，前64位表示整数部分，后96位表示小数部分，总位数160（由于solidity不支持浮点数，用uint160类型记录）
- 价格的取值范围 [2^-128, 2^128]。因为 `sqrtPriceX96` 的整数相当于（uint64），即 √P 取值范围 [2^-64, 2^64]
- 由上可得tick序号`i`的取值范围 [log√1.0001√2^-64, log√1.0001√2^64]。因此tick的序号是在区间 [-887272, 887272] 的整数集合

