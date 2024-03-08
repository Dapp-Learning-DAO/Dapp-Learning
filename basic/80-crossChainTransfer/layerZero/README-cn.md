# Layerzero 跨链
中文 / [English](./README.md)  

## 概览 
LayerZero 是一种全链互操作性协议，专注于链与链之间的数据消息传递，允许任何数据，包括代币、链的状态、合约调用、NFT 或治理投票等，从链 A 转移到链 B。
LayerZero 通过 Relayer 和 Oracle 结合的方式实现数据的跨链传输。其中 Oracle 提交跨链申请，Relayer 提交跨链证明，从而防止作恶

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
- 官方文档: https://docs.layerzero.network/contracts/getting-started
- example for OmniCounter: https://github.com/LayerZero-Labs/solidity-examples/blob/main/test/examples/OmniCounter.test.js  
- blog: https://senn.fun/layerzero-v1  
- layerzero scan: https://testnet.layerzeroscan.com/  
- Whitepaper: https://layerzero.network/publications/LayerZero_Whitepaper_V1.1.0.pdf  