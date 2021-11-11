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
- HHH-WETH-Pool `0x2c0bd19fc5f7e8e01530f2822bf1a2fb15d3d70b`
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

### 交易对流动性的影响

:warning: **以下所有操作都在 Rinkeby 测试网中进行，并不是主网真实数据，仅作演示用，不构成任何投资建议**

现在有两个 HHH-WETH 的 position（流动性头寸）

- 窄区间 HHH-WETH-Pool, position id: `5264`, price range: 90.168 - 109.91 (HH per ETH)
- 宽区间 HHH-WETH-Pool, position id: `5266`, price range: 100.45 - 101.06 (HH per ETH)

当前价格 100.471 (HH per ETH)

- 窄区间资金利用率更高，可以认为同样的交易量情况下，收取的手续费更多，但同时承受了更大的风险
- 当价格变动时，流动性 position 实际上是在和市场中的交易者做对手盘
  - 比如当 ETH 下跌时，市场大部分交易者会卖出 ETH 换出 HH
  - 对于 position 来说，就是被动的买入了 ETH,卖出了 HH，于是内部的 ETH 变多， HH 变少
  - 如果价格滑出了价格区间，position 中就会变成单一资产，并且一定是当时处于弱势的资产
  - position 处于 `outOfRange` 状态，不但资产被迫变成单一资产，且不再参与手续费的分享

现在用 ETH 买入 20 个 HH, 价格变为 98.9205 (HH per ETH)

- 窄区间流动性内 HH 被耗尽，全部转为 ETH，变成 `outOfRange` 状态，不能参与手续费的分享

然后用 20 个 HH 买入 ETH, 价格变为 100.469 (HH per ETH)

- 价格又回到了窄区间内，其内部会变回两种资产，并且可以参与手续费的分享

通常来说做市会尽量避免 `outOfRange` ，不过这种特性也可以用来做平滑的交易，即特意设置一个大概率会 `outOfRange` 的窄区间，故意让价格穿过，将资产 A 平滑的换成资产 B。

## PoolList

页面的命名是 Pool 列表，但实际上主要展示的是用户的 position。

### PositionList

根据用户账户地址向 Manager 合约查询他的所有 position

- 调用 Manager 合约的 balanceOf 方法查询用户有多少个 position
- 调用 Manager 合约的 tokenOfOwnerByIndex 方法查询每个 position 的 tokenId
- 调用 Manager 合约的 positions getter 方法查询每个 position 的具体数据

### CollectFee

查询可回收的手续费

