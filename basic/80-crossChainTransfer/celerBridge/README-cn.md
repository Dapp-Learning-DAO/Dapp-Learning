# Celer Bridge 跨链
中文 / [English](./README.md)  

## 概览 
cBridge 引入了最佳的跨链代币桥接体验，为用户提供了深度流动性，为 cBridge 节点运营商和不想运营 cBridge 节点的流动性提供者提供了高效且易于使用的流动性管理，以及新的令人兴奋的面向开发者的功能，如用于跨链 DEX 和 NFT 等场景的通用消息桥接。

本测试将以 OP mainnet 和 Polygon mainnet 进行测试

## 准备测试环境  
- 安装依赖  
```
npm install
```

- 配置环境  
```
cp .env.example .env
## 之后在 .env 中配置具体的私钥
```

## 执行跨链   
- 以流动性池方式进行跨链   
```
npx hardhat run scripts/1-poolBasedTransfer.js --network optim
```

- 检查跨链结果    
```
npx hardhat run scripts/2-queryPoolBasedTrasnferStatus.js --network optim
```

- 以映射方式进行跨链   
```
## 为测试需要，本次跨链将会失败，OP tonken 会被 unlock，为后续的 refund 做准备
npx hardhat run scripts/3-canonicalTokenTransfer.js --network optim
```

- 检查跨链结果    
```
npx hardhat run scripts/4-queryCanonicalTrasnferStatus.js --network optim
```

- Refund   
```
npx hardhat run scripts/5-canonicalTrasnferRefund.js --network optim
```

## 参考文档 
- 官方 doc: https://cbridge-docs.celer.network/  