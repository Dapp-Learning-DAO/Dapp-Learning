// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
    // await hre.run('compile');
    const [owner,Alice,Bob] = await hre.ethers.getSigners();


  console.log("owner:" , owner.address);
  console.log("Alice:" , Alice.address);
  console.log("Bob:" , Bob.address);

  //todo deploy erc721 & erc20
   const erc20 = "0x7B698903d4A52f0A00a4288C0f1b9bC07B161748";
   const erc721 = "0xBf2efA0AdB1DaFBF051B302F881bAC56c2a35db7";
   const auction = "0x09d09A4E7b8eE3c21aB91b2404a5c7Cfec4cf90e";

    const token = await hre.ethers.getContractAt("contracts/IERC20.sol:IERC20",erc20);

    await token.transfer(Alice.address,1000);

    const bal =  await token.balanceOf(Alice.address);
    console.log("alice erc20 balance: ", bal.toNumber())

    const nfttoken = await hre.ethers.getContractAt("contracts/IMyERC721:IMyERC721",erc721);

   // var options = { gasPrice: 5, gasLimit: 8500000 };

    let tx = await nfttoken.mintWithTokenURI(owner.address, "www.baidu.com");
    console.log("transhash: ", tx.hash);


    let nftbalBigNumber  =   await nfttoken.balanceOf(owner.address) ;
    let erc721Id =  nftbalBigNumber.toNumber() -1 ;
    console.log("owner nft balance", nftbalBigNumber.toNumber());

    const auctionFixedPrice = await hre.ethers.getContractAt("contracts/AuctionFixedPrice:AuctionFixedPrice", auction);

    console.log("auctionFixedPrice deployed to:", auctionFixedPrice.address);
    let approveTx = await nfttoken.approve(auction, erc721Id);

 //   console.log("approveTx: ", approveTx)
    console.log(erc721Id, "approve success");

    var timestamp=new Date().getTime();
    const endTime = timestamp + 3600*1000;
    console.log("endtime: ", endTime);

    let tx1 =  await auctionFixedPrice.createTokenAuction(erc721, erc721Id,erc20,100,endTime);
    console.log("transhash1: ", tx1.hash);
    await tx1.wait();

    const auctionDetail =  await  auctionFixedPrice.getTokenAuctionDetails(erc721,erc721Id);

    console.log("auctionDetail before sale:  ", auctionDetail);

    token.connect(Alice);
    await token.approve(auction, 1000);
    console.log("alice approve auction contract successfully ");

    let allow = await  token.allowance(Alice.address,auction);
    console.log("alice allowans ", allow.toNumber());

    auctionFixedPrice.connect(Alice);
    let tx2 =  await auctionFixedPrice.purchaseNFTToken(erc721,erc721Id);

    console.log("alice purchase successfully: ");

    const auctionDetail1 =  await  auctionFixedPrice.getTokenAuctionDetails(erc721,erc721Id);


    console.log(auctionDetail1);



}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
