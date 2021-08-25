// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const fs = require("fs");

async function main() {

    const [deployer] = await ethers.getSigners();

    console.log(
        "Deploying contracts with the account:",
        deployer.address
    );

    console.log("Account balance:", (await deployer.getBalance()).toString());

    const counterFactory = await ethers.getContractFactory("Counter");
    const counterContract = await counterFactory.deploy(10);

    console.log("Counter address:", counterContract.address);

    // Writer Contract address to file
    const contractAddressFile = __dirname + "/CounterContractaddress.json"
    fs.writeFileSync(
      contractAddressFile,
      JSON.stringify({ address: counterContract.address }, undefined, 2)
    );
    
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
