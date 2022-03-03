## 基于 chainlink vrf的 nft盲盒设计
VRF 为链上安全可验证随机数, 用于安全的生成随机数, 具体可参考 [chainlink vrf官方文档](https://docs.chain.link/docs/get-a-random-number).  
本样例代码演示如何使用 ChainLink 进行 NFT 盲盒设计.  

## 操作步骤  
- 配置私钥  
在 .env 中放入的私钥，格式为 "PRIVATE_KEY=xxxx", 然后代码自动从中读取

- 获取 test Link  
每次去 ChainLink 请求 VRF 随机数时, 都需要消耗 Link 币, 所以在测试前需要申请 Link 测试币. 以 Kovan 测试网为例, 前往 [Request testnet LINK](https://faucets.chain.link/kovan?_ga=2.35440098.2104755910.1637393798-1377742816.1635817935) , 然后 "Netwrok" 选择 "Ethereum Kovan", "Testnet account address" 输入 .env 文件中 PRIVATE_KEY 对应的账户地址 
![](./images/chainlink.png)
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/15-nft-blindbox-chainlink-vrf/chainlink.png?raw=true" /></center>

- 安装依赖
```
npm install 
```

- 创建 ChainLink SubscriptionID  
登陆 [ChainLink VRF 测试网](https://vrf.chain.link/?_ga=2.225785050.1950508783.1645630272-1230768383.1643005305) , 点击 "Create Subscription" 创建 SubscriptionID , 之后可以在 "My Subscriptions" 中看到创建的 SubscriptionID
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/14-chainlink-price-feed/ChainLinkVRF.png?raw=true" /></center> 


- 保存 SubscriptionID  
将上一步创建的 SubscriptionID 保存到 .env 文件中 
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/14-chainlink-price-feed/SubscriptionID.png?raw=true" /></center>

```sh
## .env
SubscriptionId=ddddd
```

- 配置环境变量  
在 .env 文件中放入私钥, infura 节点 id 

```sh
## .env
PRIVATE_KEY=xxxxxxxxxxxxxxxx
INFURA_ID=yyyyyyyy
```

- 部署测试合约
```
npx hardhat run scripts/deploy.js --network rinkeby
```

- 获取随机数  
```
npx hardhat run scripts/random-number-vrf.js --network rinkeby
```

- 生成随机  Character  
```
npx hardhat run scripts/transaction.js --network rinkeby
``` 

## 参考链接
github 样例代码:  https://github.com/PatrickAlphaC/dungeons-and-dragons-nft  
Chainlink链下报告概览: https://learnblockchain.cn/article/2186  
如何在NFT(ERC721)中获取随机数: https://learnblockchain.cn/article/1776  
使用Chainlink预言机，十分钟开发一个DeFi项目: https://learnblockchain.cn/article/1056  
chainlink kovan faucet: https://faucets.chain.link/kovan?_ga=2.35440098.2104755910.1637393798-1377742816.1635817935  
ChainLink VRF 官网文档: https://docs.chain.link/docs/get-a-random-number/  