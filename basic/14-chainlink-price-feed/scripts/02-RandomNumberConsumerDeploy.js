const hre = require('hardhat');
const { saveDeployment } = require('./utils');
const ethers = hre.ethers;


async function main () {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying contracts with the account:', deployer.address);

  // 部署 RandomNumberConsumer 合约
  const RandomNumberConsumer = await ethers.getContractFactory('RandomNumberConsumer');
  console.log('process.env.SubscriptionId', process.env.SubscriptionId)
  const instance = await RandomNumberConsumer.deploy(process.env.SubscriptionId);
  await instance.waitForDeployment();
  const RandomNumberConsumerAddress = await instance.getAddress();

  console.log('----------------------------------------------------');
  console.log('RandomNumberConsumer address:', RandomNumberConsumerAddress);

  // save contract address to file
  saveDeployment({
    RandomNumberConsumerAddress: RandomNumberConsumerAddress,
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
