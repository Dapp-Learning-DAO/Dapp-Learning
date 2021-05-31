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
   const auction = "0xCA6Fa6ed9c5808767632E718427e3A6D5278f19b";

    const token = await hre.ethers.getContractAt("contracts/IERC20:IERC20",erc20);

    await token.transfer(Alice.address,1000);

    const bal =  await token.balanceOf(Alice.address);
    console.log("alice erc20 balance: ", bal.toNumber())

    const nfttoken = await hre.ethers.getContractAt("contracts/IMyERC721:IMyERC721",erc721);

   // var options = { gasPrice: 5, gasLimit: 8500000 };

    await nfttoken.mintWithTokenURI(owner.address, "www.baidu.com");

    let nftbalBigNumber  =   await nfttoken.balanceOf(owner.address) ;
    let erc721Id =  nftbalBigNumber.toNumber() -1 ;
    console.log("owner nft balance", nftbalBigNumber.toNumber());

    const auctionUnfixedPrice = await hre.ethers.getContractAt("contracts/AuctionUnfixedPrice:AuctionUnfixedPrice", auction);

    console.log("auctionUnfixedPrice deployed to:", auctionUnfixedPrice.address);

    console.log("erc721 id is: ", erc721Id );

   await nfttoken.approve(auction, erc721Id).then((result) => {
    }, (error) => {
        console.log(error);
    });

 //   console.log("approveTx: ", approveTx)
    console.log(erc721Id, "approve success");

    var timestamp=new Date().getTime();
    const endTime = timestamp + 15*1000;
    console.log("endtime: ", endTime);

     auctionUnfixedPrice.createTokenAuction(erc721, erc721Id,erc20,100, endTime).then((result) => {
    }, (error) => {
        console.log(error);
    });


    const auctionDetail =  await  auctionUnfixedPrice.getTokenAuctionDetails(erc721,erc721Id);

  //  console.log("auctionDetail before sale:  ", auctionDetail);

    token.connect(Alice);
    await token.approve(auction, 1000);
    console.log("alice approve auction contract successfully ");

    let allow = await  token.allowance(Alice.address,auction);
    console.log("alice allowans: ", allow.toNumber());

    auctionUnfixedPrice.connect(Alice);
    let tx2 =  await auctionUnfixedPrice.bid(erc721,erc721Id, 200);

    console.log("alice bid successfully: ");


    auctionUnfixedPrice.connect(owner);


    function sleep (time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }

    await sleep(15000);

     auctionUnfixedPrice.executeSale(erc721, erc721Id).then((result) => {
     }, (error) => {
         console.log(error);
         // error.reason - The Revert reason; this is what you probably care about. :)
         // Additionally:
         // - error.address - the contract address
         // - error.args - [ BigNumber(1), BigNumber(2), BigNumber(3) ] in this case
         // - error.method - "someMethod()" in this case
         // - error.errorSignature - "Error(string)" (the EIP 838 sighash; supports future custom errors)
         // - error.errorArgs - The arguments passed into the error (more relevant post EIP 838 custom errors)
         // - error.transaction - The call transaction used
     });;

    const auctionDetail1 =  await  auctionUnfixedPrice.getTokenAuctionDetails(erc721,erc721Id);


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
