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

交易相关的全局状态，存于 `storage slot` 插槽中

- Pool合约的全局状态 (public state) 在slot0之前定义的都是 `immutable` 类型变量，不会占用slot插槽，该结构体存储位置是 `storage slot` 的第一个插槽，因而命名为 `slot0`
- `storage slot` 每个插槽有32个字节（256位），内部数据会被紧凑型打包，如果超出会进入第二个插槽；这里打包的数据加起来255位，可以比较合理的利用存储空间，节省访问的gas开销（不用访问多个插槽）

```solidity
struct Slot0 {
    // the current price
    // 当前的交易价格 √P sqrt(token1/token0) Q64.96
    uint160 sqrtPriceX96;
    // the current tick
    // 当前价格对应的tick index
    int24 tick;
    // the most-recently updated index of the observations array
    // 最近更新的预言机数据的索引值
    uint16 observationIndex;
    // the current maximum number of observations that are being stored
    // oracle 当前能存储的最大数量（数据的个数）
    uint16 observationCardinality;
    // the next maximum number of observations to store, triggered in observations.write
    // Oracle 下次将要写入数据位置的索引值
    uint16 observationCardinalityNext;
    // the current protocol fee as a percentage of the swap fee taken on withdrawal
    // represented as an integer denominator (1/x)%
    // 当前的协议费率 uint8类型 前4位代表 x 换成 y 的费率 后4位反之
    // 协议费率的 x 为计算费率的时候的分母
    // 即 protocolFee = fee * (1/x)%
    // x = 0 或 4 <= x <= 10 的整数
    uint8 feeProtocol;
    // whether the pool is locked
    // 防止重入攻击的互斥锁
    bool unlocked;
}
/// @inheritdoc IUniswapV3PoolState
Slot0 public override slot0;
```

相关代码

