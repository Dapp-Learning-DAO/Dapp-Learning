// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const {ethers} = require("hardhat");
require('dotenv').config();

const {
  readRedpacketDeployment,
  getStatus,
  request,
} = require("../utils");

async function getQuote (fromChain, toChain, fromToken, toToken, fromAmount, slippage, fromAddress, toAddress) {
  const result = await request(
    "https://li.quest/v1/quote",
    {
      fromChain,
      toChain,
      fromToken,
      toToken,
      fromAmount,
      slippage,
      fromAddress,
      toAddress,
    }
  )

  return result;
}


async function main() {
  const [deployer] = await ethers.getSigners();

  // Bridge From Op to Zksync ERA
  // const fromChain = 'OPT';
  // const fromToken = 'USDT';
  // const toChain = 'ERA';
  // const toToken = 'USDT';
  // const fromAmount = '1000000';
  // const slippage = 0.03;
  // const fromAddress = deployer.address;
  // const toAddress = deployer.address;
  // let quote = await getQuote(fromChain, toChain, fromToken, toToken, fromAmount, slippage,fromAddress,toAddress);
  // console.log(quote.transactionRequest)


  // Bridge From Op to ARB
  const fromChain = 'OPT';
  const fromToken = 'USDT';
  const toChain = 'ARB';
  const toToken = 'USDT';
  const fromAmount = '1000000';
  const slippage = 0.03;
  const fromAddress = deployer.address;
  const toAddress = deployer.address;
  let quote = await getQuote(fromChain, toChain, fromToken, toToken, fromAmount, slippage,fromAddress,toAddress);
  // console.log(quote.transactionRequest)

  const deployment = readRedpacketDeployment();
  let txHash = deployment.crossChainTxHash
  // Waiting for the transfer to complete
  let result;
  do {
      result = await getStatus(quote.tool, fromChain, toChain, txHash);
      console.log(`Transfer status: ${result.status}`)
  } while (result.status !== 'DONE' && result.status !== 'FAILED')
  console.log(result)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
