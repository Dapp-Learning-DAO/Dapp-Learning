// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const {ethers} = require("hardhat");
require('dotenv').config();

const {
  saveRedpacketDeployment,
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
  const fromChain = 'OPT';
  const fromToken = 'USDT';
  const toChain = 'ARB';
  const toToken = 'USDT';
  const fromAmount = '1000000';
  const slippage = 0.05;
  const fromAddress = deployer.address;
  const toAddress = deployer.address;
  const signer = await ethers.provider.getSigner()
  const OPUSDTaddress = "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58"
  let quote = await getQuote(fromChain, toChain, fromToken, toToken, fromAmount, slippage,fromAddress,toAddress);
  console.log(quote.transactionRequest)
  
  // approve USDT
  const usdtContracct = await ethers.getContractAt('IERC20', OPUSDTaddress, deployer);
  let approveTx = await usdtContracct.approve(quote.transactionRequest.to, fromAmount);
  await approveTx.wait();
  console.log(`Approve USDT to ${quote.transactionRequest.to} successfully`)

  // send cross chain transfer request
  let tx = await signer.sendTransaction(quote.transactionRequest)
  await tx.wait();
  console.log("send request successfully")

  // save tx has
  saveRedpacketDeployment({
    crossChainTxHash: tx.hash,
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
