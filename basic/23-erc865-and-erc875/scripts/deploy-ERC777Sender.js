// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
const fs = require('fs');

function saveFrontendFiles(token) {
  const contractsDir = __dirname + '/../'

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir)
  }

  fs.writeFileSync(
    contractsDir + '/Simple777Sender-address.json',
    JSON.stringify({ contractAddress: token.address }, undefined, 2)
  )
}

async function main() {

    const [deployer,alice] = await ethers.getSigners();

    console.log("Going to deploy Simple777Sender, please be patient");
    const simple777SenderFactory = await ethers.getContractFactory("Simple777Sender");
    const simple777SenderContract = await simple777SenderFactory.deploy();
    await simple777SenderContract.deployed()

    // Save address to file
    saveFrontendFiles(simple777SenderContract);

    console.log("Deploy successfully, Simple777Sender address: ", simple777SenderContract.address);
}



// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
