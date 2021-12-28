# 喂价预言机

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
yarn
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
priceFeed.latestRoundData().then((roundData) => {
  // Do something with roundData
  console.log('Latest Round Data', roundData);
});
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

## Chainlink VRF

Chainlink VRF 可验证随机函数， 是一种可证明公平且可验证的随机性来源。作为防篡改随机数生成器，为依赖不可预测结果的任何应用程序构建构建智能合约。

- 区块链游戏和 NFT
- 随机分配职责和资源（例如随机分配法官审理案件）
- 为共识机制选择具有代表性的样本

### 操作流程

1. 在 kovan 测试网络环境下，将 Link token (测试代币)添加到小狐狸钱包，初始会自动发放 10 个测试代币，token address：
   `0xa36085F69e2889c224210F603D836748e7dC0088`
2. 运行部署脚本部署合约

   ```sh
   npx hardhat run scripts/02-RandomNumberConsumerDeploy.js --network kovan
   ```

3. 使用小狐狸向合约转账 Link token 作为调用随机函数的费用。在 kovan 网络下，合约每次调用随机函数花费 0.1Link，转账适量即可。
4. 将打印出来的合约部署地址，添加到 .env 文件中，运行测试脚本

   ```js
   // .env
   RandomNumberConsumer_ADDRESS=xxxx; // <--- you need fill this
   ```

   运行测试脚本

   ```sh
   npx hardhat test ./test/RandomNumberConsumer.test.js --network kovan
   ```

   结果可能需要等待 2 到 3 分钟，可以看到两次获取的随机数值不同

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
