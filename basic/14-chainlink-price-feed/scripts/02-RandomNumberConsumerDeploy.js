const hre = require('hardhat');
require('@nomiclabs/hardhat-web3');

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying contracts with the account:', deployer.address);

  // 部署 RandomNumberConsumer 合约
  const RandomNumberConsumer = await ethers.getContractFactory('RandomNumberConsumer');
  const instance = await RandomNumberConsumer.deploy();
  await instance.deployed();

  console.log('----------------------------------------------------');
  console.log('RandomNumberConsumer address:', instance.address);
  console.log('Now you need transfer Link token to this contract address.')
  console.log('Then add address to .env file, and run the test script file.')

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
