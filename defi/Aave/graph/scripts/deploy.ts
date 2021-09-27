import { ethers, run } from 'hardhat';
import { GraphQLClient, gql } from 'graphql-request'

async function main() {
  const endpoint = 'https://api.thegraph.com/subgraphs/name/aave/aave-v2-matic'

  const graphQLClient = new GraphQLClient(endpoint,{ headers: {} })

  //https://www.npmjs.com/package/graphql-request
  const reserveQuery = gql`
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
  `

  const reserveData = await graphQLClient.request(reserveQuery);

  console.log("reserveData: ", reserveData);
  const userQuery = gql`
  {
    userReserves(where: {user: "xxxxxx"}) {
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
  `


const userData = await graphQLClient.request(userQuery)

console.log("userData: ", userData);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



