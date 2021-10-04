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

let userAddress = "XXXX";

const lendingPool = await ethers.getContractAt("ILendingPool", "0x8dff5e27ea6b7ac08ebfdf9eb090f32ee9a30fcf");
  
// user data
let useraccount =  await lendingPool.getUserAccountData(userAddress);


console.log("userdata: ", useraccount); 
console.log("healthFactor: ", useraccount.healthFactor.toString()); 

//returns the configuration of the user across all the reserves.
let userConfiguration =  await lendingPool.getUserConfiguration(userAddress);
console.log("userConfiguration: ", userConfiguration);

// returns the list of initialized reserves.
let reservesList  = await lendingPool.getReservesList();
console.log(reservesList);

// returns the state and configuration of the reserve
let asset = reservesList[0];
let reserveData =  await lendingPool.getReserveData(asset);
console.log("reserveData: ", reserveData);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



