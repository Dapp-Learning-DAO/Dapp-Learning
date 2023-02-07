// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main () {
    const [Alice] = await ethers.getSigners();
    console.log("MultiSigWallet owner is :", Alice.address);
    
    //部署MyToken.sol
    const MultiSigWalletContractFactory = await ethers.getContractFactory("MultiSigWallet");
    const multiSigWallet = await MultiSigWalletContractFactory.deploy([Alice.address], 1);
    await multiSigWallet.deployed();
    
    console.log("MultiSigWallet Contract address:", multiSigWallet.address);

    // Deploy Verify sol
    const verifyContractFactory = await ethers.getContractFactory("Verifier");
    const verify = await verifyContractFactory.deploy();
    await verify.deployed();

    console.log("Verifier Contract address: ", verify.address)
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });