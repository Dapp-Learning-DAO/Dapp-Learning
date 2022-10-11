const hre = require('hardhat');
require('@nomiclabs/hardhat-web3');
const { BigNumber } = require('ethers');
require('dotenv').config();
const { readDeployment } = require('./utils');

async function main() {
  const provider = new ethers.providers.WebSocketProvider(`wss://goerli.infura.io/ws/v3/${process.env.INFURA_ID}`);
  const { abi: RandomNumberConsumerABI } = require('../artifacts/contracts/RandomNumberConsumer.sol/RandomNumberConsumer.json');

  const deployment = readDeployment();
  const addr = deployment.RandomNumberConsumerAddress;

  if (!addr) {
    console.log('Please deploy contract RandomNumberConsumer first');
    return;
  }

  let randomNumberConsumer, user1, iface;

  randomNumberConsumer = new ethers.Contract(addr, RandomNumberConsumerABI, provider);
  iface = new ethers.utils.Interface(RandomNumberConsumerABI);
  [user1] = await ethers.getSigners();

  let random0ID, random0Res;

    // 监听randomNumberConsumer 的请求随机数事件
    const filterCall = {
      address: addr,
      topics: [ethers.utils.id('RequestId(address,uint256)')],
    };
    // 监听chainlink VRF Coordinator 的随机数回写事件
    const filterRes = {
      address: addr,
      topics: [ethers.utils.id('FulfillRandomness(uint256,uint256[])')],
    };

    console.log(`Listen on random number call...`);
    provider.on(filterCall, (log, event) => {
      console.log('event RequestId(address,uint256)');
      const { args } = iface.parseLog(log);
      if (args[0] === user1.address) {
        random0ID = args[1];
        console.log('random0 requestID: ', random0ID);
      } else {
        console.log('msg.sender not matched.');
      }
    });

    console.log(`Listen on random number result...`);
    provider.on(filterRes, (log, event) => {
      console.log('event FulfillRandomness(uint256,uint256[])');
      const { args } = iface.parseLog(log);
      console.log("args[0] :",args[0]);
      if (BigNumber.from(args[0]).eq(random0ID)) {
        random0Res = args[1];
        console.log('random0Res: ', random0Res.toString());
      } else {
        console.log('requestID not matched.');
      }
    });

    const tx0 = await randomNumberConsumer.connect(user1).requestRandomWords({
      // for sometimes , it will be fail if not specify the gasLimit
      gasLimit: 200000
    });
    console.log('first transaction hash:', tx0.hash);

    // wait for the result event
    for (let i = 0; i < 500; i++) {
      if (random0Res) break;
      console.log(`${i}: Please be patient, it will take a little long time to get the result`)
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 1000);
      });
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
