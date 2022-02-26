// npx hardhat test --network mainnet
const { expect } = require('chai');
const { ethers } = require('hardhat');
const { createWatcher } = require('@makerdao/multicall');
const { default: IndexedFinanceMultiCall } = require('@indexed-finance/multicall');

const ERC20abi = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

const PairAbi = [
  {
    constant: true,
    inputs: [],
    name: 'getReserves',
    outputs: [
      { internalType: 'uint112', name: '_reserve0', type: 'uint112' },
      { internalType: 'uint112', name: '_reserve1', type: 'uint112' },
      { internalType: 'uint32', name: '_blockTimestampLast', type: 'uint32' },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
];

// mainnet address
const tokens = [
  '0x6b175474e89094c44da98b954eedeac495271d0f', // dai
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // weth
  '0x0000000000000000000000000000000000000000', // eth
];

describe('Multicall contract', function () {
  let user1;
  let muticall;
  let dai, weth;

  beforeEach(async function () {
    [user1] = await ethers.getSigners();
    muticall = new IndexedFinanceMultiCall(ethers.provider);
    dai = new ethers.Contract(tokens[0], ERC20abi, ethers.provider);
    weth = new ethers.Contract(tokens[1], ERC20abi, ethers.provider);
  });

  it('General Usage', async function () {
    const account = '0x0000000000000000000000000000000000000000';

    const inputs = [];
    for (let _token of [tokens[0], tokens[1]]) {
      inputs.push({ target: _token, function: 'balanceOf', args: [account] });
    }
    const [blockNumber, balances] = await muticall.multiCall(ERC20abi, inputs);

    const daiBalance = balances[0];
    const wethBalance = balances[1];

    expect(await dai.balanceOf(account)).to.eq(daiBalance);
    expect(await weth.balanceOf(account)).to.eq(wethBalance);
  });

  it('Querying Token Balances', async function () {
    const account = '0x0000000000000000000000000000000000000000';
    const [blockNumber, balances] = await muticall.getBalances(tokens, account);

    const daiBalance = balances['0x6b175474e89094c44da98b954eedeac495271d0f'];
    const wethBalance = balances['0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'];
    const ethBalance = balances['0x0000000000000000000000000000000000000000'];

    expect(await dai.balanceOf(account)).to.eq(daiBalance);
    expect(await weth.balanceOf(account)).to.eq(wethBalance);
    expect(await ethers.provider.getBalance(account)).to.eq(ethBalance);
  });

  it('Querying Token Balances and Allowances', async function () {
    const owner = '0x0000000000000000000000000000000000000000';
    const spender = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'; // uniswap v2 router
    const [blockNumber, balancesAndAllowances] = await muticall.getBalancesAndAllowances([tokens[0], tokens[1]], owner, spender);

    const { allowance: daiAllowance } = balancesAndAllowances['0x6b175474e89094c44da98b954eedeac495271d0f'];
    const { allowance: wethAllowance } = balancesAndAllowances['0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'];

    expect(await dai.allowance(owner, spender)).to.eq(daiAllowance);
    expect(await weth.allowance(owner, spender)).to.eq(wethAllowance);
  });

  it('Querying Uniswap Pair Reserves', async function () {
    const pairs = [
      '0xa478c2975ab1ea89e8196811f51a7b7ade33eb11', // dai-weth
      '0x004375dff511095cc5a197a54140a24efef3a416', // wbtc-usdc
    ];
    const [blockNumber, reserves] = await muticall.getReserves(pairs);

    const { reserve0: daiWethR0, reserve1: daiWethR1, blockTimestampLast: daiWethTimestamp } = reserves[pairs[0]];
    const pair0 = new ethers.Contract(pairs[0], PairAbi, ethers.provider);
    const res0 = await pair0.getReserves();
    expect(res0[0]).to.eq(daiWethR0);
    expect(res0[1]).to.eq(daiWethR1);

    const { reserve0: wbtcUsdcR0, reserve1: wbtcUsdcR1, blockTimestampLast: wbtcUsdcTimestamp } = reserves[pairs[1]];
    const pair1 = new ethers.Contract(pairs[1], PairAbi, ethers.provider);
    const res1 = await pair1.getReserves();
    expect(res1[0]).to.eq(wbtcUsdcR0);
    expect(res1[1]).to.eq(wbtcUsdcR1);
  });
});
