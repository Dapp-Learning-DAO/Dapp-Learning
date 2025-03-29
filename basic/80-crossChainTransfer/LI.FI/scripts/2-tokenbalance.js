// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers } = require('hardhat');
require('dotenv').config();

const { getRoutes, getQuote, getStatus, getToken, ChainId, getTokenBalances, getTokens } = require('@lifi/sdk');

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(deployer.address);

  //  check  balance

  const chainId = 1;
  const walletAddress = deployer.address;

  try {
    const tokensResponse = await getTokens();

    const optimismTokens = tokensResponse.tokens[ChainId.OPT];

    console.log(optimismTokens);

    const tokenBalances = await getTokenBalances(walletAddress, optimismTokens);
    console.log(tokenBalances);
  } catch (error) {
    console.error(error);
  }

  // request quote
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
