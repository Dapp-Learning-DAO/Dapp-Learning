const { expect } = require("chai");
const { exec } = require('child_process');

async function auction_init() {
    const Token = await ethers.getContractFactory("SimpleToken");
    const hardhatToken = await Token.deploy("HEHE", "HH", 1, 100000000);
    console.log("erc20 : ", hardhatToken.address);
    const contractfactory = await ethers.getContractFactory("MYERC721");
    const myerc721 = await contractfactory.deploy("MYERC721", "TEST","");
    console.log("erc721 : ", myerc721.address);
    const auctionContractFactory = await ethers.getContractFactory("AuctionUnfixedPrice");
    const auctionContract = await auctionContractFactory.deploy();
    await auctionContract.deployed();
    console.log("auction : ", auctionContract.address);
    return [hardhatToken, myerc721, auctionContract]
}


describe("AuctionUnfixedPrice contract", function() {
    it("Seller puts the item on auction", async function() {
        const [owner, Alice, Test, Bob] = await hre.ethers.getSigners();
        const [hardhatToken, myerc721, auctionContract] = await auction_init()

        await myerc721.mintWithTokenURI(owner.address, "www.baidu.com");
        let nftbalBigNumber = await myerc721.balanceOf(owner.address);
        let erc721Id = nftbalBigNumber.toNumber() - 1;

        await myerc721.approve(auctionContract.address, erc721Id);

        var timestamp = new Date().getTime();
        const endTime = timestamp + 3600 * 1000;
        await auctionContract.createTokenAuction(myerc721.address, erc721Id, hardhatToken.address, 100, endTime);

        const auctionDetail = await auctionContract.getTokenAuctionDetails(myerc721.address, erc721Id);
        console.log(auctionDetail)
        expect(auctionDetail).to.not.be.undefined;
    });

    it("Seller cancel auction", async function() {
        const [owner, Alice, Test, Bob] = await hre.ethers.getSigners();
        console.log(owner.address)
        const [hardhatToken, myerc721, auctionContract] = await auction_init()

        await myerc721.mintWithTokenURI(owner.address, "www.baidu.com");
        let nftbalBigNumber = await myerc721.balanceOf(owner.address);
        let erc721Id = nftbalBigNumber.toNumber() - 1;

        await myerc721.approve(auctionContract.address, erc721Id);

        var timestamp = new Date().getTime();
        const endTime = timestamp + 3600 * 1000;
        await auctionContract.createTokenAuction(myerc721.address, erc721Id, hardhatToken.address, 100, endTime);

        let auctionDetail = await auctionContract.getTokenAuctionDetails(myerc721.address, erc721Id);
        console.log(auctionDetail)
        expect(auctionDetail).to.not.be.undefined;

        await auctionContract.cancelAution(myerc721.address, erc721Id)
        auctionDetail = await auctionContract.getTokenAuctionDetails(myerc721.address, erc721Id);
        console.log(auctionDetail)
        expect(auctionDetail).to.not.be.undefined;
    });

    it("Alice and Bob bid", async function() {
        const [owner, Alice, Bob] = await hre.ethers.getSigners();
        console.log("owner:",owner.address);
        console.log("alice:",Alice.address);
        console.log("bob:",Bob.address);
    
        const [hardhatToken, myerc721, auctionContract] = await auction_init()

        await hardhatToken.transfer(Alice.address, 1000);
        expect(await hardhatToken.balanceOf(Alice.address)).to.equal(1000);

        await hardhatToken.transfer(Bob.address, 500);
        expect(await hardhatToken.balanceOf(Bob.address)).to.equal(500);

        await myerc721.mintWithTokenURI(owner.address, "www.baidu.com");
        let nftbalBigNumber = await myerc721.balanceOf(owner.address);
        let erc721Id = nftbalBigNumber.toNumber() - 1;

        await myerc721.approve(auctionContract.address, erc721Id);

        var timestamp = new Date().getTime();
        const endTime = timestamp + 2 * 1000;
        await auctionContract.createTokenAuction(myerc721.address, erc721Id, hardhatToken.address, 100, endTime);

        // Alice
        let tokenAlice = hardhatToken.connect(Alice)
        await tokenAlice.approve(auctionContract.address, 1000);
        let allow = await hardhatToken.allowance(Alice.address, auctionContract.address);

        let auctionUnFixedPriceAlice = auctionContract.connect(Alice);
        await auctionUnFixedPriceAlice.bid(myerc721.address, erc721Id, 200);
        console.log('Alice bid 200')

        //Bob
        let tokenBob = hardhatToken.connect(Bob)
        await tokenBob.approve(auctionContract.address, 1000);
        allow = await hardhatToken.allowance(Bob.address, auctionContract.address);

        let auctionUnFixedPriceBob = auctionContract.connect(Bob);
        await auctionUnFixedPriceBob.bid(myerc721.address, erc721Id, 300);
        console.log('Bob bid 300')
    
       
        await auctionUnFixedPriceAlice.bid(myerc721.address, erc721Id, 400);
        console.log('Alice bid again 400')
    
    
        var timestamp1 = new Date().getTime();
        const time = timestamp1 + 5 * 1000
        await ethers.provider.send('evm_setNextBlockTimestamp', [time]);
        
        
        // await auctionContract.executeSale(myerc721.address, erc721Id)
        // let erc721IdOwner = await myerc721.ownerOf(erc721Id);
        // expect(erc721IdOwner).to.equal(Bob.address);
         await auctionContract.cancelAution(myerc721.address, erc721Id)
        
    });
});