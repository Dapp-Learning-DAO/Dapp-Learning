# Usage and States

> V2 的用户交互流程及状态变化<br>
> 追踪交互动作与状态数据变化的关系，可以帮助我们更好的理解程序运行的逻辑

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

## 添加自定义 token

在 token 列表中添加新的 token

### 涉及的源码

- `CurrencySearch`: `src/components/SearchModal/CurrencySearch.tsx`
- `useToken`: `src/hooks/Tokens.ts`
- `useSingleCallResult`: `src/state/multicall/hooks.ts`

### initial state

```js
user: {
  ...
  tokens: {}
}
callResults: {
  '4': {    // 4 代表了rinkeby测试网
    ...
  }
}
```

### 交互流程

1. 在 Swap 界面点击 `Select a token` 按钮，填入自定义 token 的地址
2. `CurrencySearch` 的 `searchQuery` 被赋值为自定义 token 地址，其值产生变化，触发 `useToken` 获取 token 的信息
3. `useToken` 首先会在已有的 tokenlist 中查找，如果有则直接返回 token 信息
4. 找不到 token 信息，会调用 `useSingleCallResult` 请求自定义 token 合约的 `name` `symbol` 和 `decimals` 字段，这里返回 'HEHE' 'HH' 和 1

   - `useSingleCallResult` 是调用 multicall 合约的方法
   - 在 state 中可以看到 callResults 新增了三条数据，其键的组成格式为 `{contract address}-{methodid}`
   - 对照[methodid 列表](./InfoList.md#ERC20)查询 methodid 可以验证其对应的正是合约的三个 getter 函数 `name()` `symbol()` `decimals()`
   - 关于 multicall 模块的批量请求过程会在 [Multicall 模块详解](./Multicall.md) 中解析，这里不再赘述

   ```js
   // callResults 新增三条数据
   ...
   '0x6583989a0b7b86b026e50C4D0fa0FE1C5e3e8f85-0x06fdde03': {
     ...
   },
   '0x6583989a0b7b86b026e50C4D0fa0FE1C5e3e8f85-0x313ce567': {
     ...
   },
   '0x6583989a0b7b86b026e50C4D0fa0FE1C5e3e8f85-0x95d89b41': {
     ...
   }
   ```

5. `CurrencySearch` 拿到 token 信息，判断其不在已有列表中，固显示 import 按钮
6. 用户点击 import，再次确认之后，触发 user state 的 `user/addSerializedToken` 事件，添加新的自定义 token

   ```js
   // user state 新增自定义token信息
   user: {
     ...
     tokens: {
       '4': {
         '0x6583989a0b7b86b026e50C4D0fa0FE1C5e3e8f85': {
           chainId: 4,
           address: '0x6583989a0b7b86b026e50C4D0fa0FE1C5e3e8f85',
           decimals: 1,
           symbol: 'HH',
           name: 'HEHE'
         }
       }
     },
   }
   ```

7. 用户自定义的设置，远程请求的 token list 等信息都会被缓存到浏览器的 storage 中长期保存，加速以后的访问速度，即第二次进入时，自定义 token 无须再次 import

## Swap

token 交易界面

### 涉及的源码

- `SwapPage`: `src/pages/Swap/index.tsx`
- `CurrencySearchModel`: `src/components/SearchModal/CurrencySearchModel.tsx`
- `CurrencyList`: `src/components/SearchModal/CurrencyList.tsx`
- `useCurrencyBalance`: `src/state/wallet/hooks.ts`
- `useSwapActionHandlers`, `useDerivedSwapInfo`: `src/state/swap/hooks.ts`
- `useTradeExactIn`, `useTradeExactOut`, `useAllCommonPairs`: `src/hooks/Trades.ts`

详细代码解析请戳这里 :point_right: [Transaction 代码解析](./Code.md#Swap)

### init state

```js
// swap state tokenInput 默认 ETH
swap: {
  INPUT: {
    currencyId: 'ETH'   // 默认 ETH
  },
  OUTPUT: {
    currencyId: ''      // 暂未选择 output
  },
  // 用户使用哪个输入框设置金额 即用户希望使用精确的 输入数值 还是 输出数值
  independentField: 'INPUT',  // INPUT | OUTPUT
  typedValue: '',   // 键入的数值
  recipient: null   // 交易接收者的地址 仅高级模式可设置，默认是用户连接的钱包地址
},
transactions: {}
```

### 交互流程

1. 在 Swap 界面点击 `Select a token` 按钮，`CurrencySearchModel` 弹窗展示可选择的 token 列表 `CurrencyList`
2. `CurrencyList` 会自动遍历加载用户对应每种 token 的余额， 由`useCurrencyBalance` 调用 token 合约的 balanceOf 方法实现
3. 选择 `DAI` 作为输入 token， 触发 swap state 的 `swap/selectCurrency` 事件
4. 选择 `HH` 作为输出 token，此时 swap state 变化如下

   ```js
   swap: {
     INPUT: {
       currencyId: '0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735'  // DAI 的地址
     },
     OUTPUT: {
       currencyId: '0x6583989a0b7b86b026e50C4D0fa0FE1C5e3e8f85'  // HH 的地址
     },
     ...
   }
   ```

5. 以指定输出数量为例，用户在输出 token 前面(下方的输入框)输入交易金额，触发 swap state 的 `swap/typeInput` 事件，

   ```js
   // swap state changed
   swap: {
    ...
    independentField: 'OUTPUT',   // 因为指定了输出金额，这里变成 OUTPUT
    typedValue: '1',  // 指定交易出 1 个 HH token
   }
   ```

6. state 中 typedValue 的更新会触发 `useDerivedSwapInfo` 计算最优交易路径和预计的输入数量

   - 判断 `isExactIn` 即是否为指定精确输入的模式，布尔值，这里为 false
   - 调用 `useTradeExactOut` 计算最佳交易路径和预计需要的输入 token 数量 [useTradeExactOut](./Code.md#useTradeExactOut)
     - `singleHopOnly` 为用户是否禁止中转交易，即仅使用一个交易对交易，若交易对不存在池子则无法进行交易
     - 这里可以看到交易框下方出现了备注信息，其中 Route 字段为 `DAI -> ETH -> HH`；因为没有 DAI - HH 的池子，所以需要通过两个 token 与 weth 的池子进行中转交易
     - 调用 `useAllCommonPairs` 获取所有可能用到的交易对(包含中转交易对)，具体的逻辑[参见 useAllCommonPairs](./Code.md#useAllCommonPairs)
     - 调用 `@uniswap/sdk/Trade.bestTradeExactOut` 计算最优交易路径

7. 现在界面上已经显示出了最优交易路径和预计需要的输入数量，点击 swap 按钮和确认弹窗。如果 token 未授权会先提示 approve，[过程参考 ApproveToken](#ApproveToken)
8. `useSwapCallback` 向 router 合约发起交易，返回交易的 状态，回调，报错

   - `useSwapCallback` 中会先检查所有交易，并估算 gas 费用，在预执行过程中若有报错会立即抛出
   - `useSwapCallback` 实际上一次只实际发送一笔交易，当需要发起多笔交易时，由 `SwapPage` 中的 `handleSwap` 监听上一笔交易的回调，当上一笔交易完成，会继续执行下一笔交易，直到全部执行完成
   - 交易发送成功，向 transactions state 推送交易信息，以便追踪交易结果

9. 监听交易的过程请看 [WatchingTransaction](#WatchingTransaction)

#### 不同的交易方法

交易分 6 种情况，对应 router 合约的 6 种交易方法

| INPUT TOKEN | OUTPUT TOKEN | 用户输入位置 | Router swap method       |
| ----------- | ------------ | ------------ | ------------------------ |
| token       | token        | input        | swapExactTokensForTokens |
| token       | token        | output       | swapTokensForExactTokens |
| ETH         | token        | input        | swapExactETHForTokens    |
| token       | ETH          | output       | swapTokensForExactETH    |
| token       | ETH          | input        | swapExactTokensForETH    |
| ETH         | token        | output       | swapETHForExactTokens    |

## WatchingTransaction

监听交易

### 涉及的源码

`useTransactionAdder`: `src/state/transactions/hooks.tsx`
`TransactionReducer`: `src/state/transactions/reducer.ts`
`userTransactionAdder`: `src/state/transactions/reducer.ts`
`TransactionUpdater`: `src/state/transactions/updater.ts`

详细代码解析请戳这里 :point_right: [Transaction 代码解析](./Code.md#Transaction)

### init state

```js
transactions: {
}
```

### 流程

1. 接着看 Swap 部分的后续，发送交易后，会向 transaction state 添加交易记录

   ```js
   // transactions state add transation
   transactions: {
     '4': {
       '0x28e3b29d664593fa382caa736d5418a426567abf4271b747d467144b31cd26ce': {
         hash: '0x28e3b29d664593fa382caa736d5418a426567abf4271b747d467144b31cd26ce',
         summary: 'Swap 40100000000 DAI for 1 HH',
         from: '0xe45d43FEb3F65B4587510A68722450b629154e6f',
         addedTime: 1629128326722, // 时间戳
         lastCheckedBlockNumber: 9125844 // 区块高度
       }
     }
   }
   ```

2. 监听交易结果，transactions state 触发 `transactions/checkedTransaction` 事件，当区块高度变化，更新交易信息的 `lastCheckedBlockNumber` 字段
3. 交易确认，transactions state 触发 `transactions/finalizeTransaction` 事件， 记录交易结果

   ```js
   // transactions state add
   transactions: {
     '4': {
       '0x28e3b29d664593fa382caa736d5418a426567abf4271b747d467144b31cd26ce': {
         hash: '0x28e3b29d664593fa382caa736d5418a426567abf4271b747d467144b31cd26ce',
         summary: 'Swap 40100000000 DAI for 1 HH',
         from: '0xe45d43FEb3F65B4587510A68722450b629154e6f',
         addedTime: 1629128326722,
         lastCheckedBlockNumber: 9125844,
         // 以下是新增的交易结果数据
         receipt: {
           blockHash: '0xe05e5d4f90bf808baa02267b356ddcd3e694f0da3c88498f33572efd482d74a1',
           blockNumber: 9125845,
           contractAddress: null,
           from: '0xe45d43FEb3F65B4587510A68722450b629154e6f',
           status: 1,
           to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
           transactionHash: '0x28e3b29d664593fa382caa736d5418a426567abf4271b747d467144b31cd26ce',
           transactionIndex: 12
         },
         confirmedTime: 1629128357461
       }
     }
   }
   ```

## ApproveToken

### 涉及的源码

- `useApproveCallback`: `src/hooks/useApproveCallback.ts`
- `useTokenAllowance`: `src/data/Allowances.ts`
- `useHasPendingApproval`: `src/state/transactions/hooks.tsx`

详细代码解析请戳这里 :point_right: [Transaction 代码解析](./Code.md#Approve)

### init state

```js
transactions: {
},
application: {

}
```

### 操作流程

1. 在需要 token 授权的场景，程序会自动获取 allowance 数量判断是否需要发起 approve
2. 调用 `useApproveCallback` 有两个返回
   - `approvalState` 当前 token 对于 router 合约的 approve 状态
   - `approve` 向 token 发起 approve 的方法
3. `useApproveCallback` 的运行过程：
   - 向 token 发送 multicall 调用查询对于 router 合约的 allowance 数量
   - 如果数量不足，会先检查 transaction state 是否有 pending 状态的 approve 请求
   - approve 状态有四种： `UNKNOWN`, `NOT_APPROVED`, `PENDING`, `APPROVED`
   - 内部详细的执行过程可以看[useApproveCallback 的代码解析](./Code.md#useApproveCallback)
4. 当用户点击 Approve 按钮，会调用上一步返回的 approve 方法

   - approve 的执行方法有两种模式，一个是最大数量授权，一个是精确数量的授权，会预执行前者若失败则执行后者
   - 交易发送成功，向 transactions state 推送交易信息，以便追踪交易结果

   ```js
   transactions: {
    '0xd5c0fc192774b5a6d7ac7eb5e1937096909aca9ba78454386a371b6876fab611': {
        hash: '0xd5c0fc192774b5a6d7ac7eb5e1937096909aca9ba78454386a371b6876fab611',
        approval: {   //  相比swap交易多了approval字段
          tokenAddress: '0x6583989a0b7b86b026e50C4D0fa0FE1C5e3e8f85',
          spender: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
        },
        summary: 'Approve HH',
        from: '0xe45d43FEb3F65B4587510A68722450b629154e6f',
        addedTime: 1629196516760
      }
    }
   ```

5. 交易确认，显示提示弹窗

   ```js
   transactions: {
     '4': {
      '0xd5c0fc192774b5a6d7ac7eb5e1937096909aca9ba78454386a371b6876fab611': {
        hash: '0xd5c0fc192774b5a6d7ac7eb5e1937096909aca9ba78454386a371b6876fab611',
        approval: {
          tokenAddress: '0x6583989a0b7b86b026e50C4D0fa0FE1C5e3e8f85',
          spender: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
        },
        summary: 'Approve HH',
        from: '0xe45d43FEb3F65B4587510A68722450b629154e6f',
        addedTime: 1629196516760,
        lastCheckedBlockNumber: 9130389,
        receipt: {   // 交易结果字段
          blockHash: '0xb191afae62ee3625ac2f388fcb44a14c3ad9448ec93db0fc5bd65388bc30c5f1',
          blockNumber: 9130390,
          contractAddress: null,
          from: '0xe45d43FEb3F65B4587510A68722450b629154e6f',
          status: 1,
          to: '0x6583989a0b7b86b026e50C4D0fa0FE1C5e3e8f85',
          transactionHash: '0xd5c0fc192774b5a6d7ac7eb5e1937096909aca9ba78454386a371b6876fab611',
          transactionIndex: 12
        },
        confirmedTime: 1629196539067
      }
     }
   },
   application: {
     ...
     // 显示交易成功的提示弹窗
      popupList: [
      {
        key: '0xd5c0fc192774b5a6d7ac7eb5e1937096909aca9ba78454386a371b6876fab611',
        show: true,
        content: {
          txn: {
            hash: '0xd5c0fc192774b5a6d7ac7eb5e1937096909aca9ba78454386a371b6876fab611',
            success: true,
            summary: 'Approve HH'
          }
        },
        removeAfterMs: 15000
      }
    ],
   }
   ```

## AddLiquidity

## RemoveLiquidity
