# 喂价 和 随机数 预言机

区块链是非常安全可靠的价值交换网络，但却无法安全防篡改地获取链下数据或将数据发送至链下系统。使用 Chainlink 预言机喂价, 通过预言机网络在链上直接获取实时金融市场价格数据

## 测试流程

### 配置私钥

在 .env 文件中放入私钥，和 infura 节点 id, 然后代码自动从中读取

```js
// .env
PRIVATE_KEY = xxxxxxxxxxxxxxxx;
INFURA_ID = yyyyyyyy;
```

### 安装依赖

```sh
yarn install
```

### 执行测试脚本

```sh
npx hardhat run scripts/01-PriceConsumerV3Deploy.js --network kovan
```

### 链下调用喂价机

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

返回数据格式如下：

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

- 完整示例看这里 [:point_right: UsingDataFeedsByEthers.js](./UsingDataFeedsByEthers.js)



### Chainlink VRF

Chainlink VRF 可验证随机函数， 是一种可证明公平且可验证的随机性来源。作为防篡改随机数生成器，为依赖不可预测结果的任何应用程序构建构建智能合约。

- 区块链游戏和 NFT
- 随机分配职责和资源（例如随机分配法官审理案件）
- 为共识机制选择具有代表性的样本

### 操作流程

1. 创建 ChainLink SubscriptionID  
登陆 [ChainLink VRF 测试网](https://vrf.chain.link/?_ga=2.225785050.1950508783.1645630272-1230768383.1643005305) , 点击 "Create Subscription" 创建 SubscriptionID , 之后可以在 "My Subscriptions" 中看到创建的 SubscriptionID
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/14-chainlink-price-feed/ChainLinkVRF.png?raw=true" /></center> 


2. 保存 SubscriptionID  
将上一步创建的 SubscriptionID 保存到 .env 文件中 
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/14-chainlink-price-feed/SubscriptionID.png?raw=true" /></center>

```sh
## .env
SubscriptionId=ddddd
```

3. 运行部署脚本部署合约

   ```sh
   npx hardhat run scripts/02-RandomNumberConsumerDeploy.js --network rinkeby
   ```

4. 获取 ChainLink 币  
登陆 [ChainLink Faucet](https://faucets.chain.link/) , 在, 获取 ChainLink 币用于后续的 RandomNumberConsume , 其中 Network 选择 rinkeby, "Testnet account address" 输入合约 owner 的账户地址
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/14-chainlink-price-feed/ChainLinkFaucet.png?raw=true" /></center>   


5. 赋权合约消费 ChainLink 币以进行随机数获取    
登陆 [ChainLink VRF 测试网](https://vrf.chain.link/?_ga=2.225785050.1950508783.1645630272-1230768383.1643005305) , 点击其中的 SubscriptionID 
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/14-chainlink-price-feed/ClickSubscriptionID.png?raw=true" /></center>  


之后在新出现的页面中, 进行 "Add Funds" 和 "Add consumer". 其中 "Add Funds" 为存入 ChainLink 币的数量, "Add consumer" 需要填入部署成功的 RandomNumberConsumer 合约地址, 即为步骤 3中打印出来的合约地址 
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/14-chainlink-price-feed/AddFundsAddCustomer.png?raw=true" /></center>   


6. 运行测试脚本  

   ```sh
   npx hardhat run  scripts/03-RandomNumberConsumer --network rinkeby
   ```

   结果可能需要等待 2 到 3 分钟，可以看到 ChainLink 返回的两个随机值

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

增加聚合方式获取。

## 参考文档

参考文档链接如下：

- https://zh.chain.link/
- https://mp.weixin.qq.com/s/h0uTWY7vzd-CMdr1pE7_YQ
- https://docs.chain.link/docs/ethereum-addresses/
- https://learnblockchain.cn/article/2237
- https://learnblockchain.cn/article/2558
- https://learnblockchain.cn/article/1056
- https://mp.weixin.qq.com/s/h0uTWY7vzd-CMdr1pE7_YQ
