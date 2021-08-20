// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
async function main() {

// * Chainlink VRF Coordinator address: 0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9
//     * LINK token address:                0xa36085F69e2889c224210F603D836748e7dC0088
//     * Key Hash: 0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4
  
  // We get the contract to deploy
    const RandomNumberVRF = await hre.ethers.getContractFactory("RandomNumberVRF");
    const Coordinator = "0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9";
    const LINK = "0xa36085F69e2889c224210F603D836748e7dC0088";
    const KeyHash = "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4";
    
    const randomNumberVRF = await RandomNumberVRF.deploy(Coordinator, LINK, KeyHash);

    await randomNumberVRF.deployed();

    console.log("randomNumberVRF deployed to:", randomNumberVRF.address);
    
    const token = await hre.ethers.getContractAt("LinkTokenInterface", LINK);
    
    var exp = ethers.BigNumber.from("10").pow(18);
    
    await token.transfer(randomNumberVRF.address, ethers.BigNumber.from("3").mul(exp));
   
    const bal =  await token.balanceOf(randomNumberVRF.address);
    console.log("dnd link balance : ", bal.toString());
    
    const tx = await randomNumberVRF.requestRandomNumber(77);
    
    function sleep (time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }
    
    await sleep(3000);
    
    const overview = await randomNumberVRF.get()
    console.log(overview);
 
 
 
}


async function main1() {
    
    const randomAddress = "0xBb50A47649524fffBD18827316AA8A3E428813aA";
    const randomNumberVRF = await hre.ethers.getContractAt("RandomNumberVRF",randomAddress);
    
    console.log("randomNumberVRF deployed to:", randomNumberVRF.address);
    const LINK = "0xa36085F69e2889c224210F603D836748e7dC0088";
    const token = await hre.ethers.getContractAt("LinkTokenInterface", LINK);
    
    const bal =  await token.balanceOf(randomNumberVRF.address);
    console.log("randomNumberVRF link balance : ", bal.toString());
    const overview = await randomNumberVRF.get()
    console.log(overview);
    
    
    
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main1()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
