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
  const sourceChainID = 10  // Op Mainnet
  const destChainID = 56  // BNB Mainnet
  const transferAmount = ethers.utils.parseEther("2")
  const OpTokenAddress = "0x4200000000000000000000000000000000000042"
  const nonce = new Date().getTime()

  // Transfer for Op token, from Op to BNB
  // for contract address, refer to https://cbridge-docs.celer.network/reference/contract-addresses
  const canonicalBridgeContract = "0xbCfeF6Bb4597e724D720735d32A9249E0640aA11"
  const opContract = await hre.ethers.getContractAt('IERC20', OpTokenAddress, deployer);

  let tx = await opContract.approve(canonicalBridgeContract, transferAmount);
  await tx.wait();
  console.log("Approve Op token to canonicalBridgeContract successfully")

  const bridge = await hre.ethers.getContractAt('OriginalTokenVault', canonicalBridgeContract, deployer);
  let receipt = await bridge.deposit(OpTokenAddress,transferAmount,destChainID,deployer.address,nonce)
  await receipt.wait()

  console.log("Send bridge request successfully")

  let transferID = getCanonicalTransferID(deployer.address,OpTokenAddress,transferAmount,destChainID,nonce,sourceChainID)
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
