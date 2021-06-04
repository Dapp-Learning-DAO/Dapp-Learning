

function convertEthToExactDai(uint256 daiAmount) external payable {
    require(daiAmount > 0, "Must pass non 0 DAI amount");
    require(msg.value > 0, "Must pass non 0 ETH amount");

    uint256 deadline = block.timestamp + 15; // using 'now' for convenience, for mainnet pass deadline from frontend!
    address tokenIn = WETH9;
    address tokenOut = multiDaiKovan;
    uint24 fee = 3000;
    address recipient = msg.sender;
    uint256 amountOut = daiAmount;
    uint256 amountInMaximum = msg.value;
    uint160 sqrtPriceLimitX96 = 0;

    ISwapRouter.ExactOutputSingleParams memory params = ISwapRouter.ExactOutputSingleParams(
    tokenIn,
    tokenOut,
    fee,
    recipient,
    deadline,
    amountOut,
    amountInMaximum,
    sqrtPriceLimitX96
    );

    uniswapRouter.exactOutputSingle{ value: msg.value }(params);
    uniswapRouter.refundETH();

    // refund leftover ETH to user
    (bool success,) = msg.sender.call{ value: address(this).balance }("");
    require(success, "refund failed");
}

function getEstimatedETHforDAI(uint daiAmount) external payable returns (uint256) {
    address tokenIn = WETH9;
    address tokenOut = multiDaiKovan;
    uint24 fee = 500;
    uint160 sqrtPriceLimitX96 = 0;
    return quoter.quoteExactOutputSingle(
    tokenIn,
    tokenOut,
    fee,
    daiAmount,
    sqrtPriceLimitX96
    );

}

//https://github.com/Uniswap/uniswap-v3-periphery/blob/9ca9575d09b0b8d985cc4d9a0f689f7a4470ecb7/test/shared/path.ts
function encodePath(tokenAddresses, fees) {
    const FEE_SIZE = 3

    if (path.length != fees.length + 1) {
    throw new Error('path/fee lengths do not match')
    }

    let encoded = '0x'
    for (let i = 0; i < fees.length; i++) {
    // 20 byte encoding of the address
    encoded += path[i].slice(2)
    // 3 byte encoding of the fee
    encoded += fees[i].toString(16).padStart(2 * FEE_SIZE, '0')
    }
    // encode the final token
    encoded += path[path.length - 1].slice(2)

    return encoded.toLowerCase()
}