const { ethers } = require('hardhat');
require('dotenv').config();
const { readDeployment } = require('./utils');

async function main () {
  const [deployer] = await ethers.getSigners();
  let wallet = new ethers.Wallet(process.env.PRIVATE_KEY, deployer.provider);
  const { abi: DungeonsAndDragonsCharacterABI } = require('../artifacts/contracts/DungeonsAndDragonsCharacter.sol/DungeonsAndDragonsCharacter.json');
  const deployment = readDeployment();
  const addr = deployment.dndCharacterAddress;
  const randomNum = deployment.randomNum;
  if (!addr) {
    console.log('Please deploy contract dndCharacter first');
    return;
  }

  let DungeonsAndDragonsCharacter, user1;

  DungeonsAndDragonsCharacter = new ethers.Contract(addr, DungeonsAndDragonsCharacterABI, wallet);
  [user1] = await ethers.getSigners();
  try {
    console.log("Blind Character...");
    const tx = await DungeonsAndDragonsCharacter.blindCharacter(randomNum, wallet.address, 'long')
    txRecipt = await tx.wait();
    console.log('Blind Character tx hash:', tx.hash)
    const characterLen = await DungeonsAndDragonsCharacter.getNumberOfCharacters()
    console.log('len', characterLen)
    const character = await DungeonsAndDragonsCharacter.getCharacterOverView(Number(characterLen) - 1)
    console.log('character', character)
  } catch (error) {
    console.log('Blind Character error ', error)
  }
}


main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });