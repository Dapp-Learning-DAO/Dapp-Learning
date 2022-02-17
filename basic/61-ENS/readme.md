## ENS

### 简介

ENS（Ethereum Name Service）是以太坊域名服务，是一个基于以太坊区块链的分布式、开放和可扩展的命名系统。

ENS的工作是将可读的域名（比如"alice.eth"）解析为计算机可以识别的标识符，如以太坊地址、内容的散列、元数据等。ENS还支持"反向解析"，这使得将元数据(如规范化域名或接口描述)与以太坊地址相关联成为可能

### 使用流程

ENS JavaScript 库：

- [ethereum-ens](https://www.npmjs.com/package/ethereum-ens)，由ENS开发者维护
- [ethjs-ens](https://www.npmjs.com/package/ethjs-ens)
- [ethers.js](https://github.com/ethers-io/ethers.js) （[ethers.js中文文档](https://learnblockchain.cn/docs/ethers.js/))
- [web3.js](https://web3js.readthedocs.io/en/1.0/web3-eth-ens.html)：不支持反向解析

### 原理

#### ENS架构

ENS主要有两个组件：

- 注册表：是一个智能[合约](https://github.com/ensdomains/ens/blob/master/contracts/ENS.sol)，该合约维护所有域名和子域名列表
- 解析器：是一个智能合约，负责将 ENS 域名转换为地址或其他类型的哈希和文本数据，合约内保存着这些解析记录

注册表负责将域名映射到负责解析这个域名的解析器

解析器负责将域名转换为地址

#### 解析过程

1. 对将要解析的域名进行规范化和哈希
   - 规范化：对域名进行规范化和有效性检查（比如将fOO.eth 规范为 foo.eth）并屏蔽包含下划线等禁止字符的域名
   - 哈希：Namehash 是一个递归过程，可以为任何有效的域名生成唯一的哈希
2. 在 ENS 注册表上调用 `resolver()` ，并将第 1 步输出的哈希作为参数传递，然后 `resolver()` 会返回负责解析这个域名的解析器的地址。
   - ENS 注册表是 ENS 系统中的核心合约，所有的 ENS 查询都从注册表开始。注册表负责管理域名列表，记录每个域名的所有者、解析器和 TTL ，并允许域名的所有者对这些数据进行更改
3. 使用 [resolver 接口](https://github.com/ensdomains/resolvers/blob/master/contracts/Resolver.sol) ，在第 2 步返回的解析器地址上调用 `addr()` ，并将第1步输出的哈希作为参数传递。

## 测试步骤  
- 安装依赖  
```
yarn
```

- 执行测试脚本  
```
node src/ethers-ens/index.js
```

## 参考链接

- ens 介绍： <https://ethfans.org/posts/new-decaying-price-premium-for-newly-released-names>
- ens 续订： <https://ethfans.org/posts/the-great-renewal-its-time-to-renew-your-eth-names-or-else-lose-them>
- reclaim: <https://medium.com/the-ethereum-name-service/how-to-get-back-an-old-deposit-1e2b1767b930>
