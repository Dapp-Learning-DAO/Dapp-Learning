中文 / [English](./README.md)

# Layerzero 跨链

## 概览 
LayerZero 是一种全链互操作性协议，专注于链与链之间的数据消息传递，允许任何数据，包括代币、链的状态、合约调用、NFT 或治理投票等，从链 A 转移到链 B。
LayerZero 通过 Relayer 和 Oracle 结合的方式实现数据的跨链传输。其中 Oracle 提交跨链申请，Relayer 提交跨链证明，从而防止作恶。
简单地说，LayerZero 处理通信，应用程序处理其它一切问题。这种组合允许应用安全地在所有链上统一资产的平衡。

### LayerZero 角色  
LayerZero 的核心角色分为 Oracle 和 Relayer, 承担着两条链之间信息传递  
<center><img src="https://github.com/yingjingyang/Imgs-for-tasks-01/blob/main/basic-task/task-80/LayerZero_Layout.png?raw=true" /></center>  

### Oracle 和 Relayer 的分工  
简单来说，Oracle（预言机）的主要作用是让目标链上的合约知道什么时候验证和验证的答案是什么。而 Relayer（中继器）则负责提供验证交易所需的证明过程以及跨链信息的具体内容。

1. Oracle 的作用  
将源头链上跨链请求所在的 Blockhash 和 Block Receiptsroot 传递到目标链上.  
Blockhash: 告知目标链上的合约哪个区块里有用户的跨链请求  
Block Receiptsroot: 用来验证交易中继器传递的消息  

2. Relayer 的作用  
将跨链消息所在的 Receipt 和 Merkle Proof 所需的路径信息传递到目标链上的合约用以验证。  
其中 Receipt 收据是指交易回执信息，其中主要包含着交易执行结果、交易哈希和交易事件日志。 
交易执行结果：源链上交易本身是否成功。 
交易哈希：每一笔交易的全局唯一哈希。  
交易事件日志：跨链信息的具体内容。 
这里的路径信息就是下图的红色箭头，比如将中继者依次将 L2 -> Hash 0-0 -> Hash 1 信息告诉链上节点后。比对预言机给出的 TopHash，以及基于中继者给出的信息合约进行二次计算后一致则说明中继者是正确的。
<center><img src="https://github.com/yingjingyang/Imgs-for-tasks-01/blob/main/basic-task/task-80/Oracle_Merkle_proof.png?raw=true" /></center> 

3. LayerZero 的跨链生命周期   

<center><img src="https://github.com/yingjingyang/Imgs-for-tasks-01/blob/main/basic-task/task-80/LayerZero_LifeCycle.png?raw=true" /></center> 
整体流程概述如下：

一个交易从用户应用程序（UA）启动一个交易（即在链上执行某些操作）开始。然后，通过预言机和中继器在 LayerZero 端点的协助下，将这个交易分解成多个部分（证明和区块头）。一旦预言机和中继器在目标链上发送各自的信息（签署交易上链），并且 LayerZero Endpoint（合约）验证了信息的正确性，消息就会被转化并在目标链上执行。

展开详细步骤如下（对照上图看）：

步骤 1：用户应用程序 UA（如 Stargate 桥）LayerZero 的通信器（Communicator）发送请求，包括交易标识符 t、从 A 到 B 转移的数据（payload 有效负载）、或指向 Chain B 上用户应用程序智能合约的标识符或者中继器 (relayer_args) 等交易信息。

步骤 2：通信器将这些数据以 LayerZero 数据包（packet）的形式发送给验证器（Validator）

步骤 3：验证器将交易标识符和链 B 上智能合约的标识符等发送给网络层（NetWork）。网络层的工作也被触发，有待传递的信息需要通过 oracle 将源链 A 的区块头发送到目标链 B。

步骤 4：验证器将此信息（packet）转发给中继器。中继器被通知后则取交易证明（第 7 步的 Proof）链下存储，并将其发送到 Chain B（第 11 步），chainB 的端点亦可发起申请要求获取指定块哈希的结果 (第 10 步)。

步骤 5：网络层将 Chain B 上智能合约的标识符和交易块的块 ID 一起发送给预言机。当预言机被通知则获取 Chain A 上当前块的块头（第 6 步）并将其发送到 Chain B（第 8 步）。

可以看到这时候其实 6、7、8、10、11 的部分都内嵌在中继器和预言机的环节执行了。

