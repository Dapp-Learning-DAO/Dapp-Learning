// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require('hardhat');
const { readDeployment } = require('./utils');

async function main() {
    const deployment = readDeployment();
    const addr = deployment.rnvAddress;
    const requestID = deployment.requestID;
   
    const random = await ethers.getContractAt("RandomNumberVRF",addr);

    // get RequestStatus 
    console.log("Going to get RequestStatus");
    const requests = await random.getRequestStatus(requestID);
  
    console.log(requests);

    // get randomWords 
    console.log("Going to get randomWords");
    const overview = await requests.randomWords;
    console.log(overview);
    
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
