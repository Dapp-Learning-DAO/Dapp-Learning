English / [中文](https://github.com/Dapp-Learning-DAO/Dapp-Learning/blob/main/basic/14-chainlink-price-feed/README-CN.md)
# Feed price and random number predictor

Blockchain is a very secure and reliable network for the exchange of value, but there is no way to secure and tamper-proof access to off-chain data or send data to off-chain systems. Use Chainlink predictor to feed prices and obtain real-time financial market price data directly on the chain through the predictor network

## Test Process

### Configure the private key
The private key put in **.env** in the format "PRIVATE_KEY= XXXX ", from which the code automatically reads.

```js
// .env
PRIVATE_KEY = xxxxxxxxxxxxxxxx;
INFURA_ID = yyyyyyyy;
```

### Install Dependencies

```sh
yarn install
```

### Executing the test script

```sh
npx hardhat run scripts/01-PriceConsumerV3Deploy.js --network kovan
```

### Off-Chain Call the price feeder

```js
// ./UsingDataFeedsByEthers.js
require('dotenv').config();

const { ethers } = require('ethers'); // for nodejs only
const provider = new ethers.providers.JsonRpcProvider(`https://kovan.infura.io/v3/${process.env.INFURA_ID}`);
const aggregatorV3InterfaceABI = require('@chainlink/contracts/abi/v0.8/AggregatorV3Interface.json');

const addr = '0x9326BFA02ADD2366b30bacB125260Af641031331';
const priceFeed = new ethers.Contract(addr, aggregatorV3InterfaceABI, provider);

async function test() {
  const roundData = await priceFeed.latestRoundData();
  console.log("Latest Round Data", roundData);
  const price = roundData[1];
  const decimal = await priceFeed.decimals();
  console.log("decimal = ", decimal);

  console.log("eth's price = ", price.toNumber() / 10 ** decimal + "USD");
}

test();

```

The returned data format is as follows:

```js
Latest Round Data [
  BigNumber { _hex: '0x0200000000000029f5', _isBigNumber: true },
  BigNumber { _hex: '0x5b755c30c0', _isBigNumber: true },
  BigNumber { _hex: '0x61c3c368', _isBigNumber: true },
  BigNumber { _hex: '0x61c3c368', _isBigNumber: true },
  BigNumber { _hex: '0x0200000000000029f5', _isBigNumber: true },
  roundId: BigNumber { _hex: '0x0200000000000029f5', _isBigNumber: true },
  answer: BigNumber { _hex: '0x5b755c30c0', _isBigNumber: true },
  startedAt: BigNumber { _hex: '0x61c3c368', _isBigNumber: true },
  updatedAt: BigNumber { _hex: '0x61c3c368', _isBigNumber: true },
  answeredInRound: BigNumber { _hex: '0x0200000000000029f5', _isBigNumber: true }
]
```

- See a for the full example [:point_right: UsingDataFeedsByEthers.js](./UsingDataFeedsByEthers.js)



### Chainlink VRF

Chainlink VRF verifiable random function is a provably fair and verifiable source of randomness. As a tamper-proof random number generator, build smart contracts for any application builds that rely on unpredictable results.

- Blockchain game and NFT
- Randomly assigned responsibilities and resources (e.g. randomly assigned judges to hear cases)
- Selection of representative samples for consensus mechanisms

### Operation Process  

1. Create ChainLink SubscriptionID  
Login [ChainLink VRF Test network](https://vrf.chain.link/?_ga=2.225785050.1950508783.1645630272-1230768383.1643005305) , Click on" Create Subscription" to Create a SubscriptionID and you can see the created SubscriptionID under "My Subscriptions"
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/14-chainlink-price-feed/ChainLinkVRF.png?raw=true" /></center> 


2. Save SubscriptionID  
Save the SubscriptionID created in the previous step to **.env** 
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/14-chainlink-price-feed/SubscriptionID.png?raw=true" /></center>

```sh
## .env
SubscriptionId=ddddd
```

3. Run the deployment script to deploy the contract

   ```sh
   npx hardhat run scripts/02-RandomNumberConsumerDeploy.js --network rinkeby
   ```

4. Access to ChainLink coins  
Login [ChainLink Faucet](https://faucets.chain.link/) , Get ChainLink coins for subsequent RandomNumberConsume, where Network selects Rinkeby and "Testnet Account Address "enters the account address of the contract owner
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/14-chainlink-price-feed/ChainLinkFaucet.png?raw=true" /></center>   


5. Empower contracts to consume ChainLink coins for random number capture   
Login [ChainLink VRF test network](https://vrf.chain.link/?_ga=2.225785050.1950508783.1645630272-1230768383.1643005305) , and Click **SubscriptionID** 
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/14-chainlink-price-feed/ClickSubscriptionID.png?raw=true" /></center>  


Then on the new page, "Add Funds" and "Add Consumer ". Where "Add Funds" is the number of ChainLink coins deposited, and "Add Consumer "needs to fill in the successfully deployed RandomNumberConsumer contract address, which is the contract address printed in Step 3 
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/14-chainlink-price-feed/AddFundsAddCustomer.png?raw=true" /></center>   


6. Run the test script  

   ```sh
   npx hardhat run  scripts/03-RandomNumberConsumer --network rinkeby
   ```

  The result may take 2 to 3 minutes, and you can see two random values returned by ChainLink

   ```sh
   ❯ npx hardhat run scripts/03-RandomNumberConsumer.js --network rinkeby
   Listen on random number call...
   Listen on random number result...
   first transaction hash: 0xb822b742836e3e028102b938ff9b52f5c31ecbf00a663b4865c50f83d141c441
   event RequestId(address,uint256)
   random0 requestID:  BigNumber { value: "68813323376039607636454911576409413136200025762802867082556497319163019860937" }
   event FulfillRandomness(uint256,uint256[])
   args[0] : BigNumber { value: "68813323376039607636454911576409413136200025762802867082556497319163019860937" }
   random0Res:  21345191237588857524675400331731955708910062406377169110385405370996391926856,49611358654743768743671276783545638722996121599596073254340228099561828202433
   ```

## todo

Will add aggregate obtain.

## Reference Documentation

Reference documents are linked below:

- https://zh.chain.link/
- https://mp.weixin.qq.com/s/h0uTWY7vzd-CMdr1pE7_YQ
- https://docs.chain.link/docs/ethereum-addresses/
- https://learnblockchain.cn/article/2237
- https://learnblockchain.cn/article/2558
- https://learnblockchain.cn/article/1056
- https://mp.weixin.qq.com/s/h0uTWY7vzd-CMdr1pE7_YQ
