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

}
```
3 字段解析
https://docs.uniswap.org/SDK/classes/Pool1
 
 ## 参考链接
 https://github.com/Uniswap/uniswap-v3-subgraph
 https://github.com/croco-finance/cduniswap-v3-subgraph/