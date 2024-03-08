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
  const oftv2Address = deployment.OFTAddressOnOptimSepolia
  const oftv2 = await ethers.getContractAt('OFTV2', oftv2Address, deployer);
  const destinationEndpoindId =  10232
  const transferAmount = ethers.parseUnits("10", 9);
  const adapterParams = ethers.solidityPacked(['uint16', 'uint256'], [1, 2000]);
  const toAddress = ethers.zeroPadValue("0xfB0Fb78244aa8e03bfA0eF464c176246040dCC86",32);
  
  // setMinDstGas, otherwise, it will fail
  // PT_SEND = 0;
  // PT_SEND_AND_CALL = 1;
  let userBalance = await oftv2.balanceOf("0xfB0Fb78244aa8e03bfA0eF464c176246040dCC86")
  console.log(`user balance is ${userBalance}`)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
