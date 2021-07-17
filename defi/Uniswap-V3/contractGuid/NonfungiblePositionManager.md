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
