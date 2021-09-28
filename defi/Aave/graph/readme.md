## aave  subgraph


**tips**
- All address values (e.g. when used for id) must be in lower case format.
- The ID of reserves is the address of the asset and the address of the market's LendingPoolAddressProvider
- When using the raw endpoints, depending on the type of numeric value queried
- Each results 'page' returns 100 entries by default. This can be increased to a maximum of 1000 
- All data on our Graph endpoint is static. Therefore to get the latest balance of a user (which includes the interest earned up to that second), you would need to either calculate it yourself or make a balanceOf() call to the aToken contract.
- When using the raw endpoints, depending on the type of numeric value queried, it will be returned either in wei units (i.e. 10^18), the decimals of the asset itself (i.e. 10^6 for USDC), or ray units (i.e. 10^27).
### polygon aave subgraph

**reserve**
```
{
  reserves {
    name
   
   baseLTVasCollateral
    reserveFactor
    utilizationRate
  reserveLiquidationThreshold
    liquidityRate 
    variableBorrowRate
    totalDeposits
  
    availableLiquidity
    totalATokenSupply
    totalCurrentVariableDebt
  }
}
```

result is blow ：
```
{
  "data": {
    "reserves": [
      {
        "availableLiquidity": "148499409352405686010730485",
        "baseLTVasCollateral": "5000",
        "liquidityRate": "2723725322887993370107575",
        "name": "Wrapped Matic",
        "reserveFactor": "2000",
        "reserveLiquidationThreshold": "6500",
        "totalATokenSupply": "174523901736562566724430221",
        "totalCurrentVariableDebt": "26026721418501477800005470",
        // 储备规模 = totalDeposits * price
        "totalDeposits": "171465364402278182828144318",
        "utilizationRate": "0.13393932",
        "variableBorrowRate": "23013327817337086137883509"
      },
      {
        "availableLiquidity": "870365227434",
        "baseLTVasCollateral": "7000",
        "liquidityRate": "73866868905717564132946",
        "name": "(PoS) Wrapped BTC",
        "reserveFactor": "2000",
        "reserveLiquidationThreshold": "7500",
        "totalATokenSupply": "895168097450",
        "totalCurrentVariableDebt": "24807284062",
        "totalDeposits": "887033351890",
        "utilizationRate": "0.01879086",
        "variableBorrowRate": "3371073075120547152544351"
      },
      {
        "availableLiquidity": "164494501634635",
        "baseLTVasCollateral": "8000",
        "liquidityRate": "29160326901557196296303103",
        "name": "USD Coin (PoS)",
        "reserveFactor": "1000",
        "reserveLiquidationThreshold": "8500",
        "totalATokenSupply": "1105111600358348",
        "totalCurrentVariableDebt": "940615291406719",
        "totalDeposits": "1091603232776498",
        "utilizationRate": "0.84930925",
        "variableBorrowRate": "37947544627904123801526949"
      },
      {
        "availableLiquidity": "270725570708570461419467",
        "baseLTVasCollateral": "8000",
        "liquidityRate": "1935899655658532451393346",
        "name": "Wrapped Ether",
        "reserveFactor": "1000",
        "reserveLiquidationThreshold": "8250",
        "totalATokenSupply": "310782290627589744730249",
        "totalCurrentVariableDebt": "40056233794241691613949",
        "totalDeposits": "309087754682165022712310",
        "utilizationRate": "0.12411421",
        "variableBorrowRate": "16270784076037333942892535"
      },
      {
        "availableLiquidity": "189352219058735115509650306",
        "baseLTVasCollateral": "7500",
        "liquidityRate": "28159917877426171058417185",
        "name": "(PoS) Dai Stablecoin",
        "reserveFactor": "1000",
        "reserveLiquidationThreshold": "8000",
        "totalATokenSupply": "897958515833242343078127894",
        "totalCurrentVariableDebt": "708608285629834524443486916",
        "totalDeposits": "885132826725244362709010054",
        "utilizationRate": "0.78607479",
        "variableBorrowRate": "39553000923814007433510746"
      },
      {
        "availableLiquidity": "16180317028423",
        "baseLTVasCollateral": "0",
        "liquidityRate": "32294322747531035912568352",
        "name": "(PoS) Tether USD",
        "reserveFactor": "1000",
        "reserveLiquidationThreshold": "0",
        "totalATokenSupply": "187386231211372",
        "totalCurrentVariableDebt": "171226579215053",
        "totalDeposits": "181335082278022",
        "utilizationRate": "0.91077117",
        "variableBorrowRate": "39934713849587631894406064"
      },
      {
        "availableLiquidity": "185734398320734291623460",
        "baseLTVasCollateral": "5000",
        "liquidityRate": "0",
        "name": "Aave (PoS)",
        "reserveFactor": "0",
        "reserveLiquidationThreshold": "6500",
        "totalATokenSupply": "185734398320734291623460",
        "totalCurrentVariableDebt": "0",
        "totalDeposits": "185727392627832565258167",
        "utilizationRate": "-0.00003772",
        "variableBorrowRate": "0"
      }
    ]
  }
}
 


```

## calculate the health factor
** userData** 
```
{ 
  userReserves(where: {user: "xxxx"}) {
    reserve {
      id
      symbol
      pool {
       lendingPool 
      }
      
      baseLTVasCollateral
      name
      reserveFactor
      reserveLiquidationThreshold
      utilizationRate
      
    }
    currentVariableDebt
    currentTotalDebt
    currentATokenBalance
    liquidityRate
    
    user {
      id
      unclaimedRewards
      lifetimeRewards
     
      
    }
    
    liquidityRate
    currentATokenBalance
  }
}
```



## 操作文档

```
   npx hardhat compile --no-typechain (依赖问题，所以跳过)    
   npx hardhat run scripts/deploy.ts --network matic  

```


## 参考链接
- 合约：
https://github.com/aave/protocol-v2/blob/750920303e33b66bc29862ea3b85206dda9ce786/contracts/protocol/libraries/logic/GenericLogic.sol
- 清算：https://docs.aave.com/developers/guides/liquidations
- graph文档： https://docs.aave.com/developers/getting-started/using-graphql
- liquidate: https://medium.com/coinmonks/creating-a-liquidation-script-for-aave-defi-protocol-ef584ad87e8f  
- thegraphapi: https://thegraph.com/docs/developer/querying-from-your-app
- graphgithub :https://github.com/prisma-labs/graphql-request#install  