- [modifier lock](#lock)

补充

- [Constant and Immutable State Variables](https://docs.soliditylang.org/en/latest/contracts.html#constant-and-immutable-state-variables)
- [Layout of State Variables in Storage](https://docs.soliditylang.org/en/latest/internals/layout_in_storage.html#layout-of-state-variables-in-storage)

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

Pool当前的可用的流动性（当前激活的position流动性总和）（公式中的L， L^2 = K)

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

- [Tick.info](./Tick.md#Info)

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

- [modifier lock](#lock)
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

- [modifier lock](#lock)
- [_modifyPosition](#_modifyPosition)

### collect

回收position中的手续费，并转给接收者

```solidity
/// @inheritdoc IUniswapV3PoolActions
function collect(
    address recipient,
    int24 tickLower,
    int24 tickUpper,
    uint128 amount0Requested, // 期望回收的手续费数量
    uint128 amount1Requested
) external override lock returns (uint128 amount0, uint128 amount1) {
    // we don't need to checkTicks here, because invalid positions will never have non-zero tokensOwed{0,1}
    // 这里不需要做tick检查 因为非法的position是不可能拥有tokenOwned
    Position.Info storage position = positions.get(msg.sender, tickLower, tickUpper);

    // 当position tokensOwed余额 < 期望数值 取出 余额
    amount0 = amount0Requested > position.tokensOwed0 ? position.tokensOwed0 : amount0Requested;
    amount1 = amount1Requested > position.tokensOwed1 ? position.tokensOwed1 : amount1Requested;

    if (amount0 > 0) {
        position.tokensOwed0 -= amount0;
        TransferHelper.safeTransfer(token0, recipient, amount0);
    }
    if (amount1 > 0) {
        position.tokensOwed1 -= amount1;
        TransferHelper.safeTransfer(token1, recipient, amount1);
    }

    emit Collect(msg.sender, recipient, tickLower, tickUpper, amount0, amount1);
}
```

相关代码

- [modifier lock](#lock)

### swap

交易函数

```solidity
/// @inheritdoc IUniswapV3PoolActions
function swap(
    address recipient,          // 交易输出token的接收者
    bool zeroForOne,            // 交易方向
    int256 amountSpecified,     // 输入的token数量
    uint160 sqrtPriceLimitX96,  // 交易的价格限制（超出即停止交易）
    bytes calldata data         // 回调函数的入参数据
) external override noDelegateCall returns (int256 amount0, int256 amount1) {
    require(amountSpecified != 0, 'AS');

    // 优化gas消耗 将storage中的slot0缓存入memory，对memory的读写比storage便宜
    Slot0 memory slot0Start = slot0;

    // 防止重入攻击
    require(slot0Start.unlocked, 'LOK');
    // zeroForOne 代表了交易方向 true  输入x输出y, false 输入y输出x
    require(
        zeroForOne
            ? sqrtPriceLimitX96 < slot0Start.sqrtPriceX96 && sqrtPriceLimitX96 > TickMath.MIN_SQRT_RATIO
            : sqrtPriceLimitX96 > slot0Start.sqrtPriceX96 && sqrtPriceLimitX96 < TickMath.MAX_SQRT_RATIO,
        'SPL'
    );

    // 作用和 modifier lock 一样
    // 1. 这里的 slot0.unlocked 是修改的storage 
    // 2. 这里不直接使用modifier lock，因为上一个断言可能不通过
    //    如果使用modifier lock 会先执行storage的状态修改，造成不必要的gas消耗
    slot0.unlocked = false;

    // 缓存交易相关的全局状态
    SwapCache memory cache =
        SwapCache({
            // 当前Pool可用的总流动性
            liquidityStart: liquidity,
            blockTimestamp: _blockTimestamp(),
            // 协议手续费率的存储结构是 由 4 位 反方向的费率数值 + 4 位正方向的费率数值组成
            // 即 0000 + 0000 共8位的结构，参见 slot0.feeProtocol
            feeProtocol: zeroForOne ? (slot0Start.feeProtocol % 16) : (slot0Start.feeProtocol >> 4),
            // t / max(1,liquidity) 的加权累计值
            secondsPerLiquidityCumulativeX128: 0,
            // t * tickIndex 的加权累计值
            tickCumulative: 0,
            // 是否获取过最新的Oracle数据 只获取一次
            computedLatestObservation: false
        });

    // exactInput还是exactOutinput
    bool exactInput = amountSpecified > 0;

    // 缓存分步执行交易的状态
    SwapState memory state =
        SwapState({
            amountSpecifiedRemaining: amountSpecified,
            amountCalculated: 0,
            sqrtPriceX96: slot0Start.sqrtPriceX96,
            tick: slot0Start.tick,
            feeGrowthGlobalX128: zeroForOne ? feeGrowthGlobal0X128 : feeGrowthGlobal1X128,
            protocolFee: 0,
            liquidity: cache.liquidityStart
        });

    // continue swapping as long as we haven't used the entire input/output and haven't reached the price limit
    while (state.amountSpecifiedRemaining != 0 && state.sqrtPriceX96 != sqrtPriceLimitX96) {
        StepComputations memory step;

        step.sqrtPriceStartX96 = state.sqrtPriceX96;

        (step.tickNext, step.initialized) = tickBitmap.nextInitializedTickWithinOneWord(
            state.tick,
            tickSpacing,
            zeroForOne
        );

        // ensure that we do not overshoot the min/max tick, as the tick bitmap is not aware of these bounds
        if (step.tickNext < TickMath.MIN_TICK) {
            step.tickNext = TickMath.MIN_TICK;
        } else if (step.tickNext > TickMath.MAX_TICK) {
            step.tickNext = TickMath.MAX_TICK;
        }

        // get the price for the next tick
        step.sqrtPriceNextX96 = TickMath.getSqrtRatioAtTick(step.tickNext);

        // compute values to swap to the target tick, price limit, or point where input/output amount is exhausted
        (state.sqrtPriceX96, step.amountIn, step.amountOut, step.feeAmount) = SwapMath.computeSwapStep(
            state.sqrtPriceX96,
            (zeroForOne ? step.sqrtPriceNextX96 < sqrtPriceLimitX96 : step.sqrtPriceNextX96 > sqrtPriceLimitX96)
                ? sqrtPriceLimitX96
                : step.sqrtPriceNextX96,
            state.liquidity,
            state.amountSpecifiedRemaining,
            fee
        );

        if (exactInput) {
            state.amountSpecifiedRemaining -= (step.amountIn + step.feeAmount).toInt256();
            state.amountCalculated = state.amountCalculated.sub(step.amountOut.toInt256());
        } else {
            state.amountSpecifiedRemaining += step.amountOut.toInt256();
            state.amountCalculated = state.amountCalculated.add((step.amountIn + step.feeAmount).toInt256());
        }

        // if the protocol fee is on, calculate how much is owed, decrement feeAmount, and increment protocolFee
        if (cache.feeProtocol > 0) {
            uint256 delta = step.feeAmount / cache.feeProtocol;
            step.feeAmount -= delta;
            state.protocolFee += uint128(delta);
        }

        // update global fee tracker
        if (state.liquidity > 0)
            state.feeGrowthGlobalX128 += FullMath.mulDiv(step.feeAmount, FixedPoint128.Q128, state.liquidity);

        // shift tick if we reached the next price
        if (state.sqrtPriceX96 == step.sqrtPriceNextX96) {
            // if the tick is initialized, run the tick transition
            if (step.initialized) {
                // check for the placeholder value, which we replace with the actual value the first time the swap
                // crosses an initialized tick
                if (!cache.computedLatestObservation) {
                    (cache.tickCumulative, cache.secondsPerLiquidityCumulativeX128) = observations.observeSingle(
                        cache.blockTimestamp,
                        0,
                        slot0Start.tick,
                        slot0Start.observationIndex,
                        cache.liquidityStart,
                        slot0Start.observationCardinality
                    );
                    cache.computedLatestObservation = true;
                }
                int128 liquidityNet =
                    ticks.cross(
                        step.tickNext,
                        (zeroForOne ? state.feeGrowthGlobalX128 : feeGrowthGlobal0X128),
                        (zeroForOne ? feeGrowthGlobal1X128 : state.feeGrowthGlobalX128),
                        cache.secondsPerLiquidityCumulativeX128,
                        cache.tickCumulative,
                        cache.blockTimestamp
                    );
                // if we're moving leftward, we interpret liquidityNet as the opposite sign
                // safe because liquidityNet cannot be type(int128).min
                if (zeroForOne) liquidityNet = -liquidityNet;

                state.liquidity = LiquidityMath.addDelta(state.liquidity, liquidityNet);
            }

            state.tick = zeroForOne ? step.tickNext - 1 : step.tickNext;
        } else if (state.sqrtPriceX96 != step.sqrtPriceStartX96) {
            // recompute unless we're on a lower tick boundary (i.e. already transitioned ticks), and haven't moved
            state.tick = TickMath.getTickAtSqrtRatio(state.sqrtPriceX96);
        }
    }

    // update tick and write an oracle entry if the tick change
    if (state.tick != slot0Start.tick) {
        (uint16 observationIndex, uint16 observationCardinality) =
            observations.write(
                slot0Start.observationIndex,
                cache.blockTimestamp,
                slot0Start.tick,
                cache.liquidityStart,
                slot0Start.observationCardinality,
                slot0Start.observationCardinalityNext
            );
        (slot0.sqrtPriceX96, slot0.tick, slot0.observationIndex, slot0.observationCardinality) = (
            state.sqrtPriceX96,
            state.tick,
            observationIndex,
            observationCardinality
        );
    } else {
        // otherwise just update the price
        slot0.sqrtPriceX96 = state.sqrtPriceX96;
    }

    // update liquidity if it changed
    if (cache.liquidityStart != state.liquidity) liquidity = state.liquidity;

    // update fee growth global and, if necessary, protocol fees
    // overflow is acceptable, protocol has to withdraw before it hits type(uint128).max fees
    if (zeroForOne) {
        feeGrowthGlobal0X128 = state.feeGrowthGlobalX128;
        if (state.protocolFee > 0) protocolFees.token0 += state.protocolFee;
    } else {
        feeGrowthGlobal1X128 = state.feeGrowthGlobalX128;
        if (state.protocolFee > 0) protocolFees.token1 += state.protocolFee;
    }

    (amount0, amount1) = zeroForOne == exactInput
        ? (amountSpecified - state.amountSpecifiedRemaining, state.amountCalculated)
        : (state.amountCalculated, amountSpecified - state.amountSpecifiedRemaining);

    // do the transfers and collect payment
    if (zeroForOne) {
        if (amount1 < 0) TransferHelper.safeTransfer(token1, recipient, uint256(-amount1));

        uint256 balance0Before = balance0();
        IUniswapV3SwapCallback(msg.sender).uniswapV3SwapCallback(amount0, amount1, data);
        require(balance0Before.add(uint256(amount0)) <= balance0(), 'IIA');
    } else {
        if (amount0 < 0) TransferHelper.safeTransfer(token0, recipient, uint256(-amount0));

        uint256 balance1Before = balance1();
        IUniswapV3SwapCallback(msg.sender).uniswapV3SwapCallback(amount0, amount1, data);
        require(balance1Before.add(uint256(amount1)) <= balance1(), 'IIA');
    }

    emit Swap(msg.sender, recipient, amount0, amount1, state.sqrtPriceX96, state.liquidity, state.tick);
    slot0.unlocked = true;
}
```

相关代码

- [modifier lock](#lock)
- [state slot0](#slot0)

### checkTicks

检查tickindex是否非法（不能超过上下限）

```solidity
/// @dev Common checks for valid tick inputs.
function checkTicks(int24 tickLower, int24 tickUpper) private pure {
    require(tickLower < tickUpper, 'TLU');
    require(tickLower >= TickMath.MIN_TICK, 'TLM');
    require(tickUpper <= TickMath.MAX_TICK, 'TUM');
}
```

## modifier

### lock

被修饰的函数执行时，slot0 为锁定状态，执行完成后解锁
防止重入攻击

```solidity
/// @dev Mutually exclusive reentrancy protection into the pool to/from a method. This method also prevents entrance
/// to a function before the pool is initialized. The reentrancy guard is required throughout the contract because
/// we use balance checks to determine the payment status of interactions such as mint, swap and flash.
/// 资金出入Pool时，防止重入攻击的互斥锁。
/// 整个合约都需要重入保护，因为我们使用余额检查来确定交互的支付状态，例如 mint、swap 和 flash。
/// 此方法还可以防止Pool在初始化之前，有资金出入（Pool初始化前unlocked为false）
modifier lock() {
    require(slot0.unlocked, 'LOK');
    slot0.unlocked = false;
    _;
    slot0.unlocked = true;
}
```

相关代码

- [Pool.slot0](#slot0)

补充

- [re-entrancy(重入攻击)](https://docs.soliditylang.org/en/latest/security-considerations.html#re-entrancy)
