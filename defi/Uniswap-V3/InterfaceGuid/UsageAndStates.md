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
- V3SwapRouter `0xE592427A0AEce92De3Edee1F18E0157C05861564`
- PositionManager `0xC36442b4a4522E871399CD717aBDD847Ab11FE88`
- HHH-WETH-Pool ``
- HHH-WETH-Pool, position id: `5264`, price range: 90.168 - 109.91 (HH per ETH)
- HHH-WETH-Pool, position id: `5266`, price range: 100.45 - 101.06 (HH per ETH)
- 自定义 token HEHE(HH) `0x6583989a0b7b86b026e50C4D0fa0FE1C5e3e8f85`
- 测试网 DAI `0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735`

详细请戳这里 :point_right:[相关辅助数据](./InfoList.md)

## Swap

token 交易界面

详细代码解析请戳这里 :point_right: [Swap 代码解析](./Code.md#Swap)

### 交互流程

swap 的交互流程和 V2 一致，内部逻辑的主要区别如下：

- 根据模式匹配滑点百分比：V3，V2， layer2
- 预估交易量不在是本地利用 sdk 计算，而是使用去调用 Quoter 合约查询，最后通过 revert 拿到预计的交易量
  - Quoter 合约会真实调用 Pool 的 swap 函数，而 swap 函数又会去调用 Quoter 合约的 uniswapV3SwapCallback 回调函数
  - 回调函数中会把得到的输入输出量，作为 revert 信息传回
  - 因为 V2 直接可用 x\*y=k 的公式计算，而 V3 的交易过程非常复杂，是分段执行，并且每段的状态都不一样

## CreatePool

添加流动性

### init state

```ts
mintV3: {
  independentField: 'CURRENCY_A', // 输入数量使用的 tokenA还是tokenB
  typedValue: '',             // 注入多少流动性（token的数量，输入一种会自动计算另一种）
  startPriceTypedValue: '',   // 当创建Pool时，设置的初始价格
  leftRangeTypedValue: '',    // 价格区间下限
  rightRangeTypedValue: ''    // 价格区间上限
}
```

### 路由参数

- currencyIDA/B token的地址
- feeAmount 费率水平 `feeAmount / 10**6` %, 例如 feeAmount=3000 即表示 0.3%的费率
- tokenId 流动性position在Manager合约内的tokenID（NFT ID）

```ts
`#/add/${currencyIDA}/${currencyIDB}/${feeAmount}/${tokenId}`
```

### 使用流程

- 用户在Pool页面点击 `New Position` 按钮，进入新建Position页面（流动性头寸）
  - 此时浏览器路由为 `/#/add/ETH`
  - 默认tokenA是ETH，浏览器路由第一个参数是 `/ETH` (只有ETH以别名表示，通常以token地址表示)
  - 当用户选择token时，路由参数会跟随变动，这里选择ETH-HHH作为交易对，路由则变为 `#/add/ETH/0x6583989a0b7b86b026e50C4D0fa0FE1C5e3e8f85`

## AddLiquidity
