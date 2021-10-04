import { ethers, run } from 'hardhat';
import { GraphQLClient, gql } from 'graphql-request'
import { v1, v2,RewardsInformation } from '@aave/protocol-js';


async function main() {
  const endpoint = 'https://api.thegraph.com/subgraphs/name/aave/aave-v2-matic'

  const graphQLClient = new GraphQLClient(endpoint,{ headers: {} })

  //https://www.npmjs.com/package/graphql-request
  const reserveQuery = gql`
    {
      reserves (where: {
        usageAsCollateralEnabled: true
      }) {
        id
        name
        price {
          id
        }
        liquidityRate
        variableBorrowRate
        stableBorrowRate
      }
    }
  `

  const poolReservesData = await graphQLClient.request(reserveQuery);

  console.log("reserveData: ", poolReservesData);


  let userAddress = "xxx	";

  const userQuery = gql`
  {
    userReserves(where: {user: "xxx"}) {
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


const rawUserReserves = await graphQLClient.request(userQuery)

console.log("userData: ", rawUserReserves);






// ethprice
const priceQuery = gql`
  {

  priceOracle(id: "1") {
    usdPriceEth
         }
      
  }
`
const price = await graphQLClient.request(priceQuery);

console.log(" price: ", price )

//todo 
const rewardsInfo = {} as any;

let userSummary = v2.formatUserSummaryData(poolReservesData, rawUserReserves, userAddress.toLowerCase(),price,  Math.floor(Date.now() / 1000), rewardsInfo);

console.log(userSummary)

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



