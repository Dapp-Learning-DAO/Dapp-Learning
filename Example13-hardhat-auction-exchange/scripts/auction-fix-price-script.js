// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
    // await hre.run('compile');

  const alice = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const bob = "0xdd46729Ee7a43CF328e9927F5429275ac8B904a0";

   const erc20 = "0x7B698903d4A52f0A00a4288C0f1b9bC07B161748";
   const erc721 = "";
   const auction = "0x29015216510102AE7Ed100d6b2bC51a06449430d";

    const token = await hre.ethers.getContractAt("IERC20",erc20);

    await token.transfer(alice,1000);

    const bal =  await token.balanceOf(alice);
    console.log("&&&&&&", bal)
    const auctionFixedPrice = await hre.ethers.getContractAt("AuctionFixedPrice",auction);

    console.log("auctionFixedPrice deployed to:", auctionFixedPrice.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
