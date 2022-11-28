// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { readDeployment } = require('./utils');

async function main() {
    const deployment = readDeployment();
    const addr = deployment.dndAddress;
    const requestID = deployment.requestID;

    const dnd = await hre.ethers.getContractAt("DungeonsAndDragonsCharacter",addr);

    // Do the blindCharacter 
    console.log("Going to do blindCharacter");
    const tx1 = await dnd.blindCharacter(requestID);
    await tx1.wait();
    console.log("BlindCharacter finished");

    // get character 
    console.log("Going to get characters");
    const overview = await dnd.characters(0)
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
