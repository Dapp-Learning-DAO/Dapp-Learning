中文 / [English](https://github.com/Dapp-Learning-DAO/Dapp-Learning/blob/main/basic/13-decentralized-exchange/README.md)
## 简介

去中心化交易所， 有 etherdelta 订单薄模式和uniswap的AMM做市商模式。
其他类型有 0x & bancor  & 1inch
了解etherdelta交易所是了解其他订单薄模式交易所的基础。而了解uniswap v1是了解AMM的基础。

### EtherDelta
本样例主要介绍 etherdelta 合约逻辑, 演示对 etherdelta 合约的基本使用.

[详情参见 EtherDelta解析和测试 :point_right:](./EtherDelta/README.md)

### uniswap-v1-like

仿uniV1项目。原项目是用Vyper开发合约，这里会使用 solidity 0.8.0 仿写一个uniswapV1，由浅入深理解uniswap的原理。

[详情参见 uniswap-v1-like :point_right:](./uniswap-v1-like/README.md)


### backup
为了方便演示以及兼容hardhat我们做了微调。 backup 目录是原版代码。
## 参考链接

https://github.com/etherdelta/smart_contract/blob/master/etherdelta.sol
https://github.com/forkdelta/smart_contract   
https://github.com/Uniswap/old-solidity-contracts/blob/master/contracts/Exchange/UniswapExchange.sol
https://zhuanlan.zhihu.com/p/96664332
https://github.com/PhABC/ethereum-alarm-clock 
https://www.codementor.io/@yosriady/signing-and-verifying-ethereum-signatures-vhe8ro3h6   
https://jeiwan.net/posts/programming-defi-uniswap-1/  

