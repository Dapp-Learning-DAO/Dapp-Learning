const { expect } = require('chai');
require('dotenv').config();

// const { ethers } = require('ethers'); // for nodejs only
const provider = new ethers.providers.JsonRpcProvider(`https://kovan.infura.io/v3/${process.env.INFURA_ID}`);
const { abi: RandomNumberConsumerABI } = require('../artifacts/contracts/RandomNumberConsumer.sol/RandomNumberConsumer.json');

const addr = process.env.RandomNumberConsumer_ADDRESS; // <--- you need fill this
if (!addr) {
  console.log('Please set the contract address in .env file.');
  return;
}
let randomNumberConsumer, user1;

describe('RandomNumberConsumer', function () {
  beforeEach(async function () {
    randomNumberConsumer = new ethers.Contract(addr, RandomNumberConsumerABI, provider);
    [user1] = await ethers.getSigners();
  });

  it('Should change the storage variable randomResult after call getRandomNumber().', async function () {
    // first getRandomNumber
    console.log(`first getRandomNumber`);
    const tx0 = await randomNumberConsumer.connect(user1).getRandomNumber();
    await tx0.wait();
    const random0 = await randomNumberConsumer.randomResult();
    console.log(`result`, random0.toString());

    // Don't know why, but no sleep will get the same random number
    await new Promise(resolve => {
      console.log('need sleep 60s...')
      setTimeout(() => {
        resolve()
      }, 60*1000);
    })

    // second getRandomNumber
    console.log(`second getRandomNumber`);
    const tx1 = await randomNumberConsumer.connect(user1).getRandomNumber();
    await tx1.wait();
    const random1 = await randomNumberConsumer.randomResult();
    console.log(`result`, random1.toString());

    expect(random0.toString() !== random1.toString()).to.equal(true);
  });
});
