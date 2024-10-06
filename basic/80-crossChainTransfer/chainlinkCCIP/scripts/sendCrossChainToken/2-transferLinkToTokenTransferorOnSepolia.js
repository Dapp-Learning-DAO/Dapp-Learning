const { ethers } = require('hardhat');
const { readRedpacketDeployment } = require('../../utils');

const ccipBnMTokenAddress = '0xFd57b4ddBf88a4e07fF4e34C487b99af2Fe82a05';
const linkTokenAddress = '0x779877A7B0D9E8603169DdbD7836e478b4624789';

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployment = readRedpacketDeployment();

  // transfer link & ccipBnMToken to Sender
  // ccipBnMToken token address is fixed in sepolia
  const ccipBnMToken = await ethers.getContractAt('SimpleToken', ccipBnMTokenAddress, deployer);
  let recepit = await ccipBnMToken.transfer(deployment.tokenTransferorSenderAddress, ethers.parseEther('0.02'));
  await recepit.wait();
  console.log('transfer 0.02 ccipBnMToken token successfully');

  const linkToken = await ethers.getContractAt('SimpleToken', linkTokenAddress, deployer);
  recepit = await linkToken.transfer(deployment.tokenTransferorSenderAddress, ethers.parseEther('0.1'));
  await recepit.wait();

  console.log('transfer 0.1 link token successfully');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
