# SwapRouter

## State Variables

## struct

### ExactInputParams

```solidity
struct ExactInputParams {
    bytes path;                 // 路径
    address recipient;          // 收款地址
    uint256 deadline;           // 交易有效期
    uint256 amountIn;           // 输入的 token 数（输入的 token 地址就是 path 中的第一个地址）
    uint256 amountOutMinimum;   // 预期交易最少获得的 token 数（获得的 token 地址就是 path 中最后一个地址）
}
```

### SwapCallbackData

交易回调函数的入参结构体

```solidity
struct SwapCallbackData {
    bytes path;
    address payer;
}
```

## functions

### exactInput

指定交易对路径，将 x token 交换为 y token。
传入 x token 数和预期得到的最小 y token 数

```solidity
/// @inheritdoc ISwapRouter
function exactInput(ExactInputParams memory params)
    external
    payable
    override
    checkDeadline(params.deadline)
    returns (uint256 amountOut)
{
    address payer = msg.sender; // msg.sender pays for the first hop

    // 通过循环，遍历传入的路径，进行交易
    while (true) {
        // 交易路径是否存在2个及2个以上的Pool地址
        bool hasMultiplePools = params.path.hasMultiplePools();

        // the outputs of prior swaps become the inputs to subsequent ones
        params.amountIn = exactInputInternal(
            params.amountIn,
            hasMultiplePools ? address(this) : params.recipient, // for intermediate swaps, this contract custodies
            0,
            SwapCallbackData({
                path: params.path.getFirstPool(), // only the first pool in the path is necessary
                payer: payer
            })
        );

        // decide whether to continue or terminate
        if (hasMultiplePools) {
            payer = address(this); // at this point, the caller has paid
            params.path = params.path.skipToken();
        } else {
            amountOut = params.amountIn;
            break;
        }
    }

    require(amountOut >= params.amountOutMinimum, 'Too little received');
}
```

相关代码

- [struct ExactInputParams](#ExactInputParams)
- [modifier checkDeadLine](#checkDeadLine)
- [hasMultiplePools](#hasMultiplePools)

### exactInputInternal

exactInput 内部函数

```solidity
/// @dev Performs a single exact input swap
function exactInputInternal(
    uint256 amountIn,
    address recipient,
    uint160 sqrtPriceLimitX96,
    SwapCallbackData memory data
) private returns (uint256 amountOut) {
    // allow swapping to the router address with address 0
    // 允许0地址作为接受者 自动转为本合约地址
    if (recipient == address(0)) recipient = address(this);

    (address tokenIn, address tokenOut, uint24 fee) = data.path.decodeFirstPool();

    bool zeroForOne = tokenIn < tokenOut;

    (int256 amount0, int256 amount1) =
        getPool(tokenIn, tokenOut, fee).swap(
            recipient,
            zeroForOne,
            amountIn.toInt256(),
            sqrtPriceLimitX96 == 0
                ? (zeroForOne ? TickMath.MIN_SQRT_RATIO + 1 : TickMath.MAX_SQRT_RATIO - 1)
                : sqrtPriceLimitX96,
            abi.encode(data)
        );

    return uint256(-(zeroForOne ? amount1 : amount0));
}
```

### hasMultiplePools

通过路径字节长度判断交易路径中是否存在两个及以上的pool地址

```solidity
/// @notice Returns true iff the path contains two or more pools
/// @param path The encoded swap path
/// @return True if path contains two or more pools, otherwise false
function hasMultiplePools(bytes memory path) internal pure returns (bool) {
    // MULTIPLE_POOLS_MIN_LENGTH： 2个Pool地址+1个fee费率的字节长度
    return path.length >= MULTIPLE_POOLS_MIN_LENGTH;
}
```

### decodeFirstPool

解析交易路径中的第一个Pool地址，返回tokenA,tokenB,fee

```solidity
/// @notice Decodes the first pool in path
/// @param path The bytes encoded swap path
/// @return tokenA The first token of the given pool
/// @return tokenB The second token of the given pool
/// @return fee The fee level of the pool
function decodeFirstPool(bytes memory path)
    internal
    pure
    returns (
        address tokenA,
        address tokenB,
        uint24 fee
    )
{
    // 返回第一个地址
    tokenA = path.toAddress(0);
    fee = path.toUint24(ADDR_SIZE);
    tokenB = path.toAddress(NEXT_OFFSET);
}
```

## modifier

### checkDeadline

当blocktime超过deadline，被修饰的函数终止执行

```solidity
modifier checkDeadline(uint256 deadline) {
    require(_blockTimestamp() <= deadline, 'Transaction too old');
    _;
}
```
