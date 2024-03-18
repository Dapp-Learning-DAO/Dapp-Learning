const hre = require("hardhat");
const fetch = require('node-fetch');
const qs = require('qs');
require('dotenv').config();

//https://github.com/0xProject/0x-api-starter-guide-code/blob/master/src/direct-swap.js#L105-L113
async function main() {

  //const API_QUOTE_URL = 'https://api.0x.org/swap/v1/quote';
  const API_QUOTE_URL = 'https://optimism.api.0x.org/swap/v1/quote';
  console.info(`Fetching swap quote from 0x-API to sell WETH for DAI...`);

  const exchangeOP="0xdef1abe32c034e558cdd535791643c58a13acc10";
  const apiKey = process.env.ZEROXAPIKEY;

  const usdcTokenAddress = '0x7F5c764cBc14f9669B88837ca1490cCa17c31607'; // Replace with actual USDC token address
  const opTokenAddress = '0x4200000000000000000000000000000000000042'; // Replace with actual OP token address
  const wethTokenAddress = '0x4200000000000000000000000000000000000006'; // Replace with actual OP token address
  
  const params = {
      // Not all token symbols are supported. The address of the token can be used instead.
      sellToken:usdcTokenAddress ,
      buyToken: opTokenAddress,
      // Note that the DAI token uses 18 decimal places, so `sellAmount` is `100 * 10^18`.
      sellAmount: '5000000',
  }
  const quoteUrl = `${API_QUOTE_URL}?${qs}`;

  // const headers = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` } }

  // const response = await fetch(
  //     `https://api.0x.org/swap/v1/price?${qs.stringify(params)}`, {headers: {'0x-api-key': apiKey}}
  // );

  const response = await fetch(
    `https://optimism.api.0x.org/swap/v1/quote?${qs.stringify(params)}`, {headers: {'0x-api-key': apiKey}}
);

  const quote = await response.json();
  console.log(quote)

  console.info(`Received a quote  ${quote}`);
  console.info(`Received a quote with price ${quote.price}`);


  const [signer] = await ethers.getSigners();

  console.log("send transaction ----")
  //
// await signer.sendTransaction({
//   gasLimit: quote.gas,
//   gasPrice: quote.gasPrice,
//   to: quote.to,
//   data: quote.data,
//   value: quote.value,
//   chainId: quote.chainId,
// });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
