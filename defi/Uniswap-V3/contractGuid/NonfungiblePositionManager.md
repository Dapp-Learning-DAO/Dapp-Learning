# NonfungiblePositionManager 主要代码解读

## State Variables

### _poolIds

Pool地址  => Pool在manager中的编号

```solidity
/// @dev IDs of pools assigned by this contract
mapping(address => uint80) private _poolIds;
```

### _poolIdToPoolKey

Pool在manager中的编号  => [PoolKey](#poolkey)

```solidity
/// @dev Pool keys by pool ID, to save on SSTOREs for position data
mapping(uint80 => PoolAddress.PoolKey) private _poolIdToPoolKey;
```

### _positions

position 列表
Pool在manager中的编号 => position

```solidity
/// @dev The token ID position data
mapping(uint256 => Position) private _positions;
```

### _nextId,_nextPoolId

自增序号

```solidity
/// @dev The ID of the next token that will be minted. Skips 0
uint176 private _nextId = 1;
/// @dev The ID of the next pool that is used for the first time. Skips 0
uint80 private _nextPoolId = 1;
```

### _tokenDescriptor

存储`NonfungibleTokenPositionDescriptor`合约地址
该合约用于记录代表用户流动性的 NFT token地址，并为 NFT 生成 URI

```solidity
/// @dev The address of the token descriptor contract, which handles generating token URIs for position tokens
address private immutable _tokenDescriptor;
```

## Struct

### PoolKey

```solidity
/// @notice The identifying key of the pool
struct PoolKey {
    address token0;
    address token1;
    uint24 fee;
}
```

### Position

```solidity
// details about the uniswap position
struct Position {
    // the nonce for permits
    uint96 nonce;
    // the address that is approved for spending this token
    address operator;
    // the ID of the pool with which this token is connected
    uint80 poolId;
    // the tick range of the position
    int24 tickLower;
    int24 tickUpper;
    // the liquidity of the position
    uint128 liquidity;
    // the fee growth of the aggregate position as of the last action on the individual position
    uint256 feeGrowthInside0LastX128;
    uint256 feeGrowthInside1LastX128;
    // how many uncollected tokens are owed to the position, as of the last computation
    uint128 tokensOwed0;
    uint128 tokensOwed1;
}
```

### AddLiquidityParams

添加流动性方法的入参

```solidity
struct AddLiquidityParams {
    address token0;     // token0 的地址
    address token1;     // token1 的地址
    uint24 fee;         // 交易费率
    address recipient;  // 流动性的所属人地址
    int24 tickLower;    // 流动性的价格下限（以 token0 计价），这里传入的是 tick index
    int24 tickUpper;    // 流动性的价格上线（以 token0 计价），这里传入的是 tick index
    uint256 amount0Desired; // 希望提供的token0数量
    uint256 amount1Desired; // 希望提供的token1数量
    uint256 amount0Max; // 提供的 token0 上限数
    uint256 amount1Max; // 提供的 token1 上限数
}
```

### MintCallbackData

uniswapV3MintCallback 回调函数的入参结构

```solidity
struct MintCallbackData {
    PoolAddress.PoolKey poolKey;
    address payer;
}
```

## Functions

### createAndInitializePoolIfNecessary

创建Pool，如果有必要，对其初始化

```solidity
/// @inheritdoc IPoolInitializer
function createAndInitializePoolIfNecessary(
    address token0,
    address token1,
    uint24 fee,
    uint160 sqrtPriceX96
) external payable override returns (address pool) {
    // 保证token地址排序一致
    require(token0 < token1);
    // 通过Factory查询Pool的地址
    pool = IUniswapV3Factory(factory).getPool(token0, token1, fee);

    if (pool == address(0)) {
        // 如果Pool为0 则需要创建并初始化
        pool = IUniswapV3Factory(factory).createPool(token0, token1, fee);
        IUniswapV3Pool(pool).initialize(sqrtPriceX96);
    } else {
        // Pool已存在 获取最新价格
        (uint160 sqrtPriceX96Existing, , , , , , ) = IUniswapV3Pool(pool).slot0();
        // 如果价格为 0 则初始化Pool
        if (sqrtPriceX96Existing == 0) {
            IUniswapV3Pool(pool).initialize(sqrtPriceX96);
        }
    }
}
```

相关代码

- [UniswapV3Factory(factory).getPool](./UniswapV3Factory.md#getPool)
- [UniswapV3Factory(factory).createPool](./UniswapV3Factory.md#createPool)
- [UniswapV3Pool.initialize](./UniswapV3Pool.md#initialize)

### mint

Manager 铸造代表流动性头寸的ERC721代笔返回给用户

```solidity
/// @inheritdoc INonfungiblePositionManager
function mint(MintParams calldata params)
    external
    payable
    override
    checkDeadline(params.deadline)
    returns (
        uint256 tokenId,
        uint128 liquidity,
        uint256 amount0,
        uint256 amount1
    )
{
    // 添加流动性
    IUniswapV3Pool pool;
    (liquidity, amount0, amount1, pool) = addLiquidity(
        AddLiquidityParams({
            token0: params.token0,
            token1: params.token1,
            fee: params.fee,
            recipient: address(this),
            tickLower: params.tickLower,
            tickUpper: params.tickUpper,
            amount0Desired: params.amount0Desired,
            amount1Desired: params.amount1Desired,
            amount0Min: params.amount0Min,
            amount1Min: params.amount1Min
        })
    );

    // 铸造ERC721代币
    _mint(params.recipient, (tokenId = _nextId++));

    // 计算positionKey
    bytes32 positionKey = PositionKey.compute(address(this), params.tickLower, params.tickUpper);
    // 通过positionKey获取token0和token1的 每单位流动性的手续费数量
    // 后续提取手续费可以用 该值 × position的流动性 来得出用户应得的手续费数量
    (, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, , ) = pool.positions(positionKey);

    // idempotent set
    // 生成PoolId
    uint80 poolId =
        cachePoolKey(
            address(pool),
            PoolAddress.PoolKey({token0: params.token0, token1: params.token1, fee: params.fee})
        );

    // 将用户的流动性头寸 存入positions列表
    _positions[tokenId] = Position({
        nonce: 0,
        operator: address(0),
        poolId: poolId,
        tickLower: params.tickLower,
        tickUpper: params.tickUpper,
        liquidity: liquidity,
        feeGrowthInside0LastX128: feeGrowthInside0LastX128,
        feeGrowthInside1LastX128: feeGrowthInside1LastX128,
        tokensOwed0: 0,
        tokensOwed1: 0
    });

    emit IncreaseLiquidity(tokenId, liquidity, amount0, amount1);
}
```

相关代码

- [Pool.positions](./UniswapV3Pool.md#positions)
- [struct Position](#Position)
- [Manager.addLiquidity](#addLiquidity)

### addLiquidity

添加流动性到一个已初始化过的Pool中

```solidity
/// @notice Add liquidity to an initialized pool
function addLiquidity(AddLiquidityParams memory params)
    internal
    returns (
        uint128 liquidity,
        uint256 amount0,
        uint256 amount1,
        IUniswapV3Pool pool
    )
{
    // 新建 struct PoolKey 并缓存
    PoolAddress.PoolKey memory poolKey =
        PoolAddress.PoolKey({token0: params.token0, token1: params.token1, fee: params.fee});

    // 通过Poolkey计算出Pool地址 进而得到了Pool合约的实例
    // 和V2不同，这里不需要通过访问factory合约拿到Pool地址
    pool = IUniswapV3Pool(PoolAddress.computeAddress(factory, poolKey));

    // compute the liquidity amount
    // 计算流动性数量
    {
        // 从slot0插槽拿到 价格
        (uint160 sqrtPriceX96, , , , , , ) = pool.slot0();
        // 根据入参tickLower计算本次提供流动性的价格下限
        uint160 sqrtRatioAX96 = TickMath.getSqrtRatioAtTick(params.tickLower);
        // 根据入参tickUpper计算本次提供流动性的价格上限
        uint160 sqrtRatioBX96 = TickMath.getSqrtRatioAtTick(params.tickUpper);

        // 根据入参计算其能提供的最大流动性数量
        liquidity = LiquidityAmounts.getLiquidityForAmounts(
            sqrtPriceX96,
            sqrtRatioAX96,
            sqrtRatioBX96,
            params.amount0Desired,
            params.amount1Desired
        );
    }

    // 调用Pool的mint函数
    (amount0, amount1) = pool.mint(
        params.recipient,
        params.tickLower,
        params.tickUpper,
        liquidity,
        abi.encode(MintCallbackData({poolKey: poolKey, payer: msg.sender}))
    );

    require(amount0 >= params.amount0Min && amount1 >= params.amount1Min, 'Price slippage check');
}
```

相关代码

- [struct PoolKey](#PoolKey)
- [Manager.computeAddress](#computeAddress)
- [Tick.getSqrtRatioAtTick](./Tick.md#getSqrtRatioAtTick)
- [LiquidityAmounts.getLiquidityForAmounts](#getLiquidityForAmounts)
- [Pool.mint](./UniswapV3Pool.md#mint)

### getPoolKey

通过 tokenA, tokenB, fee 三个参数 生成 PoolKey
tokenA,tokenB 需要地址排序

```solidity
/// @notice Returns PoolKey: the ordered tokens with the matched fee levels
/// @param tokenA The first token of a pool, unsorted
/// @param tokenB The second token of a pool, unsorted
/// @param fee The fee level of the pool
/// @return Poolkey The pool details with ordered token0 and token1 assignments
function getPoolKey(
    address tokenA,
    address tokenB,
    uint24 fee
) internal pure returns (PoolKey memory) {
    if (tokenA > tokenB) (tokenA, tokenB) = (tokenB, tokenA);
    return PoolKey({token0: tokenA, token1: tokenB, fee: fee});
}
```

### computeAddress

通过 factory地址 和 PoolKey 计算出 Pool 的地址

```solidity
/// @notice Deterministically computes the pool address given the factory and PoolKey
/// @param factory The Uniswap V3 factory contract address
/// @param key The PoolKey
/// @return pool The contract address of the V3 pool
function computeAddress(address factory, PoolKey memory key) internal pure returns (address pool) {
    require(key.token0 < key.token1);
    pool = address(
        uint256(
            keccak256(
                abi.encodePacked(
                    hex'ff',
                    factory,
                    keccak256(abi.encode(key.token0, key.token1, key.fee)),
                    POOL_INIT_CODE_HASH
                )
            )
        )
    );
}
```

### getLiquidityForAmounts

根据传入的token0和token1的数量，计算其能提供的最大流动性数量

```solidity
/// @notice Computes the maximum amount of liquidity received for a given amount of token0, token1, the current
/// pool prices and the prices at the tick boundaries
/// @param sqrtRatioX96 A sqrt price representing the current pool prices
/// Pool的当前价格
/// @param sqrtRatioAX96 A sqrt price representing the first tick boundary
/// 希望提供流动性的价格下限
/// @param sqrtRatioBX96 A sqrt price representing the second tick boundary
/// 希望提供流动性的价格上限
/// @param amount0 The amount of token0 being sent in
/// token0的数量
/// @param amount1 The amount of token1 being sent in
/// token1的数量
/// @return liquidity The maximum amount of liquidity received
/// 返回其能提供的最大流动性数量
function getLiquidityForAmounts(
    uint160 sqrtRatioX96,
    uint160 sqrtRatioAX96,
    uint160 sqrtRatioBX96,
    uint256 amount0,
    uint256 amount1
) internal pure returns (uint128 liquidity) {
    // 对价格进行排序 保证 A < B
    if (sqrtRatioAX96 > sqrtRatioBX96) (sqrtRatioAX96, sqrtRatioBX96) = (sqrtRatioBX96, sqrtRatioAX96);

    // 从token数量计算流动性L
    // 具体原理请参考博客链接
    if (sqrtRatioX96 <= sqrtRatioAX96) {
        liquidity = getLiquidityForAmount0(sqrtRatioAX96, sqrtRatioBX96, amount0);
    } else if (sqrtRatioX96 < sqrtRatioBX96) {
        uint128 liquidity0 = getLiquidityForAmount0(sqrtRatioX96, sqrtRatioBX96, amount0);
        uint128 liquidity1 = getLiquidityForAmount1(sqrtRatioAX96, sqrtRatioX96, amount1);

        liquidity = liquidity0 < liquidity1 ? liquidity0 : liquidity1;
    } else {
        liquidity = getLiquidityForAmount1(sqrtRatioAX96, sqrtRatioBX96, amount1);
    }
}
```

补充

- 原理解析原文 [Uniswap v3 详解（二）：创建交易对/提供流动性 #从 token 数计算流动性 L](https://liaoph.com/uniswap-v3-2/#%E4%BB%8E-token-%E6%95%B0%E8%AE%A1%E7%AE%97%E6%B5%81%E5%8A%A8%E6%80%A7-l)

### uniswapV3MintCallback

被Pool.mint 函数调用的回调，进行token的转帐操作

```solidity
/// @inheritdoc IUniswapV3MintCallback
function uniswapV3MintCallback(
    uint256 amount0Owed,
    uint256 amount1Owed,
    bytes calldata data
) external override {
    // 从calldata缓存区中 解码出 PoolKey 和 payer 参数
    MintCallbackData memory decoded = abi.decode(data, (MintCallbackData));
    // 检验得到的Pool地址是否正确
    CallbackValidation.verifyCallback(factory, decoded.poolKey);

    // 进行token转帐 从payer转到Pool中
    // payer 可能是用户或者Manager合约
    if (amount0Owed > 0) pay(decoded.poolKey.token0, decoded.payer, msg.sender, amount0Owed);
    if (amount1Owed > 0) pay(decoded.poolKey.token1, decoded.payer, msg.sender, amount1Owed);
}
```

相关代码

- [UniswapV3Pool.mint](./UniswapV3Pool.md#mint)
- [MintCallbackData](#MintCallbackData)
- [pay](#pay)

### pay

Pool的token转帐函数

```solidity
/// @param token The token to pay
/// @param payer The entity that must pay
/// @param recipient The entity that will receive payment
/// @param value The amount to pay
function pay(
    address token,
    address payer,
    address recipient,
    uint256 value
) internal {
    // 如果token是eth（WETH） 且 调用该方法的地址中有余额
    if (token == WETH9 && address(this).balance >= value) {
        // pay with WETH9
        // 用WETH9支付
        // 向WETH9合约中存入
        IWETH9(WETH9).deposit{value: value}(); // wrap only what is needed to pay
        // 调用WETH9合约转帐方法
        IWETH9(WETH9).transfer(recipient, value);
    } else if (payer == address(this)) {
        // 如果payer是调用该方法的合约 （Manager）
        // pay with tokens already in the contract (for the exact input multihop case)
        // 用Manager合约中已存在的token支付
        TransferHelper.safeTransfer(token, recipient, value);
    } else {
        // pull payment
        // payer不是本合约（可能是用户）
        TransferHelper.safeTransferFrom(token, payer, recipient, value);
    }
}
```

### DecreaseLiquidityParams

移除流动性的入参结构体

```solidity
struct DecreaseLiquidityParams {
    uint256 tokenId;        // ERC721的id
    uint128 liquidity;      // 要移除的流动性数量
    uint256 amount0Min;     // token0要移除的最小数量
    uint256 amount1Min;     // token1要移除的最小数量
    uint256 deadline;       // blocktime超过deadline终止执行
}
```

### decreaseLiquidity

移除position的流动性
更新Manager中的position状态（流动性和存在Manager中的token数量），调用`Pool.burn`

```solidity
/// @inheritdoc INonfungiblePositionManager
function decreaseLiquidity(DecreaseLiquidityParams calldata params)
    external
    payable
    override
    isAuthorizedForToken(params.tokenId)
    checkDeadline(params.deadline)
    returns (uint256 amount0, uint256 amount1)
{
    require(params.liquidity > 0);
    Position storage position = _positions[params.tokenId];

    // 检查position现有流动性 >= 传入的流动性
    uint128 positionLiquidity = position.liquidity;
    require(positionLiquidity >= params.liquidity);

    // 缓存PoolKey 优化gas消耗
    PoolAddress.PoolKey memory poolKey = _poolIdToPoolKey[position.poolId];
    // 通过PoolKey拿到对应的Pool
    IUniswapV3Pool pool = IUniswapV3Pool(PoolAddress.computeAddress(factory, poolKey));
    // 调用Pool的burn函数 返回实际移除的流动性转换为token的数量
    (amount0, amount1) = pool.burn(position.tickLower, position.tickUpper, params.liquidity);

    // 实际移除的流动性不能小于设置的最小移除流动性数量
    require(amount0 >= params.amount0Min && amount1 >= params.amount1Min, 'Price slippage check');

    // 计算positionKey
    bytes32 positionKey = PositionKey.compute(address(this), position.tickLower, position.tickUpper);

    // this is now updated to the current transaction
    // 现在为用户回收position中的手续费

    // 获取移除之后的position中的 手续费每流动性单位 （fee/liquidity）
    // 此时Pool中的position记录的fee是最新的
    // 而Manager中的fee，只会在 增加或移除 流动性时，从Pool的数据中更新
    (, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, , ) = pool.positions(positionKey);

    // position中记录着拥有者的token数量
    // token数量 = 移除流动性转换的token + 用户赚取的手续费增量 （相比于上次更新手续费时）
    // 用户赚取的手续费增量 = Pool中的手续费 - Manager中的手续费
    position.tokensOwed0 +=
        uint128(amount0) +
        uint128(
            // FullMath.mulDiv 是先乘后除的安全计算方法
            // feeGrowthInside0LastX128 是 手续费每流动性单位
            // 即 feeGrowth增量 × positionLiquidity = 手续费增量
            // 又因feeGrowthInside0LastX128是Q128.128精度的定点数
            // 所以最后要将小数位左移128位（二进制）
            // FixedPoint128.Q128 = 0x100000000000000000000000000000000
            FullMath.mulDiv(
                feeGrowthInside0LastX128 - position.feeGrowthInside0LastX128,
                positionLiquidity,
                FixedPoint128.Q128
            )
        );
    // 同上
    position.tokensOwed1 +=
        uint128(amount1) +
        uint128(
            FullMath.mulDiv(
                feeGrowthInside1LastX128 - position.feeGrowthInside1LastX128,
                positionLiquidity,
                FixedPoint128.Q128
            )
        );

    // 从Pool的数据中更新手续费
    position.feeGrowthInside0LastX128 = feeGrowthInside0LastX128;
    position.feeGrowthInside1LastX128 = feeGrowthInside1LastX128;

    // 更新position的流动性 （减去移除的量）
    // subtraction is safe because we checked positionLiquidity is gte params.liquidity
    // 我们检查了 positionLiquidity >= params.liquidity 所以这里减法是安全的
    position.liquidity = positionLiquidity - params.liquidity;

    emit DecreaseLiquidity(params.tokenId, params.liquidity, amount0, amount1);
}
```

相关代码

- [struct DecreaseLiquidityParams](#DecreaseLiquidityParams)
- [modifer Manager.isAuthorizedForToken](#isAuthorizedForToken)
- [modifer Manager.checkDeadline](#checkDeadline)
- [Manager._positions](#_positions)
- [Pool.positions](./UniswapV3Pool.md#positions)
- [Pool.burn](./UniswapV3Pool.md#burn)
- [Manager.computeAddress](#computeAddress)

### burn

传入`tokenId`调用Manager内部方法`_burn()`，销毁ERC721代币代表的position
`_burn()` 继承自 ERC721 类，即销毁ERC721token的标准方法

```solidity
/// @inheritdoc INonfungiblePositionManager
function burn(uint256 tokenId) external payable override isAuthorizedForToken(tokenId) {
    // 获取tokenId对应的postion
    Position storage position = _positions[tokenId];
    // 检查position的 liquidity tokensOwed0 tokensOwed1 必须为0
    // 否则不能销毁position
    require(position.liquidity == 0 && position.tokensOwed0 == 0 && position.tokensOwed1 == 0, 'Not cleared');
    // 删除position数据
    delete _positions[tokenId];
    // 销毁ERC721 TOKEN
    _burn(tokenId);
}
```

相关代码

- [modifer Manager.isAuthorizedForToken](#isAuthorizedForToken)

## modifer

### isAuthorizedForToken

调用 ERC721 类的 `_isApprovedOrOwner`函数
被修饰的函数只能是ERC721token所有者，或被approve授权者

```solidity
modifier isAuthorizedForToken(uint256 tokenId) {
    require(_isApprovedOrOwner(msg.sender, tokenId), 'Not approved');
    _;
}
```

### checkDeadline

当blocktime超过deadline，被修饰的函数终止执行

```solidity
modifier checkDeadline(uint256 deadline) {
    require(_blockTimestamp() <= deadline, 'Transaction too old');
    _;
}
```
