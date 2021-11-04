# UniswapV3Pool 主要代码解读

pool合约负责池子的所有操作：
```
  function mint(
        address recipient,
        int24 tickLower,
        int24 tickUpper,
        uint128 amount,
        bytes calldata data
    ) external override lock returns (uint256 amount0, uint256 amount1) {

 function collect(
        address recipient,
        int24 tickLower,
        int24 tickUpper,
        uint128 amount0Requested,
        uint128 amount1Requested
    ) external override lock returns (uint128 amount0, uint128 amount1)


 function burn(
        int24 tickLower,
        int24 tickUpper,
        uint128 amount
    ) external override lock returns (uint256 amount0, uint256 amount1) 


   function swap(
        address recipient,
        bool zeroForOne,
        int256 amountSpecified,
        uint160 sqrtPriceLimitX96,
        bytes calldata data
    ) external override noDelegateCall returns (int256 amount0, int256 amount1)

 function flash(
        address recipient,
        uint256 amount0,
        uint256 amount1,
        bytes calldata data
    ) external override lock noDelegateCall

```

## State Variables

### factory, token0, token1

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

相关代码

- [Observation](./Oracle.md#Observation)

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

### StepComputations

用于swap函数的分步交易状态缓存

```solidity
struct StepComputations {
    // the price at the beginning of the step
    // 当前步的起始价格
    uint160 sqrtPriceStartX96;
    // the next tick to swap to from the current tick in the swap direction
    // 目标价格的tickindex
    int24 tickNext;
    // whether tickNext is initialized or not
    // tickNext 是否已初始化 （已有流动性）
    bool initialized;
    // sqrt(price) for the next tick (1/0)
    // 目标价格(根号)
    uint160 sqrtPriceNextX96;
    // how much is being swapped in in this step
    // 当前步交易了多少输入token
    uint256 amountIn;
    // how much is being swapped out
    // 当前步交易了多少输出token
    uint256 amountOut;
    // how much fee is being paid in
    // 当前步收取的手续费数量
    uint256 feeAmount;
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

#### flashswap

- 因为swap函数在计算完实际的交易数量之后，Pool会先将输出函数转给接收者，然后由调用者实现的回调函数中，将输入token转给Pool
- 由于回调函数是由调用者实现，所以实际上每次交易都是一次闪电贷，因为接收者会先接受输出token，然后再支付输入token，而这期间输出token是可以直接使用的
- 即 接收者先借出 `tokenOut` 最后归还 `tokenIn` ， 实现了借出和归还不同币种的闪电贷

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
            // 输入的token数量
            amountSpecifiedRemaining: amountSpecified,
            // 已计算交易的输入数量
            amountCalculated: 0,
            // 当前交易价格
            sqrtPriceX96: slot0Start.sqrtPriceX96,
            // 当前tickindex
            tick: slot0Start.tick,
            // 全局费feeGrowth 手续费从输入的token中扣除
            feeGrowthGlobalX128: zeroForOne ? feeGrowthGlobal0X128 : feeGrowthGlobal1X128,
            // 协议费率
            protocolFee: 0,
            // 当前可用的流动性（当前处于激活状态的position总和）
            liquidity: cache.liquidityStart
        });

    // continue swapping as long as we haven't used the entire input/output and haven't reached the price limit
    // 不断的分步执行交易直到输入token耗尽或达到了价格限制
    while (state.amountSpecifiedRemaining != 0 && state.sqrtPriceX96 != sqrtPriceLimitX96) {
        StepComputations memory step;

        // 该步的起始价格
        step.sqrtPriceStartX96 = state.sqrtPriceX96;

        // 在bitmap的当前word上寻找下一个已初始化的tick
        // 若当前word没有已初始化的tick 返回word的边界
        (step.tickNext, step.initialized) = tickBitmap.nextInitializedTickWithinOneWord(
            state.tick,
            tickSpacing,
            zeroForOne
        );

        // ensure that we do not overshoot the min/max tick, as the tick bitmap is not aware of these bounds
        // 确认我们没有超出最大/最小的tickindex,因为已经超出了bitmap的边界
        if (step.tickNext < TickMath.MIN_TICK) {
            step.tickNext = TickMath.MIN_TICK;
        } else if (step.tickNext > TickMath.MAX_TICK) {
            step.tickNext = TickMath.MAX_TICK;
        }

        // get the price for the next tick
        // 通过tickNext获取下一个价格点
        step.sqrtPriceNextX96 = TickMath.getSqrtRatioAtTick(step.tickNext);

        // compute values to swap to the target tick, price limit, or point where input/output amount is exhausted
        // 具体计算该步交易的函数，返回交易后的价格，消耗的输入token，和交换出的输出token
        (state.sqrtPriceX96, step.amountIn, step.amountOut, step.feeAmount) = SwapMath.computeSwapStep(
            state.sqrtPriceX96,
            (zeroForOne ? step.sqrtPriceNextX96 < sqrtPriceLimitX96 : step.sqrtPriceNextX96 > sqrtPriceLimitX96)
                ? sqrtPriceLimitX96
                : step.sqrtPriceNextX96,
            state.liquidity,
            state.amountSpecifiedRemaining,
            fee
        );

        // 将输入输出累计到交易状态缓存
        if (exactInput) {
            state.amountSpecifiedRemaining -= (step.amountIn + step.feeAmount).toInt256();
            state.amountCalculated = state.amountCalculated.sub(step.amountOut.toInt256());
        } else {
            state.amountSpecifiedRemaining += step.amountOut.toInt256();
            state.amountCalculated = state.amountCalculated.add((step.amountIn + step.feeAmount).toInt256());
        }

        // if the protocol fee is on, calculate how much is owed, decrement feeAmount, and increment protocolFee
        // 若开启了协议费，从手续费中分出协议费用
        if (cache.feeProtocol > 0) {
            uint256 delta = step.feeAmount / cache.feeProtocol;
            step.feeAmount -= delta;
            state.protocolFee += uint128(delta);
        }

        // update global fee tracker
        // 更新全局手续费的计算值 即每单流动性手续费的总和 (feeGrowth * 整体流动性 = 所有的手续费)
        if (state.liquidity > 0)
            state.feeGrowthGlobalX128 += FullMath.mulDiv(step.feeAmount, FixedPoint128.Q128, state.liquidity);

        // shift tick if we reached the next price
        // 当交易价格触及下一个tick 需要将目标价格移动
        if (state.sqrtPriceX96 == step.sqrtPriceNextX96) {
            // if the tick is initialized, run the tick transition
            // 如果当前目标价格已初始化 需要更新tick上的数据
            if (step.initialized) {
                // check for the placeholder value, which we replace with the actual value the first time the swap
                // 检查本次交易是否更新过Oracle数据 没有则在第一次分步交易时更新
                // crosses an initialized tick
                // 这里价格跨过了一个已初始化的tick(有流动性)
                if (!cache.computedLatestObservation) {
                    // 读取Oracle最近的一次数据
                    (cache.tickCumulative, cache.secondsPerLiquidityCumulativeX128) = observations.observeSingle(
                        cache.blockTimestamp,
                        0,
                        slot0Start.tick,
                        slot0Start.observationIndex,
                        cache.liquidityStart,
                        slot0Start.observationCardinality
                    );
                    // 将缓存状态改为已加载Oracle数据
                    cache.computedLatestObservation = true;
                }
                // 价格穿过tick，更新tick数据，得到tick上的流动性净值
                // (用于价格变化时，计算当前已激活的总流动性)
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
                // 如果价格向左移动（变小），需要反号
                // safe because liquidityNet cannot be type(int128).min
                if (zeroForOne) liquidityNet = -liquidityNet;

                // 当前激活的总流动性 + 流动性净值 (即为更新后的总流动性)
                state.liquidity = LiquidityMath.addDelta(state.liquidity, liquidityNet);
            }

            // 更新 tick 的值，使得下一次循环时让 tickBitmap 进入下一个 word 中查询
            // 这里zeroForOne为false时没有+1是因为向右寻找时会+1
            // 具体可参考 nextInitializedTickWithinOneWord 的代码
            state.tick = zeroForOne ? step.tickNext - 1 : step.tickNext;
        } else if (state.sqrtPriceX96 != step.sqrtPriceStartX96) {
            // recompute unless we're on a lower tick boundary (i.e. already transitioned ticks), and haven't moved
            // 价格没有越过目标tick 需要重新通过价格计算tick的索引值
            state.tick = TickMath.getTickAtSqrtRatio(state.sqrtPriceX96);
        }
    }

    // update tick and write an oracle entry if the tick change
    // 如果分步交易循环完成之后 tick index发生变化，需要向Oracle写入新数据
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
        // 否则只更新slot0的价格(此时交易在bitmap的同一个word内完成)
        slot0.sqrtPriceX96 = state.sqrtPriceX96;
    }

    // update liquidity if it changed
    // 更新当前激活状态的所有流动性
    if (cache.liquidityStart != state.liquidity) liquidity = state.liquidity;

    // update fee growth global and, if necessary, protocol fees
    // 更新全局的交易手续费 若有必要 更新协议手续费
    // overflow is acceptable, protocol has to withdraw before it hits type(uint128).max fees
    // 溢出是可以接受的，协议手续费必须在达到 type(uint128).max 之前取出
    if (zeroForOne) {
        feeGrowthGlobal0X128 = state.feeGrowthGlobalX128;
        if (state.protocolFee > 0) protocolFees.token0 += state.protocolFee;
    } else {
        feeGrowthGlobal1X128 = state.feeGrowthGlobalX128;
        if (state.protocolFee > 0) protocolFees.token1 += state.protocolFee;
    }

    // 返回交易实际的输入和输出数量
    (amount0, amount1) = zeroForOne == exactInput
        ? (amountSpecified - state.amountSpecifiedRemaining, state.amountCalculated)
        : (state.amountCalculated, amountSpecified - state.amountSpecifiedRemaining);

    // do the transfers and collect payment
    // 将交易输出转给接收者
    if (zeroForOne) {
        if (amount1 < 0) TransferHelper.safeTransfer(token1, recipient, uint256(-amount1));

        uint256 balance0Before = balance0();
        // 调用回调函数 回调函数需要将输入token转给Pool
        IUniswapV3SwapCallback(msg.sender).uniswapV3SwapCallback(amount0, amount1, data);
        // 检查输入token转入数量
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
- [struct StepComputations](#StepComputations)
- [tickBitMap.nextInitializedTickWithinOneWord](./Tick.md#nextInitializedTickWithinOneWord)
- [Pool.computeSwapStep](#computeSwapStep)
- [observations.observeSingle](./Oracle.md#observeSingle)
- [observations.write](./Oracle.md#write)

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

### computeSwapStep

用于swap函数的分步交易，计算具体的输入输出数量以及交易后的价格

```solidity
/// @notice Computes the result of swapping some amount in, or amount out, given the parameters of the swap
/// @dev The fee, plus the amount in, will never exceed the amount remaining if the swap's `amountSpecified` is positive
/// @param sqrtRatioCurrentX96 The current sqrt price of the pool
/// @param sqrtRatioTargetX96 The price that cannot be exceeded, from which the direction of the swap is inferred
/// @param liquidity The usable liquidity
/// @param amountRemaining How much input or output amount is remaining to be swapped in/out
/// @param feePips The fee taken from the input amount, expressed in hundredths of a bip
/// @return sqrtRatioNextX96 The price after swapping the amount in/out, not to exceed the price target
/// @return amountIn The amount to be swapped in, of either token0 or token1, based on the direction of the swap
/// @return amountOut The amount to be received, of either token0 or token1, based on the direction of the swap
/// @return feeAmount The amount of input that will be taken as a fee
function computeSwapStep(
    uint160 sqrtRatioCurrentX96,
    uint160 sqrtRatioTargetX96,
    uint128 liquidity,
    int256 amountRemaining,
    uint24 feePips
)
    internal
    pure
    returns (
        uint160 sqrtRatioNextX96,
        uint256 amountIn,
        uint256 amountOut,
        uint256 feeAmount
    )
{
    bool zeroForOne = sqrtRatioCurrentX96 >= sqrtRatioTargetX96;
    bool exactIn = amountRemaining >= 0;

    if (exactIn) {
        // 刨除手续费之后的输入数量 (以1e6为100%, feePips是费率)
        uint256 amountRemainingLessFee = FullMath.mulDiv(uint256(amountRemaining), 1e6 - feePips, 1e6);
        // 通过deltaPrice（当前价格到目标价格的差）和流动性L计算deltaX
        amountIn = zeroForOne
            ? SqrtPriceMath.getAmount0Delta(sqrtRatioTargetX96, sqrtRatioCurrentX96, liquidity, true)
            : SqrtPriceMath.getAmount1Delta(sqrtRatioCurrentX96, sqrtRatioTargetX96, liquidity, true);
        
        // 如果刨除手续费之后的输入 >= 计算得出能够交换的数量 (输入仍未被耗尽)
        // 下个价格点即为目标价格
        if (amountRemainingLessFee >= amountIn) sqrtRatioNextX96 = sqrtRatioTargetX96;
        else
            // 如果输出被耗尽，需要重新计算交易停止的价格点
            sqrtRatioNextX96 = SqrtPriceMath.getNextSqrtPriceFromInput(
                sqrtRatioCurrentX96,
                liquidity,
                amountRemainingLessFee,
                zeroForOne
            );
    } else {
        // exactOut 的情况类似
        amountOut = zeroForOne
            ? SqrtPriceMath.getAmount1Delta(sqrtRatioTargetX96, sqrtRatioCurrentX96, liquidity, false)
            : SqrtPriceMath.getAmount0Delta(sqrtRatioCurrentX96, sqrtRatioTargetX96, liquidity, false);
        if (uint256(-amountRemaining) >= amountOut) sqrtRatioNextX96 = sqrtRatioTargetX96;
        else
            sqrtRatioNextX96 = SqrtPriceMath.getNextSqrtPriceFromOutput(
                sqrtRatioCurrentX96,
                liquidity,
                uint256(-amountRemaining),
                zeroForOne
            );
    }

    // max 交易后的价格是否达到了下一个tick对应的价格
    // 即判断交易价格是否越过了tickNext
    bool max = sqrtRatioTargetX96 == sqrtRatioNextX96;

    // get the input/output amounts
    if (zeroForOne) {
        amountIn = max && exactIn
            ? amountIn
            : SqrtPriceMath.getAmount0Delta(sqrtRatioNextX96, sqrtRatioCurrentX96, liquidity, true);
        amountOut = max && !exactIn
            ? amountOut
            : SqrtPriceMath.getAmount1Delta(sqrtRatioNextX96, sqrtRatioCurrentX96, liquidity, false);
    } else {
        amountIn = max && exactIn
            ? amountIn
            : SqrtPriceMath.getAmount1Delta(sqrtRatioCurrentX96, sqrtRatioNextX96, liquidity, true);
        amountOut = max && !exactIn
            ? amountOut
            : SqrtPriceMath.getAmount0Delta(sqrtRatioCurrentX96, sqrtRatioNextX96, liquidity, false);
    }

    // cap the output amount to not exceed the remaining output amount
    // 当处于 exactOutinput 调用时，需要将输出反号（入参的amountRemaining是负数）
    if (!exactIn && amountOut > uint256(-amountRemaining)) {
        amountOut = uint256(-amountRemaining);
    }

    if (exactIn && sqrtRatioNextX96 != sqrtRatioTargetX96) {
        // we didn't reach the target, so take the remainder of the maximum input as fee
        // 当该步交易没有越过下一个tick时，将剩余的输入token作为手续费
        feeAmount = uint256(amountRemaining) - amountIn;
    } else {
        // 当该步交易越过下一个tick时，使用费率计算手续费
        // 注意这里分母是 1e6 - feePips 不是 1e6
        // 因为此时amountIn是由amountRemainingLessFee计算而来，而amountRemainingLessFee已经在最开始刨除了手续费
        feeAmount = FullMath.mulDivRoundingUp(amountIn, feePips, 1e6 - feePips);
    }
}
```

相关代码

- [getAmount0Delta](#getAmount0Delta)
- [getNextSqrtPriceFromInput](#getNextSqrtPriceFromInput)

补充

- [Uniswap v3 详解（三）：交易过程#拆分后的交易计算](https://liaoph.com/uniswap-v3-3/#%E6%8B%86%E5%88%86%E5%90%8E%E7%9A%84%E4%BA%A4%E6%98%93%E8%AE%A1%E7%AE%97)

### getAmount0Delta

通过价格差Δ√P和流动性L计算 ΔX (token0)

```math
Δx=1/(Δ√P⋅L)
Δy=Δ√P⋅L
```

```solidity
/// @notice Gets the amount0 delta between two prices
/// @dev Calculates liquidity / sqrt(lower) - liquidity / sqrt(upper),
/// i.e. liquidity * (sqrt(upper) - sqrt(lower)) / (sqrt(upper) * sqrt(lower))
/// @param sqrtRatioAX96 A sqrt price
/// @param sqrtRatioBX96 Another sqrt price
/// @param liquidity The amount of usable liquidity
/// @param roundUp Whether to round the amount up or down
/// @return amount0 Amount of token0 required to cover a position of size liquidity between the two passed prices
function getAmount0Delta(
    uint160 sqrtRatioAX96,
    uint160 sqrtRatioBX96,
    uint128 liquidity,
    bool roundUp
) internal pure returns (uint256 amount0) {
    // A,B价格排序
    if (sqrtRatioAX96 > sqrtRatioBX96) (sqrtRatioAX96, sqrtRatioBX96) = (sqrtRatioBX96, sqrtRatioAX96);

    // FixedPoint96.RESOLUTION 为 96
    // 因为价格是 96位定点数，所以liquidity需要左移96位
    uint256 numerator1 = uint256(liquidity) << FixedPoint96.RESOLUTION;
    uint256 numerator2 = sqrtRatioBX96 - sqrtRatioAX96;

    // A,B 价格都要大于0 (B>A)
    require(sqrtRatioAX96 > 0);

    // 价格向上入：若不能整除则结果+1
    // 价格向下舍：若不能整除则结果取整数
    return
        roundUp
            ? UnsafeMath.divRoundingUp(
                FullMath.mulDivRoundingUp(numerator1, numerator2, sqrtRatioBX96),
                sqrtRatioAX96
            )
            : FullMath.mulDiv(numerator1, numerator2, sqrtRatioBX96) / sqrtRatioAX96;
}
```

### getNextSqrtPriceFromInput

通过输入的token数量和流动性L计算交易后的价格

```math
√Pn = L√Pc / (L · Δx√Pc)
```

```solidity
/// @notice Gets the next sqrt price given an input amount of token0 or token1
/// @dev Throws if price or liquidity are 0, or if the next price is out of bounds
/// @param sqrtPX96 The starting price, i.e., before accounting for the input amount
/// @param liquidity The amount of usable liquidity
/// @param amountIn How much of token0, or token1, is being swapped in
/// @param zeroForOne Whether the amount in is token0 or token1
/// @return sqrtQX96 The price after adding the input amount to token0 or token1
function getNextSqrtPriceFromInput(
    uint160 sqrtPX96,
    uint128 liquidity,
    uint256 amountIn,
    bool zeroForOne
) internal pure returns (uint160 sqrtQX96) {
    require(sqrtPX96 > 0);
    require(liquidity > 0);

    // round to make sure that we don't pass the target price
    return
        zeroForOne
            ? getNextSqrtPriceFromAmount0RoundingUp(sqrtPX96, liquidity, amountIn, true)
            : getNextSqrtPriceFromAmount1RoundingDown(sqrtPX96, liquidity, amountIn, true);
}
```

### flash

闪电贷接口，无需抵押和零信任的借贷，借贷到还贷需要在一个区块内完成。本接口只能归还相同品种相同数量的token，如果需要借出和归还不同品种，直接使用swap函数

实现原理：

- 借贷方可以先向合约借贷 x, y token 中某一个（或者两个都借贷）
- 借贷方指定借贷的数量，以及回调函数的参数，调用 flashswap
- 合约会先将用户请求借贷的 token 按指定数量发送给借贷方
- 发送完毕后，Pool会向借贷方指定的合约的地址调用指定的回调函数，并将回调函数的参数传入
- 调用完成后，Pool检查 x, y token 余额满足 x′⋅y′≥k (x⋅y=k)

```solidity
/// @inheritdoc IUniswapV3PoolActions
function flash(
    address recipient,
    uint256 amount0,
    uint256 amount1,
    bytes calldata data
) external override lock noDelegateCall {
    // 若Pool中没有流动性，无法提供借贷
    uint128 _liquidity = liquidity;
    require(_liquidity > 0, 'L');

    // 计算手续费
    uint256 fee0 = FullMath.mulDivRoundingUp(amount0, fee, 1e6);
    uint256 fee1 = FullMath.mulDivRoundingUp(amount1, fee, 1e6);
    // 记录借贷之前的Pool的token总余额
    uint256 balance0Before = balance0();
    uint256 balance1Before = balance1();

    // 将贷款打给借贷者
    if (amount0 > 0) TransferHelper.safeTransfer(token0, recipient, amount0);
    if (amount1 > 0) TransferHelper.safeTransfer(token1, recipient, amount1);

    // flash的回调
    // 用户在回调中需要完成还贷的逻辑，将贷款归还Pool
    IUniswapV3FlashCallback(msg.sender).uniswapV3FlashCallback(fee0, fee1, data);

    // 查询借贷流程之后的Pool的token总余额
    uint256 balance0After = balance0();
    uint256 balance1After = balance1();

    // 两种token余额，只能多不能少
    require(balance0Before.add(fee0) <= balance0After, 'F0');
    require(balance1Before.add(fee1) <= balance1After, 'F1');

    // sub is safe because we know balanceAfter is gt balanceBefore by at least fee
    // 这里减法不用担心下溢出，因为after至少比before多了fee
    uint256 paid0 = balance0After - balance0Before;
    uint256 paid1 = balance1After - balance1Before;

    // 分别计算交易手续费和协议手续费
    if (paid0 > 0) {
        uint8 feeProtocol0 = slot0.feeProtocol % 16;
        uint256 fees0 = feeProtocol0 == 0 ? 0 : paid0 / feeProtocol0;
        if (uint128(fees0) > 0) protocolFees.token0 += uint128(fees0);
        feeGrowthGlobal0X128 += FullMath.mulDiv(paid0 - fees0, FixedPoint128.Q128, _liquidity);
    }
    if (paid1 > 0) {
        uint8 feeProtocol1 = slot0.feeProtocol >> 4;
        uint256 fees1 = feeProtocol1 == 0 ? 0 : paid1 / feeProtocol1;
        if (uint128(fees1) > 0) protocolFees.token1 += uint128(fees1);
        feeGrowthGlobal1X128 += FullMath.mulDiv(paid1 - fees1, FixedPoint128.Q128, _liquidity);
    }

    emit Flash(msg.sender, recipient, amount0, amount1, paid0, paid1);
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
