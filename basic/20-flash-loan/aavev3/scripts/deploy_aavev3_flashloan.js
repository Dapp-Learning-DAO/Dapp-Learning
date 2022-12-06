// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const daiTokenAddr = '0xDF1742fE5b0bFc12331D8EAec6b478DfDbD31464';
  let lendingPoolProviderAddr, faucetAddr;
  let network = hre.hardhatArguments.network;

  if (network === 'goerli'){
    lendingPoolProviderAddr = '0xc4dCB5126a3AfEd129BC3668Ea19285A9f56D15D';
    faucetAddr = '0x1ca525Cd5Cb77DB5Fa9cBbA02A0824e283469DBe';
  }else{
    throw console.error(`Are you deploying to the correct network? (network selected: ${network})`);
  }
  const [deployer] = await ethers.getSigners();

  console.log('Deploying contracts with the account:', deployer.address);

  const flashLoanFactory = await ethers.getContractFactory('MintFlashLoan');
  const flashLoan = await flashLoanFactory.deploy(lendingPoolProviderAddr, faucetAddr);

  await flashLoan.deployed();

  console.log('flashLoan deployed to:', flashLoan.address);

  // do flashLoan
  let res = await flashLoan.executeFlashLoan(daiTokenAddr, 10000000000000000000000);
  await res.wait();
  console.log(`MintFlashLoan successfully, please check tx hash ${res.hash} for more details `);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
