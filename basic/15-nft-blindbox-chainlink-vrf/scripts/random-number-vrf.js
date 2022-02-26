const hre = require('hardhat');
require('@nomiclabs/hardhat-web3');
const { BigNumber } = require('ethers');
require('dotenv').config();
const { readDeployment,saveDeployment } = require('./utils');

async function main() {
  const provider = new ethers.providers.WebSocketProvider(`wss://rinkeby.infura.io/ws/v3/${process.env.INFURA_ID}`);
  const { abi: DungeonsAndDragonsCharacterABI } = require('../artifacts/contracts/DungeonsAndDragonsCharacter.sol/DungeonsAndDragonsCharacter.json');

  const deployment = readDeployment();
  const addr = deployment.dndAddress;

  if (!addr) {
    console.log('Please deploy contract DungeonsAndDragonsCharacter first');
    return;
  }

  let dndCharacter, user1;

  dndCharacter = new ethers.Contract(addr, DungeonsAndDragonsCharacterABI, provider);
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
      topics: [
        ethers.utils.id('FulfillRandomness(uint256,uint256[])')
      ],
    };

    console.log(`Listen on random number call...`);
    dndCharacter.on(filterCall, (sender, requestID) => {
      console.log('event RequestId(address,uint256)');
      console.log(`Sender: ${sender}  requestID: ${requestID}`)
      random0ID = requestID;
    });

    console.log(`Listen on random number result...`);
    dndCharacter.on(filterRes, (requestID, randomNumbers) => {
      console.log('event FulfillRandomness(uint256,uint256[])');
      if (BigNumber.from(requestID).eq(random0ID)) {
        random0Res = randomNumbers[0];
        console.log('random0Res: ', random0Res.toString());
      } else {
        console.log('requestID not matched.');
      }
    });

    const tx0 = await dndCharacter.connect(user1).requestNewRandomCharacter("DND",{
      // for sometimes , it will be fail if not specify the gasLimit
      gasLimit: 200000
    });
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
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
