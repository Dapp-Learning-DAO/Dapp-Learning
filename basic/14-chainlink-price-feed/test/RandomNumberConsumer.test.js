const { expect } = require('chai');
require('dotenv').config();

const provider = new ethers.providers.WebSocketProvider(`wss://kovan.infura.io/ws/v3/${process.env.INFURA_ID}`);
const { abi: RandomNumberConsumerABI } = require('../artifacts/contracts/RandomNumberConsumer.sol/RandomNumberConsumer.json');

const addr = process.env.RandomNumberConsumer_ADDRESS; // <--- you need fill it in .env file
if (!addr) {
  console.log('Please set the contract address in .env file.');
  return;
}

let randomNumberConsumer, user1, iface;

describe('RandomNumberConsumer', function () {
  beforeEach(async function () {
    randomNumberConsumer = new ethers.Contract(addr, RandomNumberConsumerABI, provider);
    iface = new ethers.utils.Interface(RandomNumberConsumerABI);
    [user1] = await ethers.getSigners();
  });

  it('Should get different random number by getRandomNumber() twice.', async function () {
    let random0ID, random1ID, random0Res, random1Res;

    // 监听randomNumberConsumer 的请求随机数事件
    const filterCall = {
      address: addr,
      topics: [ethers.utils.id('RequestId(address,bytes32)')],
    };
    // 监听chainlink VRF Coordinator 的随机数回写事件
    const filterRes = {
      address: addr,
      topics: [ethers.utils.id('FulfillRandomness(bytes32,uint256)')],
    };

    console.log(`Listen on random number call...`);
    provider.on(filterCall, (log, event) => {
      console.log('event RequestId(address,bytes32)');
      const { args } = iface.parseLog(log);
      if (args[0] === user1.address) {
        if (!random0ID) {
          random0ID = args[1];
          console.log('random0 requestID: ', random0ID);
        } else if (!random1ID) {
          random1ID = args[1];
          console.log('random1 requestID: ', random1ID);
        }
      } else {
        console.log('msg.sender not matched.');
      }
    });

    console.log(`Listen on random number result...`);
    provider.on(filterRes, (log, event) => {
      console.log('event FulfillRandomness(bytes32,uint256)');
      const { args } = iface.parseLog(log);
      if (args[0] === random0ID) {
        random0Res = args[1];
        console.log('random0Res: ', random0Res.toString());
      } else if (args[0] === random1ID) {
        random1Res = args[1];
        console.log('random1Res: ', random1Res.toString());
      } else {
        console.log('requestID not matched.');
      }
    });

    const tx0 = await randomNumberConsumer.connect(user1).getRandomNumber();
    console.log('first transaction hash:', tx0.hash);
    const tx1 = await randomNumberConsumer.connect(user1).getRandomNumber();
    console.log('second transaction hash:', tx1.hash);

    // wait for the result event
    for (let i = 0; i < 500; i++) {
      if (random0Res && random1Res) break;
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 1000);
      });
    }

    // Now we've got all random number results
    expect(random0Res.toString() !== random1Res.toString()).to.equal(true);
  });
});
