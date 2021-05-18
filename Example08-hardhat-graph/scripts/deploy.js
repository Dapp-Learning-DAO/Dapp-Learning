// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {

    const [deployer] = await ethers.getSigners();

    console.log(
        "Deploying contracts with the account:",
        deployer.address
    );

    console.log("Account balance:", (await deployer.getBalance()).toString());

    const Token = await ethers.getContractFactory("SimpleToken");
    const token = await Token.deploy("HEHE", "HH", 1, 100000000);

    console.log("Contract address:", token.address);
    
    const receiver = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    console.log("Transfer 50 to receiver ",receiver);
    await token.transfer(receiver, 50);

    // Check the balance of receiver
    console.log("Account balance of receiver is: ", (await token.balanceOf(receiver)).toString());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
