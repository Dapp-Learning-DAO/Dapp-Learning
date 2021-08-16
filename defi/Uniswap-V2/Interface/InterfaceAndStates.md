# Interface and States

> V2 的用户交互流程及状态变化<br>
> 追踪交互动作与状态数据变化的关系，可以帮助我们更好的理解程序运行的逻辑

## 准备工作

### 分析工具

下面是两个react官方的chrome插件，用于辅助开发react应用

- ReactDeveloperTools 快速定位组件在源码中的位置
- ReduxDevTools 追踪程序运行过程中redux状态的变化

### 演示环境和相关数据

- rinkeby 测试网络
- 测试网 DAI `0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735`
- 自定义 token HEHE(HH) `0x6583989a0b7b86b026e50C4D0fa0FE1C5e3e8f85`
- LPtoken `0x25c1CF39598DdD67bD68cA9e52f0c861D9Bf4c70`

详细请戳这里 :point_right:[Interface 技术栈详细图示](./InfoList.md)


## 添加自定义 token

在token列表中添加新的token

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
2. `CurrencySearch` 的 `searchQuery` 被赋值为自定义token地址，其值产生变化，触发 `useToken` 获取token的信息
3. `useToken` 首先会在已有的tokenlist中查找，如果有则直接返回token信息
4. 找不到已有信息，会调用 `useSingleCallResult` 请求自定义token合约的 `name` `symbol` 和 `decimals` 字段，这里返回 'HEHE'  'HH' 和 1
    - `useSingleCallResult` 是调用multicall合约的方法
    - 在state中可以看到callResults新增了三条数据，其键的组成格式为 `{contract address}-{methodid}`
    - 对照[methodid列表](./InfoList.md#ERC20)查询methodid可以验证其对应的正是合约的三个getter函数 `name()` `symbol()` `decimals()`
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
5. `CurrencySearch` 拿到token信息，判断其不在已有列表中，固显示 import 按钮
6. 用户点击 import，再次确认之后，触发user state 的 `user/addSerializedToken` 事件，添加新的自定义token

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

7. 用户自定义的设置，远程请求的token list 等信息都会被缓存到浏览器的 storage 中长期保存，加速以后的访问速度，即第二次进入时，自定义token无须再次import

## create pair

## AddLiquidity

## Swap

## RemoveLiquidity
