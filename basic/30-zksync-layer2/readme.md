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

Components of zkSync：

- zkSync smart contract：Deployed on Ethereum mainnet, which is used to manage account balance && verify operations on zkSync network. 

- Prover application：A worker application that is used to generate a proof for an executed block。  
  Prover application fetch valid jobs from Server application. Whenever a new block is generated, Server application will provide a witness（input data to generate a proof), then Prover application starts to work. when proof is generated, Prover application will report the proof to Server application, and then Server application publish the proof to zkSync smart contract. 

- Prover application can be regarded as an on-demand worker. When Server application workload is very high, there will be multi Prover applications. In the opposite, when there is no transactions, no Prover application is needed.  
Proof generating is a resource-intensive job, it requires a very powerful CPU && lots of RAM for machine that runs Prover application。

- Server application：Nodes running the zkSync network 
Main functions of Server application ：  
1）Listenging events of onchain operations（ Such as deposite ）  
2）Receive transactions  
3）Generate blocks on zkSync   
4）Apply for proof generating for executed blocks   
5）Publish data to zkSync smart contract    

## Operation Steps   
### Deposite ETH to zksync mannually    
- Login [zksync testnet](https://wallet.zksync.io/?network=rinkeby)  并链接 metaMask 钱包  

- Choose "Add Funds"   

- Input deposite amount, then click "Add Funds"  

- Deposite successfully  

- Click "OK" and check balance on rinkeby zkSync   

- Review transaction on [zkscan](https://rinkeby.zkscan.io/)   

### Send transaction to zkSync with script   
- Install dependencies   
```shell
yarn
``` 

- Config env parameters    
```shell
cp .env.example .env

## config PRIVATE_KEY , INFURA_API_KEY in .env
```

- Execute test script    
```shell
npx hardhat run scripts/main.js
```

## References    
- github: https://github.com/matter-labs/zksync  
- zkSync principal: https://zhuanlan.zhihu.com/p/363029544  
- zkSync source code analysis: https://www.jianshu.com/u/ac3aed07477e  
- L2 - zkSync souce code tutorial: https://zhuanlan.zhihu.com/p/343212894   
- Layer 2 expansion solution: https://mp.weixin.qq.com/s/TxZ5W9rx6OF8qB4ZU9XrKA   
- Layer 2 solution comparison:  https://blog.matter-labs.io/evaluating-ethereum-l2-scaling-solutions-a-comparison-framework-b6b2f410f955  
- zkSync official website: https://zksync.io/  
- zkSync twitter: https://twitter.com/zksync  
- zkSync discord: https://discord.com/invite/px2aR7w  
- zkSync telegram: https://t.me/zksync  
- Deep into Plasma: https://learnblockchain.cn/2018/10/20/plasma-framework   
- 7 solutions for expansion: https://picture.iczhiku.com/weixin/message1625468135177.html  
- rinkeby cross-bridge :  https://rinkeby.zksync.io  
- ZKSync introduction: https://www.jianshu.com/p/8821f1e63dc9  
- zkSync rinkeby scan: https://rinkeby.zkscan.io/  
- NFT upload: https://app.pinata.cloud/  
- zigzag introduction:  https://docs.zigzag.exchange/  
- zkSync2.0 example : https://v2-docs.zksync.io/dev/guide/hello-world.html
