const {expect} = require("chai");
const {ethers, network, waffle} = require("hardhat");
require("@nomiclabs/hardhat-waffle");
const provider = waffle.provider;
const util = require("../utils/utils");


describe("reentrancy attack",  function() {
    var owner, user1, user2;
    //0 Deploiy ERC1820
    //1 Deploy ERC777 and add hook
    //2 Deploy ERC777
    //3 Deploy Uni Exchange
    //4 Add Liquidity
    //5 Buy some eth.
    before(async function(){
        [owner, user1, user2] = await ethers.getSigners();
        //Deploy ERC1820
        let erc1820 = await util.deploy1820(owner);
        //Deploy ERC777
        let erc777 = await util.deployErc777(owner);

        //Deploy Uniswap V1 and add liquidities
        let uniV1 = await util.deployUniV1(owner, erc777);

        //Add malicious hook for senders
        
        //

        //Add liquidity (1:1)
        await (await erc777.connect(owner).mint(owner.address, 500000, [], [])).wait();
        await (await erc777.connect(owner).approve(uniV1.address, 100000)).wait();
        await (await uniV1.connect(owner).addLiquidity(100000, {value:100000})).wait();
    });
 
    it("reentrancy attack ", async function(){
        console.log('attack!');
    });

});


