const { ethers } = require('hardhat');
const { Web3 } = require("web3");
require('dotenv').config();
const fetch = require('node-fetch');

const apiKey = process.env.APIKEY;
const chainId = 10; // Chain ID for Optimism
const optimismRpcUrl = 'https://mainnet.optimism.io';

const broadcastApiUrl = 'https://api.1inch.dev/tx-gateway/v1.1/' + chainId + '/broadcast';

const apiBaseUrl = `https://api.1inch.dev/swap/v5.2/${chainId}`;
let yourInfuraKey = process.env.ALCHEMY;
const web3 = new Web3(`https://opt-mainnet.g.alchemy.com/v2/${yourInfuraKey}`);



async function checkAllowance(tokenAddress, walletAddress) {
    const url = `${apiBaseUrl}/approve/allowance?tokenAddress=${tokenAddress}&walletAddress=${walletAddress}`;
    const response = await fetch(url, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` } });
    const data = await response.json();
    return data.allowance;
  }
  
//   async function approveToken(tokenAddress, spenderAddress) {
//     const url = `${apiBaseUrl}/approve/transaction?tokenAddress=${tokenAddress}&spenderAddress=${spenderAddress}`;
//     const response = await fetch(url, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` } });
//     const transaction = await response.json();
  
//     const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
//     const signedTransaction = await wallet.signTransaction(transaction);
//     await ethers.provider.sendTransaction(signedTransaction);
//   }



// Sign and post a transaction, return its hash
async function signAndSendTransaction( transaction) {
    console.log("sign ----")
    const { rawTransaction } = await web3.eth.accounts.signTransaction(transaction, process.env.PRIVATE_KEY);
    console.log("rawTransaction: ", rawTransaction)
    return await broadCastRawTransaction(rawTransaction);
  }
  

async function broadCastRawTransaction(rawTransaction) {
    const response = await fetch(broadcastApiUrl, {
      method: 'post',
      body: JSON.stringify({ rawTransaction }),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    });
  
    const data = await response.json();
    console.log("broadCast", data)
    return data.transactionHash;
  }
  
  
function apiRequestUrl(methodName, queryParams) {
    let s =  apiBaseUrl + methodName + '?' + (new URLSearchParams(queryParams)).toString();
  
    return s
  }

  async function buildTxForApproveTradeWithRouter(tokenAddress, amount) {
    const url = apiRequestUrl(
      '/approve/transaction',
      amount ? { tokenAddress, amount } : { tokenAddress }
    );
  
    const response = await fetch(url, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` } });
    
  
    const transaction = await response.json();
  
    console.log("transaction: ", transaction)
  
    const gasLimit = await ethers.provider.estimateGas({
      ...transaction
    });
  
    console.log("gasLimit: ", gasLimit)
  
    return {
      ...transaction,
      gas: gasLimit,
    };
  
    
   }


//   async function buildSwapTransaction(srcToken, dstToken, amount) {
//     const url = `${apiBaseUrl}/swap?fromTokenAddress=${srcToken}&toTokenAddress=${dstToken}&amount=${amount}&fromAddress=${wallet.address}`;
//     const response = await fetch(url, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` } });
//     const transaction = await response.json();
//     return transaction;
//   }


async function buildTxForSwap(swapParams) {
    const url = apiRequestUrl("/swap", swapParams);
    console.log(url);
    const headers = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` } }
    // Fetch the swap transaction details from the API
    const response = await  fetch(url, headers);

    const data = await response.json();
    return data.tx;

   
  }

  function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }
  

async function main() {
  const usdcTokenAddress = '0x7F5c764cBc14f9669B88837ca1490cCa17c31607'; // Replace with actual USDC token address
  const opTokenAddress = '0x4200000000000000000000000000000000000042'; // Replace with actual OP token address
  const oneinchrouter = '0x1111111254eeb25477b68fb85ed929f73a960582';
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
  const [signer] = await ethers.getSigners();
//   const usdcAllowance = await checkAllowance(usdcTokenAddress, wallet.address);
//   console.log("usdcAllowance", usdcAllowance)

//   if (usdcAllowance < 1e18) {
    // Approve 1inch to spend USDC if allowance is insufficient
    // const transactionForSign = await buildTxForApproveTradeWithRouter(usdcTokenAddress, 10000000);
    // const approveTxHash = await signAndSendTransaction( transactionForSign);
    // console.log("approveTxHash", approveTxHash);
  //}

//   // Swap USDC to OP
const swapParams = {
    src: usdcTokenAddress, // Token address of 1INCH
    dst: opTokenAddress, // Token address of DAI
    amount: "5000000", // Amount of 1INCH to swap (in wei)
    from: wallet.address,
    slippage: 1, // Maximum acceptable slippage percentage for the swap (e.g., 1 for 1%)
    disableEstimate: false, // Set to true to disable estimation of swap details
    allowPartialFill: false // Set to true to allow partial filling of the swap order
  };
  const swapTransaction = await buildTxForSwap(swapParams); // 0.1 USDC

  console.log("swapTransaction ", swapTransaction)

 // await wallet.signTransaction(swapTransaction)  //!!! need fix the gas to gaslimit
//    const transactionHash = await ethers.provider.sendTransaction(swapTransaction);
// console.log(`Swap transaction sent. Transaction Hash: ${transactionHash}`);

// await sleep(2000)

  // const swapTxHash = await signAndSendTransaction(swapTransaction);
  //   console.log("Swap tx hash: ", swapTxHash);
  //  console.log(`Swap transaction sent. Transaction Hash: ${transactionHash}`);
}

main().catch((error) => console.error(error));
