# UniswapV3Factory 主要代码解读

## State Variables

### owner

```solidity
/// @inheritdoc IUniswapV3Factory
address public override owner;
```

### feeAmountTickSpacing

根据费率设置的不同的 [tickSpacing](./UniswapV3Pool.md#tickSpacing) 间隔

```solidity
/// @inheritdoc IUniswapV3Factory
mapping(uint24 => int24) public override feeAmountTickSpacing;
```

初始化代码

```solidity
contsructor() {
    ...
    feeAmountTickSpacing[500] = 10;
    feeAmountTickSpacing[3000] = 60;
    feeAmountTickSpacing[10000] = 200;
}
```

### getPool

Pool的地址索引，通过 `tokenA`, `tokenB`, `fee` 三个键查找

```solidity
/// @inheritdoc IUniswapV3Factory
mapping(address => mapping(address => mapping(uint24 => address))) public override getPool;
```

### parameters

存储Pool初始化的参数

```solidity
struct Parameters {
    address factory;
    address token0;
    address token1;
    uint24 fee;
    int24 tickSpacing;
}

/// @inheritdoc IUniswapV3PoolDeployer
Parameters public override parameters;
```

## Struct


## Functions

### createPool

通过token交易对（顺序不影响），fee费率，三个参数部署Pool合约

```solidity
/// @inheritdoc IUniswapV3Factory
function createPool(
    address tokenA,
    address tokenB,
    uint24 fee
) external override noDelegateCall returns (address pool) {
    // 需要两种不同token
    require(tokenA != tokenB);
    // 对token地址排序
    (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    // tokenA地址不能为 0 因为B比A大 所以只用断言一个
    require(token0 != address(0));
    // 根据费率设定Pool的tickSpacing
    int24 tickSpacing = feeAmountTickSpacing[fee];
    require(tickSpacing != 0);
    // 查询该Pool地址 地址必须为 0 否则说明Pool已创建
    require(getPool[token0][token1][fee] == address(0));
    // 部署Pool合约
    pool = deploy(address(this), token0, token1, fee, tickSpacing);
    getPool[token0][token1][fee] = pool;
    // populate mapping in the reverse direction, deliberate choice to avoid the cost of comparing addresses
    getPool[token1][token0][fee] = pool;
    emit PoolCreated(token0, token1, fee, tickSpacing, pool);
}
```

### deploy

部署 `UniswapV3Pool` 合约

- 先将初始化参数存入storage，方便Pool合约初始化时调用，部署完成后，清除storage
- 不直接传入初始化参数的原因是这里使用了 `CREATE2` 来部署合约，`CREATE2` 会将合约的 `initcode`(包含constructor的参数) 和 `salt` 一起用来计算创建出的合约地址
- 使用 `CREATE2` 的优势：
  - 可以在链下计算出已经创建的交易池的地址
  - 其他合约不必通过 UniswapV3Factory 中的接口来查询交易池的地址，可以节省 gas
  - 合约地址不会因为 reorg 而改变
- 不使用V2的`initialize`方法来初始化是因为这些参数在V3中都是`immutable`,无法在除了`constructor`的函数里面赋值.immutable的值在编译器编译后,将会在初次运行时写入合约的运行时代码中, 因此访问immutable参数比访问slot值会更快.这可能是这些参数设计成immutable的原因.
```solidity
/// @dev Deploys a pool with the given parameters by transiently setting the parameters storage slot and then
/// clearing it after deploying the pool.
/// @param factory The contract address of the Uniswap V3 factory
/// @param token0 The first token of the pool by address sort order
/// @param token1 The second token of the pool by address sort order
/// @param fee The fee collected upon every swap in the pool, denominated in hundredths of a bip
/// @param tickSpacing The spacing between usable ticks
function deploy(
    address factory,
    address token0,
    address token1,
    uint24 fee,
    int24 tickSpacing
) internal returns (address pool) {
    // 将初始化参数存入storage
    parameters = Parameters({factory: factory, token0: token0, token1: token1, fee: fee, tickSpacing: tickSpacing});
    // 使用 CREATE2 指令部署Pool合约
    // Pool初始化时 会访问storage中的初始化参数
    pool = address(new UniswapV3Pool{salt: keccak256(abi.encode(token0, token1, fee))}());
    // 部署完成 清除storage
    delete parameters;
}
```

相关代码

- [tickSpacing](./UniswapV3Pool.md#tickSpacing)
- [UniswapV3Pool.constructor](./UniswapV3Pool.md#constructor)

补充

- 关于使用 salt 创建合约的解释：[Salted contract creations / create2](https://docs.soliditylang.org/en/latest/control-structures.html#salted-contract-creations-create2)
