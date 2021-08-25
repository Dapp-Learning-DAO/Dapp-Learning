// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const fs = require("fs");
const counterContractAddress = require("./CounterContractaddress.json");

async function main() {
  const [deployer] = await ethers.getSigners();
  const artifact = artifacts.readArtifactSync("Counter");
  const provider = new ethers.providers.InfuraProvider("kovan");

  const providerContract = new ethers.Contract(
    counterContractAddress.address,
    artifact.abi,
    provider
  );

  // Check the value of counter
  const counterVal = await providerContract.counter();
  console.log("The value of counter is :", parseInt(counterVal));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
