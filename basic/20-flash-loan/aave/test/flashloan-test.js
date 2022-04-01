const { expect } = require('chai');
const { hasRegexChars } = require('prettier');
const { ethers } = require("hardhat");
require('dotenv').config();

const provider = new ethers.providers.WebSocketProvider(`wss://kovan.infura.io/ws/v3/${process.env.INFURA_ID}`);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const { abi: FlashloanABI } = require('../artifacts/contracts/Flashloan.sol/Flashloan.json');

const addr = process.env.FLASHLOAN_ADDRESS; // <--- you need fill it in .env file
if (!addr) {
  console.log('Please set the contract address in .env file.');
  return;
}

let iface;

describe('flashloan test', function () {
  beforeEach(async function () {
    iface = new ethers.Contract(addr, FlashloanABI, wallet);
  });

  it('start flashloan', async function () {
    let res = await iface.flashloan(process.env.YOUR_WALLET_ADDRESS, { gasPrice: 10000000, gasLimit: 25000 });
    await res.wait()
  })

});
