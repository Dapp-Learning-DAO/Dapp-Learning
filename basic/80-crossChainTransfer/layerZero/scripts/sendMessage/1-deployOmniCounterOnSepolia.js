// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const {ethers} = require("hardhat");

const {
  saveRedpacketDeployment,
} = require("../../utils");

async function main() {

  const [deployer] = await ethers.getSigners();

  // for sepolia, endpoint address is fixed, refer to : https://layerzero.gitbook.io/docs/technical-reference/testnet/testnet-addresses
  // for mainnet endpoint address, please refer to : https://docs.layerzero.network/v1/developers/evm/technical-reference/mainnet/mainnet-addresses
  const omniCounter = await ethers.deployContract("OmniCounter", ["0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1"]);

  await omniCounter.waitForDeployment();

  console.log(
    `SourceOApp has been deployed to ${omniCounter.target}`
  );

  saveRedpacketDeployment({
    omniCounterAddressOnSepolia: omniCounter.target,
  });

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
