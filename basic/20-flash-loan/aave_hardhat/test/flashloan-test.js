const { expect } = require('chai');
const { hasRegexChars } = require('prettier');
const { ethers } = require("hardhat");
require('dotenv').config();

const provider = new ethers.providers.WebSocketProvider(`wss://kovan.infura.io/ws/v3/${process.env.INFURA_ID}`);
// const web3Provider = new ethers.providers.InfuraProvider('rinkeby', VITE_INFURA_ID);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Get instance of our crowdFund contract
// const instance = new ethers.Contract(VITE_CONTRACT_ADDRESS, crowdFundABI.abi, wallet);
// const { abi: RandomNumberConsumerABI } = require('../artifacts/contracts/RandomNumberConsumer.sol/RandomNumberConsumer.json');
const { abi: FlashloanABI } = require('../artifacts/contracts/Flashloan.sol/Flashloan.json');

// console.log(FlashloanABI);

const addr = process.env.FLASHLOAN_ADDRESS; // <--- you need fill it in .env file
if (!addr) {
  console.log('Please set the contract address in .env file.');
  return;
}

let Flashloan, user1, iface;

describe('RandomNumberConsumer', function () {
  beforeEach(async function () {
    // Flashloan = new ethers.Contract(addr, FlashloanABI, provider);
    // iface = new ethers.utils.Interface(Flashloan);
    // Flashloan = await ethers.getContractFactory("Flashloan");
    // iface = await Flashloan.deploy(addr);
    iface = new ethers.Contract(addr, FlashloanABI, wallet);
    [user1] = await ethers.getSigners();
  });

  // it('Should get different random number by getRandomNumber() twice.', async function () {
  //   let random0ID, random1ID, random0Res, random1Res;

  //   // 监听randomNumberConsumer 的请求随机数事件
  //   const filterCall = {
  //     address: addr,
  //     topics: [ethers.utils.id('RequestId(address,bytes32)')],
  //   };
  //   // 监听chainlink VRF Coordinator 的随机数回写事件
  //   const filterRes = {
  //     address: addr,
  //     topics: [ethers.utils.id('FulfillRandomness(bytes32,uint256)')],
  //   };

  //   console.log(`Listen on random number call...`);
  //   provider.on(filterCall, (log, event) => {
  //     console.log('event RequestId(address,bytes32)');
  //     const { args } = iface.parseLog(log);
  //     if (args[0] === user1.address) {
  //       if (!random0ID) {
  //         random0ID = args[1];
  //         console.log('random0 requestID: ', random0ID);
  //       } else if (!random1ID) {
  //         random1ID = args[1];
  //         console.log('random1 requestID: ', random1ID);
  //       }
  //     } else {
  //       console.log('msg.sender not matched.');
  //     }
  //   });

  //   console.log(`Listen on random number result...`);
  //   provider.on(filterRes, (log, event) => {
  //     console.log('event FulfillRandomness(bytes32,uint256)');
  //     const { args } = iface.parseLog(log);
  //     if (args[0] === random0ID) {
  //       random0Res = args[1];
  //       console.log('random0Res: ', random0Res.toString());
  //     } else if (args[0] === random1ID) {
  //       random1Res = args[1];
  //       console.log('random1Res: ', random1Res.toString());
  //     } else {
  //       console.log('requestID not matched.');
  //     }
  //   });

  //   const tx0 = await randomNumberConsumer.connect(user1).getRandomNumber();
  //   console.log('first transaction hash:', tx0.hash);
  //   const tx1 = await randomNumberConsumer.connect(user1).getRandomNumber();
  //   console.log('second transaction hash:', tx1.hash);

  //   // wait for the result event
  //   for (let i = 0; i < 500; i++) {
  //     if (random0Res && random1Res) break;
  //     await new Promise((resolve) => {
  //       setTimeout(() => {
  //         resolve();
  //       }, 1000);
  //     });
  //   }

  //   // Now we've got all random number results
  //   expect(random0Res.toString() !== random1Res.toString()).to.equal(true);
  // });

  it('Should get different random number by getRandomNumber() twice.', async function () {

    console.log(provider);

    // let res = await provider.getBalance('0x2fE023204958fc4c44f639CE72D3bdC0f025Adfe');
    console.log(ethers.utils);
    let res = await iface.flashloan('0x2fE023204958fc4c44f639CE72D3bdC0f025Adfe', { gasPrice: 1000000000, gasLimit: 25000 });
    let re = await res.wait()
    console.log(res, re);

  })

});
