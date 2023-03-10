# Optimism

中文 / [English](https://github.com/Dapp-Learning-DAO/Dapp-Learning/blob/main/basic/28-optimism-layer2/README.md)

## 简介

Optimistic Rollups（OR）是一种第二层解决方案，也就是说不直接在以太坊基础层中构建，而是基于以太坊进行构建。好处在于可以规模化运行智能合约，同时还能受到共享以太坊的安全性。其构造类似于 Plasma，虽然无法达到 Plasma 几近无限的扩容能力，OR 选择使用与 EVM 兼容的 OVM（Optimistic 虚拟机），使其能够像以太坊一样运作。

其名称“Opmistic Rollup”源自于这个解决方案本身的特征。之所以采用“Optimistic”（乐观），是因为聚合者仅发布最少量的所需信息，而无需提供任何证明，前提是聚合者没有实施欺诈行为，且仅在发生欺诈时提供证明。之所以使用“Rollups”，是因为交易以捆绑形式提交到主链（也即，交易被 rolled-up）

## Bedrock

- [OptimismBedrock.md](./OptimismBedrock.md)
- [Optimism Bedrock Sharing meeting video (coming soon)](https://www.youtube.com/@DappLearning)

Bedrock 是 Optimism 网络的下一个主要版本，计划于 2023 年第一季度发布（需经 Optimism 治理批准）。它将进一步减少 Optimism 和 L1 Ethereum (opens new window) 之间的差异。

## Contracts

### System Overview

Optimism协议中的智能合约可以分为几个关键组件

- **[Chain:](#chain-contracts)** 在第一层的合约，它们持有第二层交易的排序和关联的第二层状态根的承诺。
- **[Verification:](#verification)** 在第一层的合约，它们实现了挑战交易结果的过程。
- **[Bridge:](#bridge-contracts)** 负责在第一层和第二层之间进行消息传递的合约。
- **[Predeploys:](#predeployed-contracts)** 在系统的起始状态中部署并可用的一组基本合约。这些合约类似于以太坊的预编译，但它们是用Solidity编写的，并且可以在以0x42为前缀的地址上找到。

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
- Optimism doc: <https://community.optimism.io/docs/protocol/protocol-2.0/>
- Optimistic Rollup 合约介绍: <https://medium.com/plasma-group/ethereum-smart-contracts-in-l2-optimistic-rollup-2c1cef2ec537>
- Optimism Rollup 原理解析: <https://zhuanlan.zhihu.com/p/350541979>
- Optimism 跨链桥: <https://gateway.optimism.io/>
- Optimism Goerli deposite proxy contract : <https://goerli.etherscan.io/address/0x636af16bf2f682dd3109e60102b8e1a089fedaa8#code>
- Optimism Goerli withdraw proxy contract : <https://goerli-optimism.etherscan.io/address/0x4200000000000000000000000000000000000010>
