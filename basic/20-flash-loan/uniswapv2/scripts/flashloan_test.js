const { expect } = require('chai');
const { hasRegexChars } = require('prettier');
const { ethers } = require("hardhat");
require('dotenv').config();
const { getTokenAddress } = require('../utils/index');
const flashloanerAddress= require("../UniswapFlashloaner.json");


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


// address pair = address(uint(keccak256(abi.encodePacked(
//   hex'ff',
//   factory,
//   keccak256(abi.encodePacked(token0, token1)),
//   hex'96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f'
// ))));

async function main() {
  let [wallet] = await ethers.getSigners();

  // kovan uniswap v2 factory address
  const factory = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
  let getTokenAddr = getTokenAddress('kovan');

  const artifactUniswapV2Library = artifacts.readArtifactSync("UniswapV2Library");
  let iuniswapV2Library = new ethers.Contract(flashloanerAddress.uniswapV2LibraryAddress, artifactUniswapV2Library.abi, wallet);
  let pairAddr = await iuniswapV2Library.getPair(factory, getTokenAddr('WETH'), getTokenAddr('DAI'))
  console.log(pairAddr)

  const artifactIUniswapV2Pair = artifacts.readArtifactSync("IUniswapV2Pair");
  let UniswapV2Pair = new ethers.Contract(pairAddr, artifactIUniswapV2Pair.abi, wallet);

  const OVERRIDES = {
    gasLimit: 8e6,
    gasPrice: 60e8
  }

  console.log("Going to do Uniswap V2 flashSwap");
  const bytes = ethers.utils.arrayify('0x00')
  let pair_res =
  await UniswapV2Pair.swap(
      0, 1,
      flashloanerAddress.uniswapFlashloanerAddress,
      bytes,
      OVERRIDES)
  
  await pair_res.wait()
  console.log("Uniswap V2 flashSwap successfully");

};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

