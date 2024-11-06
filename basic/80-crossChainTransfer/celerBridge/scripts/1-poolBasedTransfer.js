// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const {ethers} = require("hardhat");

const {
  saveRedpacketDeployment,
  request,
} = require("../utils");



async function getTransferConfigs(){
  const fetchRes = await request(
    "https://cbridge-prod2.celer.app/v2/getTransferConfigs"
  );
  console.log("fetchRes", fetchRes?.blocked_bridge_direct?.[0]);
}

async function estimateAmt(sourceChain,dstChain,tokenSymbol,userAddress,tolerance,transferAmount){
  const fetchParamsRes = await request(
    "https://cbridge-prod2.celer.app/v2/estimateAmt",
    {
      src_chain_id: sourceChain,
      dst_chain_id: dstChain,
      token_symbol: tokenSymbol,
      usr_addr: userAddress,
      slippage_tolerance: tolerance,
      amt: transferAmount,
    }
  );
  console.log("fetchParamsRes", fetchParamsRes);
}


function getPoolBasedTransferID(userAddress,tokenAddress,transferAmount,destChainID,nonce,sourceChainID){
  return ethers.utils.solidityPackedKeccak256(
    ["address","address","address","uint256","uint64","uint64","uint64"],[userAddress,userAddress,tokenAddress,transferAmount,destChainID,nonce,sourceChainID])
}


async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Try to getTransferConfigs")
  await getTransferConfigs()

  // Bridge from OP to Zksync Era
  // const sourceChainID = 10  // Op Mainnet: 10, Ethereum: 1
  // const destChainID = 324  // Polygon Mainnet: 137, zkSync Era: 324
  // const tokenSymbol = "USDT" // transfer USDT
  // const slippageTolerance = 3000 // if the user sets slippage_tolerance with 0.05%, slippage_tolerance in the request will be 0.05% * 1M = 500
  // const transferAmount = 21000000
  // const tokenAddress = "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58" 
  // const nonce = new Date().getTime()

  
  // Bridge from Ethereum to Zksync Era
  // const sourceChainID = 1  // Op Mainnet
  // const destChainID = 324  // Zksync Era Mainnet
  // const tokenSymbol = "USDC" // transfer USDT
  // const slippageTolerance = 3000 // if the user sets slippage_tolerance with 0.05%, slippage_tolerance in the request will be 0.05% * 1M = 500
  // const transferAmount = 21000000 // The transfer amount must be greater than 20 USDC.e.
  // const tokenAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" // celeBridge support USDC.e & wETH right now, please refer to https://cbridge.celer.network/1/324/USDC for more details
  // const nonce = new Date().getTime()


  // Bridge from OP to Polygon
  const sourceChainID = 10  // Op Mainnet: 10, Ethereum: 1
  const destChainID = 137  // Polygon Mainnet: 137, zkSync Era: 324
  const tokenSymbol = "USDT" // transfer USDT
  const slippageTolerance = 3000 // if the user sets slippage_tolerance with 0.05%, slippage_tolerance in the request will be 0.05% * 1M = 500
  const transferAmount = 21000000
  const tokenAddress = "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58" 
  const nonce = new Date().getTime()


  console.log("Try to estimate transfer amt")
  const estimageResult = await estimateAmt(sourceChainID,destChainID,tokenSymbol,deployer.address,slippageTolerance,transferAmount)

  // Pool Based Transfer for USDT, from Op to Polygon
  // for contract address, refer to https://cbridge-docs.celer.network/reference/contract-addresses
  const OpPoolBasedBridgeContract = "0x9D39Fc627A6d9d9F8C831c16995b209548cc3401"
  const usdtContracct = await ethers.getContractAt('IERC20', tokenAddress, deployer);

  let tx = await usdtContracct.approve(OpPoolBasedBridgeContract, transferAmount);
  await tx.wait();
  console.log("Approve USDT to OpPoolBasedBridge successfully")

  const bridge = await ethers.getContractAt('Bridge', OpPoolBasedBridgeContract, deployer);
  let receipt = await bridge.send(deployer.address, tokenAddress,transferAmount,destChainID,nonce,slippageTolerance)
  await receipt.wait()

  console.log("Send bridge request successfully")

  let transferID = getPoolBasedTransferID(deployer.address, deployer.address,tokenAddress,transferAmount,destChainID,nonce,sourceChainID)
  console.log(transferID)
  // let  transferID = "0xasdfasfsfasf"
  saveRedpacketDeployment({
    poolBasedCelerTransferID: transferID,
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
