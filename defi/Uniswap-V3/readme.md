# Uniswap V3

## Contract

![合约结构图](./img/640.png)

Uniswap v3 在代码层面的架构和 v2 基本保持一致，将合约分成了两个仓库：

- uniswap-v3-core
  - UniswapV3Factory 是交易池(UniswapV3Pool)统一创建的接口。
  - UniswapV3Pool 由 UniswapV3PoolDeployer 统一部署。 实现代币交易，流动性管理，交易手续费的收取，oracle 数据管理。接口的实现粒度比较低，不适合普通用户使用，错误的调用其中的接口可能会造成经济上的损失。
    UniswapV3Pool 是核心逻辑，管理了 Tick 和 Position，实现流动性管理以及一个交易池中 swap 功能实现。
- uniswap-v3-periphery
  - NonfungiblePositionManager 负责交易池的创建以及流动性的添加删除，用来增加/移除/修改 Pool 的流动性，并且通过 NFT token 将流动性代币化。使用 ERC721 token（v2 使用的是 ERC20）的原因是同一个池的多个流动性并不能等价替换（v3 的集中流性动功能）。
  - SwapRouter 是 swap 路由的管理。提供代币交易的接口，它是对 UniswapV3Pool 合约中交易相关接口的进一步封装，前端界面主要与这个合约来进行对接。

详细内容请戳这里 :point_right: [UniswapV3 合约导读](./contractGuid/readme.md)

### 代码解析

主要代码解析：

- [NonfungiblePositionManager](./contractGuid/NonfungiblePositionManager.md)
- [SwapRouter](./contractGuid/SwapRouter.md)
- [UniswapV3Factory](./contractGuid/UniswapV3Factory.md)
- [UniswapV3Pool](./contractGuid/UniswapV3Pool.md)
- [Tick](./contractGuid/Tick.md)
- [Oracle](./contractGuid/Oracle.md)

### 用户交互流程

#### NonfungiblePositionManager

- CreatePool 创交易对池子
- mint 铸造代表流动性的 ERC721 代币返回给用户
- increaseLiquidity 添加流动性
- decreaseLiquidity 移除流动性
- collect 收取手续费
- burn 销毁流动性 token

#### SwapRouter

- exactInput 指定精确输入的交易
- exactOutput 指定精确输出的交易
- flash swap 闪电贷交易

## SDK

详细内容请戳这里 :point_right: [SDK 导读](./frontGuid/sdkGuid.md)

## Graph

Graph 实操详解

- 本地部署
- 第三方托管
- 在 mapping.ts 中处理合约,区块等相关数据
- 通过 TheGraph 查询
- Node.js 中查询 graph 数据

详细内容请戳这里 :point_right: [Graph 导读](./graphGuid/graphGuid.md)

## Interface

## 参考链接

- https://learnblockchain.cn/article/2357
- https://learnblockchain.cn/article/2580
- https://liaoph.com/uniswap-v3-1/
- https://medium.com/taipei-ethereum-meetup/uniswap-v3-features-explained-in-depth-178cfe45f223
- https://github.com/GammaStrategies/awesome-uniswap-v3
- https://mp.weixin.qq.com/s/SYjT3HH48V7WaSGmkPOzKg 星想法
- https://github.com/spore-engineering/nft-required-liquidity-mining-pool/blob/main/LiquidityFarmingNFT.sol nft farming
- https://github.com/omarish/uniswap-v3-deploy-plugin 一键部署 V3
- https://www.gelato.network/
- https://www.chainnews.com/articles/715772476688.htm
- https://arxiv.org/pdf/2106.12033.pdf 流动性策略
- https://mellowprotocol.medium.com/uniswap-v3-liquidity-providing-101-f1db3822f16d
