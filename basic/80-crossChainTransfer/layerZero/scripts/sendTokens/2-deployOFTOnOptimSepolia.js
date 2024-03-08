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
  const oftv2 = await ethers.deployContract("OFTV2", ["MyFirstOFT","MYOFT",8,"0x55370E0fBB5f5b8dAeD978BA1c075a499eB107B8"]);

  await oftv2.waitForDeployment();

  console.log(
    `OFT has been deployed to ${oftv2.target}`
  );

  saveRedpacketDeployment({
    OFTAddressOnOptimSepolia: oftv2.target,
  });

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
