const { ethers } = require('hardhat');
const { deployContract, saveRedpacketDeployment } = require('../../utils');

const { readRedpacketDeployment } = require('../../utils');

const mumbaiRouter = '0x1035CabC275068e0F4b745A29CEDf38E13aF41b1';
const numbaiLinkTokenAddress = '0x326C977E6efc84E512bB9C30f76E30c160eD06FB';
const destinationChainSelector = '16015286601757825753'; // 目标区块链的 CCIP 链标识符。 Sepolia

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployment = readRedpacketDeployment();

  console.log('Deploying contracts with the account:', deployer.address);

  console.log('Account balance:', await ethers.provider.getBalance(deployer.address));

  // for mumbai, the route address and LINK address are fixed, see: https://docs.chain.link/ccip/getting-started
  const tokenTransferor = await deployContract('ProgrammableTokenTransfers', [mumbaiRouter, numbaiLinkTokenAddress], deployer);

  console.log('deploy ProgrammableTokenTransfers successfully, and contract address is ', tokenTransferor.target);

  saveRedpacketDeployment({
    tokenTransferorReceiverAddress: tokenTransferor.target,
  });

  // allowlistDestinationChain
  let recepit = await tokenTransferor.allowlistSourceChain(ethers.toBigInt(destinationChainSelector), true);
  await recepit.wait();

  console.log('set allowlistSourceChain successfully');

  recepit = await tokenTransferor.allowlistSender(deployment.tokenTransferorSenderAddress, true);
  await recepit.wait();

  console.log('set allowlistSender successfully');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
