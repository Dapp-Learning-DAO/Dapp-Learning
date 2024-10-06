const { ethers } = require('hardhat');
require('dotenv').config();
const { saveDeployment } = require('./utils');
const imageUrl = 'https://cdn.pixabay.com/photo/2024/06/19/23/18/dragon-8840975_1280.png'

async function main () {
  const DungeonsAndDragonsCharacterFactory = await ethers.getContractFactory('DungeonsAndDragonsCharacter');
  const dndCharacter = await DungeonsAndDragonsCharacterFactory.deploy(imageUrl, 'vvvvv');

  console.log('deploying dndCharacter....');
  await dndCharacter.waitForDeployment();

  console.log("dndCharacter deployed to:", dndCharacter.target);
  saveDeployment({
    dndCharacterAddress: dndCharacter.target,
  });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });