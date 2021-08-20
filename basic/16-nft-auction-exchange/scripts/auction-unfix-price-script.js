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


    const token = await hre.ethers.getContractAt("contracts/IERC20.sol:IERC20",erc20);

    // transfer some token to Alice
    await token.transfer(Bob.address,1000);

    const bal =  await token.balanceOf(Bob.address);
    console.log("Bob erc20 balance: ", bal.toNumber())


    const nfttoken = await hre.ethers.getContractAt("contracts/IMyERC721.sol:IMyERC721",erc721);

    // mint nft  to owner
    let mintTx = await nfttoken.mintWithTokenURI(owner.address, "www.baidu.com");
    await mintTx.wait();
    
    let nftbalBigNumber  =   await nfttoken.balanceOf(owner.address) ;

    // id from 0
    let erc721Id =  nftbalBigNumber.toNumber() -1 ;
    console.log("owner nft balance", nftbalBigNumber.toNumber());
    console.log("erc721 id is: ", erc721Id );

    await nfttoken.approve(auction, erc721Id);
    
    console.log(erc721Id, "approve success");
    const auctionUnfixedPrice = await hre.ethers.getContractAt("contracts/AuctionUnfixedPrice.sol:AuctionUnfixedPrice", auction);
    

    var timestamp=new Date().getTime();
    const endTime = timestamp + 10*1000;
    console.log("endtime: ", endTime);

    await auctionUnfixedPrice.createTokenAuction(erc721, erc721Id,erc20,100, endTime);

    const auctionDetail =  await  auctionUnfixedPrice.getTokenAuctionDetails(erc721,erc721Id);



     const tokenBob = token.connect(Bob);

    await tokenBob.approve(auction, 1000);
    console.log("Bob approve auction contract successfully ");

    let allow = await  token.allowance(Bob.address,auction);
    console.log("Bob allowans: ", allow.toNumber());

     const auctionUnfixedPriceBob  = auctionUnfixedPrice.connect(Bob);
     await auctionUnfixedPriceBob.bid(erc721,erc721Id, 200);

    console.log("Bob bid successfully: ");

    function sleep (time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }

    await sleep(10000);

    await auctionUnfixedPrice.executeSale(erc721, erc721Id);
 
   console.log("trade successfully: ");
   await  auctionUnfixedPrice.getTokenAuctionDetails(erc721,erc721Id);

  //  console.log(auctionDetail1);
     let erc721IdOwner = await  nfttoken.ownerOf(erc721Id);

     console.log(erc721Id, "nft owner: ", erc721IdOwner);



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
