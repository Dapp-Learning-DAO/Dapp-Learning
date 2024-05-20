const hre = require("hardhat");
const fetch = require('node-fetch');
const utils = require("@0x/protocol-utils");
const { Web3 } = require("web3");
const qs = require('qs');
const {
  LimitOrderBuilder,
  ChainId,
  Web3ProviderConnector,
  PrivateKeyProviderConnector
}  = require( '@1inch/limit-order-protocol-utils');
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
 
  const walletAddress= process.env.ADDRESS;



const chainId = ChainId.optimismMainnet; // suggested, or use your own number

let yourInfuraKey = process.env.ALCHEMY;
const web3 = new Web3(`https://opt-mainnet.g.alchemy.com/v2/${yourInfuraKey}`);

//const connector = new Web3ProviderConnector(web3);
const connector = new PrivateKeyProviderConnector(process.env.PRIVATE_KEY, web3);

//const contractAddress1 = limirOrderProtocolAdresses[chainId];
 const contractAddress = '0x11431a89893025D2a48dCA4EddC396f8C8117187';
 //console.log("contractAddress ", contractAddress1);

const limitOrderBuilder = new LimitOrderBuilder(
  contractAddress,
  chainId,
  connector
);

//   const limitOrder = limitOrderBuilder.buildLimitOrder({
//     makerAsset: usdcTokenAddress,
//     takerAsset: opTokenAddress,
//     maker: walletAddress,
//     makingAmount: '500000000',
//     takingAmount: '2000000000000000000',
//     salt: '12345678',
// });
const getFutureExpiryInSeconds = () =>
Math.floor(Date.now() / 1000 + 300).toString(); // 5 min expiry


const order = new utils.LimitOrder({
  makerToken: usdcTokenAddress,
  takerToken: opTokenAddress,
  makerAmount: "500000000", // NOTE: This is 1 WEI, 1 ETH would be 1000000000000000000
  takerAmount: "2000000000000000000", // NOTE this is 0.001 ZRX. 1 ZRX would be 1000000000000000000
  maker: walletAddress,
 
  expiry: getFutureExpiryInSeconds(),
  salt: Date.now().toString(),
  chainId: 10,
  verifyingContract: contractAddress
});
console.log("limitOrder ", order);


const signature = await order.getSignatureWithKey(
  process.env.PRIVATE_KEY,
  utils.SignatureType.EIP712 // Optional
);
console.log(`Signature: ${JSON.stringify(signature, undefined, 2)}`);

const signedOrder = { ...order, signature };


let limit_order_url = "https://limit-orders.1inch.io/v3.0/10/limit-order";

const resp = await fetch(limit_order_url, {
    method: "POST",
    body: JSON.stringify(signedOrder),
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (resp.status === 200) {
    console.log("Successfully posted order to SRA");
  } else {
    const body = await resp.json();
    console.log(
      `ERROR(status code ${resp.status}): ${JSON.stringify(body, undefined, 2)}`
    );
  }


//   const limitOrderTypedData = limitOrderBuilder.buildLimitOrderTypedData(
//     limitOrder,
//   );
//   //  console.log("limitOrderTypedData ", limitOrderTypedData);


//   const limitOrderSignature = limitOrderBuilder.buildOrderSignature(
//     walletAddress,
//     limitOrderTypedData,
//   );

//   const limitOrderHash = limitOrderBuilder.buildLimitOrderHash(
//     limitOrderTypedData
// );

// console.log("limitOrderHash ", limitOrderHash);
  // const callData = limitOrderProtocolFacade.fillLimitOrder({
  //   order: limitOrder,
  //   signature: limitOrderSignature,
  //   makingAmount: '100',
  //   takingAmount: '0',
  //   thresholdAmount: '50'
  // });

  // // Send transaction for the order filling
  // // Must be implemented
  // sendTransaction({
  //   from: walletAddress,
  //   gas: 210_000, // Set your gas limit
  //   gasPrice: 40000, // Set your gas price
  //   to: contractAddress,
  //   data: callData,
  // });
  }

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
