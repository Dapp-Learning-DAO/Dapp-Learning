const Pool   = require("@uniswap/v3-sdk");
const Address = require("cluster");
const hre = require("hardhat");
const ethers = require( "ethers");

 const provider = new ethers.providers.JsonRpcProvider("https://mainnet.infura.io/v3/0aae8358bfe04803b8e75bb4755eaf07");

const poolAddress = "0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8";

const poolImmutablesAbi = [
	"function factory() external view returns (address)",
	"function token0() external view returns (address)",
	"function token1() external view returns (address)",
	"function fee() external view returns (uint24)",
	"function tickSpacing() external view returns (int24)",
	"function maxLiquidityPerTick() external view returns (uint128)",
];

const poolContract = new ethers.Contract(
	poolAddress,
	poolImmutablesAbi,
	provider
);

// let Immutables {
// 	factory: Address;
// 	token0: Address;
// 	token1: Address;
// 	fee: number;
// 	tickSpacing: number;
// 	maxLiquidityPerTick: number;
// }

async function getPoolImmutables() {
	const PoolImmutables = {
		factory: await poolContract.factory(),
		token0: await poolContract.token0(),
		token1: await poolContract.token1(),
		fee: await poolContract.fee(),
		tickSpacing: await poolContract.tickSpacing(),
		maxLiquidityPerTick: await poolContract.maxLiquidityPerTick(),
	};
	return PoolImmutables;
}

getPoolImmutables().then((result) => {
	console.log("pool info")
	console.log(result);
	console.log(result.maxLiquidityPerTick.toString());
});