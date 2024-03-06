const { ethers }  = require('hardhat');
const {
  readRedpacketDeployment,
} = require("../../utils");

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployment = readRedpacketDeployment();

  // console.log(ethers)

  // transfer link to Sender
  // link token address is fixed in sepolia
  const receiver = await ethers.getContractAt('Receiver', deployment.receiverAddress, deployer);

  let {messageId,text} = await receiver.getLastReceivedMessageDetails() 
  console.log(`messageId: ${messageId}, text: ${text}`)

  console.log("receive cross chain data successfully")

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  // .then(() => process.exit(0))
  // .catch((error) => {
  //   console.error(error);
  //   process.exit(1);
  // });
