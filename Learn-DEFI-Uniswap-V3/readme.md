# Uniswap V3
## 合约分析
  [合约结构图](./img/640.png)

 集成uniswap V3 以及   uniswap V3 源码剖析
 Uniswap v3 在代码层面的架构和 v2 基本保持一致，将合约分成了两个仓库：
 - uniswap-v3-core
 - uniswap-v3-periphery
 **core仓库**
- UniswapV3Factory是交易池(UniswapV3Pool)统一创建的接口。
- UniswapV3Pool由UniswapV3PoolDeployer统一部署。  实现代币交易，流动性管理，交易手续费的收取，oracle 数据管理。接口的实现粒度比较低，不适合普通用户使用，错误的调用其中的接口可能会造成经济上的损失。
UniswapV3Pool是核心逻辑，管理了Tick和Position，实现流动性管理以及一个交易池中swap功能实现。

**peirphery仓库**
- NonfungiblePositionManager负责交易池的创建以及流动性的添加删除，用来增加/移除/修改 Pool 的流动性，并且通过 NFT token 将流动性代币化。使用 ERC721 token（v2 使用的是 ERC20）的原因是同一个池的多个流动性并不能等价替换（v3 的集中流性动功能）。
- SwapRouter是swap路由的管理。提供代币交易的接口，它是对 UniswapV3Pool 合约中交易相关接口的进一步封装，前端界面主要与这个合约来进行对接。

每个Pool中的Position都做成了ERC721的Token。也就是说，每个Position都有独立的ERC721的Token ID。

 UniswapV3Pool 池子主要有 swap , mint ,collect, burn;

router合约对外接口 ,交易
[合约接口图](./img/create-pool.png)
```
 IUniswapRouter public constant uniswapRouter = IUniswapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);

```
### 创建交易池
 NonfungiblePositionManager负责交易池的创建以及流通性的添加/删除。
 每个交易池的关键信息由PoolKey表示， token0, token1, fee 构成一个池子。
 所有交易池中的Position都归总管理，并赋予一个全局唯一的编号（_nextId)，从1开始。 每个Position由创建地址以及边界唯一确定：
 ```
 function compute(
      address owner,
      int24 tickLower,
      int24 tickUpper
 ) internal pure returns (bytes32) {
      return keccak256(abi.encodePacked(owner, tickLower, tickUpper));
 }

 通过createAndInitializePoolIfNecessary函数创建一个交易池：

- createPool
核心逻辑是调用UniswapV3PoolDeployer的deploy函数创建UniswapV3Pool智能合约并设置两个token信息，交易费用信息和tick的步长信息：
接着查看deploy函数，创建UniswapV3Pool智能合约。注意每个交易池的地址的设置，是token0/token1/fee的编码后的结果。也就是说，每个交易池有唯一的地址，并且和PoolKey信息保持一致。通过这种方法，从PoolKey信息可以反推出交易池的地址。
 ```
- initialize
每个交易池的initialize函数初始化交易池的参数和状态。所有交易池的参数和状态用一个数据结构Slot0来记录：

### 添加流动性
 NonfungiblePositionManager的mint函数实现初始的流动性的添加，increaseLiquidity函数实现了流动性的增加。这两个函数的逻辑基本一致，都是通过调用addLiquidity函数实现。mint需要额外创建ERC721的token。
 addLiquidity实现在LiquidityManagement.sol：

  nfm合约根据用户输入的amount0Desired，amount1Desired 计算出liquidity, 然后计算出时间需要的 amount0, amount1,
  实际支付在mintcallback中实现，然后关注pool池子逻辑。
