// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
    
    const randomAddress = "0xbb50a47649524fffbd18827316aa8a3e428813aa";
    console.log("catBlindbox begin to depploy!")
    const CatBlindboxFactory = await hre.ethers.getContractFactory("CatBlindbox");
    const catBlindbox = await CatBlindboxFactory.deploy(randomAddress);
    await catBlindbox.deployed();

    console.log("catBlindbox Contract deployed at :", catBlindbox.address)
    
    const transactiontReceipt = await catBlindbox.requestNewBlindboxCat(77, "The Cat Blindbox - 01");
   // const tx = await transactiontReceipt.wait();
     const { events } = await transactiontReceipt.wait();
    
    const args = events.find(({ event }) => event === 'ResultOfNewBlindboxCat').args
    
    console.log(args);
    console.log("get request id: ");
    
    console.log(args.requestId);
    function sleep (time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }
    
    await sleep(8000);
    
    const transactiontReceipt1 =  await catBlindbox.generateBlindBoxCat(args.requestId);
    const tx1 = await transactiontReceipt1.wait();
    console.log("create the cat tx :", tx1.status);
    
    const len = await catBlindbox.getLength();
    console.log("len:", len);
    
    const cat = await catBlindbox.generatedCats(0);
    console.log("cat: " , cat);
    // //Deploy AuctionFixedPrice
    // const auctionContractFactory = await ethers.getContractFactory("AuctionFixedPrice");
    // const auctionContract = await auctionContractFactory.deploy();
    // await auctionContract.deployed();
    //
    // console.log("auction Contract deployed at :", auctionContract.address)

 
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });