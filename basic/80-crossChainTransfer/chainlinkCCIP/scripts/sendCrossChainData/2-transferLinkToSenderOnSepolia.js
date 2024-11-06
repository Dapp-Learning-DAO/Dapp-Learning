const { ethers } = require('hardhat');
const { readRedpacketDeployment } = require('../../utils');

const linkTokenAddress = '0x779877A7B0D9E8603169DdbD7836e478b4624789';

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployment = readRedpacketDeployment();

  // transfer link to Sender
  // link token address is fixed in sepolia
  const linkToken = await ethers.getContractAt('SimpleToken', linkTokenAddress, deployer);
  let recepit = await linkToken.transfer(deployment.senderAddress, ethers.parseEther('0.1')); // 0.1 link
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