详细代码解析请戳这里 :point_right: [CollectFee 代码解析](./Code.md#CollectFee)

### 交互流程

- 通过 `ethers.callStatic` 方法，静态调用(不会真实消耗 gas) Manager 合约的 collect 函数，得到最新的可回收手续费的数量。
  - 从 Manager 的 positions getter 函数可以获取到手续费数量的数据
  - 但这个数据不是最新的，因为 Manager 中的 position 的手续费只有在用户添加或删除流动性时才会触发去 Pool 合约中查询最新数据
  - Manager 合约和 Pool 合约都存有 position 数据，但是 Pool 合约不会存储用户相关的信息，并且仅限 Pool 合约所对应的交易对；而 Manager 中会针对用户存储其所有交易对的全部 position 信息

回收手续费

- 这里就是真实的发送交易，触发 `Manager.collect()` 回收手续费，该方法会让 Pool 合约将手续费转给用户

## AddLiquidity

添加流动性

详细代码解析请戳这里 :point_right: [AddLiquidity 代码解析](./Code.md#AddLiquidity)

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

- currencyIDA/B token 的地址
- feeAmount 费率水平 `feeAmount / 10**6` %, 例如 feeAmount=3000 即表示 0.3%的费率
- tokenId 流动性 position 在 Manager 合约内的 tokenID（NFT ID）

```ts
`#/add/${currencyIDA}/${currencyIDB}/${feeAmount}/${tokenId}`;
```

### 使用流程

#### 选择 token 和费率水平

- 用户在 Pool 页面点击 `New Position` 按钮，进入新建 Position 页面（流动性头寸）
  - 此时浏览器路由为 `/#/add/ETH`
  - 默认 tokenA 是 ETH，浏览器路由第一个参数是 `/ETH` (只有 ETH 以别名表示，通常以 token 地址表示)
  - 当用户选择 token 时，路由参数会跟随变动，这里选择 ETH-HHH 作为交易对，路由则变为 `#/add/ETH/0x6583989a0b7b86b026e50C4D0fa0FE1C5e3e8f85`
- `useFeeTierDistribution` 会去检索低中高三档费率的 Pool 是否存在，费率选择的选项会相应的做出可选和不可选的状态变化
- 用户选择费率 0.3%，路由会添加 `feeAmount` 参数为 3000

#### 创建流动性池子

- 如果选择的费率还未有池子，界面会出现 `Gas 费将比平时高一些` 的警告，这是因为比普通添加流动性多调用了 manager 合约的 `createAndInitializePoolIfNecessary` 方法，多出的 gas 费消耗除了部署 Pool 合约之外，主要还有下列开销
  - 初始化 Pool 的 slot0 插槽变量
  - 还要初始化 Oracle 相关的 storage 存储变量。初始化是必须的，但是创建 Pool 的用户通常不是 Oracle 的使用者，所以并不会将 65535 个存储空间全部初始化，而只初始化 1 个
- 初始创建流动性还需要用户输入初始价格
- 输入价格区间
  - 由于V3的价格不是连续的数轴，而是一个个tick组成的离散的点，并且根据费率不同tick之间还会存在tickSpacing间隔
  - 所以用户输入的数值通常不能正在卡在tick所代表的价格上，每当输入完成，程序会自动匹配最近的tick，然后修改输入值
  - tick代表的价格是 `sqrt(1.0001) ** i`，i为tick的序号，所以价格是不连续的，离散的点
  - tick的序号是 `int24` 类型，所以有最大和最小范围 [参见合约导读 TickBitmap](../contractGuide/Tick.md#TickBitmap)
- 点击 `Preview` 按钮
  - 如果是 `OPTIMISM` 和其测试网，需要先点击 `Create` 按钮，单独发一笔交易创建 Pool 合约
  - 其他网络则直接 `Preview` 按钮，发送一笔交易同时完成创建和添加流动性

#### 已有流动性池子

- 如果已经有流动性，此时 `LiquidityChartRangeInput` 组件会渲染出当前处于激活状态的头寸分步图
  - `usePoolActiveLiquidity` 首先根据当前交易价格筛选出 Pool 中所有处于激活状态的 poistion
  - 遍历计算每个 tick 上的处于激活状态的流动性总和 `liquidityActive`
  - 生成每个 tick 上的活跃流动性的数量，计算逻辑 [参见下方 :point_down:](#computeLiquidityActive)
- 此时如果有流动性数据，会自动计算出一个合适的价格区间
  - 自动计算的区间的逻辑是根据三档费率固定设置的比例
  - 即自动计算费率只跟你选择的费率等级相关，且是固定值，比较鸡肋……

### computeLiquidityActive

关于每个 tick 上激活状态的流动性数量计算

- Pool 合约保存的 liquidity 变量是当前处于激活状态的 position 的流动性总和，即价格区间包含当前价格的所有流动性
- 所以当前价格对应 tick 可直接赋值为合约中的变量 `Pool.liquidity`,即为函数中的 `liquidityActive`
- `liquidityNet` 是 Pool 合约在每个 tick 上存储的一个用于计算的数据，其主要有 6 种变化的情况，参见下方表格
- 如果向后（更高价格）遍历
  - 若 `liquidityNet` > 0, 说明该 tick 上以此作为 Lower price 的流动性更多
  - 若 `liquidityNet` < 0, 说明该 tick 上以此作为 Upper price 的流动性更多
  - 当价格移动到此处，流动性需要做加法
- 如果向前（更低价格）遍历，由于价格已经穿过了这些 tick，其 net 值已经反号
  - 若 `liquidityNet` > 0, 说明该 tick 上以此作为 Upper price 的流动性更多
  - 若 `liquidityNet` < 0, 说明该 tick 上以此作为 Lower price 的流动性更多
  - 当价格移动到此处，流动性需要做减法

流动性的操作对 `liquidityNet` 的影响

| liquidity 操作 | tick 所在位置 | liquidityNet 运算   |
| -------------- | ------------- | ------------------- |
| Add            | Lower         | `+= deltaLiquidity` |
| Add            | Upper         | `-= deltaLiquidity` |
| Remove         | Lower         | `-= deltaLiquidity` |
| Remove         | Upper         | `+= deltaLiquidity` |

交易的操作对 `liquidityNet` 的影响

| 价格穿过 tick 的方向 | liquidityNet 运算 |
| -------------------- | ----------------- |
| -->                  | 保持不变          |
| <--                  | `= -liquidityNet` |

### ZOOM_LEVELS

根据不同费率设置的三档初始价格区间比例

- `initialLeftprice = initialMin * currentPrice`
- `initialRightprice = initialMax * currentPrice`
- 上述是以 token1 的价格计算，如果是 token0 则左右参数颠倒

```ts
const ZOOM_LEVELS: Record<FeeAmount, ZoomLevels> = {
  [FeeAmount.LOW]: {
    initialMin: 0.999,
    initialMax: 1.001,
    min: 0.00001,
    max: 1.5,
  },
  [FeeAmount.MEDIUM]: {
    initialMin: 0.5,
    initialMax: 2,
    min: 0.00001,
    max: 20,
  },
  [FeeAmount.HIGH]: {
    initialMin: 0.5,
    initialMax: 2,
    min: 0.00001,
    max: 20,
  },
};
```

## RemoveLiquidity

移除流动性头寸(position)

详细代码解析请戳这里 :point_right: [RemoveLiquidity 代码解析](./Code.md#RemoveLiquidity)

### 交互流程

- 用户选择要移除的百分比
- `useDerivedV3BurnInfo` 预估用户移除的流动性返回多少 token 和手续费
  - @uniswap/v3-sdk/Position 可以根据移除的 liquidity 数量预估返回的 token 数量
  - 获取可回收的手续费数量，方法和 [CollectFee](#CollectFee) 一样
  - 判断是否 outOfRange
- 确认移除发送交易
