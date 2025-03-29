const { ethers } = require('hardhat');
require('dotenv').config();

const provider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${process.env.INFURA_ID}`);

// Check the balance of the null address for dai and weth
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying contracts with the account:', deployer.address);

  const tokens = [
    '0x6b175474e89094c44da98b954eedeac495271d0f', // dai
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // weth
  ];
  const account = '0x89F2ab029DcD11bD5A00Ed6A77ccBE46315212e8';

  console.log(`Checking balances for ${account}`);

  const Multicall = await ethers.getContractFactory('Multicall');

  const erc20Abi = [
    {
      constant: true,
      inputs: [{ name: '_owner', type: 'address' }],
      name: 'balanceOf',
      outputs: [{ name: 'balance', type: 'uint256' }],
      type: 'function',
    },
  ];

  const balanceCalls = tokens.map((tokenAddress) => ({
    target: tokenAddress,
    callData: new ethers.utils.Interface(erc20Abi).encodeFunctionData('balanceOf', [account]),
  }));

  // console.log(`balanceCalls: ${JSON.stringify(balanceCalls)}`);

  const multicall = await Multicall.attach('0x5ba1e12693dc8f9c48aad8770482f4739beed696');

  // let balanceFunciton = '0x70a08231' + '000000000000000000000000' + account.substring(2);

  // const result = await multicall.callStatic.aggregate([{ target: tokens[1], callData: balanceFunciton }]);
  const result = await multicall.callStatic.aggregate(balanceCalls);

  console.log(`result: ${JSON.stringify(result[1])}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
