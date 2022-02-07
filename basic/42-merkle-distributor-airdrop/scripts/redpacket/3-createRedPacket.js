// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require('hardhat');
require('dotenv').config();
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const addresList = require('./redpacketAddressList.json');

function hashToken(account) {
  return Buffer.from(ethers.utils.solidityKeccak256(['address'], [account]).slice(2), 'hex')
}

async function main() {
  const [deployer] = await ethers.getSigners();

  const HappyRedPacketAddress = "0xE9c061465E9eaF01D1c8F9Dfc2487Db31a053bb0";
  const SimpleTokenAddress = "0xdc6999dC3f818B4f74550569CCC7C82091cA419F";
  
  const redPacket = await ethers.getContractAt("HappyRedPacket", HappyRedPacketAddress, deployer);
  const simpleToken = await ethers.getContractAt("SimpleToken", SimpleTokenAddress, deployer);

  let tx = await simpleToken.approve(redPacket.address,ethers.utils.parseEther("100"));
  await tx.wait()

  console.log("Approve Successfully");
  
  merkleTree = new MerkleTree(addresList.map(address => hashToken(address)), keccak256, { sortPairs: true });
  merkleTreeRoot = merkleTree.getHexRoot();
  console.log("merkleTree Root:",merkleTreeRoot);

  // create_red_packet
  let creationParams = {
    merkleroot: merkleTreeRoot,
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
      `CreationSuccess Event, total: ${total}   RedpacketId: ${id}  `
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
