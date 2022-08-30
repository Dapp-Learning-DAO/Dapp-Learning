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

- `CurrencySearch`: src/components/SearchModal/CurrencySearch.tsx
- `useToken`: src/hooks/Tokens.ts
- `useSingleCallResult`: src/state/multicall/hooks.ts

### initial state

```ts
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

   ```ts
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

   ```ts
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

- `SwapPage`: src/pages/Swap/index.tsx
- `CurrencySearchModel`: src/components/SearchModal/CurrencySearchModel.tsx
- `CurrencyList`: src/components/SearchModal/CurrencyList.tsx
- `useCurrencyBalance`: src/state/wallet/hooks.ts
- `useSwapActionHandlers`, `useDerivedSwapInfo`: src/state/swap/hooks.ts
- `useTradeExactIn`, `useTradeExactOut`, `useAllCommonPairs`: src/hooks/Trades.ts

详细代码解析请戳这里 :point_right: [Swap 代码解析](./Code.md#Swap)

### init state

```ts
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

   ```ts
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

   ```ts
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

- `useTransactionAdder`: src/state/transactions/hooks.tsx
- `TransactionReducer`: src/state/transactions/reducer.ts
- `userTransactionAdder`: src/state/transactions/reducer.ts
- `TransactionUpdater`: src/state/transactions/updater.ts

