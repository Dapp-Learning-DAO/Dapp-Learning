const { ethers } = require('ethers');
const { getBalances } = require('@indexed-finance/multicall');
require('dotenv').config();

const provider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${process.env.INFURA_ID}`);

// Check the balance of the null address for dai and weth
async function main() {
  const tokens = [
    '0x6b175474e89094c44da98b954eedeac495271d0f', // dai
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // weth
    '0x0000000000000000000000000000000000000000', // eth
  ];
  const account = '0x89f2ab029dcd11bd5a00ed6a77ccbe46315212e8';

  console.log(`Checking balances for ${account}`);
  const [blockNumber, balances] = await getBalances(provider, tokens, account).catch((err) => {});

  console.log(`BlockNumber: ${blockNumber}`);
  console.log(`Balances: ${JSON.stringify(balances)}`);
  const daiBalance = balances['0x6b175474e89094c44da98b954eedeac495271d0f'];
  const wethBalance = balances['0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'];
  const ethBalance = balances['0x0000000000000000000000000000000000000000'];

  console.log(`
  BalanceOf zero address at blockNumber ${blockNumber}
  daiBalance:  ${daiBalance.toString()}
  wethBalance: ${wethBalance.toString()}
  ethBalance:  ${ethBalance.toString()}
  `);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