```
struct AddLiquidityParams {
    address token0;     // token0 的地址
    address token1;     // token1 的地址
    uint24 fee;         // 交易费率
    address recipient;  // 流动性的所属人地址
    int24 tickLower;    // 流动性的价格下限（以 token0 计价），这里传入的是 tick index
    int24 tickUpper;    // 流动性的价格上线（以 token0 计价），这里传入的是 tick index
    uint128 amount;     // 流动性 L 的值
    uint256 amount0Max; // 提供的 token0 上限数
    uint256 amount1Max; // 提供的 token1 上限数
}

 /// @notice Add liquidity to an initialized pool
function addLiquidity(AddLiquidityParams memory params)
    internal
    returns (
        uint256 amount0,
        uint256 amount1,
        IUniswapV3Pool pool
    )
{
    PoolAddress.PoolKey memory poolKey =
        PoolAddress.PoolKey({token0: params.token0, token1: params.token1, fee: params.fee});

    // 这里不需要访问 factory 合约，可以通过 token0, token1, fee 三个参数计算出 pool 的合约地址
    pool = IUniswapV3Pool(PoolAddress.computeAddress(factory, poolKey));

    (amount0, amount1) = pool.mint(
        params.recipient,
        params.tickLower,
        params.tickUpper,
        params.amount,
        // 这里是 pool 合约回调所使用的参数
        abi.encode(MintCallbackData({poolKey: poolKey, payer: msg.sender}))
    );

    require(amount0 <= params.amount0Max);
    require(amount1 <= params.amount1Max);
}
```

流动性添加的核心逻辑由交易池的mint函数实现。mint函数又是由两个子函数实现：_modifyPosition和_updatePosition。
- _updatePosition
 _updatePosition 创建或修改一个用户的 Position
流动性的状态更新是通过流动性(position)边界上的Tick的liquidityNet来表示：

_updatePosition主要就是更新Poisition对应边界的Tick信息：
```
function _updatePosition(
    address owner,
    int24 tickLower,
    int24 tickUpper,
    int128 liquidityDelta,
    int24 tick
) private returns (Position.Info storage position) {
    // 获取用户的 Postion
    position = positions.get(owner, tickLower, tickUpper);
    ...

    // 根据传入的参数修改 Position 对应的 lower/upper tick 中
    // 的数据，这里可以是增加流动性，也可以是移出流动性
    bool flippedLower;
    bool flippedUpper;
    if (liquidityDelta != 0) {
        uint32 blockTimestamp = _blockTimestamp();

        // 更新 lower tikc 和 upper tick
        // fippedX 变量表示是此 tick 的引用状态是否发生变化，即
        // 被引用 -> 未被引用 或
        // 未被引用 -> 被引用
        // 后续需要根据这个变量的值来更新 tick 位图
        flippedLower = ticks.update(
            tickLower,
            tick,
            liquidityDelta,
            _feeGrowthGlobal0X128,
            _feeGrowthGlobal1X128,
            false,
            maxLiquidityPerTick
        );
        flippedUpper = ticks.update(
            tickUpper,
            tick,
            liquidityDelta,
            _feeGrowthGlobal0X128,
            _feeGrowthGlobal1X128,
            true,
            maxLiquidityPerTick
        );

        // 如果一个 tick 第一次被引用，或者移除了所有引用
        // 那么更新 tick 位图
        if (flippedLower) {
            tickBitmap.flipTick(tickLower, tickSpacing);
            secondsOutside.initialize(tickLower, tick, tickSpacing, blockTimestamp);
        }
        if (flippedUpper) {
            tickBitmap.flipTick(tickUpper, tickSpacing);
            secondsOutside.initialize(tickUpper, tick, tickSpacing, blockTimestamp);
        }
    }
    ...
    // 更新 position 中的数据
    position.update(liquidityDelta, feeGrowthInside0X128, feeGrowthInside1X128);

    // 如果移除了对 tick 的引用，那么清除之前记录的元数据
    // 这只会发生在移除流动性的操作中
    if (liquidityDelta < 0) {
        if (flippedLower) {
            ticks.clear(tickLower);
            secondsOutside.clear(tickLower, tickSpacing);
        }
        if (flippedUpper) {
            ticks.clear(tickUpper);
            secondsOutside.clear(tickUpper, tickSpacing);
        }
    }
}
```
先忽略费率相关的操作，这个函数所做的操作是：

    - 添加/移除流动性时，先更新这个 Positon 对应的 lower/upper tick 中记录的元数据
    - 更新 position
    - 根据需要更新 tick 位图
 Postion 是以 owner, lower tick, uppper tick 作为键来存储的，注意这里的 owner 实际上是 NonfungiblePositionManager 合约的地址。这样当多个用户在同一个价格区间提供流动性时，
 在底层的 UniswapV3Pool 合约中会将他们合并存储。而在 NonfungiblePositionManager 合约中会按用户来区别每个用户拥有的 Position。

