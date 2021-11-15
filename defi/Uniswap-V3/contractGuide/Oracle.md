# Oracle

Oracle 数据使用一个结构体 Observation 来表示：
```solidity
struct Observation {
    // 记录区块的时间戳
    uint32 blockTimestamp;
    // tick index 的时间加权累积值
    int56 tickCumulative;
    // 价格所在区间的流动性的时间加权累积值
    uint160 liquidityCumulative;
    // 是否已经被初始化
    bool initialized;
}

```

## functions

### Observation

Oracle 的数据结构

```solidity
struct Observation {
    // the block timestamp of the observation
    // 区块时间戳
    uint32 blockTimestamp;
    // the tick accumulator, i.e. tick * time elapsed since the pool was first initialized
    // tick index 的时间加权累计值
    // tickCumulative = last tickCumulative + tickindex * deltaTime
    int56 tickCumulative;
    // the seconds per liquidity, i.e. seconds elapsed / max(1, liquidity) since the pool was first initialized
    // 时间(秒) 每 单位流动性
    // 这里主要为了方便计算position的挖矿权重
    uint160 secondsPerLiquidityCumulativeX128;
    // whether or not the observation is initialized
    // 该Oracle数据是否已被初始化
    bool initialized;
}
```

### initialize

```solidity
/// @notice Initialize the oracle array by writing the first slot. Called once for the lifecycle of the observations array
/// 用slot0数据初始化Oracle数组，在Oracle生命周期内只调用一次
/// @param self The stored oracle array
/// @param time The time of the oracle initialization, via block.timestamp truncated to uint32
/// @return cardinality The number of populated elements in the oracle array
/// @return cardinalityNext The new length of the oracle array, independent of population
function initialize(Observation[65535] storage self, uint32 time)
    internal
    returns (uint16 cardinality, uint16 cardinalityNext)
{
    self[0] = Observation({
        blockTimestamp: time,
        tickCumulative: 0,
        secondsPerLiquidityCumulativeX128: 0,
        initialized: true
    });
    return (1, 1);
}
```

### observeSingle

返回一段时间内的预言机数据，内部方法

```solidity
/// @dev Reverts if an observation at or before the desired observation timestamp does not exist.
/// 当传入的时间不存在，程序将被revert
/// 0 may be passed as `secondsAgo' to return the current cumulative values.
/// secondsAgo 表示希望获取多少秒以前至时间戳(time)期间的数据
/// If called with a timestamp falling between two observations, returns the counterfactual accumulator values
/// at exactly the timestamp between the two observations.
/// @param self The stored oracle array
/// @param time The current block timestamp
/// @param secondsAgo The amount of time to look back, in seconds, at which point to return an observation
/// @param tick The current tick
/// @param index The index of the observation that was most recently written to the observations array
/// Oracle最后一次被写入数据的索引值
/// @param liquidity The current in-range pool liquidity
/// 当前Pool处于激活状态的总流动性
/// @param cardinality The number of populated elements in the oracle array
/// oracle 数据的最大长度（类环结构）
/// @return tickCumulative The tick * time elapsed since the pool was first initialized, as of `secondsAgo`
/// tickindex 的加权累计值 从pool初始化开始到 secondsAgo 截止
/// @return secondsPerLiquidityCumulativeX128 The time elapsed / max(1, liquidity) since the pool was first initialized, as of `secondsAgo`
/// 时间(秒) 每单位流动性 用于计算position的挖矿权重
function observeSingle(
    Observation[65535] storage self,
    uint32 time,
    uint32 secondsAgo,
    int24 tick,
    uint16 index,
    uint128 liquidity,
    uint16 cardinality
) internal view returns (int56 tickCumulative, uint160 secondsPerLiquidityCumulativeX128) {
    // 当secondsAgo传0 返回最新的一个Oracle数据
    if (secondsAgo == 0) {
        Observation memory last = self[index];

        // 区块时间戳 不等于 Oracle最新的时间戳，更新last
        if (last.blockTimestamp != time) last = transform(last, time, tick, liquidity);
        return (last.tickCumulative, last.secondsPerLiquidityCumulativeX128);
    }

    // 当secondsAgo不为0
    // 计算时间区间的另一个点
    uint32 target = time - secondsAgo;

    // 计算出请求时间戳最近的两个 Oracle 数据
    (Observation memory beforeOrAt, Observation memory atOrAfter) =
        getSurroundingObservations(self, time, target, tick, index, liquidity, cardinality);

    if (target == beforeOrAt.blockTimestamp) {
        // we're at the left boundary
        // 如果请求时间和返回的左侧时间戳吻合，那么可以直接使用
        return (beforeOrAt.tickCumulative, beforeOrAt.secondsPerLiquidityCumulativeX128);
    } else if (target == atOrAfter.blockTimestamp) {
        // we're at the right boundary
        // 如果请求时间和返回的右侧时间戳吻合，那么可以直接使用
        return (atOrAfter.tickCumulative, atOrAfter.secondsPerLiquidityCumulativeX128);
    } else {
        // we're in the middle
        // 如果请求时间介于两个Oracle数据之间，我们需要线性的算出时间戳对应的数据
        uint32 observationTimeDelta = atOrAfter.blockTimestamp - beforeOrAt.blockTimestamp;
        uint32 targetDelta = target - beforeOrAt.blockTimestamp;
        return (
            beforeOrAt.tickCumulative +
                ((atOrAfter.tickCumulative - beforeOrAt.tickCumulative) / observationTimeDelta) *
                targetDelta,
            beforeOrAt.secondsPerLiquidityCumulativeX128 +
                uint160(
                    (uint256(
                        atOrAfter.secondsPerLiquidityCumulativeX128 - beforeOrAt.secondsPerLiquidityCumulativeX128
                    ) * targetDelta) / observationTimeDelta
                )
        );
    }
}
```

补充

- [关于secondsPerLiquidityCumulativeX128的原理解析](https://www.paradigm.xyz/2021/05/liquidity-mining-on-uniswap-v3/)
- https://liaoph.com/uniswap-v3-5/