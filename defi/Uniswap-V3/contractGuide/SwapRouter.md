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

指定交易对路径，将 tokenIn 交换为 tokenOut， 返回实际的交易数量。

- 传入 x token 数和预期得到的最小 y token 数
- path中传入多个token地址，可设置中间代币 （Base token），即 tokenX -> Basetoken -> tokenY
  - tokenAddress0 + fee0 + tokenAddress1（无Base token）
  - tokenAddress0 + fee0 + tokenAddress1 + fee1 + tokenAddress2（有Base token）

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
            0,                          // 传入价格 0 代表以市价交易
            SwapCallbackData({
                path: params.path.getFirstPool(), // only the first pool in the path is necessary
                payer: payer
            })
        );

        // decide whether to continue or terminate
        // 判断path中是否还有未交易的token地址，即是否需要继续交易
        if (hasMultiplePools) {
            // 继续循环，需要将交易者设置为本合约地址
            payer = address(this);  // at this point, the caller has paid
            params.path = params.path.skipToken();
        } else {
            // 交易完成跳出循环
            amountOut = params.amountIn;
            break;
        }
    }

    // 检查交易输出量，不能过小
    require(amountOut >= params.amountOutMinimum, 'Too little received');
}
```

相关代码

- [struct ExactInputParams](#ExactInputParams)
- [struct SwapCallbackData](#SwapCallbackData)
- [modifier checkDeadLine](#checkDeadLine)
- [hasMultiplePools](#hasMultiplePools)
- [exactInputInternal](#exactInputInternal)

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

    // 从path中解析出Pool的关键信息
    // 这里从交易链路（path）中解析出的地址有可能 tokenIn > tokenOut 
    (address tokenIn, address tokenOut, uint24 fee) = data.path.decodeFirstPool();

    // 判断两个token地址大小
    // 由于Pool中price始终以 y/x 表示 （x地址 < y地址）
    // zeroForOne 实际代表的是Pool.swap中的交易方向
    //      true  token x -> token y
    //      false token y -> token x
    bool zeroForOne = tokenIn < tokenOut;

    // 调用Pool.swap 返回实际交易的token数量
    // amount0 输入的实际数量
    // amount1 输出的实际数量
    // 执行完成后 Pool 会调用 uniswapV3SwapCallback 回调函数
    (int256 amount0, int256 amount1) =
        getPool(tokenIn, tokenOut, fee).swap(
            recipient,
            zeroForOne,
            amountIn.toInt256(),
            // 传入价格 0 代表以市价交易
            sqrtPriceLimitX96 == 0
                ? (zeroForOne ? TickMath.MIN_SQRT_RATIO + 1 : TickMath.MAX_SQRT_RATIO - 1)
                : sqrtPriceLimitX96,
            abi.encode(data)
        );

    return uint256(-(zeroForOne ? amount1 : amount0));
}
```

相关代码

- [Pool.swap](./UniswapV3Pool.md#swap)
- [Router.uniswapV3SwapCallback](#uniswapV3SwapCallback)

### uniswapV3SwapCallback

swap回调函数，只执行path交易链路中的第一个token转账

- 执行 `exactInput`时，将直接把token从Manager合约内转到Pool中

`Pool.swap` 执行完成后，会调用本回调函数

```solidity
/// @inheritdoc IUniswapV3SwapCallback
function uniswapV3SwapCallback(
    int256 amount0Delta,
    int256 amount1Delta,
    bytes calldata _data
) external override {
    require(amount0Delta > 0 || amount1Delta > 0); // swaps entirely within 0-liquidity regions are not supported
    SwapCallbackData memory data = abi.decode(_data, (SwapCallbackData));
    (address tokenIn, address tokenOut, uint24 fee) = data.path.decodeFirstPool();
    CallbackValidation.verifyCallback(factory, tokenIn, tokenOut, fee);

    (bool isExactInput, uint256 amountToPay) =
        amount0Delta > 0
            ? (tokenIn < tokenOut, uint256(amount0Delta))
            : (tokenOut < tokenIn, uint256(amount1Delta));
    if (isExactInput) {
        pay(tokenIn, data.payer, msg.sender, amountToPay);
    } else {
        // either initiate the next swap or pay
        if (data.path.hasMultiplePools()) {
            data.path = data.path.skipToken();
            exactOutputInternal(amountToPay, msg.sender, 0, data);
        } else {
            amountInCached = amountToPay;
            tokenIn = tokenOut; // swap in/out because exact output swaps are reversed
            pay(tokenIn, data.payer, msg.sender, amountToPay);
        }
    }
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

相关代码

- [path.toAddress](#path.toAddress)
- [path.toUint24](#path.toUint24)

### path.toAddress

传入`bytes` 类型，和读取的起始位，返回内存中的地址

```solidity
function toAddress(bytes memory _bytes, uint256 _start) internal pure returns (address) {
    // 检查 _start+20 是否会溢出（超过uint256的最大值）
    // 若溢出则为负数
    require(_start + 20 >= _start, 'toAddress_overflow');
    // 检查_start 起始位 + 20字节（地址类型的长度） 不能超过bytes的总长度
    require(_bytes.length >= _start + 20, 'toAddress_outOfBounds');
    address tempAddress;

    assembly {
        // add(_bytes, 0x20)
        // 从 _bytes 指针开始向后越过32字节（16进制0x20）
        // 即 跳过内存中表达 _bytes 长度的区域（一个uint256数值）

        // add(..., _start)
        // 加上入参设置的读取起始位

        // div(mload(...), 0x1000000000000000000000000) 这里有24个0，即 2^96
        // 将mload的结果右移96位（12个字节）
        // 因为mload取出的数据是uint256类型（32个字节）而address类型是（20个字节）
        // 结果会自动在后面补0，即后12个字节（96位）补0，所以这里需要用除法将结果右移96位

        tempAddress := div(mload(add(add(_bytes, 0x20), _start)), 0x1000000000000000000000000)
    }

    return tempAddress;
}
```

原理解析：

- bytes在内存中前32字节是存储的bytes长度数值（uint256），所以这里要加上32越过这个uint256区域
- 由于address是uin160（20个字节），用mload操作符取出来是一个uint256（32个字节），所以得到的值后面会被补0。于是我们需要将取出的结果右移。
- 这里补了12个字节，也就是`12 * 8 = 96` 个0 (2进制)，所以结果需要除以 2^96。转换成16进制就是上面的0x100...0(24个0）

补充

- [Formal Specification of the Encoding](https://docs.soliditylang.org/en/latest/abi-spec.html#formal-specification-of-the-encoding)

### toUint24

传入`bytes` 类型，和读取的起始位，返回内存中的fee费率数值(`uint24`)

```solidity
function toUint24(bytes memory _bytes, uint256 _start) internal pure returns (uint24) {
    require(_start + 3 >= _start, 'toUint24_overflow');
    require(_bytes.length >= _start + 3, 'toUint24_outOfBounds');
    uint24 tempUint;

    assembly {
        tempUint := mload(add(add(_bytes, 0x3), _start))
    }

    return tempUint;
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
