import {
  nearestUsableTick,
  NonfungiblePositionManager,
  Pool,
  Position,
} from '@uniswap/v3-sdk/';

import { ethers } from 'hardhat';
import { CurrencyAmount, Percent, Token } from '@uniswap/sdk-core';
import { abi as IUniswapV3PoolABI } from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';
import { BigNumber } from 'ethers';

const provider = ethers.provider;

// pool address for DAI/USDC 0.05%
const poolAddress = '0x6c6bc977e13df9b0de53b251522280bb72383700';

const poolContract = new ethers.Contract(
  poolAddress,
  IUniswapV3PoolABI,
  provider
);

interface Immutables {
  factory: string;
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  maxLiquidityPerTick: BigNumber;
}

interface State {
  liquidity: BigNumber;
  sqrtPriceX96: BigNumber;
  tick: number;
  observationIndex: number;
  observationCardinality: number;
  observationCardinalityNext: number;
  feeProtocol: number;
  unlocked: boolean;
}

async function getPoolImmutables() {
  const immutables: Immutables = {
    factory: await poolContract.factory(),
    token0: await poolContract.token0(),
    token1: await poolContract.token1(),
    fee: await poolContract.fee(),
    tickSpacing: await poolContract.tickSpacing(),
    maxLiquidityPerTick: await poolContract.maxLiquidityPerTick(),
  };
  return immutables;
}

async function getPoolState() {
  const slot = await poolContract.slot0();
  const PoolState: State = {
    liquidity: await poolContract.liquidity(),
    sqrtPriceX96: slot[0],
    tick: slot[1],
    observationIndex: slot[2],
    observationCardinality: slot[3],
    observationCardinalityNext: slot[4],
    feeProtocol: slot[5],
    unlocked: slot[6],
  };
  return PoolState;
}

async function liquidityExamples(sender: string, exampleType: number) {
  const immutables = await getPoolImmutables();
  const state = await getPoolState();
  const DAI = new Token(1, immutables.token0, 18, 'DAI', 'Stablecoin');
  const USDC = new Token(1, immutables.token1, 18, 'USDC', 'USD Coin');
  const block = await provider.getBlock(provider.getBlockNumber());
  const deadline = block.timestamp + 200;
  console.log('blocknumber: ', deadline);

  //create a pool
  const DAI_USDC_POOL = new Pool(
    DAI,
    USDC,
    immutables.fee,
    state.sqrtPriceX96.toString(),
    state.liquidity.toString(),
    state.tick
  );

  // create a position with the pool
  // the position is in-range, specified by the lower and upper tick
  // in this example, we will set the liquidity parameter to a small percentage of the current liquidity
  const position = new Position({
    pool: DAI_USDC_POOL,
    liquidity: state.liquidity.mul(1).toString(),
    tickLower:
      nearestUsableTick(state.tick, immutables.tickSpacing) -
      immutables.tickSpacing * 2,
    tickUpper:
      nearestUsableTick(state.tick, immutables.tickSpacing) +
      immutables.tickSpacing * 2,
  });

  // Example 0: Setting up calldata for minting a Position
  if (exampleType == 0) {
    const { calldata, value } = NonfungiblePositionManager.addCallParameters(
      position,
      {
        slippageTolerance: new Percent(50, 10_000),
        recipient: sender,
        deadline: deadline,
      }
    );
    console.log('______________');
    console.log(calldata);
    console.log(value);
  }

  // Example 1: Setting up calldata for adding liquidity to Position
  if (exampleType == 1) {
    const { calldata, value } = NonfungiblePositionManager.addCallParameters(
      position,
      {
        slippageTolerance: new Percent(50, 10_000),
        deadline: deadline,
        tokenId: 1,
      }
    );
  }

  // Example 2: Setting up calldata for removing liquidity from Position
  if (exampleType == 2) {
    const { calldata, value } = NonfungiblePositionManager.removeCallParameters(
      position,
      {
        tokenId: 1,
        liquidityPercentage: new Percent(1),
        slippageTolerance: new Percent(50, 10_000),
        deadline: deadline,
        collectOptions: {
          expectedCurrencyOwed0: CurrencyAmount.fromRawAmount(DAI, 0),
          expectedCurrencyOwed1: CurrencyAmount.fromRawAmount(USDC, 0),
          recipient: sender,
        },
      }
    );
  }
}

liquidityExamples('0x54A65DB20D7653CE509d3ee42656a8F138037d51', 0);
