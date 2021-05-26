// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
    // await hre.run('compile');

  // We get the contract to deploy
//  const AuctionFixedPrice = await hre.ethers.getContractFactory("AuctionFixedPrice");
  const AuctionUnFixedPrice = await hre.ethers.getContractFactory("AuctionUnfixedPrice");
 // const auctionFixedPrice = await AuctionFixedPrice.deploy();
  const auctionUnFixedPrice = await AuctionUnFixedPrice.deploy();


  //  console.log("auctionFixedPrice deployed to:", auctionFixedPrice.address);
    console.log("auctionUnfixedPrice deployed to:", auctionUnFixedPrice.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
