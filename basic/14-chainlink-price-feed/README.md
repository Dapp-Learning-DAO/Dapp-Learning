# 喂价预言机

区块链是非常安全可靠的价值交换网络，但却无法安全防篡改地获取链下数据或将数据发送至链下系统。使用 Chainlink 预言机喂价, 通过预言机网络在链上直接获取实时金融市场价格数据

## 测试流程

### 配置私钥

在 .env 中放入的私钥，和 infura 节点 id, 然后代码自动从中读取

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
npx hardhat run scripts/deploy.js --network kovan
```

## 链下调用喂价机

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

## todo

增加聚合方式获取。

## 参考文档

参考文档链接如下：  
https://zh.chain.link/  
https://mp.weixin.qq.com/s/h0uTWY7vzd-CMdr1pE7_YQ  
https://docs.chain.link/docs/ethereum-addresses/  
https://learnblockchain.cn/article/2237  
https://learnblockchain.cn/article/2558  
https://learnblockchain.cn/article/1056
https://mp.weixin.qq.com/s/h0uTWY7vzd-CMdr1pE7_YQ
