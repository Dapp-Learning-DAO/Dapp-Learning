// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.

const moment = require('moment');

const aggregatorV3InterfaceABI = [
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "description",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint80", name: "_roundId", type: "uint80" }],
    name: "getRoundData",
    outputs: [
      { internalType: "uint80", name: "roundId", type: "uint80" },
      { internalType: "int256", name: "answer", type: "int256" },
      { internalType: "uint256", name: "startedAt", type: "uint256" },
      { internalType: "uint256", name: "updatedAt", type: "uint256" },
      { internalType: "uint80", name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "latestRoundData",
    outputs: [
      { internalType: "uint80", name: "roundId", type: "uint80" },
      { internalType: "int256", name: "answer", type: "int256" },
      { internalType: "uint256", name: "startedAt", type: "uint256" },
      { internalType: "uint256", name: "updatedAt", type: "uint256" },
      { internalType: "uint80", name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "version",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
]

async function main () {

  const { ethers, BigNumber } = require("ethers") // for nodejs only

  const provider = new ethers.providers.JsonRpcProvider("https://rpc.ankr.com/eth_sepolia")
  //eth_usd: one eth worths how many usd
  const addr = "0x694AA1769357215DE4FAC081bf1f309aDC325306"
  const priceFeed = new ethers.Contract(addr, aggregatorV3InterfaceABI, provider)

  //1. 获取最新的round
  const latestRound = await priceFeed.latestRoundData();

  //see https://docs.chain.link/data-feeds/historical-data
  const mask = BigNumber.from('0xFFFFFFFFFFFFFFFF');//right most 64bits with 1

  const latestPhaseId = latestRound.roundId.shr(64);
  const latestAggregatorRoundId = latestRound.roundId.and(mask);

  console.log('latesPhaseId ' + latestPhaseId.toString())
  console.log('latestAggregatorRoundId ' + latestAggregatorRoundId.toString())

  for (var phase = BigNumber.from(1); phase.lte(latestPhaseId); phase = phase.add(1)) {
    for (var agRound = latestAggregatorRoundId; agRound.gte(1); agRound = agRound.sub(1)) {

      const [inPhase, roundData] = await downloadRoundData(priceFeed, phase, agRound);
      console.log('inPhase', inPhase)
      if (!inPhase) {
        console.log('should start a new phase')
        break;
      }
      processRoundData(phase, agRound, roundData)
      await new Promise(r => setTimeout(r, 1000));

    }
  }
}

async function downloadRoundData (priceFeed, phase, agRound) {
  const roundId = phase.shl(64).or(agRound);
  const maxRetries = 10
  var tries = 1;
  while (tries <= maxRetries) {
    try {
      const roundData = await priceFeed.getRoundData(roundId);
      console.log('roundData', roundData)
      return [true, roundData] //still same phase, rounddata
    }
    catch (e) {
      if (e.message.includes('Transaction reverted')) {
        return [false, undefined]//out of the current phase, should start new one
      } else {
        console.log(e.message)
        tries++;//just retry, may be network connection issues
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
  throw Error('Totally failed. dont know why');


}
function processRoundData (phase, agRound, roundData) {
  //Todo:insert it into database
  //目前只是打印
  console.log(`phase:${phase}, agRound:${agRound}`);
  console.log(`answer:${ethers.utils.formatUnits(roundData.answer, 8)}`);
  console.log(`updatedAt:${moment(roundData.updatedAt * 1000).format('YYYY-MM-DD HH:mm:ss')}`);

}


main()