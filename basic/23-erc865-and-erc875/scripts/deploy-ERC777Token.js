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
    contractsDir + '/Simple777Token-address.json',
    JSON.stringify({ contractAddress: token.address }, undefined, 2)
  )
}

async function main() {

    const [deployer,alice] = await ethers.getSigners();

    console.log("Going to deploy Simple777Token, please be patient");
    const simple777TokenFactory = await ethers.getContractFactory("Simple777Token");
    const simple777TokenContract = await simple777TokenFactory.deploy();
    await simple777TokenContract.deployed()

    // Save address to file
    saveFrontendFiles(simple777TokenContract);

    console.log("Deploy successfully, Simple777Token address: ", simple777TokenContract.address);

    // Send ERC777 Token to Alice
    console.log("Going to send ERC777 token to Alice");
    const data = ethers.utils.formatBytes32String("777TestData")
    await simple777TokenContract.send(alice.address, 10000,data);
    console.log("Send ERC777 token successfully");
}



// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
