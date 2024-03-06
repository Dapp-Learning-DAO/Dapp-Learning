// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const {ethers} = require("hardhat");

const {
  saveRedpacketDeployment,
} = require("../utils");



function getCanonicalTransferID(userAddress,tokenAddress,transferAmount,destChainID,nonce,sourceChainID){
  return ethers.utils.solidityKeccak256(
    ["address","address","uint256","uint64","address","uint64","uint64"],[userAddress,tokenAddress,transferAmount,destChainID,userAddress,nonce,sourceChainID])
}


async function main() {
  const [deployer] = await ethers.getSigners();
  const sourceChainID = 137  // Polygon Mainnet
  const destChainID = 1285  // Moonriver Mainnet
  const transferAmount = ethers.utils.parseEther("21")
  const tokenAddress = "0xa3Fa99A148fA48D14Ed51d610c367C61876997F1"
  const nonce = new Date().getTime()

  // Transfer for miMATIC token, from Polygon to Moonriver
  // for contract address, refer to https://cbridge-docs.celer.network/reference/contract-addresses
  const canonicalBridgeContract = "0xc1a2D967DfAa6A10f3461bc21864C23C1DD51EeA"
  const contract = await hre.ethers.getContractAt('IERC20', tokenAddress, deployer);

  let tx = await contract.approve(canonicalBridgeContract, transferAmount);
  await tx.wait();
  console.log("Approve Op token to canonicalBridgeContract successfully")

  const bridge = await hre.ethers.getContractAt('OriginalTokenVault', canonicalBridgeContract, deployer);
  let receipt = await bridge.deposit(tokenAddress,transferAmount,destChainID,deployer.address,nonce)
  await receipt.wait()

  console.log("Send bridge request successfully")

  let transferID = getCanonicalTransferID(deployer.address,tokenAddress,transferAmount,destChainID,nonce,sourceChainID)
  saveRedpacketDeployment({
    canonicalCelerBridgeTransferID: transferID,
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
