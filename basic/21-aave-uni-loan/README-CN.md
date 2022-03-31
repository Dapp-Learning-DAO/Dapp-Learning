# 项目介绍    
基于 Hardhat 测试框架，通过样例合约的演示，了解如何在 AAVE 上进行借贷，在 Uniswap 上进行兑换。 

### AAVE    
Lending Pool Addresses Provider 是 AAVE 交互的入口，通过它可以和 AAVE 进行交互。 
同时因为 AAVE 会更新 LendingPool / ProtocolDataProvider / PriceOracle 合约的地址以便修复发现的 Bug ，而通过 Lending Pool Addresses Provider  可以获取这三个合约的最新的地址，而不必修改代码: 
- LendingPool：  负责 存入/借贷 功能  
- ProtocolDataProvider： 提供 用户/池子 中相关的借贷信息  
- PriceOracle： 价格预言机 

### uniswapv2      
UniswapV2 的交互入口为 Router02，通过它可以完成和 UniswapV2 的所有交互


##  要点       
首先，在部署合约的时候，会传入两个参数，AddressesProvider 和 Router 的地址，之后便可以通过调用合约接口，获取 AAVE 当前池子的状态信息。 

### 做多  
假设你有两种资产，其中一种资产 A 你想要做多，另一种资产 B 你想要做空。 Ape 合约通过如下操作，在一笔交易中便可以帮用户达到同时对两种资产做多和做空的目的。   
- 根据用户当前在 AAVE 质押的资产 A 的价值，计算用户可借的最大数额的资产 B  
- 从 AAVE 中借贷资产 B 

需要注意的是，在上述 "从 AAVE 中借贷资产 B " 时，需要用户预先授权 Ape 合约，以便 Ape 可以以用户的名义进行借贷，详细内容可参考 AAVE 的 Credit Delegation。  

### 做空
从 AAVE 借出资产 B 后，Ape  进行如下操作做空 B。 

- 通过 Uniswap V2， 把借出的资产 B 全部兑换为 资产 A  
- 把兑换出的资产 A 继续存入 AAVE 


## unwindApe 介绍  
通过 AAVE V2 的闪电贷偿还从 AAVE 借出的资产.  
详细逻辑, 参考 [aave-ape](https://azfuller20.medium.com/aave-ape-with-%EF%B8%8F-scaffold-eth-c687874c079e )

## 操作步骤  

```shell
// depoly aaveape
hardhat run --network matic scripts/deploy.js   

// contract verify
npx hardhat verify --network matic 0xddb2d92d5a0EDcb03c013322c7BAe92734AA4597 "0xd05e3E715d945B59290df0ae8eF85c1BdB684744" "0x1b02da8cb0d097eb8d57a175b88c7d8b47997506"

// open maxposition on aave
hardhat run --network matic scripts/loan.js   

```




## 参考链接
- aave-ape 借贷 : https://azfuller20.medium.com/lend-with-aave-v2-20bacceedade
- hardhat fork 主网 : https://hardhat.org/hardhat-network/guides/mainnet-forking.html
- quick swap: https://github.com/QuickSwap
- uniswapper 接口调用 : https://azfuller20.medium.com/swap-with-uniswap-wip-f15923349b3d 
- ds-math 安全数学库: https://medium.com/dapphub/introducing-ds-math-an-innovative-safe-math-library-d58bc88313da 
- aave 官方文档: https://docs.aave.com/developers/the-core-protocol/protocol-overview#main-contracts 
- aave polygon graph: https://thegraph.com/legacy-explorer/subgraph/aave/aave-v2-matic  
- scaffold 挑战:  https://medium.com/@austin_48503/%EF%B8%8Fethereum-dev-speed-run-bd72bcba6a4c
- scaffold-eth 任务: https://speedrunethereum.com/ 
- aave 闪电贷: https://github.com/johngrantuk/aaveFlashLoan