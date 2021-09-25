## aave  subgraph


**tips**
- All address values (e.g. when used for id) must be in lower case format.
- The ID of reserves is the address of the asset and the address of the market's LendingPoolAddressProvider
- When using the raw endpoints, depending on the type of numeric value queried
- Each results 'page' returns 100 entries by default. This can be increased to a maximum of 1000 
- All data on our Graph endpoint is static. Therefore to get the latest balance of a user (which includes the interest earned up to that second), you would need to either calculate it yourself or make a balanceOf() call to the aToken contract.
### polygon aave subgraph


```
{
  
  userReserves(where: {user: "0x7ac1f060320e23182a78fdada0a5efa0ecd2bf8d"}) {
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
