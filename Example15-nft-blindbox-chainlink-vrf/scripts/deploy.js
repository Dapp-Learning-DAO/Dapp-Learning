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
    const Dnd = await hre.ethers.getContractFactory("DungeonsAndDragonsCharacter");
    const Coordinator = "0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9";
    const LINK = "0xa36085F69e2889c224210F603D836748e7dC0088";
    const KeyHash = "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4";
    
    const dnd = await Dnd.deploy(Coordinator, LINK, KeyHash);

    await dnd.deployed();

    console.log("dnd deployed to:", dnd.address);
    
    const token = await hre.ethers.getContractAt("LinkTokenInterface", LINK);
    
    var exp = ethers.BigNumber.from("10").pow(18);
    
    await token.transfer(dnd.address, ethers.BigNumber.from("3").mul(exp));
   
    const bal =  await token.balanceOf(dnd.address);
    console.log("dnd link balance : ", bal.toString());
    
    const tx = await dnd.requestNewRandomCharacter(77, "The Chainlink Knight");
    
    console.log()
    const tx1 = await dnd.setTokenURI(0, "https://ipfs.io/ipfs/QmaSED9ZSbdGts5UZqueFJjrJ4oHH3GnmGJdSDrkzpYqRS?filename=the-chainlink-knight.json")
    
    const overview = await dnd.characters(0)
    console.log(overview);
 
 
 
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