- _modifyPosition
_modifyPosition 函数在调用 _updatePosition 更新完 Position 后，会计算出此次提供流动性具体所需的 x token 和 y token 数量。
```
function _modifyPosition(ModifyPositionParams memory params)
    private
    noDelegateCall
    returns (
        Position.Info storage position,
        int256 amount0,
        int256 amount1
    )
{
    ...

    if (params.liquidityDelta != 0) {
        // 计算三种情况下 amount0 和 amount1 的值，即 x token 和 y token 的数量
        if (_slot0.tick < params.tickLower) {
            amount0 = SqrtPriceMath.getAmount0Delta(
                // 计算 lower/upper tick 对应的价格
                TickMath.getSqrtRatioAtTick(params.tickLower),
                TickMath.getSqrtRatioAtTick(params.tickUpper),
                params.liquidityDelta
            );
        } else if (_slot0.tick < params.tickUpper) {
            // current tick is inside the passed range
            uint128 liquidityBefore = liquidity; // SLOAD for gas optimization

            ...

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

            liquidity = LiquidityMath.addDelta(liquidityBefore, params.liquidityDelta);
        } else {
            amount1 = SqrtPriceMath.getAmount1Delta(
                TickMath.getSqrtRatioAtTick(params.tickLower),
                TickMath.getSqrtRatioAtTick(params.tickUpper),
                params.liquidityDelta
            );
        }
    }
}
```
代码将计算的过程封装在了 SqrtPriceMath 库中，getAmount0Delta 和 getAmount1Delta 分别对应公式,这两个函数中主要是封装了很多数学计算，Uniswap v3 参考这里实现了一个精度较高的 a⋅bc 的算法，封装在 FullMath 库中。

除了更新Tick信息外，_modifyPosition需要计算在当前价格情况下一定流动性对应资金金额。当前的价格存在_slot0.tick中，所以大体的逻辑如下：
```
if (_slot0.tick < params.tickLower) {
...
} else if (_slot0.tick < params.tickUpper) {
...
liquidity = LiquidityMath.addDelta(liquidityBefore, params.liquidityDelta);
} else {
...
}
```
在添加流动性时，如果添加的流动性包括当前的价格，当前的流动性需要更新。也就是上述代码的liquidity的更新。每个交易池中的liquidity保存了当前价格对应的流动性总和。


_modifyPosition 调用完成后，会返回 x token, 和 y token 的数量。完成流动性添加

```
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
### 删除流动性
调用交易池的burn函数。burn函数的核心也是调用_modifyPosition函数实现流动性的调整。_modifyPosition函数实现了正负流动性的调整。

在删除完流动性后，每个流动性对应需要取回的资金金额暂时存储在tokensOwed0和tokensOwed1变量：
```
position.tokensOwed0 +=
         uint128(amount0) +
         uint128(
             FullMath.mulDiv(
                 feeGrowthInside0LastX128 - position.feeGrowthInside0LastX128,
                 position.liquidity,
                 FixedPoint128.Q128
             )
         );
     position.tokensOwed1 +=
         uint128(amount1) +
         uint128(
             FullMath.mulDiv(
                 feeGrowthInside1LastX128 - position.feeGrowthInside1LastX128,
                 position.liquidity,
                 FixedPoint128.Q128
             )
         );
