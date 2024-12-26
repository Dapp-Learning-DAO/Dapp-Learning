const { ethers } = require('hardhat');
const { deployContract, saveRedpacketDeployment, verifyContract } = require('../../utils');

const sepoliaRouter = '0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59'; //  Sepolia testnet
const linkTokenAddress = '0x779877A7B0D9E8603169DdbD7836e478b4624789';

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying contracts with the account:', deployer.address);

  console.log('Account balance:', await ethers.provider.getBalance(deployer.address));

  // for sepolia, the route address and LINK address are fixed, see: https://docs.chain.link/ccip/getting-started
  const sender = await deployContract('Sender', [sepoliaRouter, linkTokenAddress], deployer);

  console.log('Sender address:', sender.target);

  saveRedpacketDeployment({
    senderAddress: sender.target,
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
