require("@nomicfoundation/hardhat-toolbox");
const { ethers } = require('hardhat');
require('dotenv').config();
const { readDeployment, saveDeployment } = require('./utils');

async function main () {
  const provider = new ethers.WebSocketProvider(`wss://sepolia.infura.io/ws/v3/${process.env.INFURA_ID}`);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const { abi: RandomNumberVRFABI } = require('../artifacts/contracts/RandomNumberVRF.sol/RandomNumberVRF.json');

  const deployment = readDeployment();
  const addr = deployment.rnvAddress;

  if (!addr) {
    console.log('Please deploy contract RandomNumberVRF first');
    return;
  }

  let rnvVRF, user1;

  rnvVRF = new ethers.Contract(addr, RandomNumberVRFABI, wallet);
  [user1] = await ethers.getSigners();

  console.error('signer is: ', user1.address);

  let random0ID;

  console.log(`Listen on random number call...`);
  rnvVRF.on("RequestSent", (_, ruquestId) => {
    console.log('Event RequestId(address,uint256)');
    console.log("requestID is :", ruquestId);
    random0ID = ruquestId;
  });

  let random0Res = false;
  console.log(`Listen on random number result...`);
  rnvVRF.on("RequestFulfilled", (requestID) => {
    console.log('Event RequestFulfilled(uint256,uint256[])');
    random0Res = true; //  verify whether random generate or not.
    console.log('RandomNumber generated, calling RequestStatus to get randomWords[]');

  });

  const tx0 = await rnvVRF.requestRandomWords(false);
  // for sometimes , it will be fail if not specify the gasLimit
  // const tx0 = await rnvVRF.connect(user1).requestNewRandomCharacter("DND",{
  //   
  //   gasLimit: 200000
  // });
  console.log('first transaction hash:', tx0.hash);

  // wait for the result event
  for (let i = 0; i < 500; i++) {
    if (random0Res) {
      saveDeployment({
        requestID: random0ID.toString(),
      });
      break;
    }
    console.log(`${i}: Please be patient, it will take sometime to get the result`)
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  }

  try {
    console.log('random0ID', random0ID);
    if (!random0ID) {
      console.log('random0ID is null');
      return;
    }
    const getStat = await rnvVRF.getRequestStatus(random0ID);
    saveDeployment({
      randomNum: getStat[0]
    })
  } catch (error) {
    console.log('RequestStatus error ');
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
