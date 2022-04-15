# zksync 介绍   
zkSync是一种无需信任的协议，用于在以太坊上进行可扩展的低成本支付，由 zkRollup 技术提供支持。它使用零知识证明和链上数据可用性来确保用户的资金安全，就像这些资产从未离开过主网一样。 

## zkSync2.0
zkSync发布了2.0测试网，开始支持智能合约。这里有一个简单的dApp例子，大家可以进行体验。
https://github.com/Dapp-Learning-DAO/Dapp-Learning/tree/main/basic/30-zksync-layer2/zkSync2.0-examples

## ZK-Rollup
zkRollup在链下利用Merkle tree存储账户状态，由Operator收集用户的交易，交易收集完成后Operator会执行每个交易（校验余额，校验nonce，校验签名，执行状态转换），当交易执行完成后会产生一个新的Merkle tree Root，为了证明链下状态转移是正确的，Operator会在交易执行完成后生成一个零知识证明的proof。
Operator执行交易后本地的merkle tree root会由prev state root转换成post state root。  
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/30-zksync-layer2/zkrollup.png?raw=true" /></center>

## 基本架构

zkSync 的基本组成有：

- zkSync smart contract：部署在以太坊网络上的 Solidity 智能合约，用于管理用户 balances 并验证 zkSync network 操作的正确性。

- Prover application：为 a worker application，用于创建 a proof for an executed block。  
  Prover application 会从 Server application 中获取有效的 jobs，当有新的区块时，Server application 将提供 a witness（input data to generate a proof），然后 Prover application 开始工作。当 proof 生成后，Prover application 会将该 proof 报告给 Server application，Server application 再将该 proof 发布给 zkSync 智能合约。

- Prover application 可看成是 on-demand worker，当 Server application 负载很高时，允许有多个 Prover applications，当没有交易输入时则没有 Prover application。
生成 proof 是非常消耗资源的工作，因此，运行 Prover application 的机器应具有现代 CPU 和大量的 RAM。

- Server application：运行 zkSync 网络的节点。
Server application 的职能主要有：  
1）监测智能合约上的 onchain operations（如存款）  
2）接收交易  
3）生成 zkSync 上的区块  
4）为 executed blocks 发起 proof 生成申请  
5）将数据发布到 zkSync smart contract    

## 操作流程  
### 手工存入 ETH 到 zksync   
- 登陆 [zksync 测试网](https://wallet.zksync.io/?network=rinkeby)  并链接 metaMask 钱包  

- 选择 "Add Funds"   

- 输入存入金额, 然后点击 "Add Funds"  

- 存入成功  

- 点击 "OK" 查看 rinkeby zkSync 上的余额  

- 在 [zkscan](https://rinkeby.zkscan.io/) 上查看交易信息  

### 使用 JS 在 zkSync 上发送交易  
- 安装依赖 
```shell
yarn
``` 

- 配置环境变量  
```shell
cp .env.example .env

## 在 .env 文件配置 PRIVATE_KEY , INFURA_API_KEY, ZKSYNC_PROVIDER_URL, TARGET_TEST_NET
```

- 执行测试脚本  
```shell
npx hardhat run scripts/main.js
```

## 参考链接  
github: https://github.com/matter-labs/zksync  
zkSync 基本原理: https://zhuanlan.zhihu.com/p/363029544  
zkSync 源码分析: https://www.jianshu.com/u/ac3aed07477e  
L2 - zkSync源代码导读: https://zhuanlan.zhihu.com/p/343212894   
Layer 2 扩容方案及用例综述: https://mp.weixin.qq.com/s/TxZ5W9rx6OF8qB4ZU9XrKA   
各个 Layer 2 方案比较及考虑点:  https://blog.matter-labs.io/evaluating-ethereum-l2-scaling-solutions-a-comparison-framework-b6b2f410f955  
zkSync 官网: https://zksync.io/  
zkSync twitter: https://twitter.com/zksync  
zkSync discord: https://discord.com/invite/px2aR7w  
zkSync telegram: https://t.me/zksync  
深入理解 Plasma: https://learnblockchain.cn/2018/10/20/plasma-framework   
7大扩容方案: https://picture.iczhiku.com/weixin/message1625468135177.html  
rinkeby 桥:  https://rinkeby.zksync.io  
ZKSync 协议介绍: https://www.jianshu.com/p/8821f1e63dc9  
zkSync rinkeby scan: https://rinkeby.zkscan.io/  
NFT 上传: https://app.pinata.cloud/  
zigzag 介绍:  https://docs.zigzag.exchange/  
一文读懂 Layer2 方案 zkSync 基本原理：https://zhuanlan.zhihu.com/p/363029544
zksync 源码分析： https://www.jianshu.com/u/ac3aed07477e  
李星L2 - zkSync源代码导读： https://zhuanlan.zhihu.com/p/343212894  
以太坊 Layer 2 扩容方案及用例综述： https://mp.weixin.qq.com/s/TxZ5W9rx6OF8qB4ZU9XrKA
zkSync2.0 example : https://v2-docs.zksync.io/dev/guide/hello-world.html
