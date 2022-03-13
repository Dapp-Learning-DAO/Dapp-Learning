const { expect } = require('chai');
const { hasRegexChars } = require('prettier');
const { ethers } = require("hardhat");
require('dotenv').config();

// IUniswapV1Factory addr
// // mainnet
// const factory = "0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95";

// // testnets
// const ropsten = "0x9c83dCE8CA20E9aAF9D3efc003b2ea62aBC08351";
// const rinkeby = "0xf5D915570BC477f9B8D6C0E980aA81757A3AaC36";
// const kovan = "0xD3E51Ef092B2845f10401a0159B2B96e8B6c3D30";
// const görli = "0x6Ce570d02D73d4c384b46135E87f8C592A8c86dA";


// UniswapV2Factory addr
// const matics = 0x160A4086CB492cFCcF996650799a908506268ffb
// const others = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f

const provider = new ethers.providers.WebSocketProvider(`wss://kovan.infura.io/ws/v3/${process.env.INFURA_ID}`);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const { abi: FlashloanABI } = require('../artifacts/contracts/Flashloan.sol/Flashloan.json');

const addr = process.env.FLASHLOAN_ADDRESS; // <--- you need fill it in .env file
if (!addr) {
  console.log('Please set the contract address in .env file.');
  return;
}

let iface;

describe('RandomNumberConsumer', function () {
  beforeEach(async function () {
    iface = new ethers.Contract(addr, FlashloanABI, wallet);
  });

  it('start flashloan', async function () {
    let res = await iface.flashloan(process.env.YOUR_WALLET_ADDRESS, { gasPrice: 10000000, gasLimit: 25000 });
    await res.wait()
  })

});
