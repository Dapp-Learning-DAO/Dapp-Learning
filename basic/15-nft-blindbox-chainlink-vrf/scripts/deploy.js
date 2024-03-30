
const { ethers } = require('hardhat');
require('dotenv').config();
const { saveDeployment } = require('./utils');

async function main() {
    // We get the contract to deploy
    const Dnd = await ethers.getContractFactory("DungeonsAndDragonsCharacter");
    
    const dnd = await Dnd.deploy(process.env.SubscriptionId, "http://81.69.8.95/WaterMarginJson/");

    await dnd.waitForDeployment()

    console.log("dnd deployed to:", dnd.target);

    // save contract address to file
    saveDeployment({
      dndAddress: dnd.target,
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
