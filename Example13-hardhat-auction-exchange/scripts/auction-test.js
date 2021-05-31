// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
    // await hre.run('compile');
  //  const [owner,Alice,Bob,Test] = await hre.ethers.getSigners();
    const [owner,Alice,Test,Bob] = await hre.ethers.getSigners();


  console.log("owner:" , owner.address);
  console.log("Alice:" , Alice.address);
  console.log("Bob:" , Bob.address);
  console.log("test:" , Test.address);

  //todo deploy erc721 & erc20
   const erc20 = "0x7B698903d4A52f0A00a4288C0f1b9bC07B161748";
   const erc721 = "0xBf2efA0AdB1DaFBF051B302F881bAC56c2a35db7";
   const auction = "0xCA6Fa6ed9c5808767632E718427e3A6D5278f19b";

    const token = await hre.ethers.getContractAt("IERC20",erc20);

    // transfer some token to Alice
    await token.transfer(Bob.address,1000);

    const bal =  await token.balanceOf(Bob.address);
    console.log("Bob erc20 balance: ", bal.toNumber())

    const nfttoken = await hre.ethers.getContractAt("IMyERC721",erc721);

    // mint nft  to owner
    let mintTx = await nfttoken.mintWithTokenURI(owner.address, "www.baidu.com");
    let txreceipt  =  await mintTx.wait();
    console.log("txreceipt: ", txreceipt.status);


 let nftbalBigNumber  =   await nfttoken.balanceOf(owner.address) ;

 // id from 0
 let erc721Id =  nftbalBigNumber.toNumber() -1 ;
 console.log("owner nft balance", nftbalBigNumber.toNumber());


 console.log("erc721 id is: ", erc721Id );

 try {
  await nfttoken.approve(auction, erc721Id);
 } catch (error) {
  console.log("appove nft failed");

  console.error(error);
 }


 console.log("success!!!");

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });




// auctionUnfixedPrice.executeSale(erc721, erc721Id).then((result) => {
//   }, (error) => {
//     console.log(error);
    // error.reason - The Revert reason; this is what you probably care about. :)
    // Additionally:
    // - error.address - the contract address
    // - error.args - [ BigNumber(1), BigNumber(2), BigNumber(3) ] in this case
    // - error.method - "someMethod()" in this case
    // - error.errorSignature - "Error(string)" (the EIP 838 sighash; supports future custom errors)
    // - error.errorArgs - The arguments passed into the error (more relevant post EIP 838 custom errors)
    // - error.transaction - The call transaction used
//});
