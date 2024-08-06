中文 / [English](./README.md)

# Celer Bridge 跨链

## 概览 
cBridge 引入了最佳的跨链代币桥接体验，为用户提供了深度流动性，为 cBridge 节点运营商和不想运营 cBridge 节点的流动性提供者提供了高效且易于使用的流动性管理，以及新的令人兴奋的面向开发者的功能，如用于跨链 DEX 和 NFT 等场景的通用消息桥接。

cBridge 有两种 bridge 方式，一种是 Pool-Based ，一种是 Canonical Mapping。
Pool-Based 就是在 A 链和 B 链之间各自锁定相同的 token，比如 USDT。当用户需要从 A 链跨到 B 链的时候，先会把 USDT 转入 A 链这边的 Vault 中，然后在 B 链这边把 USDT transfer 给用户。这个情况下，就需要在 A 链和 B 链上各自建立 pool 来完成这个操作，当 pool 中的资金不足时，就会出现无法 bridge 的情况。这种模式被称为 lock/unlock。
Canonical Mapping 对应的就是 lock/mint。用户 bridge 的时候，会把 USDT lock 到 A 链这边的 vault，然后在 B 链这边 mint 出对应的资产给用户。反过来，当用户想把 B 链上的 USDT bridge 会 A 链的时候，会把 B 链上的 USDT burn 掉，然后在 A 链这边把 USDT 从 vault 再 transfer 给用户。 

本测试将以 OP mainnet 和 Polygon mainnet 进行测试

## 测试环境要求  
node 版本需要为 v18.17.0, 可以使用 nvm 切换当前 node 版本

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
npx hardhat run scripts/3.1-canonicalTokenTransfer.js --network optim
```

- 检查跨链结果    
大概需要 15 分钟左右才能确定最终跨链状态，可等待 15 分钟后再来查询结果
```
npx hardhat run scripts/4.1-queryCanonicalTrasnferStatus.js --network optim
```

## 跨链 Refund 
当跨链失败的时候，用户可以 refund 他的资产，以下测试如何进行 refund 

- 以映射方式进行跨链   
```
## 为测试需要，本次跨链将会失败，OP tonken 会被 unlock，为后续的 refund 做准备
npx hardhat run scripts/3.2-canonicalTokenTransfer_ForRefund.js --network optim
```

- 检查跨链结果    
大概需要 15 分钟左右才能确定最终跨链状态，可等待 15 分钟后再来查询结果 
```
npx hardhat run scripts/4.2-queryCanonicalTrasnferStatus_ForRefund.js --network optim
```

- Refund   
```
npx hardhat run scripts/5-canonicalTrasnferRefund.js --network optim
```

## 参考文档 
- 官方 doc: https://cbridge-docs.celer.network/  