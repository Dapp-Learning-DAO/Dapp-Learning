const { expect } = require('chai');
const { hasRegexChars } = require('prettier');
const { ethers } = require("hardhat");
require('dotenv').config();
const { getTokenAddress } = require('../utils/index');

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
const { abi: UniswapFlashloaner } = require('../artifacts/contracts/UniswapFlashloaner.sol/UniswapFlashloaner.json');
const { abi: PairAddr } = require('../artifacts/contracts/lib/IUniswapV2Pair.sol/IUniswapV2Pair.json');
// const { abi: IUniswapV2Factory } = require('../artifacts/contracts/lib/IUniswapV2Factory.sol/IUniswapV2Factory.json');

const addr = process.env.FLASHLOAN_ADDRESS; // <--- you need fill it in .env file
const factory = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
// const token0 = 0xCAFE000000000000000000000000000000000000; // change me!
// const token1 = 0xF00D000000000000000000000000000000000000; // change me!

// address pair = address(uint(keccak256(abi.encodePacked(
//   hex'ff',
//   factory,
//   keccak256(abi.encodePacked(token0, token1)),
//   hex'96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f'
// ))));
if (!addr) {
  console.log('Please set the contract address in .env file.');
  return;
}

const OVERRIDES = {
  gasLimit: 8e6,
  gasPrice: 60e8
}

let UniswapFlashloan;
let UniswapV2Pair;
let IUniswapV2Fac

describe('flashloan test', function () {
  beforeEach(async function () {
    let getTokenAddr = getTokenAddress('kovan');
    UniswapFlashloan = new ethers.Contract(addr, UniswapFlashloaner, wallet);
    let UniswapV2Library = await ethers.getContractFactory("UniswapV2Library");
    IUniswapV2Fac = await UniswapV2Library.deploy();
    let pairAddr = await IUniswapV2Fac.getPair(factory, getTokenAddr('WETH'), getTokenAddr('DAI'))
    UniswapV2Pair = new ethers.Contract(pairAddr, PairAddr, wallet);
  });

  it('start flashloan', async function () {
    const bytes = ethers.utils.arrayify('0x00')
    let pair_res =
      await UniswapV2Pair.swap(
        10, 0,
        addr,
        bytes,
        OVERRIDES)
    console.log(pair_res);
  })

});
