# Block-based Funding Payments

> [《Block-based Funding Payment On Perp v2》 by 田少谷 Shao](https://blog.perp.fi/block-based-funding-payment-on-perp-v2-35527094635e)

> [《How Block-based Funding Payments are Implemented On Perp v2》 by 田少谷 Shao](https://blog.perp.fi/how-block-based-funding-payment-is-implemented-on-perp-v2-20cfd5057384)

## Intro

由 Bitmex 发明的永续合约是加密领域最受欢迎的创新之一。通过引入 funding 机制，可以将其视为定期结算时间表，期货没有到期日，taker 因此可以减少对时间因素的担忧，而专注于价格投机。

与 Perp v1 中的每小时资金相比，Perp v2 有一个新的 funding 机制：基于区块的 funding，它为每笔交易结算 funding payment (**block-based funding, which settles funding payments on each trade**)。

## Funding Rate & Payment

```math
Premium = Mark Price - Index Price
Funding Rate = Premium / Index Price = (Mark - Index) / Index
```

- `Mark price` perp 市场的交易价格，是 virtual token 交易对的 uniswap v3 pool 的 `Mid price on Uniswap`, 即 该交易对所有交易池子（不同费率）的平均价格
- `Index price` 是通常来自其他交易所的参考价格；包括 Chainlink 等价格预言机
- `Premium` 是前两者价格之差

`Funding Rate` 本质上是衡量标记价格与指数价格的偏离程度。

funding payment:

```math
Position Value = Position Size * Index Price
Funding Payment = Position Value * Funding Rate
                = Position Size * Index * Premium / Index
                = Position Size * Premium
```

假设 Alice 想要开 1ETH 多仓，此时 `Mark price = 4200`, 而 `Index price = 4000`。`Funding rate = (4200 — 4000) / 4000 = 5%`, Alice 需要支付 `funding payment = 4000 * 0.05 = 1 * (4200 - 4000) = 200`。那么这笔钱向谁支付？

- When `funding rate > 0`, long pay shorts
- When `funding rate < 0`, shorts pay long

由于 Alice 开了多仓，所以需要向做空一方支付 200.

注意不需要现金结算，常见的做法是生成收款凭证 receipt。

## Periodic Funding

在上述例子中，我们需要多久统计一次付费情况？将 `Funding Rate` 作为一天的支付费率。在 Bitmex 的设计中，每 8 小时收取一次 funding ，一天收费频率是 3 。如果像 FTX 一小时收取一次，则频率为 24。

如果 taker 总是在两次收费之间完成开仓平仓，就会逃过 funding 的收取。

## Block-based Funding

Block-based Funding 机制，是每当交易发生时，无论多头还是空头，资金都会被结算。公式几乎相同，只是资金间隔稍作修改：

```math
Funding Rate = (Premium / Index Price) * Δtime / 1 day
```

在每笔交易时触发 funding 的计算，`Δtime` 是两笔交易之间的间隔，以秒计算 (基于 `block.timestamp`)，一天则是 `60 * 60 * 24 = 86400 seconds`。

`Funding Interval = Δtime / 1 day`

每次新交易时，都会记录自上次交易以来的新 funding rate。通过这种机制，就能杜绝逃避 funding 的行为。

然而代码实现上不能真的每一笔交易都去计算一下新的 funding rate，会极其消耗 gas

| Time | Funding rate | Index price |
| ---- | ------------ | ----------- |
| 1000 | 0.5%         | i0          |
| 1030 | 0.2%         | i1          |
| 1045 | 0.4%         | i2          |
| 1100 | 0.3%         | i3          |

假设 taker 在价格 1000 时开仓，头寸价值 S，`funding payment` :

```math
S * (
    (1030 - 1000) * 0.2% * i1)   // funding payment for (1000, 1030)
    + (1045 - 1030) * 0.4% * i2) // funding payment for (1030, 1045)
    + (1100 - 1045) * 0.3% * i3) // funding payment for (1045, 1100)
)
```

将 S 与 `Index price` 相乘的原因是为了得到 `Position value` ，因为 `Funding Payment = Position Value * Funding Rate`。

在 solidity 中需要记录两个累计值，一个全局的 cumulative global funding growth，第二个累计值是单个用户的。

另一个难点在于流动性提供者的头寸规模可能不断的变化，导致 S 的值也不是固定的，如何准确的衡量 S 。

## Funding Payments for Makers

Perp v2 的 maker 是一个全新的角色，不曾在 Perp v1 中出现过。在传统订单簿交易所中，maker 作为 LP，是 taker 的对手盘，他们将收到对方的 funding payment。

假如市场中只有一位 taker 和一位 maker，如果 taker 开 1 个多仓，意味着 maker 开 1 个空仓。

与订单簿交易所唯一的不同是 AMMs 是被动做市的。一旦 maker 将他们的流动性置于池中，将只能被动的做市，无法决定以何种价格交易。

因此，taker 和 maker 执行 funding payment 的最大区别在于，taker 的头寸规模仅在头寸的每一次操作中发生变化。每次 taker 修改头寸时，我们都可以结算之前的 funding payment，并为即将到来的 funding payment 更新头寸规模。

然而，maker 的头寸规模不仅会随着增加或移除流动性而改变。只要他们的流动性处于 range/active 状态，这意味着**流动性当前被 taker 利用，maker 的头寸规模就会根据 taker 持有的头寸规模不断变化**。

## Cumulative Funding Payments for Takers

我们将刚才累计的例子转换成数学表达：

| Time | Funding rate | Index price |
| ---- | ------------ | ----------- |
| t0   | f0           | i0          |
| t1   | f1           | i1          |
| t2   | f2           | i2          |
| t3   | f3           | i3          |

```math
S * (
    (t1 - t0) * f1 * i1)   // funding payment for (t0, t1)
    + (t2 - t1) * f2 * i2) // funding payment for (t1, t2)
    + (t3 - t2) * f3 * i3) // funding payment for (t2, t3)
)
```

上述是 maker 的头寸规模没有发生变化时的情况，那么如果期间发生变化了呢？例如在 t1 时刻从 S 变成了 S'

```math
S  * (t1 - t0) * f1 * i1 +    // (t0, t1) with size S
S' * ( (t2 - t1) * f2 * i2)   // (t1, t2) with size S'
     + (t3 - t2) * f3 * i3) ) // (t2, t3) with size S'
```

一个阶段的 funding payment 是 头寸规模 S 乘以 `Δtime * Index price * Funding Rate`，前提是 头寸规模 S 期间不回发生改变。

$
\sum_{t=1}^{t'}{S_t*I_t*F_t*(\delta(t)-\delta(t-1))}
$

- S: position size
- I: index price
- F: funding rate
- δ(t): timestamp of t; δ(t)- δ(t — 1) is the time difference

### Spec

- 每当头寸发生变化时，应结算自上次交易以来累积的 funding payment 并更新头寸规模
- 存储全局变量 G 作为 `Δtime * Index price * Funding Rate` 的**累计值**
  - 该全局变量需要在每笔交易时触发更新；
  - 同样，由于 `Index Price * Funding Rate = Premium`, G 还可以表达为 $\sum{time}(\delta time * Premium)$
- 当 taker 开启头寸或修改其规模，记录每一个 taker 的累计值 E 将被当时的全局累计值 G 赋值 `E = G`
- 一段时间后，taker 的 funding payment 是 `S * (G' - E)`, G‘ 是当前的全局累计值

目前计算 taker 的 funding payment 还比较简单，接下来看看 maker 的计算。

## Cumulative Funding Payments for Makers

计算 maker 的 funding payment 难点在于如果他们的头寸处于 active/currently 状态，流动性被 taker 使用，那么 maker 的头寸规模会一直受价格影响而变化（本质上是 Uniswap v3 做市价格区间内，资产比例随价格变化）。

### How Perp v2 Builds on Uniswap v3

## Reference

- Block-based Funding Payment On Perp v2: <https://blog.perp.fi/block-based-funding-payment-on-perp-v2-35527094635e>
- How Block-based Funding Payments are Implemented On Perp v2: <https://blog.perp.fi/how-block-based-funding-payment-is-implemented-on-perp-v2-20cfd5057384>
