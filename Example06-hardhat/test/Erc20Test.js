const { use, expect } = require("chai");
const fs = require("fs");
const {deployContract, MockProvider, solidity} = require('ethereum-waffle');
const SimpleToken = require('../build/SimpleToken.json');

const { ethers } = require("ethers");
const Web3 = require('web3');

use(solidity);

describe('SimpleToken', () => {
    const privateKey = fs.readFileSync("./sk.txt").toString().trim()

    const web3 = new Web3.providers.HttpProvider('https://kovan.infura.io/v3/0aae8358bfe04803b8e75bb4755eaf07');

    let web3Provider = new ethers.providers.Web3Provider(web3)

 //   provider = new ethers.providers.InfuraProvider(  "kovan","0aae8358bfe04803b8e75bb4755eaf07"  )

    let wallet = new ethers.Wallet(privateKey,web3Provider);

    let address = "0x54A65DB20D7653CE509d3ee42656a8F138037d51";

    let walletTo = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

    let token;

    // (async function() {
    //
    //     // 常见合约工厂实例
    //     const simpletoken = new ethers.ContractFactory(SimpleToken.abi, SimpleToken.bytecode, wallet);
    //     token =  await simpletoken.deploy( "HEHE", "HH", 1, 100000000);
    //
    //     console.log(token.address);
    //
    //     await token.deployed()
    //     console.log( token.balanceOf(wallet.address));
    //
    // })();




     //token =  deployContract(wallet, SimpleToken, ["HEHE", "HH", 1, 100000000]);


    beforeEach(async () => {
        //token = await deployContract(wallet, SimpleToken, ["HEHE", "HH", 1, 100000000]);
        const simpletoken = new ethers.ContractFactory(SimpleToken.abi, SimpleToken.bytecode, wallet);
        token =  await simpletoken.deploy( "HEHE", "HH", 1, 100000000);
    });

    it('Assigns initial balance', async () => {
        console.log("*****2");
        expect(await token.balanceOf(wallet.address)).to.equal(100000000);

    });

    it('Transfer adds amount to destination account', async () => {
        await token.transfer(walletTo.address, 7);
        expect(await token.balanceOf(walletTo)).to.equal(7);
    });

    it('Transfer emits event', async () => {
        await expect(token.transfer(walletTo.address, 7))
            .to.emit(token, 'Transfer')
            .withArgs(wallet.address, walletTo.address, 7);
    });

    it('Can not transfer above the amount', async () => {
        await expect(token.transfer(walletTo.address, 1007)).to.be.reverted;
    });

    it('Can not transfer from empty account', async () => {
        const tokenFromOtherWallet = token.connect(walletTo);
        await expect(tokenFromOtherWallet.transfer(wallet.address, 1))
            .to.be.reverted;
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