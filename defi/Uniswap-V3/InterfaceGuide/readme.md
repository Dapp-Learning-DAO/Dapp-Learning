# UniswapV3 Interface Guide

> Interface 是 User Interface 的含义，此为Uniswap网站的代码，包括token交易,添加和移除流动性等功能。<br>
> 代码分析使用版本 `tag 4.12.8`<br>

:warning: **本文档侧重解析 V3 和 V2 的区别**，建议先看 [UniswapV2Interface 解析文档](../../Uniswap-V2/Interface/readme.md)

## 技术栈

主要使用的技术栈

- 搭建框架 `React`,  `React-dom`, `React-router-dom`
- 状态管理 `react-redux`, `@reduxjs/toolkit`, 
- Web3 `ethers`,  `typechain`, `@web3-react`
- Uniswap相关依赖 `sdk-core`, `v2-core`, `v2-periphery`, `v2-sdk`, `v3-core`, `v3-periphery`,  `v3-sdk`, `token-list`, `liquidity-staker` ...
- 缓存管理 `workbox`
- UI 样式、动效、组件、图标、字体、数据展示、语言国际化、交互事件、色彩、文档等
- 工具类


了解详细的技术栈图示请戳这里 :point_right:[Interface 技术栈详细图示](./xmind/Stacks.png)

## 需要提前了解的知识点

- [React Hooks](https://zh-hans.reactjs.org/docs/hooks-intro.html)
- [Reduxjs Toolkit (Redux的官方工具集)](https://redux-toolkit.js.org/introduction/getting-started)
- [TypeScript](https://www.typescriptlang.org/docs/handbook/intro.html)
- [@web3-react](https://github.com/NoahZinsmeister/web3-react)
- [Ethers.js-v5](https://docs.ethers.io/v5/)

## 内容导航

### State数据的结构

结构和V2相同，主要交互部分多了三个模块

- 用户交互部分
  - MintV3
  - BurnV3
- GraphAPI 管理Graph的请求

[状态数据的结构](./xmind/State.png)

### 用户使用流程及State的变化

- Swap交易
- Position列表页
- 回收手续费
- AddLiquidity
- RemoveLiquidity

详细解析请戳这里 :point_right: [V3的用户交互流程及状态变化](./UsageAndStates.md)

### 代码解析

- Swap
- PoolList
- CollectFee
- AddLiquidity
- RemoveLiquidity

详细解析请戳这里 :point_right: [V3 interface 代码解析](./Code.md)

### 相关辅助数据

请戳这里 :point_right: [辅助数据列表](./InfoList.md)

### Multicall State 解析

主要解析V3与V2的区别

详细解析请戳这里 :point_right: [Multicall模块解析](./Multicall.md)

### GraphAPI

Interface中会用到两个Graph的请求

详细解析请戳这里 :point_right: [Graph模块解析](./Graph.md)

## 相关引用

- UniswapV3Interface 源码地址：https://github.com/Uniswap/uniswap-interface/tree/v4.12.8
