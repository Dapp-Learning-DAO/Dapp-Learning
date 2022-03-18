require('dotenv').config();

const { ethers } = require('ethers'); // for nodejs only
const provider = new ethers.providers.JsonRpcProvider(`https://kovan.infura.io/v3/${process.env.INFURA_ID}`);
const aggregatorV3InterfaceABI = require('@chainlink/contracts/abi/v0.8/AggregatorV3Interface.json');

const addr = '0x9326BFA02ADD2366b30bacB125260Af641031331';
const priceFeed = new ethers.Contract(addr, aggregatorV3InterfaceABI, provider);

async function test() {
  const roundData = await priceFeed.latestRoundData();
  console.log('Latest Round Data', roundData);
  const price = roundData[1];
  const decimal = await priceFeed.decimals();
  // 精度是8位
  console.log('decimal = ', decimal);

  console.log("eth's price = ", price.toNumber() / 10 ** decimal + 'USD');
}

test();
