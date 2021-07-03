## uniswapV3 sungraph
 1 使用已经部署好的graph
 https://thegraph.com/explorer/subgraph/benesjan/uniswap-v3-subgraph
 2 输入查询语句
```
{
  factories(first: 5) {
    id
    poolCount
    txCount
    totalVolumeUSD
  }
  bundles(first: 5) {
    id
    ethPriceUSD
  }
}


{
  positions(where : {owner : "0x1aeF26E2B724fFDe7d1105E206620e43bc8077C9" } ) {
    id
    owner
    liquidity
 
    depositedToken0
    depositedToken1
    withdrawnToken0
    withdrawnToken1
    pool {
      id
      createdAtTimestamp
    }
    token0 {
    symbol
    }
    token1 {
      symbol
    }
  
  }

// 池子为单位

{
  pools(where : {id : "0x290a6a7460b308ee3f19023d2d00de604bcf5b42" 
 } ) {
    id
    token0 {
      symbol
    }
    token1 {
      symbol
    }
  liquidity
  sqrtPrice
  token0Price
  token1Price
    
    mints (where: {owner : "0xc36442b4a4522e871399cd717abdd847ab11fe88"}){
      timestamp
      owner
      amount
      amount0
      amount1
      amountUSD
      tickLower
      tickUpper
    }
  
   collects (where: {owner : "0xc36442b4a4522e871399cd717abdd847ab11fe88"}){
      timestamp
      owner
      amount0
      amount1
      amountUSD
      tickLower
      tickUpper
    }
  
     burns (where: {owner : "0xc36442b4a4522e871399cd717abdd847ab11fe88"}){
      timestamp
      owner
      amount0
      amount1
      amountUSD
      tickLower
      tickUpper
    }
  
  }
}

}
```
3 字段解析
https://docs.uniswap.org/SDK/classes/Pool1
 
 ## 参考链接
 https://github.com/Uniswap/uniswap-v3-subgraph
 https://github.com/croco-finance/cduniswap-v3-subgraph/