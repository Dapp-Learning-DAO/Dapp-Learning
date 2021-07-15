# UniswapV3Pool 主要代码解读

## State Variables

### factory,token0,token1

相关合约地址

```solidity
/// @inheritdoc IUniswapV3PoolImmutables
address public immutable override factory;
/// @inheritdoc IUniswapV3PoolImmutables
address public immutable override token0;
/// @inheritdoc IUniswapV3PoolImmutables
address public immutable override token1;
```

### fee

费率

```solidity
/// @inheritdoc IUniswapV3PoolImmutables
uint24 public immutable override fee;
```

### tickSpacing

用于计算费率的tick计算间隔
尽管tick已经是一个个离散的价格点，但依旧很密集，所以引入了tickSpacing概念，使得计算费率时节省gas

> 对于价格波动较小的交易池，我们希望 tickSpacing 更小，这样价格可选值更多，同时也希望费率更低。反之波动大的交易对，可以让 tickSpacing 更大，这样更节约 gas，但是我们希望它的费率更高。

```solidity
/// @inheritdoc IUniswapV3PoolImmutables
int24 public immutable override tickSpacing;
```

### maxLiquidityPerTick

```solidity
/// @inheritdoc IUniswapV3PoolImmutables
uint128 public immutable override maxLiquidityPerTick;
```

### slot0

```solidity
struct Slot0 {
    // the current price
    uint160 sqrtPriceX96;
    // the current tick
    int24 tick;
    // the most-recently updated index of the observations array
    uint16 observationIndex;
    // the current maximum number of observations that are being stored
    uint16 observationCardinality;
    // the next maximum number of observations to store, triggered in observations.write
    uint16 observationCardinalityNext;
    // the current protocol fee as a percentage of the swap fee taken on withdrawal
    // represented as an integer denominator (1/x)%
    uint8 feeProtocol;
    // whether the pool is locked
    bool unlocked;
}
/// @inheritdoc IUniswapV3PoolState
Slot0 public override slot0;
```

### feeGrowthGlobal0X128

Pool当前收取的手续费（token0）

```solidity
/// @inheritdoc IUniswapV3PoolState
uint256 public override feeGrowthGlobal0X128;
```

### feeGrowthGlobal1X128

Pool当前收取的手续费（token1）

```solidity
/// @inheritdoc IUniswapV3PoolState
uint256 public override feeGrowthGlobal1X128;
```

### protocolFees

协议费（暂未启用）

```solidity
// accumulated protocol fees in token0/token1 units
struct ProtocolFees {
    uint128 token0;
    uint128 token1;
}
/// @inheritdoc IUniswapV3PoolState
ProtocolFees public override protocolFees;
```

### liquidity

Pool当前的流动性（公式中的L， L^2 = K)

```solidity
/// @inheritdoc IUniswapV3PoolState
uint128 public override liquidity;
```

### ticks

```solidity
/// @inheritdoc IUniswapV3PoolState
mapping(int24 => Tick.Info) public override ticks;
```

### tickBitmap

```solidity
/// @inheritdoc IUniswapV3PoolState
mapping(int16 => uint256) public override tickBitmap;
```

### positions

```solidity
/// @inheritdoc IUniswapV3PoolState
mapping(bytes32 => Position.Info) public override positions;
```

### observations

```solidity
/// @inheritdoc IUniswapV3PoolState
Oracle.Observation[65535] public override observations;
```

## Struct

### `Tick.info`

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

## Functions

### constructor

Pool构造函数，由Factory合约调用
Factory合约部署Pool时会存储相关参数到storage

```solidity
constructor() {
    int24 _tickSpacing;
    // 从storage中取出初始化参数
    (factory, token0, token1, fee, _tickSpacing) = IUniswapV3PoolDeployer(msg.sender).parameters();
    tickSpacing = _tickSpacing;

    maxLiquidityPerTick = Tick.tickSpacingToMaxLiquidityPerTick(_tickSpacing);
}
```

相关代码

- [UniswapV3PoolDeployer(msg.sender).parameters](./UniswapV3Factory.md#parameters)
