import {ethers} from "hardhat";
import {Pool} from "@uniswap/v3-sdk";
import {Token} from "@uniswap/sdk-core";
import {abi as IUniswapV3PoolABI} from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json";
import {BigNumber} from "ethers";


// usdc/eth
const poolAddress = "0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8";


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


async function main() {

    const accounts = await ethers.getSigners();
    const poolContract = new ethers.Contract(
        poolAddress,
        IUniswapV3PoolABI,
        accounts[0]
    );

    const immutables = {
        factory: await poolContract.factory(),
        token0: await poolContract.token0(),
        token1: await poolContract.token1(),
        fee: await poolContract.fee(),
        tickSpacing: await poolContract.tickSpacing(),
        maxLiquidityPerTick: await poolContract.maxLiquidityPerTick(),
    };

    const slot = await poolContract.slot0();

    const poolState = {
        liquidity: await poolContract.liquidity(),
        sqrtPriceX96: slot[0],
        tick: slot[1],
        observationIndex: slot[2],
        observationCardinality: slot[3],
        observationCardinalityNext: slot[4],
        feeProtocol: slot[5],
        unlocked: slot[6],
    };

    console.log(poolState);
    const TokenA = new Token(1, immutables.token0, 6, "USDC", "USD Coin");
    const TokenB = new Token(1, immutables.token1, 18, "WETH", "Wrapped Ether");

    const poolExample = new Pool(
        TokenA,
        TokenB,
        immutables.fee,
        poolState.sqrtPriceX96.toString(),
        poolState.liquidity.toString(),
        poolState.tick
    );
    console.log(poolExample);
}

main();