
const { ethers } = require('hardhat');
require('dotenv').config();
const { saveDeployment } = require('./utils');

async function main() {
    // We get the contract to deploy
    const RnvContractFactory = await ethers.getContractFactory("RandomNumberVRF");
    
    const rnv = await RnvContractFactory.deploy(process.env.SubscriptionId);
    
    console.log("deploying....");

    await rnv.waitForDeployment()

    console.log("rnv deployed to:", rnv.target);

    // save contract address to file
    saveDeployment({
      rnvAddress: rnv.target,
    });
   
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
