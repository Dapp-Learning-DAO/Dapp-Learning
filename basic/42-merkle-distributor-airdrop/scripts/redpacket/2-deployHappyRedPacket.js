// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying contracts with the account:', deployer.address);

  console.log('Account balance:', (await deployer.getBalance()).toString());

  const redPacketFactory = await ethers.getContractFactory('HappyRedPacket');
  const redPacket = await redPacketFactory.deploy();
  await redPacket.deployed();

  console.log('RedPacket address:', redPacket.address);

  // Init red packet
  let initRecipt = await redPacket.initialize();
  await initRecipt.wait();

  console.log("Init HappyRedPacket successfully");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
