# Uniswap V3
## pool介绍

创建交易对，就是创建一个新的合约，作为流动池来提供交易功能。创建合约的步骤是：
```
pool = address(new UniswapV3Pool{salt: keccak256(abi.encode(token0, token1, fee))}());
```

pool合约负责池子的所有操作：
```
  function snapshotCumulativesInside(int24 tickLower, int24 tickUpper)

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