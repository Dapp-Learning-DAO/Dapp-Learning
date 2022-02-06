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
  const redPacket = await ethers.getContractAt("HappyRedPacket", HappyRedPacketAddress, deployer);
  const redpacketID = "0x45eb11e56a1b699f5e99bd16785c84b73a8257c712e0d1f31306ab1e3423b2e0"
  
  merkleTree = new MerkleTree(addresList.map(address => hashToken(address)), keccak256, { sortPairs: true });
  let proof = merkleTree.getHexProof(hashToken(deployer.address));
  console.log("merkleTree proof: ",proof);

  let createRedPacketRecipt  = await redPacket.claim(redpacketID,proof,deployer.address);
  await createRedPacketRecipt.wait();

  console.log("Claim Red Packet successfully");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
