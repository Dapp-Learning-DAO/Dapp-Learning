// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");

async function main() {

    const [owner] = await ethers.getSigners();

    // Optimism proxy contract address is 0x4200000000000000000000000000000000000010
    const artifactL1ChugSplashProxy = artifacts.readArtifactSync("WithdrawProxy");
    const l1ChugSplashProxy = new ethers.Contract("0x4200000000000000000000000000000000000010", artifactL1ChugSplashProxy.abi , owner );


    console.log("Account balance:", (await owner.getBalance()).toString());

    // withdraw eth to Optimism
    let messageBytes = ethers.utils.toUtf8Bytes("");
    await l1ChugSplashProxy.withdraw("0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000", ethers.utils.parseEther("0.0001"),0,messageBytes);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
