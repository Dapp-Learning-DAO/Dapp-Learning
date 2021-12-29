const { expect } = require("chai");
const { exec } = require('child_process');

async function auction_init() {
    const Token = await ethers.getContractFactory("SimpleToken");
    const hardhatToken = await Token.deploy("HEHE", "HH", 1, 100000000);

    const contractfactory = await ethers.getContractFactory("MYERC721");
    const myerc721 = await contractfactory.deploy("MYERC721", "TEST","");

    const auctionContractFactory = await ethers.getContractFactory("AuctionFixedPrice");
    const auctionContract = await auctionContractFactory.deploy();
    await auctionContract.deployed();

    return [hardhatToken, myerc721, auctionContract]
}


describe("AuctionFixedPrice contract", function() {
    it("Seller puts the item on auction", async function() {
        const [owner, Alice, Test, Bob] = await hre.ethers.getSigners();
        const [hardhatToken, myerc721, auctionContract] = await auction_init()

        await myerc721.mintWithTokenURI(owner.address, "www.baidu.com");
        let nftbalBigNumber  =   await myerc721.balanceOf(owner.address) ;
        let erc721Id =  nftbalBigNumber.toNumber() -1 ;

        await myerc721.approve(auctionContract.address, erc721Id);

        var timestamp=new Date().getTime();
        const endTime = timestamp + 3600*1000;
        await auctionContract.createTokenAuction(myerc721.address, erc721Id, hardhatToken.address, 100, endTime);

        const auctionDetail =  await auctionContract.getTokenAuctionDetails(myerc721.address, erc721Id);
        console.log(auctionDetail)
        expect(auctionDetail).to.not.be.undefined;
    });

    it("Seller cancel auction", async function() {
        const [owner, Alice, Test, Bob] = await hre.ethers.getSigners();
        console.log(owner.address)
        const [hardhatToken, myerc721, auctionContract] = await auction_init()

        await myerc721.mintWithTokenURI(owner.address, "www.baidu.com");
        let nftbalBigNumber  =   await myerc721.balanceOf(owner.address) ;
        let erc721Id =  nftbalBigNumber.toNumber() -1 ;

        await myerc721.approve(auctionContract.address, erc721Id);

        var timestamp=new Date().getTime();
        const endTime = timestamp + 3600*1000;
        await auctionContract.createTokenAuction(myerc721.address, erc721Id, hardhatToken.address, 100, endTime);

        let auctionDetail =  await auctionContract.getTokenAuctionDetails(myerc721.address, erc721Id);
        console.log(auctionDetail)
        expect(auctionDetail).to.not.be.undefined;

        await auctionContract.cancelAution(myerc721.address, erc721Id)
        auctionDetail =  await auctionContract.getTokenAuctionDetails(myerc721.address, erc721Id);
        console.log(auctionDetail)
        expect(auctionDetail).to.not.be.undefined;
    });

    it("Alice auction", async function() {
        const [owner, Alice, Test, Bob] = await hre.ethers.getSigners();

        const [hardhatToken, myerc721, auctionContract] = await auction_init()

        await hardhatToken.transfer(Alice.address, 1000);
        expect(await hardhatToken.balanceOf(Alice.address)).to.equal(1000);

        await myerc721.mintWithTokenURI(owner.address, "www.baidu.com");
        let nftbalBigNumber  =   await myerc721.balanceOf(owner.address) ;
        let erc721Id =  nftbalBigNumber.toNumber() -1 ;

        await myerc721.approve(auctionContract.address, erc721Id);

        var timestamp=new Date().getTime();
        const endTime = timestamp + 3600*1000;
        await auctionContract.createTokenAuction(myerc721.address, erc721Id, hardhatToken.address, 100, endTime);

        var auctionDetails = await auctionContract.tokenToAuction(myerc721.address, erc721Id);

        let tokenAlice = hardhatToken.connect(Alice)
        await tokenAlice.approve(auctionContract.address, 1000);
        let allow = await  hardhatToken.allowance(Alice.address, auctionContract.address);
        console.log("alice allowans ", allow.toNumber());

        let auctionFixedPriceAlice = auctionContract.connect(Alice);
        await auctionFixedPriceAlice.purchaseNFTToken(myerc721.address, erc721Id, auctionDetails.price);

        let erc721IdOwner = await  myerc721.ownerOf(erc721Id);
        console.log(erc721IdOwner)
        expect(erc721IdOwner).to.equal(Alice.address);
    });
});