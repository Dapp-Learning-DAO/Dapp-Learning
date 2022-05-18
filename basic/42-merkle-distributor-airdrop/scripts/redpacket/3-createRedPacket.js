// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require('hardhat');
require('dotenv').config();
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const { readRedpacketDeployment, saveRedpacketDeployment } = require('../../utils');
const claimerList = require('./claimerList.json');

function hashToken(account) {
  return Buffer.from(ethers.utils.solidityKeccak256(['address'], [account]).slice(2), 'hex');
}

// sleep function
let endSleep = false;
async function sleep() {
  for (let i = 0; i < 500; i++) {
    if (endSleep) break;
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 500);
    });
  }
  if (!endSleep) console.log(`\nhad slept too long, but no result...`);
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployment = readRedpacketDeployment();

  const HappyRedPacketAddress = deployment.redPacketAddress;
  const SimpleTokenAddress = deployment.simpleTokenAddress;

  const redPacket = await ethers.getContractAt('HappyRedPacket', HappyRedPacketAddress, deployer);
  const simpleToken = await ethers.getContractAt('SimpleToken', SimpleTokenAddress, deployer);

  // let tx = await simpleToken.approve(redPacket.address, ethers.utils.parseEther('100'));
  // await tx.wait();

  // console.log('Approve Successfully');

  merkleTree = new MerkleTree(
    claimerList.map((user) => hashToken(user)),
    keccak256,
    { sortPairs: true }
  );
  merkleTreeRoot = merkleTree.getHexRoot();
  console.log('merkleTree Root:', merkleTreeRoot);

  // create_red_packet
  let creationParams = {
    merkleroot: merkleTreeRoot,
    number: 93,
    ifrandom: true,
    duration: 259200,
    seed: ethers.utils.formatBytes32String('lajsdklfjaskldfhaikl'),
    message: 'Hi',
    name: 'cache',
    token_type: 1,
    token_addr: SimpleTokenAddress,
    // total_tokens: ethers.utils.parseEther('100'),
    total_tokens: 438000000
  };

  redPacket.once('CreationSuccess', (total, id, name, message, creator, creation_time, token_address, number, ifrandom, duration) => {
    endSleep = true;
    saveRedpacketDeployment({ redPacketID: id, redPacketTotal: total.toString() });
    console.log(`CreationSuccess Event, total: ${total.toString()}\tRedpacketId: ${id}  `);
  });

  let createRedPacketRecipt = await redPacket.create_red_packet(...Object.values(creationParams),{
    // sometimes it will be fail if not specify the gasLimit
    gasLimit: 1483507
  });
  await createRedPacketRecipt.wait();

  console.log('Create Red Packet successfully');

  await sleep();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