```
如果某个流动性为0，并且所有的手续费已经收取，可以通过NonfungiblePositionManager的burn函数删除该流动性对应的ERC721的Token 。

### SWAP
swap的逻辑实现在SwapRouter.sol，实现了多条路径互连swap逻辑。总共有两套函数:
- exactInputSingle/exactInput
- exactOutputSingle/exactOutput
exactInputSingle和exactOutputSingle是单交易池的swap函数，一个是从指定swap的输入金额，换取一定的输出，一个是指定swap的输出金额，反推需要多少输入金额。
无论是exactInputSingle，还是exactOutputSingle，最终都是调用交易池的swap函数：


### 提取交易费
NonfungiblePositionManager提供了collect函数提取手续费。每个Position中记录在流动性不变的情况下的一定时间内的费用增长率（feeGrowthInside）

tick范围
 imin=−887272,imax=887272


## 测试代码
 delegatecall 相当于把另外一个合约（或库）的函数“拉”到了当前合约（D）来执行，就像当前合约的内部函数一样。

 委托调用一个经典用法是合约的升级， 如果合约数据与逻辑分开， 逻辑函数通过委托调用来实现，就很容易实现逻辑的升级。
 保证sender不变

 multicall 方法主要调用了两个方法：

 主网weth地址：0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2
 主网USDT地址：0xdac17f958d2ee523a2206206994597c13d831ec7
 NonfungiblePositionManager: 0xc36442b4a4522e871399cd717abdd847ab11fe88
 factory: 0x1F98431c8aD98523631AE4a59f267346ea31F984

1.首次添加流动性：
```
Function: mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))

 struct MintParams {
        address token0;   //
        address token1;   //
        uint24 fee;
        int24 tickLower;   //
        int24 tickUpper;
        uint256 amount0Desired;   //提供的 token0 数
        uint256 amount1Desired;   //提供的 token1 数
        uint256 amount0Min;
        uint256 amount1Min;
        address recipient;
        uint256 deadline;
    }
     emit IncreaseLiquidity(tokenId, liquidity, amount0, amount1);
```
 调用poll的mint方法
2. 添加流动性 increaseLiquidity
```
 struct IncreaseLiquidityParams {
        uint256 tokenId;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        uint256 deadline;
    }

   emit IncreaseLiquidity(params.tokenId, liquidity, amount0, amount1);
```
 调用poll的mint方法

3. 移除流动性 decreaseLiquidity
```
 struct DecreaseLiquidityParams {
        uint256 tokenId;
        uint128 liquidity;
        uint256 amount0Min;
        uint256 amount1Min;
        uint256 deadline;
    }
 emit DecreaseLiquidity(params.tokenId, params.liquidity, amount0, amount1);
```
会调用pool池的burn方法


4 collect  收取手续费
手续费单独存储。
```
  struct CollectParams {
        uint256 tokenId;
        address recipient;
        uint128 amount0Max;
        uint128 amount1Max;
    }

   emit Collect(params.tokenId, recipient, amount0Collect, amount1Collect);
```
会调用pool.collect方法

5 burn
```
burn(uint256 tokenId)
```
## 参考链接
  https://learnblockchain.cn/article/2357
  https://learnblockchain.cn/article/2580
  https://liaoph.com/uniswap-v3-1/
  https://medium.com/taipei-ethereum-meetup/uniswap-v3-features-explained-in-depth-178cfe45f223
  //https://github.com/GammaStrategies/awesome-uniswap-v3
  https://mp.weixin.qq.com/s/SYjT3HH48V7WaSGmkPOzKg  星想法
  https://github.com/spore-engineering/nft-required-liquidity-mining-pool/blob/main/LiquidityFarmingNFT.sol   nft farming
  https://github.com/omarish/uniswap-v3-deploy-plugin  一键部署V3
  https://www.gelato.network/