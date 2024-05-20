// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const {ethers} = require("hardhat");
const {
  readRedpacketDeployment,
  saveRedpacketDeployment,
} = require("../../utils");


async function main() {
  const [deployer] = await ethers.getSigners();
  const deployment = readRedpacketDeployment();
  const omniCounterAddress = deployment.omniCounterAddressOnOptimSepolia
  const omniCounter = await ethers.getContractAt('OmniCounter', omniCounterAddress, deployer);

  // check result
  let result = await omniCounter.counter();
  console.log(result)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
