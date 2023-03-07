# Optimism

中文 / [English](https://github.com/Dapp-Learning-DAO/Dapp-Learning/blob/main/basic/28-optimism-layer2/README.md)

## 简介

Optimistic Rollups（OR）是一种第二层解决方案，也就是说不直接在以太坊基础层中构建，而是基于以太坊进行构建。好处在于可以规模化运行智能合约，同时还能受到共享以太坊的安全性。其构造类似于 Plasma，虽然无法达到 Plasma 几近无限的扩容能力，OR 选择使用与 EVM 兼容的 OVM（Optimistic 虚拟机），使其能够像以太坊一样运作。

其名称“Opmistic Rollup”源自于这个解决方案本身的特征。之所以采用“Optimistic”（乐观），是因为聚合者仅发布最少量的所需信息，而无需提供任何证明，前提是聚合者没有实施欺诈行为，且仅在发生欺诈时提供证明。之所以使用“Rollups”，是因为交易以捆绑形式提交到主链（也即，交易被 rolled-up）

## Bedrock

- [OptimismBedrock.md](./OptimismBedrock.md)
- [Optimism Bedrock Sharing meeting video (coming soon)](https://www.youtube.com/@DappLearning)

Bedrock 是 Optimism 网络的下一个主要版本，计划于 2023 年第一季度发布（需经 Optimism 治理批准）。它将进一步减少 Optimism 和 L1 Ethereum (opens new window) 之间的差异。

### Pre-Bedrock (before Q1 2023)

所有 Optimism 区块都存储在以太坊上一个特殊的智能合约中，称为 CanonicalTransactionChain（或简称 CTC）。Optimism 块保存在 CTC 内的一个仅附加列表中。这个 append-only 列表形成了 Optimism 区块链。

包括 CanonicalTransactionChain 保证现有区块列表不能被新的以太坊交易修改的代码。然而，如果以太坊区块链本身被重组并且过去以太坊交易的顺序发生变化，这种保证可能会被打破。Optimism 主网被配置为能够抵抗多达 50 个以太坊区块的区块重组。如果以太坊经历了比这更大的重组，Optimism 也会重组。

当然，不经历这种重大的区块重组是以太坊的一个关键安全目标。因此，只要以太坊共识机制也是如此，乐观主义就可以抵御大型区块重组。正是通过这种关系（至少部分），Optimism 从以太坊中获得了安全属性。

### Bedrock (Q1 2023)

在 Bedrock L2 中，块使用非合约地址保存到以太坊区块链（`0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0001`), 以最小化 L1 气体费用。由于这些区块在以太坊上作为交易调用数据提交，因此在“交易”包含在具有足够证明的区块中后，无法修改或审查它们。这就是 Optimism 继承以太坊的可用性和完整性保证的方式。

块以压缩格式写入 L1 （打开新窗口）以降低成本。这很重要，因为写入 L1 是Optimism 交易的主要成本。

## 测试步骤

- URI ETH 跨链  
  Optimism 测试网络链接的是 goerli 网, 在 Optimistic 测试网路上进行交易前, 需要把 Goerli 网络的 ETH 经过跨链桥跨到 optimism.
  访问 Optimism 的 gateway, 选择 "Deposite" , 在其中输入跨链的 ETH 数量

- 等待资产跨链成功  
  可能需要等待 20 分钟左右才能完成 ETH 的跨链转移.

- 查看余额  
  ETH 转移成功后, 可以从 metaMask 查看 Optimism 网络上的余额

- 安装依赖

```bash
npm install
```

- 配置环境变量  
  复制 .env.example 文件为 .env 文件, 然后配置其中的 PRIVATE_KEY,INFURA_ID

- 创建合约

```bash
❯ npx hardhat run scripts/deploy.js --network optimism
Deploying contracts with the account: 0xa3F2Cf140F9446AC4a57E9B72986Ce081dB61E75
Account balance: 1500000000000000000
Token address: 0x0d29e73F0b1AE67e28495880636e2407e41480F2
```

- 脚本 ETH 跨链到 Optimism 网络  
  上面除来可以通过 Optimism 的界面进行跨梁外, 还可以通过调用合约的方式进行 ETH 跨链  
  调用如下脚本, 通过调用合约的方式进行 ETH 跨链

```sh
npx hardhat run scripts/deposit-eth.js --network goerli

## 调用结束后, 等待大约 5 分钟, 就可以发现 metaMask 上, Optimism 网络上账户余额增加了 0.0001 ETH
```

- 脚本 ETH 跨链到 Goerli 网络  
  跨链到 Optimism 链上的 ETH 还可以跨回 Goerli 链.
  调用如下脚本, 通过调用合约的方式进行 ETH 跨链

```sh
npx hardhat run scripts/withdraw-eth.js --network optimism

## 调用结束后, 等待大约 5 分钟, 就可以发现 metaMask 上, goerli 网络上账户余额增加了 0.0001 ETH
```

## 参考文档

- Optimistic 官方 github: <https://github.com/ethereum-optimism/optimism-tutorial>
- Optimistic Rollup 合约介绍: <https://medium.com/plasma-group/ethereum-smart-contracts-in-l2-optimistic-rollup-2c1cef2ec537>
- Optimism Rollup 原理解析: <https://zhuanlan.zhihu.com/p/350541979>
- Optimism 跨链桥: <https://gateway.optimism.io/>
- Optimism Goerli deposite proxy contract : <https://goerli.etherscan.io/address/0x636af16bf2f682dd3109e60102b8e1a089fedaa8#code>
- Optimism Goerli withdraw proxy contract : <https://goerli-optimism.etherscan.io/address/0x4200000000000000000000000000000000000010>
