const hre = require("hardhat");
const fetch = require('node-fetch');
const qs = require('qs');


//https://github.com/0xProject/0x-api-starter-guide-code/blob/master/src/direct-swap.js#L105-L113
async function main() {

  const API_QUOTE_URL = 'https://api.0x.org/swap/v1/quote';
  console.info(`Fetching swap quote from 0x-API to sell WETH for DAI...`);
  const params = {
      // Not all token symbols are supported. The address of the token can be used instead.
      sellToken: 'DAI',
      buyToken: 'WETH',
      // Note that the DAI token uses 18 decimal places, so `sellAmount` is `100 * 10^18`.
      sellAmount: '100000000000000000000',
  }
  const quoteUrl = `${API_QUOTE_URL}?${qs}`;
  const response = await fetch(
      `https://api.0x.org/swap/v1/quote?${qs.stringify(params)}`
  );

  const quote = await response.json();
  console.log(quote)

  console.info(`Received a quote  ${quote}`);
  console.info(`Received a quote with price ${quote.price}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
