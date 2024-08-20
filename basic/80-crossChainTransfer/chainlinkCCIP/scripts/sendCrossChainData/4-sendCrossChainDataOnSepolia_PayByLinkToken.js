const { ethers } = require('hardhat');
const { readRedpacketDeployment, saveRedpacketDeployment } = require('../../utils');

const destinationChainSelector = '12532609583862916517';

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployment = readRedpacketDeployment();

  // transfer link to Sender
  // link token address is fixed in sepolia
  const sender = await ethers.getContractAt('Sender', deployment.senderAddress, deployer);

  let recepit = await sender.sendMessage(ethers.toBigInt(destinationChainSelector), deployment.receiverAddress, 'Hello World!!!!!');
  await recepit.wait();
  console.log('send successfully, and the hash is: ', recepit.hash);

  saveRedpacketDeployment({
    ccipCrossChainDataHash: recepit.hash,
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
