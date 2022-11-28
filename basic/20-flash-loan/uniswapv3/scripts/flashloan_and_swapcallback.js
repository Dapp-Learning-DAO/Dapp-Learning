// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const flashLoanAndSwapFactory = await hre.ethers.getContractFactory("FlashLoanAndSwap");
  const rinkebyWETHAddr = "0xc778417E063141139Fce010982780140Aa0cD5Ab";
  const rinkebyDai =  "0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735";
  const flashLoanAndSwap = await flashLoanAndSwapFactory.deploy(rinkebyWETHAddr,rinkebyDai);
  await flashLoanAndSwap.deployed();
  console.log("Deploy uniswap flashloan contract successfully");
  console.log(`FlashLoan contract address: ${flashLoanAndSwap.address}`);

  const artifactWETH = artifacts.readArtifactSync("IWETH9");
  let weth = new ethers.Contract(rinkebyWETHAddr, artifactWETH.abi , deployer);

  // transfer eth to weth
  let amountInEther = "0.01"
  console.log("Going to deposite ETH to WETH contract");
  let depositeRecipt = await weth.deposit({value: ethers.utils.parseEther(amountInEther)})
  await depositeRecipt.wait()
  console.log("Deposite to WETH contract successfully");

  // transfer weth to FlashLoanAndSwap to pay for flashloan fee
  console.log("Going to transfer WETH to FlashLoanAndSwap contract");
  let transferRecipt = await weth.transfer(flashLoanAndSwap.address,ethers.utils.parseEther(amountInEther));
  await transferRecipt.wait()
  console.log("Transfer WETH to FlashLoanAndSwap contract successfully")

  // Start flash loan
  console.log("Going to do Flashloan");
  let flashLoanRecipt = await flashLoanAndSwap.runFlashLoan(ethers.utils.parseEther("1"),{gasLimit: 9999999});
  await flashLoanRecipt.wait()
  console.log("FlashLoan successfully")

  // Start to flash swap
  let amountToSwap = "0.001"
  console.log("Going to deposite ETH to WETH contract");
  let swapDepositeRecipt = await weth.deposit({value: ethers.utils.parseEther(amountToSwap)})
  await swapDepositeRecipt.wait()
  console.log("Deposite to WETH contract successfully");

  // transfer weth to FlashLoanAndSwap to pay for flashloan fee
  console.log("Going to transfer WETH to FlashLoanAndSwap contract to do swap");
  let swapTransferRecipt = await weth.transfer(flashLoanAndSwap.address,ethers.utils.parseEther(amountToSwap));
  await swapTransferRecipt.wait()
  console.log("Transfer WETH to FlashLoanAndSwap contract successfully")

  console.log("Going to do swap with callback");
  let swapRecipt = await flashLoanAndSwap.runSwap(ethers.utils.parseEther(amountToSwap),{gasLimit: 9999999});
  await swapRecipt.wait()
  console.log("Swap with callback successfully")


  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
