## 1. 数据抓取
使用已经部署好的 [Subgraph](https://thegraph.com/explorer/subgraph/benesjan/uniswap-v3-subgraph), 抓取用户做市的事件数据
 
- 获取用户的 postion
以 0xb893bd6c547e4def62c6155183af118a95c0c55f 用户为例, 在 SubGraph 中输入如下 graphql 获取该用户的持仓数据
```
{
  positions( where : {
    pool : "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8",
    depositedToken1_gt: 300
    owner: "0xb893bd6c547e4def62c6155183af118a95c0c55f"

  } ) {
    id
    owner
    liquidity
  
    tickLower {
      tickIdx
      
      
    }
    tickUpper {
      tickIdx
    
      
    }
    transaction {
      id
      gasUsed
      gasPrice
    }

    depositedToken0
    depositedToken1
    withdrawnToken0
    withdrawnToken1
    collectedFeesToken0
    collectedFeesToken1
  }
}
```


mint  

{
  mints(where : {
    pool : "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8",
    # depositedToken1_gt: 300
    origin: "0xb893bd6c547e4def62c6155183af118a95c0c55f"
	tickLower: 189540
    tickUpper: 200700
   
  } ) {
    id
   transaction {
    timestamp
    id   
  }
    amount0
     amount1
    amountUSD
  }
}


//burns
{
  burns(where : {
    pool : "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8",
    # depositedToken1_gt: 300
    origin: "0xb893bd6c547e4def62c6155183af118a95c0c55f"
		tickLower: 189540
    tickUpper: 200700
   
  } ) {
    id
   transaction {
    timestamp
    id
  
    
  }
    amount0
     amount1
    amountUSD
  }

}