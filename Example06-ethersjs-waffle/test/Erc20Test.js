const { use, expect } = require("chai");
const fs = require("fs");
const {deployContract, MockProvider, solidity} = require('ethereum-waffle');
const SimpleToken = require('../build/SimpleToken.json');

const { ethers } = require("ethers");
const Web3 = require('web3');

use(solidity);

describe('SimpleToken', () => {
    const [wallet, walletTo] = new MockProvider().getWallets();
    let token;

    beforeEach(async () => {
        token = await deployContract(wallet, SimpleToken, ["HEHE", "HH", 0, 100000000]);
    });

    // beforeEach(async () => {
    //     //token = await deployContract(wallet, SimpleToken, ["HEHE", "HH", 1, 100000000]);
    //     const simpletoken = new ethers.ContractFactory(SimpleToken.abi, SimpleToken.bytecode, wallet);
    //     token =  await simpletoken.deploy( "HEHE", "HH", 1, 100000000);
    // });

    it('Assigns initial balance', async () => {
        console.log("*****2");
        expect(await token.balanceOf(wallet.address)).to.equal(100000000);

    });

    it('Transfer adds amount to destination account', async () => {
        await token.transfer(walletTo.address, 7);
        expect(await token.balanceOf(walletTo.address)).to.equal(7);
    });

    it('Transfer emits event', async () => {
        await expect(token.transfer(walletTo.address, 7))
            .to.emit(token, 'Transfer')
            .withArgs(wallet.address, walletTo.address, 7);
    });

    it('Can not transfer above the amount', async () => {
        await expect(token.transfer(walletTo.address, 1007100000000)).to.be.reverted;
    });

    it('Calls totalSupply on SimpleToken contract', async () => {
        await token.totalSupply();
        expect('totalSupply').to.be.calledOnContract(token);
    });

    it('Calls balanceOf with sender address on SimpleToken contract', async () => {
        await token.balanceOf(wallet.address);
        expect('balanceOf').to.be.calledOnContractWith(token, [wallet.address]);
    });
});