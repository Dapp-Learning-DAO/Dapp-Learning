import { run, ethers } from "hardhat";

async function main() {
    await run("compile");
    
    const accounts  = await ethers.getSigners();

    console.log(
        "Deploying contracts with the account:",
        accounts.map((a) => a.address)
    );

    console.log("Account balance:", (await deployer.getBalance()).toString());

    const Token = await ethers.getContractFactory("SimpleToken");
    const token = await Token.deploy("HEHE", "HH", 1, 100000000);

    console.log("Token address:", token.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
