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
  const omniCounterAddress = deployment.omniCounterAddressOnSepolia
  const omniCounter = await ethers.getContractAt('OmniCounter', omniCounterAddress, deployer);
  const destinationEndpoindId =  10232

  // send message
  let tx = await omniCounter.incrementCounter(destinationEndpoindId,{
    gasLimit: 2483507,
    value: ethers.parseEther("0.01")
  });
  await tx.wait()
  console.log(tx)

  saveRedpacketDeployment({
    messageTxHashOnSepolia: tx.hash,
  });

  console.log(
    `Send cross chain message successfully`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
