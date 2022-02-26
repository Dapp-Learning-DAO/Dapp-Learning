const hre = require('hardhat');
require('@nomiclabs/hardhat-web3');
require('dotenv').config();
const { saveDeployment } = require('./utils');


async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying contracts with the account:', deployer.address);

  // 部署 RandomNumberConsumer 合约
  const RandomNumberConsumer = await ethers.getContractFactory('RandomNumberConsumer');
  const instance = await RandomNumberConsumer.deploy(process.env.SubscriptionId);
  await instance.deployed();

  console.log('----------------------------------------------------');
  console.log('RandomNumberConsumer address:', instance.address);

  // save contract address to file
  saveDeployment({
    RandomNumberConsumerAddress: instance.address,
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
