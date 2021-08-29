# Usage and States

> V3 的用户交互流程及状态变化<br>
> 追踪交互动作与状态数据变化的关系，可以帮助我们更好的理解程序运行的逻辑

:warning: **本文档侧重解析 V3 和 V2 的区别**，建议先看 [UniswapV2Interface UsageAndStates](../../Uniswap-V2/Interface/UsageAndStates.md)

## 准备工作

### 分析工具

下面是两个 react 官方的 chrome 插件，用于辅助开发 react 应用

- ReactDeveloperTools 快速定位组件在源码中的位置
- ReduxDevTools 追踪程序运行过程中 redux 状态的变化

### 演示环境和相关数据

- rinkeby 测试网络
- 测试网 DAI `0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735`
- 自定义 token HEHE(HH) `0x6583989a0b7b86b026e50C4D0fa0FE1C5e3e8f85`
- LPtoken `0x25c1CF39598DdD67bD68cA9e52f0c861D9Bf4c70`

详细请戳这里 :point_right:[相关辅助数据](./InfoList.md)

## Swap

token 交易界面

详细代码解析请戳这里 :point_right: [Swap 代码解析](./Code.md#Swap)

### 交互流程

swap 的交互流程和 V2 一致，内部逻辑的主要区别如下：

- 根据模式匹配滑点百分比：V3，V2， layer2
- 预估交易量不在是本地利用 sdk 计算，而是使用去调用 Quoter 合约查询，最后通过revert拿到预计的交易量
  - Quoter合约会真实调用Pool的swap函数，而swap函数又会去调用Quoter合约的uniswapV3SwapCallback回调函数
  - 回调函数中会把得到的输入输出量，作为revert信息传回
  - 因为V2直接可用x*y=k的公式计算，而V3的交易过程非常复杂，是分段执行，并且每段的状态都不一样