详细代码解析请戳这里 :point_right: [Transaction 代码解析](./Code.md#Transaction)

### init state

```ts
transactions: {
}
```

### 流程

1. 接着看 Swap 部分的后续，发送交易后，会向 transaction state 添加交易记录

   ```ts
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

   ```ts
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

- `useApproveCallback`: src/hooks/useApproveCallback.ts
- `useTokenAllowance`: src/data/Allowances.ts
- `useHasPendingApproval`: src/state/transactions/hooks.tsx

详细代码解析请戳这里 :point_right: [ApproveToken 代码解析](./Code.md#Approve)

### init state

```ts
transactions: {
},
application: {

}
```

### 交互流程

1. 在需要 token 授权的场景，程序会调用 `useTokenAllowance` 根据返回的 allowance 数量判断是否需要发起 approve
2. 调用 `useApproveCallback` 有两个返回
   - `approvalState` 当前 token 对于 router 合约的 approve 状态
   - `approveCallback` 向 token 发起 approve 的方法
3. `useApproveCallback` 的运行过程：
   - 向 token 发送 multicall 调用查询对于 router 合约的 allowance 数量
   - 如果数量不足，会先检查 transaction state 是否有 pending 状态的 approve 请求
   - approve 状态有四种： `UNKNOWN`, `NOT_APPROVED`, `PENDING`, `APPROVED`
   - 内部详细的执行过程可以看[useApproveCallback 的代码解析](./Code.md#useApproveCallback)
4. 当用户点击 Approve 按钮，会调用上一步返回的 approveCallback 方法

   - approve 的执行方法有两种模式，一个是最大数量授权，一个是精确数量的授权，会预执行前者若失败则执行后者
   - 交易发送成功，向 transactions state 推送交易信息，以便追踪交易结果

   ```ts
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

   ```ts
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

## PoolList

### 涉及的源码

- `PoolPage`: src/pages/Pool/index.tsx
- `useTrackedTokenPairs`: src/state/user/hooks.tsx
- `useMultipleContractSingleData`: src/state/multicall/hooks.ts

详细代码解析请戳这里 :point_right: [PoolList 代码解析](./Code.md#PoolList)

### init state

```ts
multicall: {
  callListeners: {},
  callResults: {},
}
```

### 交互流程

1. 进入 pool 页面，会自动索引常用的 pool 和用户自定义的 pool
2. `useTrackedTokenPairs` 会生成一个需要追踪的 pair 列表，筛选条件如下
   - 置顶交易对(每次必查的 Pool 列表)
     - 只有主网有置顶交易对：[cDAI, cUSDC], [USDC, USDT], [DAI, USDT]
   - 根据 base token 和所有 token 配对(仅限界面中的 token 列表)
     - base token 内至少包含 WETH
     - 主网还有 DAI, USDC, USDT, WBTC
   - 用户自定义的 pair(User State 中的 pairs 字段)
3. 根据追踪列表遍历请求用户在 pair 合约中的余额(ERC20)

   - 调用 sdk 的 `Pair.getAddress(tokenA, tokenB)` 本地计算 pair 地址，然后将 pair 作为 ERC20 合约对象
   - 生成 pair 地址列表，使用 Multicall 模块的 `useMultipleContractSingleData` 方法，批量调用所有 pair 合约的 `balanceOf` 方法
   - 在 callListeners 中可以看到添加的追踪记录
   - 键的格式为 `{pairAddress}-{methodid}{calldata}`, 0x70a08231 是 `balanceOf` 的 methodid

   ```ts
   multicall: {
     // 批量调用balanceOf方法，调用监听器推入记录
     callListeners: {
       ...
       // HH-WETH
       '0x25c1CF39598DdD67bD68cA9e52f0c861D9Bf4c70-0x70a08231000000000000000000000000e45d43feb3f65b4587510a68722450b629154e6f': {
         '1': 1
       },
       // UNI-WETH
       '0x4E99615101cCBB83A462dC4DE2bc1362EF1365e5-0x70a08231000000000000000000000000e45d43feb3f65b4587510a68722450b629154e6f': {
         '1': 1
       },
       // WETH-MKR
       '0x80f07c368BCC7F8CbAC37E79Ec332c1D84e9335D-0x70a08231000000000000000000000000e45d43feb3f65b4587510a68722450b629154e6f': {
         '1': 1
       },
       // WETH-DAI
       '0x8B22F85d0c844Cf793690F6D9DFE9F11Ddb35449-0x70a08231000000000000000000000000e45d43feb3f65b4587510a68722450b629154e6f': {
         '1': 1
       },
       ...
     },
     callResults: {},
   }
   ```

4. 返回查询结果，推入 callResults，目前只有 `HH-WETH` 池子有余额

   ```ts
   multicall: {
     callListeners: {
       ...
     },
     callResults: {
       ...
       // HH-WETH
       '0x25c1CF39598DdD67bD68cA9e52f0c861D9Bf4c70-0x70a08231000000000000000000000000e45d43feb3f65b4587510a68722450b629154e6f': {
         data: '0x00000000000000000000000000000000000000000000000000000004ae1d0ecd',
         blockNumber: 9134264
       },
       // UNI-WETH
       '0x4E99615101cCBB83A462dC4DE2bc1362EF1365e5-0x70a08231000000000000000000000000e45d43feb3f65b4587510a68722450b629154e6f': {
         data: '0x0000000000000000000000000000000000000000000000000000000000000000',
         blockNumber: 9134264
       },
       // WETH-MKR
       '0x80f07c368BCC7F8CbAC37E79Ec332c1D84e9335D-0x70a08231000000000000000000000000e45d43feb3f65b4587510a68722450b629154e6f': {
         data: '0x0000000000000000000000000000000000000000000000000000000000000000',
         blockNumber: 9134264
       },
       // WETH-DAI
       '0x8B22F85d0c844Cf793690F6D9DFE9F11Ddb35449-0x70a08231000000000000000000000000e45d43feb3f65b4587510a68722450b629154e6f': {
         data: '0x0000000000000000000000000000000000000000000000000000000000000000',
         blockNumber: 9134264
       },
     },
   }
   ```

5. V1 的池子查询，提示用户升级池子

   - 以上是 V2 的查询流程，程序中还会查看 V1 的池子
   - V1 的查询比较简单，因为所有交易对都是 tokne 和 ETH 的配对
   - 直接从 v1factory 合约调用 `getExchange` 方法，拿到所有交易对然后去遍历查询余额
   - 筛选出第一个有余额的 V1 池子，即判断用户有无 V1 池子
   - 如果有，界面上会提醒用户升级到 V2

6. 筛选出有余额的池子，展示池子列表

## AddLiquidity

用户向池子添加流动性，若池子不存在会直接创建

### 涉及的源码

- `AddLiquidityPage`: src/pages/AddLiquidity/index.tsx
- `useMintState`, `useDerivedMintInfo`, `useMintActionHandlers`: src/state/mint/hooks.ts
- `onAdd`: src/pages/AddLiquidity/index.tsx

详细代码解析请戳这里 :point_right: [AddLiquidity 代码解析](./Code.md#AddLiquidity)

### init state

```ts
mint: {
  independentField: 'CURRENCY_A',
  typedValue: '',
  otherTypedValue: ''
},
multicall: {},
transactions: {}
```

### 交互流程

1. 进入`./add`路由，首先会解析路由后跟的参数，自动加载 token 信息（地址，余额等等）
   - 路由后的参数是由 token 地址组成的分三种情况：
     - 没有 token
     - `/{tokenA_Address}`
     - `/{tokenA_Address}/{tokenB_Address}`
2. 用户输入数量 `inputAmountB`，`useMintState` 返回用户的输入

   - 输入框打字会触发 `mint/typeInputMint` 事件，Mint state 更新状态

   ```ts
   // 用户在第二个输入框输入10
   mint: {
     independentField: 'CURRENCY_B', // 变为CURRENCY_B
     typedValue: '10',
     otherTypedValue: ''
   },
   ```

3. 判断输入数值是否超过了 token 的授权数量，此时会向 token 合约发送查询对于 router 合约的 allowance，approve 过程 [参见 ApproveToken](#ApproveToken)

4. 输入数值的变化触发 `useDerivedMintInfo` 自动计算另一侧 token 需要输入的数量及预测用户能得到的流动性数量

   - 调用 sdk 的 `@uniswap/sdk/Pair.getAddress(tokenA, tokenB)` 本地计算出池子地址
   - 使用 Multicall 模块的 `useSingleCallResult` 查询池子合约的 `totalSupply` 方法，得到池子的流动性总数量

     ```ts
     // 调用 totalSupply 方法
     multicall: {
       '4': {
         callListeners: {
           ...
           // HH-ETH pair 地址 - totalSupply methodid
           '0x25c1CF39598DdD67bD68cA9e52f0c861D9Bf4c70-0x18160ddd': {
             '1': 2
           }
         }
       }
     }
     ```

     ```ts
     //  得到 totalSupply 结果
     multicall: {
       '4': {
         callResults: {
           ...
           '0x25c1CF39598DdD67bD68cA9e52f0c861D9Bf4c70-0x18160ddd': {
             data: '0x00000000000000000000000000000000000000000000000000000004ae1d12b5',
             blockNumber: 9134820
           },
         }
       }
     }

     ```

   - 判断该池子是否未创建或流动性数量为 0
   - @uniswap/v2-sdk/TokenAmount 类型包装输入数值
   - 调用 sdk 计算数值计算另一侧的数量

     - @uniswap/v2-sdk/Pair.priceOf(token).quote(inputAmount)
     - 首先 `priceOf()` 得到价格
     - 用价格 \* 当前的输入数值 = 另一侧 token 的数量， 输入 tokenB，就用 priceA，反之亦然
     - 这里解释一下公式，假设用户输入了 `inputAmountB` 求 `inputAmountA`

     ```math
     // 价格就是两个token总量的比值
     priceA = reserveB / reserveA
     // 保证新增比例一样，才能保持池子的价格不变
     inputAmountB / reserveB = inputAmountA / reserveA
     // 于是我们就能求inputAmountA
     inputAmountA = inputAmountB / reserveB * reserveA = inputAmountB * priceA
     ```

   - 计算当前池子的价格，显示在界面上
   - 计算用户预计可以得到的流动性数量
     - @uniswap/v2-sdk/Pair.getLiquidityMinted()
     - 本地计算用户预计能够得到的流动性数量
     - 将两种 token 数量分别带入公式计算，取最小值
     - liquidity = inputAmount / reserve \* totalLiquidity
     - 如果是新建池子则 inputAmountA \* inputAmountB - MINIMUM_LIQUIDITY

5. 用户点击 `Supply` 按钮添加流动性，点击确认弹窗
6. `onAdd()` 先预执行交易，再真实发送添加流动性的交易

   - 根据用户设置的滑点百分比计算最少需要添加的 token 数量(少于这个数量会添加失败)
   - 分析 token 种类，包含 eth 调用 router 合约的 `addLiquidityETH` ，其他调用 `addLiquidity`
   - 合成调用参数，token 地址需要升序排列
   - 打开交易进行中的提示弹窗
   - 将交易记录推入 Transaction State ，监听交易结果
   - 这里会忽略错误码为 4001 的交易报错，这代表用户在钱包确认阶段拒绝了交易

   ```ts
   transactions: {
     '4': {
       '0x618820509d3d93a9fab799322a1671e2efed7c9c0273d673ea834be7f93a721f': {
         hash: '0x618820509d3d93a9fab799322a1671e2efed7c9c0273d673ea834be7f93a721f',
         summary: 'Add 0.102 ETH and 100 HH',
         from: '0xe45d43FEb3F65B4587510A68722450b629154e6f',
         addedTime: 1629266981813,
         lastCheckedBlockNumber: 9135086
       }
     }
   }
   ```

7. 交易确认，用户收到确认提示窗

   ```ts
   transactions: {
     '4': {
       '0x618820509d3d93a9fab799322a1671e2efed7c9c0273d673ea834be7f93a721f': {
           hash: '0x618820509d3d93a9fab799322a1671e2efed7c9c0273d673ea834be7f93a721f',
           summary: 'Add 0.102 ETH and 100 HH',
           from: '0xe45d43FEb3F65B4587510A68722450b629154e6f',
           addedTime: 1629266981813,
           lastCheckedBlockNumber: 9135086,
           // 新增交易结果和确认时间戳
           receipt: {
             blockHash: '0xb1d4344f79f556848ce4221eb614f3d3e163cfa517ea43a09ea92f4a59c88bc0',
             blockNumber: 9135087,
             contractAddress: null,
             from: '0xe45d43FEb3F65B4587510A68722450b629154e6f',
             status: 1,
             to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
             transactionHash: '0x618820509d3d93a9fab799322a1671e2efed7c9c0273d673ea834be7f93a721f',
             transactionIndex: 10
           },
           confirmedTime: 1629267005284
         }
       }
     }
   }
   ```

## RemoveLiquidity

移除流动性

### 涉及的源码

- `RemoveLiquidityPage`: src/pages/RemoveLiquidity/index.tsx
- `useBurnState`, `useDerivedBurnInfo`, `useBurnActionHandlers`: src/state/burn/hooks.ts
- `onAttemptToApprove`, `onRemove`: src/pages/RemoveLiquidity/index.tsx

详细代码解析请戳这里 :point_right: [RemoveLiquidity 代码解析](./Code.md#RemoveLiquidity)

### init state

```ts
burn: {
  independentField: 'LIQUIDITY_PERCENT',  // LIQUIDITY_PERCENT | LIQUIDITY | CURRENCY_A | CURRENCY_B
  typedValue: ''  //  用户的输入数值
},
multicall: {},
transactions: {}
```

### 交互流程

1. 移除流动性在用户输入数据环节和添加流动性不同

   - 移除有两种模式
   - Simple mode : 用户直接拖动滑块控制 `typedValue`
   - Detail mode 有两种种情况：
     - 用户直接输入移除的流动性数量(这里是`HH:WETH`栏)，`independentField` 变成 `LIQUIDITY`
     - 用户直接输入要移除的 token 数量，`independentField` 变成 `CURRENCY_A | CURRENCY_B`

   ```ts
   // 拖动滑块输入百分比
   burn: {
     independentField: 'LIQUIDITY_PERCENT',
     typedValue: '25'
   }
   // 直接输入流动性数量
   burn: {
     independentField: 'LIQUIDITY',
     typedValue: '0.0000000175505'
   }
   // 直接输入tokenA数量
   burn: {
     independentField: 'CURRENCY_A',
     typedValue: '10.6'
   }
   ```

2. 输入的变化会触发 `useDerivedBurnInfo` 更新移除流动性的数据，自动计算要移除的百分比，流动性数量，token 数量

   - 过程和添加流动性类似
   - 主要区别在于区别输入模式不同的三种情况

3. 输入的变化还会导致清空 `signatureData`，这是存储钱包签名的字段，界面会显示两个按钮 `Approve` 和 `Remove`，后者现在是置灰状态

4. 点击`Approve`按钮，调用 `onAttemptToApprove` 生成 v,r,s 签名，存入 `signatureData`，界面显示签名成功状态，此时未发交易

5. 点击`Remove`按钮，调用 `onRemove`，发送移除交易，向 Transaction state 推送交易记录，并监听结果,过程和添加流动性类似

   ```ts
   transactions: {
     '4': {
       '0xc06106f4de3c1192ceccd8fe7692ee48621f87e2d6a37330522546a89c18c366': {
         hash: '0xc06106f4de3c1192ceccd8fe7692ee48621f87e2d6a37330522546a89c18c366',
         summary: 'Remove 49.5 HH and 0.0506 ETH',
         from: '0xe45d43FEb3F65B4587510A68722450b629154e6f',
         addedTime: 1629279660975,
         lastCheckedBlockNumber: 9135930,
         receipt: {
           blockHash: '0xec98d54353ab2f5985837f26d956cead77917e37904397063a757de960b62463',
           blockNumber: 9135932,
           contractAddress: null,
           from: '0xe45d43FEb3F65B4587510A68722450b629154e6f',
           status: 1,
           to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
           transactionHash: '0xc06106f4de3c1192ceccd8fe7692ee48621f87e2d6a37330522546a89c18c366',
           transactionIndex: 9
         },
         confirmedTime: 1629279682092
       }
     }
   }
   ```
