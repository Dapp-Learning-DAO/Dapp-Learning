# Perpetual V2

「Curie」的颠覆性创新正是摆脱流动性依赖的关键，能够更大的提升资金的使用效率,将永续协议的 vAMM 模型与 Uniswap V3 耦合，经济模型与机制逻辑放在永续协议上，通过 Uniswap V3 进行交易的执行层。

## 合约地址
[合约结构](https://perp.notion.site/Curie-Docs-for-Partners-a2c316abfc1549c7b4d6e310d7a3987d#c20cf392b22142c3b33fa7e48b293c68) 
Smart contract addresses list: <https://v2docs.perp.fi/for-developers/smart-contract-addresses>

optimistic address:

- Exchange proxy `0xbd7a3b7dbeb096f0b832cf467b94b091f30c34ec`
- Clearinghouse proxy `0x82ac2ce43e33683c58be4cdc40975e73aa50f459`
- Vault proxy `0xad7b4c162707e0b2b5f6fddbd3f8538a5fba0d60`
- Insurance Fund proxy `0x1C9a192DF3936cBF093d8afDc352718bCF834EB6`

## 设计方案

- Perp V2 的聚合流动性依托于 Uniswap V3，V1 中原有的 vAMM 逻辑在 Uniswap V3 上运行。提高资金利用率。

- Perp V1 版本 USDC 是真实资产，而对应资产（ETH）是 vault 池子是虚拟的。
  Perp V2 在 Uniswap V3 上以 v-Token 创建池子，比如 vUSDC/vETH，v-token 是 Perpetual Protocol 系统生成的代币，目前仅用于 Perp 系统内的做市和交易等，这些池子真实的建立在目前的 Uniswap 架设在 Optimistic 的 Uniswap V3 上，pool 是真实的 Uniswap v3 pool (vToken 交易对)。

- Perp v1 中不需要做市（没有 maker ）， Perp V2 中为 LP 提供杠杆，称为「Leveraged LPs」（杠杆 LP）
  若 LP 向清算所（Clearing House）提供 1,000 USDC 进行做市，则 Leveraged LPs 功能可以在 10 倍范围内添加 vUSDC，这 10,000 vUSDC 就成为 LP 可以在系统内放置流动性的总额度（也称为“信用”），LP 可以将其添加到相应资产和区间上，比如可以分为 5,000 vUSDC 和价值 5,000 vUSDC 的 vETH，添加到相应流动性池中。（按 oracle 价格兑换）
  在 LP 确定了对相应资产的分配额度后，系统铸造相应 v-token，按照上述例子，系统铸造 5,000 vUSDC 和价值 5,000 vUSDC 的 2 vETH（按照 ETH 价格 2,500 美金计算），LP 可以按照自己的做市策略将这些 v-token 分配到 Uniswap V3 上的相应区间。

## Perp V2 Technical Details

> Perp V2 Technical Details: <https://docs.google.com/document/d/e/2PACX-1vRDdN03IvJFRMLolxBl4Np7OpzmniMXmJO0zQJNmndD1vL3YZ46bVgTc9VTy8KdCD4ZrnwYz7agbJJN/pub>

### V2 changes

![V1 vs V2 Architecture](https://lh4.googleusercontent.com/RzvqmS7m0ewJxQW2dXy4_deYZd2fJDkUjjHZpPR215wlR6fsnwWN4lU2nvtmJRBPT1Ug2qxmFyCBDbiHGsZleRyVY8UcnSdnjUM06LVq_0fN9gBH8x9qPFJ5CfhJBz2eJeMWOtfFmlhH5x4Xug)

V1 vs V2 Architecture

由于 V2 相较于 V1 最大的改动在于 vAMM 替换成了 Uniswap V3，所以用于记账的 virtual tokens (例如 vUSDC, vETH) 从原先的全价格区间分布，变成了不同价格区间的分布 (本质上就是 Uni V2 和 V3 的差别)。

其他的不同：

- limit order 现价单
- cross margin 交叉保证金（多头寸共用抵押资产）

### Scenario 1 - Taker Opens a Long Position

![V2 Alice opens a Long Position](https://lh3.googleusercontent.com/M0zPnKBHu0C7s93PrTP3qvULoz2vnqYEuC8EkJ0PPwDLZ_N8w_d3UaObMZ5Ok3x7SJHRsgiX3splorrk59yCLgPaAKR5aXbJF4tIiQsf0WIVbLizJgh3L_3o3Ts8GkPJ1VWD8P8Kf9KZW0cN8w)

Cleaninghouse 在 Alice 开仓时做了以下操作：

1. `Mint virtual tokens` Alice 做多，所以 mint vUSDC，如果她做空，mint vETH
2. `Store a cost basis` cost basis 是计算 Alice 实际损益情况的一个重要概念
3. `Swap tokens` Clearinghouse 将相应的 virtual tokens 进行 swap (from vUSDC to vETH)

此时 Alice 拥有：

- 1.96 vETH (由 Clearinghouse 保管)
- Cost basis 200 vUSDC (开仓的基础成本 vToken)
- Vault 中存入了 100 USDC (真正投入的 token)

假设一段时间后 ETH 价格已经上涨，Alice 想要平仓。

![V2 Alice closes her Long Position](https://lh6.googleusercontent.com/bG6HMcjmo0ZpOQH5vcKoSCZv_9NLM92HHTXwHYWfUtJ9VLAroxBycedED0g_FzokopKTAjzzriV-b5jNre0U-03Mtp_pjKCrQhvmd2PDP3gqdOQNGzIkP_UontkDu4UnK_yEZu_rRIwAQ9m4Iw)

最终 Alice 的 PnL (Profit and Loss) 是她持有的 vUSDC 减去她在 vUSDC 中的 cost basis 。最后，Vault 将她的抵押品连同她的 PnL 转回 Alice：

- `PnL = vUSDC - cost basis = 220 - 200 = 20`
- `Alice receives = collateral + PnL = 100 + 20 = 120`

### Providing Liquidity

不同于 v1，做市商提供流动性需要选择做市的价格区间(Uniswap V3 的区间做市机制)，分三种情况：

1. 价格区间低于当前价格，market maker 提供的都是 vUSDC，相当于在该价格区间挂出买单
2. 价格区间包含当前价格，market maker 同时提供 vUSDC, vETH, 根据当前价格决定两者的比例
3. 价格区间高于当前价格，market maker 提供的都是 vETH，相当于在该价格区间挂出卖单

### Scenario 2 - Providing Liquidity Above Mark Price

Alice 希望用 100 USDC 做市，以 2x 杠杆在高于当前价格的区间提供流动性：

![V2 Alice Provides Liquidity above the current price](https://lh3.googleusercontent.com/MXI4pJnDNod-GY6jQdo7cAiKBNp8yfxgR8qLjEXT_GIaDYvKEQSvsb0UsGW8UPbB1zwdEPuTOFH0in9itCSZoD4FgB4O3qk17NF6W_pFGsx1_qAqeF0ZMS9KaEAMRmncctwu8FiVvGscr3VUhw)

Clearinghouse 将会 mint vETH 并将其注入 Uni v3 AMM。简单起见，我们假设 Alice 是唯一的流动性提供者，后来 Bob 做多 1.96 vETH，将 200 vUSDC 存入池中并获得 1.96 个 vETH。 Alice 现在只有 0.04 个 vETH，但持有 200 个 vUSDC。

假设在以下场景中 Alice 是唯一流动性提供者。对于常规情况，不止一位流动性提供者（market maker），Alice 的头寸将与其他流动性提供者按比例提供流动性。

| Action                   | Alice        |               |               |                | Bob          |               |               |                |
| ------------------------ | ------------ | ------------- | ------------- | -------------- | ------------ | ------------- | ------------- | -------------- |
|                          | vETH Balance | vUSDC Balance | vETH Movement | vUSDC Movement | vETH Balance | vUSDC Balance | vETH Movement | vUSDC Movement |
| Alice provides liquidity | 2            | 0             | \-            | \-             | \-           | \-            | \-            | \-             |
| Bob longs 1.96 ETH       | 0.04         | 200           | \-1.96        | +200           | 1.96         | 0             | +1.96         | \-200          |

值得注意的是，Alice 现在拥有一个 -1.96 ETH 头寸(因为她拥有 0.04 vETH 和 cost basis 2 vETH)。她仍可以继续提供流动性，随着交易者与她提供的流动性买卖，她的头寸组成数量 (vETH, vUSDC) 也将发生变化。

对于不想做市而只想下限价单的用户，这里还有一个额外的选择。假设 Alice 只想挂出一个限价单卖出 ETH 但不想做市，可以等她的限价单完成后撤出流动性。

### Scenario 3 - Adding Liquidity Around the Mark Price

与 Scenario 2 稍有不同, Alice 提供流动性的价格区间包含当前价格

![V2 Alice provides Liquidity within the current bounts](https://lh4.googleusercontent.com/1E-flO5PncNQhU2LOliKhO6v_2srOTgxiT_5Kf5UgPzUCJPTmwfxMS0Wv2xfAv8_stwcBOr6GT_BWCOnW6Tr2J1qnd8wq_InUHWwke5o7q8AZMqF2Yb4Ylf6QZEoU9zFg074M9L3lLIpFeOXKg)

此时 Alice 提供流动性相当于同时挂出了一部分买单和一部分卖单， Clearninghouse 同时 mint vETH 和 vUSDC。注意，Alice 想以 2x 杠杆参与做市，我们不是直接mint 2 vETH，而是 1 vETH 和 100 vUSDC (假设 1 ETH = 100 USDC，两者价值之和为 200 vUSDC)。

## Funding Payment

-[Block-basedFundingPayments.md](./Block-basedFundingPayments.md)

## Reference

- A Complete Guide to Perpetual Protocol V2: <https://blocmates.com/blogmates/perpetualprotocol/>
- Perpetual Protocol v2: <https://blog.perp.fi/perpetual-protocol-v2-is-live-on-optimism-mainnet-5b9520bc02a2>
- LP 做市：<https://perp.com/lp>
- 永续合约套利：<https://open.163.com/newview/movie/courseintro?newurl=M8DOH67K8>
- V2 notion 文档：<https://v2docs.perp.fi/for-makers/use-a-strategy-provider>
- Perp V2 gitbook: <https://perpetual-protocol.github.io/lushan-docs/docs/ContractOverview>
- Curie Docs for Partners: <https://perp.notion.site/Curie-Docs-for-Partners-a2c316abfc1549c7b4d6e310d7a3987d>
