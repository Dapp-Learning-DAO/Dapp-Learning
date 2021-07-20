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

尽管tick已经是一个个离散的价格点，但依旧很密集，所以引入了tickSpacing概念，使得计算时节省gas

对于价格波动较小的交易池，我们希望 tickSpacing 更小，这样价格可选值更多，同时也希望费率更低。反之波动大的交易对，可以让 tickSpacing 更大，这样更节约 gas，但是我们希望它的费率更高。

```solidity
/// @inheritdoc IUniswapV3PoolImmutables
int24 public immutable override tickSpacing;
```

### maxLiquidityPerTick

每个tick上能承载的最大流动性

```solidity
/// @inheritdoc IUniswapV3PoolImmutables
uint128 public immutable override maxLiquidityPerTick;
```

相关代码

- [Tick.tickSpacingToMaxLiquidityPerTick](./Tick.md#tickSpacingToMaxLiquidityPerTick)

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

相关代码

- [Tick.info](./Tick.md#Info(struct))

### tickBitmap

```solidity
/// @inheritdoc IUniswapV3PoolState
mapping(int16 => uint256) public override tickBitmap;
```

### positions

`position`列表
`position`是用户的流动性头寸

```solidity
/// @inheritdoc IUniswapV3PoolState
mapping(bytes32 => Position.Info) public override positions;
```

相关代码

- [Position Info](#Position.info)

### observations

```solidity
/// @inheritdoc IUniswapV3PoolState
Oracle.Observation[65535] public override observations;
```

## Struct

### Position.Info

用户position的数据结构

```solidity
// info stored for each user's position
struct Info {
    // the amount of liquidity owned by this position
    uint128 liquidity;
    // fee growth per unit of liquidity as of the last update to liquidity or fees owed
    uint256 feeGrowthInside0LastX128;
    uint256 feeGrowthInside1LastX128;
    // the fees owed to the position owner in token0/token1
    uint128 tokensOwed0;
    uint128 tokensOwed1;
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
- [tickSpacing](#tickSpacing)

### initialize

对交易对进行初始化，初始化的作用就是给交易对设置一个初始的价格

```solidity
/// @inheritdoc IUniswapV3PoolActions
/// @dev not locked because it initializes unlocked
/// slot0.unlocked 当前为false，需要将其设为true，解除锁定
function initialize(uint160 sqrtPriceX96) external override {
    // 初始价格不能为0
    require(slot0.sqrtPriceX96 == 0, 'AI');

    // 通过√P获取tickindex
    int24 tick = TickMath.getTickAtSqrtRatio(sqrtPriceX96);

    // 初始化oracle
    (uint16 cardinality, uint16 cardinalityNext) = observations.initialize(_blockTimestamp());

    // 初始化slot0
    slot0 = Slot0({
        sqrtPriceX96: sqrtPriceX96,
        tick: tick,
        observationIndex: 0,
        observationCardinality: cardinality,
        observationCardinalityNext: cardinalityNext,
        feeProtocol: 0,
        unlocked: true
    });

    emit Initialize(sqrtPriceX96, tick);
}
```

相关代码

- [observations.initialize](./Oracle.md#initialize)

### mint

修改用户的position状态，调用manager的mint回调函数，进行token的转帐操作

```solidity
/// @inheritdoc IUniswapV3PoolActions
/// @dev noDelegateCall is applied indirectly via _modifyPosition
/// _modifyPosition 具有 noDelegateCall 修饰符，所以这里也有同样的限制
function mint(
    address recipient,
    int24 tickLower,
    int24 tickUpper,
    uint128 amount,
    bytes calldata data
) external override lock returns (uint256 amount0, uint256 amount1) {
    require(amount > 0);
    (, int256 amount0Int, int256 amount1Int) =
        _modifyPosition(
            ModifyPositionParams({
                owner: recipient,
                tickLower: tickLower,
                tickUpper: tickUpper,
                liquidityDelta: int256(amount).toInt128()
            })
        );

    amount0 = uint256(amount0Int);
    amount1 = uint256(amount1Int);

    uint256 balance0Before;
    uint256 balance1Before;
    // 获取当前池中的 x token, y token 余额
    if (amount0 > 0) balance0Before = balance0();
    if (amount1 > 0) balance1Before = balance1();
    // 将需要的 x token 和 y token 数量传给回调函数，这里预期回调函数会将指定数量的 token 发送到合约中
    IUniswapV3MintCallback(msg.sender).uniswapV3MintCallback(amount0, amount1, data);
    // 回调完成后，检查发送至合约的 token 是否复合预期，如果不满足检查则回滚交易
    if (amount0 > 0) require(balance0Before.add(amount0) <= balance0(), 'M0');
    if (amount1 > 0) require(balance1Before.add(amount1) <= balance1(), 'M1');

    emit Mint(msg.sender, recipient, tickLower, tickUpper, amount, amount0, amount1);
}
```

相关代码

- [IUniswapV3MintCallback.uniswapV3MintCallback](./NonfungiblePositionManager.md#uniswapV3MintCallback)
- [Pool._modifyPosition](#_modifyPosition)
- [Pool._updatePosition](#_updatePosition)

### _modifyPosition

修改position状态

```solidity
/// @dev Effect some changes to a position
/// 对position做一些更改
/// @param params the position details and the change to the position's liquidity to effect
/// 修改position状态的参数
/// @return position a storage pointer referencing the position with the given owner and tick range
/// 返回一个指向position的指针，该指针储存在storage中
/// position包含了拥有者，做市价格范围的信息
/// @return amount0 the amount of token0 owed to the pool, negative if the pool should pay the recipient
/// 返回token0的数量，如果需要支付给接受者，则为负值
/// @return amount1 the amount of token1 owed to the pool, negative if the pool should pay the recipient
/// 返回token1的数量，如果需要支付给接受者，则为负值
/// noDelegateCall 禁止delegateCall方法调用
function _modifyPosition(ModifyPositionParams memory params)
    private
    noDelegateCall
    returns (
        Position.Info storage position,
        int256 amount0,
        int256 amount1
    )
{
    // 检查入参中的tickindex
    // tickLower < tickUpper
    // 两个tickindex不能超出最大和最小值
    checkTicks(params.tickLower, params.tickUpper);

    // 缓存slot0插槽数据
    // 这里是做gas优化，下面需要多次调用slot0中的数据
    // 从storage中提取到memory中读取可以节省gas
    Slot0 memory _slot0 = slot0; // SLOAD for gas optimization

    // 更新position状态
    position = _updatePosition(
        params.owner,
        params.tickLower,
        params.tickUpper,
        params.liquidityDelta,
        _slot0.tick
    );

    // 当流动性有变化
    if (params.liquidityDelta != 0) {
        // 当前价格 < 价格下限
        if (_slot0.tick < params.tickLower) {
            // current tick is below the passed range; liquidity can only become in range by crossing from left to
            // right, when we'll need _more_ token0 (it's becoming more valuable) so user must provide it
            // 当前价格 < 价格下限 添加流动性只能单独添加token0
            amount0 = SqrtPriceMath.getAmount0Delta(
                TickMath.getSqrtRatioAtTick(params.tickLower),
                TickMath.getSqrtRatioAtTick(params.tickUpper),
                params.liquidityDelta
            );
        } else if (_slot0.tick < params.tickUpper) {
            // current tick is inside the passed range
            // 当前价格 介于 价格上限和下限之间
            // 这里只判断了 当前价格 < 上限 的情况，因为上一个if语句已经排除了比下限小的情况

            // 缓存流动性数量
            uint128 liquidityBefore = liquidity; // SLOAD for gas optimization

            // write an oracle entry
            // 向Oracle写入数据
            (slot0.observationIndex, slot0.observationCardinality) = observations.write(
                _slot0.observationIndex,
                _blockTimestamp(),
                _slot0.tick,
                liquidityBefore,
                _slot0.observationCardinality,
                _slot0.observationCardinalityNext
            );

            // 计算token0和token1分别需要多少数量
            amount0 = SqrtPriceMath.getAmount0Delta(
                _slot0.sqrtPriceX96,
                TickMath.getSqrtRatioAtTick(params.tickUpper),
                params.liquidityDelta
            );
            amount1 = SqrtPriceMath.getAmount1Delta(
                TickMath.getSqrtRatioAtTick(params.tickLower),
                _slot0.sqrtPriceX96,
                params.liquidityDelta
            );

            // 更新Pool的总流动性
            // 当价格在价格区间中添加流动性才会更新Pool的liquidity总量，在区间外不会更新
            liquidity = LiquidityMath.addDelta(liquidityBefore, params.liquidityDelta);
        } else {
            // current tick is above the passed range; liquidity can only become in range by crossing from right to
            // left, when we'll need _more_ token1 (it's becoming more valuable) so user must provide it
            // 当前价格 > 价格上限 添加流动性只能单独添加token1
            amount1 = SqrtPriceMath.getAmount1Delta(
                TickMath.getSqrtRatioAtTick(params.tickLower),
                TickMath.getSqrtRatioAtTick(params.tickUpper),
                params.liquidityDelta
            );
        }
    }
}
```

相关代码

- [Pool._updatePosition](#_updatePosition)

补充

- [Uniswap v3 详解（二）：创建交易对/提供流动性 #从 token 数计算流动性 L](https://liaoph.com/uniswap-v3-2/#%E4%BB%8E-token-%E6%95%B0%E8%AE%A1%E7%AE%97%E6%B5%81%E5%8A%A8%E6%80%A7-l)

### _updatePosition

```solidity
/// @dev Gets and updates a position with the given liquidity delta
/// @param owner the owner of the position
/// @param tickLower the lower tick of the position's tick range
/// @param tickUpper the upper tick of the position's tick range
/// @param tick the current tick, passed to avoid sloads
function _updatePosition(
    address owner,
    int24 tickLower,
    int24 tickUpper,
    int128 liquidityDelta,
    int24 tick
) private returns (Position.Info storage position) {
    // 获取用户的position （流动性头寸）
    position = positions.get(owner, tickLower, tickUpper);

    // 缓存token0和token1的手续费（Pool的总手续费，所有position的总和）
    uint256 _feeGrowthGlobal0X128 = feeGrowthGlobal0X128; // SLOAD for gas optimization
    uint256 _feeGrowthGlobal1X128 = feeGrowthGlobal1X128; // SLOAD for gas optimization

    // if we need to update the ticks, do it
    // 若有必要，更新ticks数据
    // flippedLower/upper 表示该tick更新后，激活状态是否改变
    bool flippedLower;
    bool flippedUpper;
    // 如果流动性数量有变化 更新tick数据
    if (liquidityDelta != 0) {
        uint32 time = _blockTimestamp();
        // 更新Oracle数据
        (int56 tickCumulative, uint160 secondsPerLiquidityCumulativeX128) =
            observations.observeSingle(
                time,
                0,
                slot0.tick,
                slot0.observationIndex,
                liquidity,
                slot0.observationCardinality
            );

        // 更新tick数据，返回flipped 作为价格下限更新
        flippedLower = ticks.update(
            tickLower,
            tick,
            liquidityDelta,
            _feeGrowthGlobal0X128,
            _feeGrowthGlobal1X128,
            secondsPerLiquidityCumulativeX128,
            tickCumulative,
            time,
            false,
            maxLiquidityPerTick
        );
        // 更新tick数据，返回flipped 作为价格上限更新
        flippedUpper = ticks.update(
            tickUpper,
            tick,
            liquidityDelta,
            _feeGrowthGlobal0X128,
            _feeGrowthGlobal1X128,
            secondsPerLiquidityCumulativeX128,
            tickCumulative,
            time,
            true,
            maxLiquidityPerTick
        );

        // 如果该 tick 第一次被引用，或者移除了所有引用（flipped）
        // 更新tick位图
        if (flippedLower) {
            tickBitmap.flipTick(tickLower, tickSpacing);
        }
        if (flippedUpper) {
            tickBitmap.flipTick(tickUpper, tickSpacing);
        }
    }

    // 计算token0和token1的feeInside 即 position应得的手续费
    (uint256 feeGrowthInside0X128, uint256 feeGrowthInside1X128) =
        ticks.getFeeGrowthInside(tickLower, tickUpper, tick, _feeGrowthGlobal0X128, _feeGrowthGlobal1X128);

    // 更新position状态 流动性 手续费
    position.update(liquidityDelta, feeGrowthInside0X128, feeGrowthInside1X128);

    // clear any tick data that is no longer needed
    // 如果流动性变化量 < 0 清除tick数据
    if (liquidityDelta < 0) {
        if (flippedLower) {
            ticks.clear(tickLower);
        }
        if (flippedUpper) {
            ticks.clear(tickUpper);
        }
    }
}
```

相关代码

- [observations.observeSingle](./Oracle.md#observeSingle)
- [ticks.update](./Tick.md#update)
- [ticks.getFeeGrowthInside](./Tick.md#getFeeGrowthInside)
- [ticks.clear](./Tick.md#clear)

### burn

移除(position的)流动性
注意`burn()`只是移除流动性，转为token，并未将token发送回给用户

```solidity
/// @inheritdoc IUniswapV3PoolActions
/// @dev noDelegateCall is applied indirectly via _modifyPosition
/// 由于_modifyPosition 使用了 noDelegateCall 修饰符，所以这里也有同样的限制
function burn(
    int24 tickLower,
    int24 tickUpper,
    uint128 amount
) external override lock returns (uint256 amount0, uint256 amount1) {
    // 函数入参amount >= 0 传入 _modifyPosition 需要加负号
    (Position.Info storage position, int256 amount0Int, int256 amount1Int) =
        _modifyPosition(
            ModifyPositionParams({
                owner: msg.sender,
                tickLower: tickLower,
                tickUpper: tickUpper,
                liquidityDelta: -int256(amount).toInt128()
            })
        );

    // amount0Int < 0 此处需要反号
    amount0 = uint256(-amount0Int);
    amount1 = uint256(-amount1Int);

    // 在用户position上记录增加token数量
    // 注意burn只是移除流动性，转为token，并未将token发送回给用户
    if (amount0 > 0 || amount1 > 0) {
        (position.tokensOwed0, position.tokensOwed1) = (
            position.tokensOwed0 + uint128(amount0),
            position.tokensOwed1 + uint128(amount1)
        );
    }

    emit Burn(msg.sender, tickLower, tickUpper, amount, amount0, amount1);
}
```

相关函数

- [_modifyPosition](#_modifyPosition)