步骤 9：网络层将获取到的区块哈希发送到验证器（触发超轻节点的验证）。

步骤 12：验证器通过查看网络层存储的交易证明和块头来确保交易有效且已提交。如果块头和交易证明匹配，则将交易信息（Packet）发送到通信器。

步骤 13：通信器将信息（Packet）转发送到 Chain B 上的用户应用程序中，执行任意功能。

整体跨链是在源链上执行首笔交易的时候收取的 Gas 手续费，到了目标链上则是对应 3 笔，构成是中继器+预言机+Layer Zero: Executor（某个 EOA 账号）。 

## 测试环境要求  
node 版本需要为 v20.11.0, 可以使用 nvm 切换当前 node 版本

## 准备测试环境  
- 安装依赖  
```
npm install
```

- 获取测试 ETH 
执行下面脚本前需要获取测试 ETH，可以访问如下两个 link 进行获取 
optim sepolia: https://faucet.quicknode.com/optimism/sepolia
sepolia: https://www.alchemy.com/faucets/ethereum-sepolia

- 配置环境  
```
cp .env.example .env
## 之后在 .env 中配置具体的私钥
```

## 跨链传输消息     
- 在 sepolia 上部署合约   
```
npx hardhat run scripts/sendMessage/1-deployOmniCounterOnSepolia.js --network sepolia
```

- 在 optim sepolia 上部署合约      
```
npx hardhat run scripts/sendMessage/2-deployOmniCounterOnOptimSepolia.js --network optim_sepolia
```

- 设置 sepolia 侧的 trustRemote   
```
npx hardhat run scripts/sendMessage/3-setTrustRemoteForSepolia.js --network sepolia
```

- 设置 optim sepolia 侧的 trustRemote    
```
npx hardhat run scripts/sendMessage/4-setTrustRemoteForOptimSepolia.js --network optim_sepolia
```

- 在 sepolia 侧触发消息发送    
```
npx hardhat run scripts/sendMessage/5-sendMessageFromSepoliaToOpsepolia.js --network sepolia
```

- 检查跨链消息状态     
```
npx hardhat run scripts/sendMessage/6-checkCrossChainMessageStatus.js
## 当 status 显示为 DELIVERED 时即表示消息传输成功，可以执行下一步操作
```

- 检查结果    
```
npx hardhat run scripts/sendMessage/7-checkResultOnOpsepolia.js --network optim_sepolia
```


## 跨链 Transfer token 
- 在 sepolia 上部署合约   
```
npx hardhat run scripts/sendTokens/1-deployOFTOnSepolia.js --network sepolia
```

- 在 optim sepolia 上部署合约      
```
npx hardhat run scripts/sendTokens/2-deployOFTOnOptimSepolia.js --network optim_sepolia
```

- 设置 sepolia 侧的 trustRemote   
```
npx hardhat run scripts/sendTokens/3-setTrustRemoteForSepolia.js --network sepolia
```

- 设置 optim sepolia 侧的 trustRemote    
```
npx hardhat run scripts/sendTokens/4-setTrustRemoteForOptimSepolia.js --network optim_sepolia
```

- 在 sepolia 侧触发 token transfer    
```
npx hardhat run scripts/sendTokens/5-bridgeTokenFromSepoliaToOpsepolia.js --network sepolia
```

- 检查跨链消息状态     
```
npx hardhat run scripts/sendTokens/6-checkCrossChainMessageStatus.js
## 当 status 显示为 DELIVERED 时即表示消息传输成功，可以执行下一步操作
```

- 检查结果    
```
npx hardhat run scripts/sendTokens/7-checkResultOnOpsepolia.js --network optim_sepolia
```


# 参考文档 
- 官方文档 v1: https://docs.layerzero.network/contracts/getting-started
- 官方文档 v2: https://docs.layerzero.network/v2
- example for OmniCounter: https://github.com/LayerZero-Labs/solidity-examples/blob/main/test/examples/OmniCounter.test.js  
- blog: https://senn.fun/layerzero-v1  
- layerzero scan: https://testnet.layerzeroscan.com/  
- Whitepaper: https://layerzero.network/publications/LayerZero_Whitepaper_V1.1.0.pdf  
- https://www.theblockbeats.info/news/42610    
- https://foresightnews.pro/article/detail/2100   