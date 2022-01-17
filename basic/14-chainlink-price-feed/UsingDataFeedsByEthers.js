require('dotenv').config()

const { ethers } = require('ethers'); // for nodejs only
const provider = new ethers.providers.JsonRpcProvider(`https://kovan.infura.io/v3/${process.env.INFURA_ID}`);
const aggregatorV3InterfaceABI = require("@chainlink/contracts/abi/v0.8/AggregatorV3Interface.json")

const addr = '0x9326BFA02ADD2366b30bacB125260Af641031331';
const priceFeed = new ethers.Contract(addr, aggregatorV3InterfaceABI, provider);
priceFeed.latestRoundData().then((roundData) => {
  // Do something with roundData
  console.log('Latest Round Data', roundData);
});
