// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require('hardhat');
require('dotenv').config();

async function main() {
  const [deployer] = await ethers.getSigners();
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);

  const HappyRedPacketAddress = "0x1337ee7C6969692c6153e5e0cEDC637560AC7E5f";
  const SimpleTokenAddress = "0x26aa59598210AE7613d5Bf3aCB01416fdaf6EBe7";
  
  const redPacket = await ethers.getContractAt("HappyRedPacket", HappyRedPacketAddress, deployer);
  const simpleToken = await ethers.getContractAt("SimpleToken", SimpleTokenAddress, deployer);

  let tx = await simpleToken.approve(redPacket.address,ethers.utils.parseEther("100"));
  await tx.wait()

  console.log("Approve Successfully");
  console.log("Public key is: ", wallet.address);

  // create_red_packet
  let creationParams = {
    public_key: wallet.address,
    number: 3,
    ifrandom: true,
    duration: 2**30,
    seed: ethers.utils.formatBytes32String('lajsdklfjaskldfhaikl'),
    message: 'Hi',
    name: 'cache',
    token_type: 1,
    token_addr: SimpleTokenAddress,
    total_tokens: 10000,
  };

  redPacket.once('CreationSuccess', ( total,  id,  name,  message,  creator,  creation_time,  token_address,  number,  ifrandom,  duration) => {
    console.log(
      `CreationSuccess Event, total: ${total}   id: ${id}  `
    );
  });

  let createRedPacketRecipt  = await redPacket.create_red_packet(...Object.values(creationParams));
  await createRedPacketRecipt.wait();

  console.log("Create Red Packet successfully");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
