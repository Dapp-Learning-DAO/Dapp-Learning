中文 / [English](https://github.com/Dapp-Learning-DAO/Dapp-Learning/blob/main/basic/15-nft-blindbox-chainlink-vrf/README.md)
## 基于 chainlink vrf的 nft盲盒设计
VRF 为链上安全可验证随机数, 用于安全的生成随机数, 具体可参考 [chainlink vrf官方文档](https://docs.chain.link/docs/get-a-random-number).  
本样例代码演示如何使用 ChainLink 进行 NFT 盲盒设计.  

## 操作步骤  
- 配置私钥  
在 .env 中放入的私钥，格式为 "PRIVATE_KEY=xxxx", 然后代码自动从中读取

- 获取 test Link  
每次去 ChainLink 请求 VRF 随机数时, 都需要消耗 Link 币, 所以在测试前需要申请 Link 测试币. 以 Sepolia 测试网为例, 前往 [Request testnet LINK](https://faucets.chain.link/sepolia) , 然后 "Netwrok" 选择 "Ethereum Sepolia", "Connect wallet" 链接小狐狸,点击"Send Request" 获取25 Test Link
<center><img src="./imgs/Ethereum-Sepolia.png?raw=true" /></center>
<center><img src="./imgs/GetLink.png?raw=true" /></center>

- 安装依赖
```
npm install 

Node版本：v20.11.0
```

### 生成随机数

- 创建 ChainLink SubscriptionID  
登陆 [ChainLink VRF 测试网](https://vrf.chain.link/?_ga=2.225785050.1950508783.1645630272-1230768383.1643005305) , 点击 "Create Subscription" 创建 SubscriptionID , 之后可以在 "My Subscriptions" 中看到创建的 SubscriptionID
<center><img src="./imgs/CreateSubscription.png?raw=true" /></center>  


- 保存 SubscriptionID  
将上一步创建的 SubscriptionID 保存到 .env 文件中 


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

- 编译合约
```
npx hardhat compile

```


- 部署测试合约
```
npx hardhat run scripts/deploy.js --network sepolia
```
 对于不同测试网络(非sepolia)，请参考[Chain Link: supported-networks](https://docs.chain.link/vrf/v2/subscription/supported-networks)，在./contracts/RandomNumberVRF.sol 中修改vrfCoordinator，link，keyHash的值

- 添加Consumer
```
点击进入已经创建好的Subscription，点击“Add Consumer"将上一步骤 deploy 返回合约地址填入, 填入完毕后需要稍等 10s, 此时再刷新页面，可以看到出现配置的consumer地址

```
<center><img src="./imgs/SubscriptionDetail.png?raw=true" /></center> 
<center><img src="./imgs/AddConsumer.png?raw=true" /></center> 

- 获取随机数  
```
npx hardhat run scripts/random-number-vrf.js --network sepolia
```

requestRandomWords请求发送后，ChainLink回调fulfillRandomWords生成随机数需要一定时间，防止Main 程序运行结束，因此需要设置循环检测是否生成了 RequestFulfilled 事件。

- 随机数获重新获取   
```
npx hardhat run scripts/transaction.js --network sepolia
``` 
RandomWords 随机数生成之后，通过合约传入。./scripts/deployment.json 中保存的 requestID,再次获取之前获取的随机数。可以自定义随机数使用场景，本例只作为调用参考。

随机数生成之后，可以在Ehterscan中查看
<center><img src="./imgs/Consumer.png?raw=true" /></center> 
<center><img src="./imgs/Events.png?raw=true" /></center> 
<center><img src="./imgs/RequestAndResult.png?raw=true" /></center> 

### 生成nft

- 部署nft721 合约
```sh
  npx hardhat run scripts/deployDungeonsAndDragonsCharacter.js --netwrok sepolia
```

- mint nft
```sh
  npx hardhat run scripts/blindCharacter.js --netwrok sepolia
```


## 参考链接
github 样例代码:  https://github.com/PatrickAlphaC/dungeons-and-dragons-nft  
Chainlink链下报告概览: https://learnblockchain.cn/article/2186  
如何在NFT(ERC721)中获取随机数: https://learnblockchain.cn/article/1776  
使用Chainlink预言机，十分钟开发一个DeFi项目: https://learnblockchain.cn/article/1056  
chainlink goerli faucet: https://faucets.chain.link/goerli?_ga=2.35440098.2104755910.1637393798-1377742816.1635817935  
ChainLink VRF 官网文档: https://docs.chain.link/docs/get-a-random-number/  