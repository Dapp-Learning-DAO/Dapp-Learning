// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");

async function main() {

    const [owner] = await ethers.getSigners();

    // kovan proxy contract address is 0x22F24361D548e5FaAfb36d1437839f080363982B
    const artifactL1ChugSplashProxy = artifacts.readArtifactSync("L1ChugSplashProxy");
    const l1ChugSplashProxy = new ethers.Contract("0x22F24361D548e5FaAfb36d1437839f080363982B", artifactL1ChugSplashProxy.abi , owner );


    console.log("Account balance:", (await owner.getBalance()).toString());

    // deploy eth to Optimism
    let overrides = {
        // To convert Ether to Wei:
        value: ethers.utils.parseEther("0.0001")     // ether in this case MUST be a string
    
        // Or you can use Wei directly if you have that:
        // value: someBigNumber
        // value: 1234   // Note that using JavaScript numbers requires they are less than Number.MAX_SAFE_INTEGER
        // value: "1234567890"
        // value: "0x1234"
    
        // Or, promises are also supported:
        // value: provider.getBalance(addr)
    };
    let messageBytes = ethers.utils.toUtf8Bytes("");
    await l1ChugSplashProxy.depositETH(1300000, messageBytes,overrides);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
