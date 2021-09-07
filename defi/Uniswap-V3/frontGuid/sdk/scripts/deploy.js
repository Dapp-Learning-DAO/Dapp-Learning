import { ethers, run } from 'hardhat';

async function main() {
  await run('compile');

  const accounts = await ethers.getSigners();

  console.log(
    'Deploying contracts with the account:',
    accounts.map((a) => a.address)
  );

  console.log('Account balance:', (await deployer.getBalance()).toString());

  const FlashLoan = await ethers.getContractFactory('PairFlash');
  const _swapRouter = '';
  const _factory = '';
  const _WETH9 = '';

  const flashLoan = await FlashLoan.deploy('', '', '');

  console.log('flashLoan address:', flashLoan.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
