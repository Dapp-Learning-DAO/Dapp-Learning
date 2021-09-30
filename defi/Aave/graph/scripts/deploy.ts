import { ethers, run } from 'hardhat';
import { GraphQLClient, gql } from 'graphql-request'
import { v1, v2 } from '@aave/protocol-js';


async function main() {

  let maticConfig = {
    lendingPoolAddressesProvider: "0xd05e3E715d945B59290df0ae8eF85c1BdB684744",
   
  }

  const accounts = await ethers.getSigners();

  console.log(
    'Deploying contracts with the account:',
    accounts.map((a) => a.address)
  );

;

const lendingPool = await ethers.getContractAt("ILendingPool", "0x8dff5e27ea6b7ac08ebfdf9eb090f32ee9a30fcf");
  
  let useraccount =  await lendingPool.getUserAccountData("xxxx");


  console.log("userdata: ", useraccount); 
  console.log("healthFactor: ", useraccount.healthFactor.toString()); 


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


// sdk 

let userAddress = "xxxx";
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



