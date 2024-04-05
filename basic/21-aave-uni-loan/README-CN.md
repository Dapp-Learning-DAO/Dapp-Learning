# 前言     
基于 Hardhat 测试框架，通过样例合约的演示，了解如何在 AAVE 上进行借贷，在 Uniswap 上进行兑换，并通过 AAVE 和 Uniswap 进行做多和做空。

## 合约交互    
### AAVE V3 合约   
Pool Addresses Provider 是 AAVE V3 交互的入口，通过它可以和 AAVE V3 进行交互。 
同时因为 AAVE 会更新 Pool / PoolDataProvider / PriceOracle 合约的地址以便修复发现的 Bug ，而通过 Lending Pool Addresses Provider  可以获取这三个合约的最新的地址，而不必修改代码: 
- Pool  负责 存入/借贷 功能  
- PoolDataProvider： 提供 用户/池子 中相关的借贷信息  
- PriceOracle： 价格预言机 

### uniswap V3 合约     
Uniswap V3 的交互入口为 SwapRouter，通过它可以完成和 Uniswap V3 的所有交互


##  功能要点  
AaveApe 合约主要有四个功能，分别是    
1）质押资产到 AAVE     
2）从 AAVE 进行借贷   
3) 到 Uniswap 进行资产置换  
4）从 AAVE 进行闪电贷     
通过组合这四个功能，可以实现自动做多，做空 以及 赎回 的操作。  
### 做多  
假设你有两种资产，其中一种资产 A 你想要做多，另一种资产 B 你想要做空。 Ape 合约通过如下操作，在一笔交易中便可以帮用户达到同时对两种资产做多和做空的目的。   
- 根据用户当前在 AAVE 质押的资产 A 的价值，计算用户可借的最大数额的资产 B  
- 从 AAVE 中借贷资产 B 

需要注意的是，在上述 "从 AAVE 中借贷资产 B " 时，需要用户预先授权 Ape 合约，以便 Ape 可以以用户的名义进行借贷，详细内容可参考 AAVE 的 Credit Delegation。  

### 做空
从 AAVE 借出资产 B 后，Ape  进行如下操作做空 B。 

- 通过 Uniswap V3， 把借出的资产 B 全部兑换为 资产 A  
- 把兑换出的资产 A 继续存入 AAVE 


### 赎回    
通过 AAVE V3 的闪电贷偿还从 AAVE 借出的资产.  
详细逻辑, 参考 [aave-ape](https://azfuller20.medium.com/aave-ape-with-%EF%B8%8F-scaffold-eth-c687874c079e )

## 操作步骤  
- 配置环境变量   
```shell
cp .env.example .env
# 配置其中的 ETHERSCAN_API_KEY， INFURA_ID，ALCHEMY_ID，PRIVATE_KEY， TARGET_ADDRESS
# ETHERSCAN_API_KEY 用于合约验证
# INFURA_ID  用于连接到各个以太网络 
# ALCHEMY_ID 在使用 polygon 网路进行借贷的时候发现因为 Infura 网络延迟，造成交易失败的情况，所以这里使用 Alchemy 的网络进行验证  
# PRIVATE_KEY 用于发送交易   
# TARGET_ADDRESS: 目标用户 ，查询用户在 AAVE 上借贷所支付的所有利息
```

- 部署合约  
```shell
// depoly aaveape
npx hardhat ignition deploy ./ignition/modules/AaveApe.js --network  matic
```

- 验证合约  
```shell
// contract verify
npx hardhat verify --network matic 0x4699f609F4FD97A3cf74CB63EFf5cd1200Dfe3dA "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb" "0xE592427A0AEce92De3Edee1F18E0157C05861564"
``` 

- 进行借贷  
```shell
// open maxposition on aave
npx hardhat run scripts/loan.js --network matic    
```

- 查询用户支付利息总额    
需要注意的是，应该在 matic 上，所有的可借贷币种的 APY 使用的都是浮动 APY，如果使用其他网络的话需要修改下代码中 “计算 interest” 部分传入 getDebtToken 接口的参数     
```shell
npx hardhat run scripts/query.js --network matic
```




## 参考链接
- aave-ape 借贷 : https://azfuller20.medium.com/lend-with-aave-v2-20bacceedade
- hardhat fork 主网 : https://hardhat.org/hardhat-network/guides/mainnet-forking.html
- quick swap: https://github.com/QuickSwap
- uniswapper : https://azfuller20.medium.com/swap-with-uniswap-wip-f15923349b3d
- uniswap v3 接口调用 : https://solidity-by-example.org/defi/uniswap-v3-swap/
- ds-math 安全数学库: https://medium.com/dapphub/introducing-ds-math-an-innovative-safe-math-library-d58bc88313da 
- aave 官方文档: https://docs.aave.com/developers/getting-started/contracts-overview 
- aave polygon graph: https://thegraph.com/hosted-service/subgraph/aave/protocol-v3-polygon  
- scaffold 挑战:  https://medium.com/@austin_48503/%EF%B8%8Fethereum-dev-speed-run-bd72bcba6a4c
- scaffold-eth 任务: https://speedrunethereum.com/ 
- aave 闪电贷: https://github.com/johngrantuk/aaveFlashLoan
- aave 合约地址: https://docs.aave.com/developers/deployed-contracts/v3-mainnet
- uniswap 合约地址: https://docs.uniswap.org/contracts/v3/reference/deployments   