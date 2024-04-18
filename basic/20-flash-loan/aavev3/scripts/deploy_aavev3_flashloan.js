// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const fs = require('fs');
const { ethers } = require('hardhat');

const USDC_ADDRESS = '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8';
const USDC_DECIMALS = 6;
const FLASHLOAN_AMOUNT = ethers.parseUnits("1000", USDC_DECIMALS);
const USDC_ABI = ["function transfer(address to, uint256 value) external returns (bool)"];
const AMOUNT_UINT = ethers.parseUnits("1", USDC_DECIMALS)


async function main() {

 
  let PoolAddressesProvider, faucetAddr;
  let network = hre.hardhatArguments.network;

  const provider = new ethers.WebSocketProvider(`wss://sepolia.infura.io/ws/v3/${process.env.INFURA_ID}`);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);


  if (network === 'sepolia'){
    PoolAddressesProvider = '0x012bAC54348C0E635dCAc9D5FB99f06F24136C9A';
    //faucetAddr = '0x1ca525Cd5Cb77DB5Fa9cBbA02A0824e283469DBe';
  }else{
    throw console.error(`Are you deploying to the correct network? (network selected: ${network})`);
  }
  const [deployer] = await ethers.getSigners();

  console.log('Deploying contracts with the account:', deployer.address);

  const flashLoanFactory = await ethers.getContractFactory('MintFlashLoan');
  const flashloan = await flashLoanFactory.deploy(PoolAddressesProvider);

  const flashloanTxn = await flashloan.deploymentTransaction().wait(1)
  console.log('flashLoan deployed to:', flashloanTxn.contractAddress);
  console.log("---------------------------------------------------------------\n");
  
  const erc20 = new ethers.Contract(USDC_ADDRESS, USDC_ABI, wallet)
  const amount = ethers.parseUnits("5",USDC_DECIMALS)
   
  console.log(`Transferring ${amount / AMOUNT_UINT} USDC to the FlashLoan contract...`)
  const transferErc20  = await erc20.transfer(flashloanTxn.contractAddress,amount)

  console.log(`Finish transfer ${amount / AMOUNT_UINT} USDC to the FlashLoan contract...`)
  console.log("Waiting for 1 block to verify the transfer ")
  await transferErc20.wait(1);// Wait 1 block for the transaction to be verified to update the balance
  console.log("---------------------------------------------------------------\n");
 
// Check USDC balance of the FlashLoan contract
const usdcBalance = await flashloan.getBalance(USDC_ADDRESS);
console.log(`USDC balance of the FlashLoan contract is: ${usdcBalance / AMOUNT_UINT} USDC`);
console.log("---------------------------------------------------------------\n");


  // do flashLoan
  console.log(`Requesting a flash loan of ${FLASHLOAN_AMOUNT / AMOUNT_UINT} USDC...`);
  let res = await flashloan.executeFlashLoan(USDC_ADDRESS, FLASHLOAN_AMOUNT); //1000 USDC, the decimal is 6,so value is 1000,000,000
  await res.wait();
  console.log("Flashloan executed!");
  console.log(`MintFlashLoan successfully, please check tx hash ${res.hash} for more details `);
  console.log("---------------------------------------------------------------\n");
  
 
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
