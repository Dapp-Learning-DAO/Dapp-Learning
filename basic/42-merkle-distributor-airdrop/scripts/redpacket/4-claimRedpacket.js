// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require('hardhat');
require('dotenv').config();
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const { readRedpacketDeployment } = require('../../utils');
const claimerList = require('./claimerList.json');

function hashToken(account) {
  return Buffer.from(ethers.utils.solidityKeccak256(['address'], [account]).slice(2), 'hex');
}

async function main() {
  const [deployer, user1, user2] = await ethers.getSigners();
  const deployment = readRedpacketDeployment();

  const HappyRedPacketAddress = deployment.redPacketAddress;
  const redpacketID = deployment.redPacketID;
  const simpleToken = await ethers.getContractAt('SimpleToken', deployment.simpleTokenAddress, deployer);
  const redPacket = await ethers.getContractAt('HappyRedPacket', HappyRedPacketAddress, deployer);

  merkleTree = new MerkleTree(
    claimerList.map((user) => hashToken(user)),
    keccak256,
    { sortPairs: true }
  );

  async function cliamRedPacket(user) {
    let proof = merkleTree.getHexProof(hashToken(user.address));
    console.log('merkleTree proof: ', proof);

    const balanceBefore = await simpleToken.balanceOf(user.address);

    let createRedPacketRecipt = await redPacket.connect(user).claim(redpacketID, proof);
    await createRedPacketRecipt.wait();

    const balanceAfter = await simpleToken.balanceOf(user.address);
    console.log(`user ${user.address} has claimd ${balanceAfter.sub(balanceBefore)}`);
  }

  console.log("\n=========Begin to claim Red Packet=========\n")
  
  await cliamRedPacket(deployer);

  console.log('\n=========Claim Red Packet successfully=========\n');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
