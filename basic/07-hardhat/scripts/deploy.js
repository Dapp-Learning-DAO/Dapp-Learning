// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying contracts with the account:', deployer.address);
  let coinBalance = await deployer.getBalance();
  console.log('Account ETH balance:', coinBalance.toString());

  const Token = await ethers.getContractFactory('SimpleToken');
  const token = await Token.deploy('SimpleToken', 'SimpleToken', 18, 10000000000);

  console.log('Token address:', token.address);

  let tokenBalance = await token.balanceOf(deployer.address);
  console.log('Account SimpleToken balance:', tokenBalance.toString());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
