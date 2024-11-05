const { ethers } = require('hardhat');
const { readRedpacketDeployment, saveRedpacketDeployment } = require('../../utils');

const destinationChainSelector = '12532609583862916517'; // numbai
const ccipBnMTokenAddress = '0xFd57b4ddBf88a4e07fF4e34C487b99af2Fe82a05'; // sepolia

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployment = readRedpacketDeployment();

  // transfer link to Sender
  // link token address is fixed in sepolia
  const sender = await ethers.getContractAt('ProgrammableTokenTransfers', deployment.tokenTransferorSenderAddress, deployer);

  let recepit = await sender.sendMessagePayLINK(
    ethers.toBigInt(destinationChainSelector),
    deployment.tokenTransferorReceiverAddress,
    'Hello World!!!!!',
    ccipBnMTokenAddress,
    ethers.parseEther('0.001'),
    {
      // sometimes it will be fail if not specify the gasLimit
      gasLimit: 1483507,
    }
  );
  await recepit.wait();
  console.log('send successfully, and the hash is: ', recepit.hash);
  saveRedpacketDeployment({
    ccipCrossChainTokenHash: recepit.hash,
  });

  console.log(
    'send cross chain data successfully. please be patient, it may takes about 15 minutes to finalize cross chain data, and you can check the result by visiting: https://ccip.chain.link/'
  );

  // todo: get finalizing result by via GET request
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
