# Uniswap V3
## 地址跟踪

 主网weth地址：0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2
 主网USDT地址：0xdac17f958d2ee523a2206206994597c13d831ec7
 NonfungiblePositionManager: 0xc36442b4a4522e871399cd717abdd847ab11fe88

1.首次添加流动性：mint
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

会发出event事件
 emit Mint (address sender, index_topic_1 address owner, index_topic_2 int24 tickLower, index_topic_3 int24 tickUpper, uint128 amount, uint256 amount0, uint256 amount1)
 emit IncreaseLiquidity(tokenId, liquidity, amount0, amount1);
以及 获取id事件
Transfer (index_topic_1 address from, index_topic_2 address to, index_topic_3 uint256 tokenId)
```
2.添加流动性 increaseLiquidity
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
监听方法和event均可
```

3 移出流动性 decreaseLiquidity
```
Function: decreaseLiquidity((uint256,uint128,uint256,uint256,uint256))
 
   struct DecreaseLiquidityParams {
        uint256 tokenId;
        uint128 liquidity;
        uint256 amount0Min;
        uint256 amount1Min;
        uint256 deadline;
    }

由于传入是liquidity, 解析方法没用，监听event
emit DecreaseLiquidity(params.tokenId, params.liquidity, amount0, amount1);
或者 UniswapV3Pool.sol合约的burn  
 emit Burn(msg.sender, tickLower, tickUpper, amount, amount0, amount1);

```

## 地址跟踪：
以 `0x6b50ed5c2f8ab4dd7a02b7cdc4e57e140292e10f` 地址为例

1  添加流动性
https://etherscan.io/tx/0xb340ded02a373b71104ebf0e7acfe53d4f05bbf9102a15f72fa10dabdce95c53
nft tokenId 52408
2 减少流动性
https://etherscan.io/tx/0xd6b52e256ca4f5afe4c86da750d4b2df8d88d067ac89722b345b3ca8be60a68e

decreaseLiquidity
collect

3 添加流动性

