# UniswapV3 合约导读

> 本文旨在帮助大家熟悉UniswapV3的合约结构，梳理流程。以下内容主要参考自 [@paco0x](https://github.com/paco0x) 的系列博客[《Uniswap v3 详解》](https://liaoph.com/uniswap-v3-1/)。感谢paco的精彩分享，强烈推荐大家去读一读他的博客！

## 基本架构

Uniswap v3 在代码层面的架构和 v2 基本保持一致，将合约分成了两个仓库：

- uniswap-v3-core
- uniswap-v3-periphery

### core

- **UniswapV3Factory**: 提供创建 pool 的接口，并且追踪所有的 pool
- **UniswapV3Pool**: 实现代币交易，流动性管理，交易手续费的收取，oracle 数据管理。接口的实现粒度比较低，不适合普通用户使用，错误的调用其中的接口可能会造成经济上的损失。

### peirphery

- **SwapRouter**: 提供代币交易的接口，它是对 UniswapV3Pool 合约中交易相关接口的进一步封装，前端界面主要与这个合约来进行对接。
- **NonfungiblePositionManager**: 用来增加/移除/修改 Pool 的流动性，并且通过 NFT token 将流动性代币化。使用 ERC721 token（v2 使用的是 ERC20）的原因是同一个池的多个流动性并不能等价替换（v3 的集中流性动功能）。

### 相关图示

- 合约关系图
![合约关系图](./img/contracts-relationship.webp)
- [合约结构图](../img/640.png)
- [Factory结构图](./img/UniswapV3_ContractMap_Factory.png)
- [NonFungiblePositionManager结构图](./img/UniswapV3_ContractMap_NonFungiblePositionManager.png)
- [Pool结构图](./img/UniswapV3_ContractMap_Pool.png)

## 流程梳理

### Create Pool (创建交易对)

![创建交易对流程图](./img/create-pool.png)

#### 流程

1. 用户首先调用 `NonfungiblePositionManager` 合约的 `createAndInitializePoolIfNecessary` 方法创建交易对，传入的参数为交易对的 token0, token1, fee 和初始价格 sqrtPrice.

#### 代码解读

- [createAndInitializePoolIfNecessary](./NonfungiblePositionManager.md#createAndInitializePoolIfNecessary)



