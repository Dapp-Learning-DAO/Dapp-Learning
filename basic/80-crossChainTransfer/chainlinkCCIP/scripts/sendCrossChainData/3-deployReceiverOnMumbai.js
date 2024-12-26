const { ethers } = require('hardhat');
const { deployContract, saveRedpacketDeployment } = require('../../utils');

const mumbaiRouter = '0x1035CabC275068e0F4b745A29CEDf38E13aF41b1';

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying contracts with the account:', deployer.address);

  console.log('Account balance:', await ethers.provider.getBalance(deployer.address));

  // for sepolia, the route address and LINK address are fixed, see: https://docs.chain.link/ccip/getting-started
  const receiver = await deployContract('Receiver', [mumbaiRouter], deployer);

  console.log('Receiver address:', receiver.target);

  saveRedpacketDeployment({
    receiverAddress: receiver.target,
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
