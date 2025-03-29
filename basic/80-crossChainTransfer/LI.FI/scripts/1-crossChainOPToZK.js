// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers } = require('hardhat');
require('dotenv').config();

const { getRoutes, getQuote, getStatus } = require('@lifi/sdk');

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(deployer.address);

  //  request route

  //Bridge from OP to Zksync Era
  const routesRequest = {
    fromChainId: 10, // op
    toChainId: 324, // zk
    fromTokenAddress: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // DAI on Arbitrum
    toTokenAddress: '0x493257fD37EDB34451f62EDf8D2a0C418852bA4C', // USDT on zksync
    fromAmount: '1000000000000000000', // 1 USDC
    fromAddress: deployer.address,
  };
  // let quote = await gettQuote(fromChain, toChain, fromToken, toToken, fromAmount, slippage, fromAddress, toAddress);
  let route = await getRoutes(routesRequest);

  console.log(route.routes);

  // request quote
  const quoteRequest = {
    fromChain: 10, // Arbitrum
    toChain: 324, // Optimism
    fromToken: 'DAI', // USDC on Arbitrum
    toToken: 'USDT', // DAI on Optimism
    fromAmount: '1000000000000000000', // 10 USDC
    slippage: 0.01,
    // The address from which the tokens are being transferred.
    fromAddress: deployer.address,
  };

  const quote = await getQuote(quoteRequest);
  console.log(quote.transactionRequest);

  // approve DAI
  const DAItokenAddress = '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'; // DAI

  const tokenContracct = await ethers.getContractAt('IERC20', DAItokenAddress, deployer);
  let approveTx = await tokenContracct.approve(quote.transactionRequest.to, quoteRequest.fromAmount);
  await approveTx.wait();

  console.log(`Approve DAI to ${quote.transactionRequest.to} successfully`);

  // send cross chain transfer request
  let tx = await deployer.sendTransaction(quote.transactionRequest);
  await tx.wait();
  console.log('send request successfully');

  console.log('crossChainTxHash', tx.hash);

  let transactionHash = '0xb7b87ac241a2f6d74cdaa9f1af4d82c081bbc31b19be7b759c7eb7f58921065a';
  let result = await getStatus({
    txHash: transactionHash,
    fromChain: quoteRequest.fromChain,
    toChain: quoteRequest.toChain,
    bridge: quote.tool,
  });

  console.log(`Transfer status: ${result.status}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
