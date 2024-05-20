const hre = require("hardhat");
const fetch = require('node-fetch');
const qs = require('qs');
require('dotenv').config();

const utils = require("@0x/protocol-utils");
const contractAddresses = require("@0x/contract-addresses");


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
  const walletAddress= process.env.ADDRESS;



  const getFutureExpiryInSeconds = () =>
Math.floor(Date.now() / 1000 + 300).toString(); // 5 min expiry

let CHAIN_ID = '10';
const addresses = contractAddresses.getContractAddressesForChainOrThrow(
  CHAIN_ID
);

  const order = new utils.LimitOrder({
    makerToken: usdcTokenAddress,
    takerToken:  opTokenAddress,
    makerAmount: "500000000", // NOTE: This is 1 WEI, 1 ETH would be 1000000000000000000
    takerAmount: "2000000000000000000", // NOTE this is 0.001 ZRX. 1 ZRX would be 1000000000000000000
    maker: walletAddress,
  
    expiry: getFutureExpiryInSeconds(),
    salt: Date.now().toString(),
    chainId: CHAIN_ID,
    verifyingContract: addresses.exchangeProxy
  });
  const signature = await order.getSignatureWithKey(
    process.env.PRIVATE_KEY,
    utils.SignatureType.EIP712 // Optional
  );

//   const response = await fetch(
//     `https://optimism.api.0x.org/swap/v1/quote?${qs.stringify(params)}`, {headers: {'0x-api-key': apiKey}}
// );

console.log(`Signature: ${JSON.stringify(signature, undefined, 2)}`);

const signedOrder = { ...order, signature };
console.log(`Signed Order: ${JSON.stringify(signedOrder, undefined, 2)}`);


const resp = await fetch("https://optimism.api.0x.org/orderbook/v1/order", {
  method: "POST",
  body: JSON.stringify(signedOrder),
  headers: {
    '0x-api-key': apiKey
  }
});
//todo 401

if (resp.status === 200) {
  console.log("Successfully posted order to SRA");
} else {
  const body = await resp.json();
  console.log(
    `ERROR(status code ${resp.status}): ${JSON.stringify(body, undefined, 2)}`
  );
}
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
