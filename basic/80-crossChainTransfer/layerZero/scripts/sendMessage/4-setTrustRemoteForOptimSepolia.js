// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const {ethers} = require("hardhat");
const {
  readRedpacketDeployment,
} = require("../../utils");


async function main() {
  const [deployer] = await ethers.getSigners();
  const deployment = readRedpacketDeployment();
  const sourceOAppAddress = deployment.omniCounterAddressOnOptimSepolia
  const destinationOAppAddress = deployment.omniCounterAddressOnSepolia
  // check Op sepolia endPoinid: https://layerzero.gitbook.io/docs/technical-reference/testnet/testnet-addresses
  const destinationEndpointId =  10161
  // for how to set trustRemote, please refer to: https://github.com/LayerZero-Labs/solidity-examples/blob/main/test/examples/OmniCounter.test.js
  const trustRemote = ethers.solidityPacked(['address','address'], [destinationOAppAddress,sourceOAppAddress]);
  const omniCounter = await ethers.getContractAt('OmniCounter', sourceOAppAddress, deployer);

  let tx = await omniCounter.setTrustedRemote(destinationEndpointId, trustRemote);
  await tx.wait();
  console.log("setTrustedRemote for sepolia successfully")
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
