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
