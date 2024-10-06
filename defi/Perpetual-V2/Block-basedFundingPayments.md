# Block-based Funding Payments

> 原文 [《Block-based Funding Payment On Perp v2》 by 田少谷 Shao](https://blog.perp.fi/block-based-funding-payment-on-perp-v2-35527094635e) </br> [《How Block-based Funding Payments are Implemented On Perp v2》 by 田少谷 Shao](https://blog.perp.fi/how-block-based-funding-payment-is-implemented-on-perp-v2-20cfd5057384)

## Intro

由 Bitmex 发明的永续合约是加密领域最受欢迎的创新之一。通过引入 funding 机制，可以将其视为定期结算时间表，期货没有到期日，taker 因此可以减少对时间因素的担忧，而专注于价格投机。

与 Perp v1 中的每小时收取 funding payment 相比，Perp v2 有一个新的 funding 机制：基于区块的 funding，它为每笔交易结算 funding payment (**block-based funding, which settles funding payments on each trade**)。

## Funding Rate & Payment

```math
Premium = Mark Price - Index Price
Funding Rate = Premium / Index Price = (Mark - Index) / Index
```

- `Mark price` perp 市场的交易价格，是 virtual token 交易对的 uniswap v3 pool 的 `Mid price`, 即 该交易对所有交易池子（不同费率）的平均价格
- `Index price` 通常是来自其他交易所的参考价格；包括 Chainlink 等价格预言机
- `Premium` 前两者之差

`Funding Rate` 本质上是衡量 `Mark price` 与 `Index price` 的偏离程度。

`funding payment`:

```math
Position Value = Position Size * Index Price
Funding Payment = Position Value * Funding Rate
                = Position Size * Index * Premium / Index
                = Position Size * Premium
```

假设 Alice 想要开多仓，头寸规模 1ETH，此时 `Mark price = 4200`, 而 `Index price = 4000`。`Funding rate = (4200 — 4000) / 4000 = 5%`, Alice 需要支付 `funding payment = 4000 * 0.05 = 1 * (4200 - 4000) = 200`。那么这笔钱向谁支付？

- When `funding rate > 0`, long pay shorts
- When `funding rate < 0`, shorts pay long

由于 Alice 开了多仓，所以需要向做空一方支付 200.

注意不需要现金结算，常见的做法是生成收款凭证 receipt。

## Periodic Funding

在上述例子中，我们需要多久统计一次付费情况？将 `Funding Rate` 作为一天的支付费率。在 Bitmex 的设计中，每 8 小时收取一次 funding ，一天收费频率是 3 。如果像 FTX 一小时收取一次，则频率为 24。

如果 taker 总是在两次收费之间完成开仓平仓，就会逃过 funding 的收取。

## Block-based Funding

Block-based Funding 机制，是每当交易发生时，无论多头还是空头，funding 都会被结算。公式几乎相同，只是 funding 收取间隔稍作修改：

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

假如市场中只有一位 taker 和一位 maker，如果 taker 开多仓，意味着 maker 开 1 个等值的空仓。

与订单簿交易所唯一的不同是 AMMs 是被动做市的。一旦 maker 将他们的流动性置于池中，将只能被动的做市，无法决定以何种价格交易。

因此，taker 和 maker 执行 funding payment 的最大区别在于，taker 的头寸规模仅在头寸的每一次头寸修改操作中发生变化。每次 taker 修改头寸时，我们都可以结算之前累计的 funding payment，并为即将到来的 funding payment 更新头寸规模。

然而，maker 的头寸规模不仅会随着增加或移除流动性而改变。只要他们的流动性处于 range/active 状态，这意味着**流动性被 taker 利用时，maker 的头寸规模就会根据 taker 持有的头寸规模不断变化**。

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

一个阶段的 funding payment 是 头寸规模 S 乘以 `Δtime * Index price * Funding Rate`，前提是 头寸规模 S 期间不会发生改变。

<!--$\sum_{t=1}^{t'}{S_{t}*I_{t}*F_{t}*(\Delta(t)-\Delta(t-1))}$-->
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><munderover><mo data-mjx-texclass="OP">∑</mo><mrow><mi>t</mi><mo>=</mo><mn>1</mn></mrow><mrow><msup><mi>t</mi><mo>′</mo></msup></mrow></munderover><mrow><msub><mi>S</mi><mrow><mi>t</mi></mrow></msub><mo>∗</mo><msub><mi>I</mi><mrow><mi>t</mi></mrow></msub><mo>∗</mo><msub><mi>F</mi><mrow><mi>t</mi></mrow></msub><mo>∗</mo><mo stretchy="false">(</mo><mi mathvariant="normal">Δ</mi><mo stretchy="false">(</mo><mi>t</mi><mo stretchy="false">)</mo><mo>−</mo><mi mathvariant="normal">Δ</mi><mo stretchy="false">(</mo><mi>t</mi><mo>−</mo><mn>1</mn><mo stretchy="false">)</mo><mo stretchy="false">)</mo></mrow></math>


- S: position size
- I: index price
- F: funding rate
- Δ(t): timestamp of t; Δ(t)- Δ(t — 1) is the time difference

### Spec

- 每当头寸发生变化时，应结算自上次交易以来累积的 funding payment 并更新头寸规模
- 存储全局变量 G 作为 `Δtime * Index price * Funding Rate` 的**累计值**
  - 该全局变量需要在每笔交易时触发更新；
  - 同样，由于 `Index Price * Funding Rate = Premium`, G 还可以表达为 $\sum{time}(\Delta time * Premium)$
- 当 taker 开仓头寸或修改头寸规模，记录每一个 taker 的累计值 E 将被当时的全局累计值 G 赋值 `E = G`
- 一段时间后，taker 的 funding payment 是 `S * (G' - E)`, G‘ 是当前的全局累计值

目前计算 taker 的 funding payment 还比较简单，接下来看看 maker 的计算。

## Cumulative Funding Payments for Makers

计算 maker 的 funding payment 难点在于如果他们的头寸处于 active/currently 状态，流动性被 taker 使用，那么 maker 的头寸规模会一直受价格影响而变化（本质上是 Uniswap v3 做市价格区间内，资产比例随价格变化）。

关于 Uniswap v3 做市的机制详解参见 [UnderstandV3Witepaper](../../defi/Uniswap-V3/whitepaperGuide/understandV3Witepaper.md)

### How Perp v2 Builds on Uniswap v3

在 Perp v2 每一个交易市场都会初始化一个 Uniswap v3 pool，并生成交易对相应的 v-token (virtual token)，概念沿用 Perp v1 vAMM。

所以本质上 Perp v2 的交易市场就是在 Uniswap v3 pool 的基础上增加了一些特性。

- v-token 在 Uniswap v3 pool 中的价格就是 Perp v2 的 `Mark price`
- Perp v2 的开仓做多或者做空，实际上是在 Uniswap v3 pool 的 swap 操作
- Perp v2 的提供流动性，实际上是向 Uniswap v3 pool 提供流动性；别称 range order；

我们将 v-ETH, v-BTC 或者 v-whatever 称之为 **base token**, v-USDC 称之为 **quote token**。

持有正数数量 base token 的用户，就是持有多头头寸；持有负数数量 base token 的用户，即从协议借出 base token 的用户，则持有空头头寸；

假如一位 maker 于 range(3000, 5000) 提供了 1 v-ETH 和 4000 v-USDC 的流动性 , 当时 v-ETH 的 mark price 是 4000。

- 如果价格超过 5000， maker 的流动性还剩 0 v-ETH 和大约 (4000 + 4472) v-USDC
- 如果价格低于 3000，maker 的流动性还剩大约 (1+1.15) v-ETH 和 0 v-USDC

每当 taker 在 maker 的做市价格区间中交易，总会影响 maker 的头寸。我们是否可以追踪每一笔交易对每一个 maker 头寸的影响呢？

可以，前提是**funding payment 只能在 quote token 中收取，不能在 base token 中收取**。因为如果在 base token 中收取 funding payment，则必须每次都根据收取之后都还要交易成 USDC ，因为用户实际只会存取和赎回 USDC (quote token)。

遗憾的是我们无法找到一个节省 gas 的实现方法。因为一笔交易可能涉及多个 range order (不同 maker 注入的流动性)，每一次交易不但要计算 taker 的 funding，还要去遍历计算每一个涉及到的 range order 他们之中 base token 数量的变化情况。

现在我们的任务就是在 Uniswap v3 pool 的基础上增加功能，以便可以追踪用户头寸规模的变化。

maker 的 `base token amount` 可以用 Uniswap v3 的函数接口获得 [`LiquidityAmounts.getAmount0ForLiquidity()`](https://github.com/Uniswap/v3-periphery/blob/main/contracts/libraries/LiquidityAmounts.sol#L82) 给定价格区间的 2 个边界和 流动性数量，计算 token0 的数量。

因为 base token 总是会被 Perp v2 部署为 token0（v-USDC 总是 token1）：

```math
Base token amount = LiquidityAmounts.getAmount0ForLiquidity()
                  = liquidity * (1 / sqrt(lower) - 1 / sqrt(upper))
```

- Liquidity 是衡量 maker 提供流动性的量化
- lower and upper 是 maker 提供流动性的价格区间边界
- sqrt: square root

base token amount 跟随 `Mark price` 的变化规律：

- Mark ≤ lower: `liquidity * (1 / sqrt(lower) — 1 / sqrt(upper))`
- lower < Mark < upper: `liquidity * (1 / sqrt(Mark) — 1 / sqrt(upper))`
- Mark ≥ upper: `liquidity * (1 / sqrt(upper) — 1 / sqrt(upper)) = 0`; 所有 base token 都被转换为 quote token 计量;

> 上述公式由来参考 Uniswap v3 white paper 6.2.3

当 maker 添加流动性之后，价格区间 lower and uppper 不再改变，除非他们直接修改流动性头寸，或者移除再添加其他区间，所以可以认为在不考虑流动性操作的前提下，影响 maker 头寸规模的因素就是 `Mark price`。

假设 Alice 于 t0 时刻在 range(lower, upper) 注入流动性，此时 mark price 仍小于 lower 价格边界 `m0 < lower`

- t1: Mark price m1 = lower; premium p1
- t2: Mark price lower < m2 < upper; premium p2
- t3: Mark price m3 = upper; premium p3

```math
(t0, t1): liquidity * (1 / sqrt(m1 = lower) — 1 / sqrt(upper)) * p1 * (t1 — t0)
(t1, t2): liquidity * (1 / sqrt(m2) — 1 / sqrt(upper)) * p2 * (t2 - t1)
(t2, t3): liquidity * (1 / sqrt(m3 = upper) — 1 / sqrt(upper)) * p3 * (t3 - t2) = 0
```

上述表达式中的共同元素：

- Mark price `(m0, m1, m2)`, Premium `(p1, p2 ,p3)` , Δtime `(t1-t0, t2-t1, t3-t2)`；这三者都是全局变量的不同时刻的值；
- 两个常量 `liquidity` 和 `sqrt(upper)`

$\sum{(\Delta time * \frac{1}{\sqrt{MarkPrice}} * premium * liquidity)} - \sum{(\Delta time * \frac{1}{\sqrt{upper}} * premium * liquidity)}$

由于 `liquidity` 和 `sqrt(upper)` 不变，可以化简：

$\sum{(\Delta time * \frac{premium}{\sqrt{MarkPrice}})} * liquidity - \sum{(\Delta time * premium)} * \frac{liquidity}{\sqrt{upper}}$

$\sum{(\Delta time * premium)}$ 我们其实已经将其存为全局变量 G；因此我们现在需要增加的全局变量即为 $\sum{(\Delta time * \frac{premium}{\sqrt{MarkPrice}})}$ 计作 G';

最终我们得到了 maker 的 funding payment 表达式：

$liquidity * (G' — \frac{G}{\sqrt{upper}})$

<hr>

t1 时刻，Alice 的头寸规模实际上是 0，因为价格刚刚触及 lower，此时并没有 taker 和她成为对手方。

> 注意：此时 Alice 的range order 虽然全部是 base token，但由于多空相抵，所以整体来算 Alice 的头寸规模为 0

t2 时刻，当价格在 `lower < m2 < upper`, 与 t0 时刻的数量之差则为：

```math
(liquidity * (1 / sqrt(m2) — 1 / sqrt(upper)) — liquidity * (1 / sqrt(lower) — 1 / sqrt(upper))
= liquidity * (1 / sqrt(m2) - 1 / sqrt(lower))
```

t3 时刻，当价格 `upper < m3`, 此时 base token 已经被 taker 全部交易走，与 t0 时刻数量之差：

```math
0 — liquidity * (1 / sqrt(lower) — 1 / sqrt(upper))
= -liquidity * (1 / sqrt(lower) — 1 / sqrt(upper))
```

总结上述 3 种情况可以写为：

```math
A maker's funding payment
= funding payment for how many base tokens left (equation A) - funding payment for the original base token amount (equation B)

= funding payment for a maker's position size
```

- `equation A` 是当前 maker 还剩多少 base token

- `equation B` 是 maker 做市的流动性如果全部变成 base token 的数量(`Mark price` 低于价格下边界时)，即 `original base token amount`；可以通过 `LiquidityAmounts.getAmount0ForLiquidity()` 获取结果

<hr>

当 `Mark price` 超出做市价格区间，头寸规模是固定不变的，要么没有 base token 头寸为 0，要么全部是 base token。 因此只需要知道 `Mark price` 分别在区间内外的时间即可算出 funding payment。

### spec

- 每当流动性头寸被修改（数量和价格区间上下限），应立即结算之前累计的 funding payment，并更新参数
- 新增一个全局 storage 变量 G2 : $\sum{(\Delta time * \frac{premium}{\sqrt{MarkPrice}})}$ 每次交易都会更新全局变量
- 在价格 tick 上新增两个变量，在 `Mark price` 进入或离开 tick 时保存当时的全局累计变量 G 和 G2， 其原理机制与 Uniswap v3 的手续费计算相同
- 要知道在何时去 收取/支付 一位 maker 的 funding payment，需要在 maker 初始化或者修改流动性时去更新 maker 的 `personal entry values` E, E'
- `maker's funding payment = (equation A) — (equation B)`
  - equation B 是用户添加流动性时，根据添加的 base token 来计算头寸规模的 funding payment

> 注意：maker首先存入资产 USDC 到 Vault 模块，然后借出 vtoken 开 range order (添加流动性)，如果添加的有 base token，那么这部分相当于 maker 从协议中借出相应的 base token (做空)，再注入到协议中 (做多)，所以刚添加完流动性，此时价格没有改变，那么 maker 的多空相抵，是不会产生 funding payment 的；一旦价格变化，maker 剩余的 base token 发生变化，相当于平掉一部分 多头 仓位，那么此时空大于多，maker 就需要计算这部分空仓的 funding payment了；

`equation B` 的计算公式和 taker 的类似，因为 maker 添加流动性时的初始头寸规模不会变化

`equation A` 的计算需要分 3 种情况:

1. `Mark price >= upper`: 0, 没有 funding payment，因为此时 base token 已耗尽
2. `Mark price <= lower`: 因为此时价格区间不是 active 状态， base token 等于 `LiquidityAmounts.getAmount0ForLiquidity()`，计算公式和 `equation B` 相同
3. `L < Mark < U` : `liquidity * ((G' — E') — (G — E) / sqrt(upper))`

需要注意的是每当 `Mark price` 穿过边界的 tick 时，需要更新 G, G', E 和 E‘

最终我们将情况 2 和 情况 3 的 funding payment 加起来就是 range order 的 funding payment

> 注意：`equation A - equation B` 只考虑了价格在区间内的情况，当价格小于 lower，虽然 range order 并未参与做市，但 maker 依然持有 base token 头寸，所以还需要累计 funding payment，所以我们之后还需要考虑累加当 `Mark price < lower` 的 funding payment

## Implementation

- Global Cumulative Values: 在 Funding.sol, Growth struct 中包含两个字段: `twPremiumX96` & `twPremiumDivBySqrtPriceX96`.
- 分别是 $\sum{(\Delta time * premium)}$ 和 $\sum{(\Delta time * \frac{premium}{\sqrt{MarkPrice}})}$

```solidity
/// @dev tw: time-weighted
/// @param twPremiumX96 overflow inspection (as twPremiumX96 > twPremiumDivBySqrtPriceX96):
//         max = 2 ^ (255 - 96) = 2 ^ 159 = 7.307508187E47
//         assume premium = 10000, time = 10 year = 60 * 60 * 24 * 365 * 10 -> twPremium = 3.1536E12
struct Growth {
    int256 twPremiumX96;
    int256 twPremiumDivBySqrtPriceX96;
}
```

- `calcLiquidityCoefficientInFundingPaymentByOrder()` 在 Funding.sol，一个 range order 当前的未结算 funding payment
- 两种 fundings 字段 `fundingBelowX96` 和 `fundingInsideX96`
  - `fundingBelowX96`: 当价格小于 range lower 时，所累计的 funding growth
  - `fundingInsideX96`: `equation A - equation B = liquidity * ((G' — E') — (G — E) / sqrt(upper))`
  - 不需要考虑高于价格区间的情况，因为此时没有 base token 不需要考虑 funding payment

```solidity
/// @dev the funding payment of an order/liquidity is composed of
///      1. funding accrued inside the range 2. funding accrued below the range
///      there is no funding when the price goes above the range, as liquidity is all swapped into quoteToken
/// @return liquidityCoefficientInFundingPayment the funding payment of an order/liquidity
function calcLiquidityCoefficientInFundingPaymentByOrder(
    OpenOrder.Info memory order,
    Tick.FundingGrowthRangeInfo memory fundingGrowthRangeInfo
) internal pure returns (int256) {
    uint160 sqrtPriceX96AtUpperTick = TickMath.getSqrtRatioAtTick(order.upperTick);

    // base amount below the range
    uint256 baseAmountBelow =
        LiquidityAmounts.getAmount0ForLiquidity(
            TickMath.getSqrtRatioAtTick(order.lowerTick),
            sqrtPriceX96AtUpperTick,
            order.liquidity
        );
    // funding below the range
    int256 fundingBelowX96 =
        baseAmountBelow.toInt256().mul(
            fundingGrowthRangeInfo.twPremiumGrowthBelowX96.sub(order.lastTwPremiumGrowthBelowX96)
        );

    // liquidity * ((G' — E') — (G — E) / sqrt(upper))
    // funding inside the range =
    // liquidity * (ΔtwPremiumDivBySqrtPriceGrowthInsideX96 - ΔtwPremiumGrowthInsideX96 / sqrtPriceAtUpperTick)
    int256 fundingInsideX96 =
        order.liquidity.toInt256().mul(
            // ΔtwPremiumDivBySqrtPriceGrowthInsideX96
            fundingGrowthRangeInfo
                .twPremiumDivBySqrtPriceGrowthInsideX96
                .sub(order.lastTwPremiumDivBySqrtPriceGrowthInsideX96)
                .sub(
                // ΔtwPremiumGrowthInsideX96
                PerpMath.mulDiv(
                    fundingGrowthRangeInfo.twPremiumGrowthInsideX96.sub(order.lastTwPremiumGrowthInsideX96),
                    PerpFixedPoint96._IQ96,
                    sqrtPriceX96AtUpperTick
                )
            )
        );

    return fundingBelowX96.add(fundingInsideX96).div(PerpFixedPoint96._IQ96);
}
```

- `OrderBook.getLiquidityCoefficientInFundingPayment()` 是计算一个 maker 所有订单的 funding payment 只和

```solidity
/// @inheritdoc IOrderBook
function getLiquidityCoefficientInFundingPayment(
    address trader,
    address baseToken,
    Funding.Growth memory fundingGrowthGlobal
) external view override returns (int256 liquidityCoefficientInFundingPayment) {
    bytes32[] memory orderIds = _openOrderIdsMap[trader][baseToken];
    mapping(int24 => Tick.GrowthInfo) storage tickMap = _growthOutsideTickMap[baseToken];
    address pool = IMarketRegistry(_marketRegistry).getPool(baseToken);

    // funding of liquidity coefficient
    (, int24 tick, , , , , ) = UniswapV3Broker.getSlot0(pool);
    for (uint256 i = 0; i < orderIds.length; i++) {
        OpenOrder.Info memory order = _openOrderMap[orderIds[i]];
        Tick.FundingGrowthRangeInfo memory fundingGrowthRangeInfo =
            tickMap.getAllFundingGrowth(
                order.lowerTick,
                order.upperTick,
                tick,
                fundingGrowthGlobal.twPremiumX96,
                fundingGrowthGlobal.twPremiumDivBySqrtPriceX96
            );

        // the calculation here is based on cached values
        liquidityCoefficientInFundingPayment = liquidityCoefficientInFundingPayment.add(
            Funding.calcLiquidityCoefficientInFundingPaymentByOrder(order, fundingGrowthRangeInfo)
        );
    }

    return liquidityCoefficientInFundingPayment;
}
```

- Funding.sol 合约的 `calcPendingFundingPaymentWithLiquidityCoefficient()` 是计算一个用户总的未结算 funding payment，
  - 一个用户既可以是 taker 同时也可以是 maker
  - taker 的 funding payment 再与 maker 部分的 funding payment 相加

```solidity
function calcPendingFundingPaymentWithLiquidityCoefficient(
    int256 baseBalance,
    int256 twPremiumGrowthGlobalX96,
    Growth memory fundingGrowthGlobal,
    int256 liquidityCoefficientInFundingPayment
) internal pure returns (int256) {
    int256 balanceCoefficientInFundingPayment =
        PerpMath.mulDiv(
            baseBalance,
            fundingGrowthGlobal.twPremiumX96.sub(twPremiumGrowthGlobalX96),
            uint256(PerpFixedPoint96._IQ96)
        );

    return
        liquidityCoefficientInFundingPayment.add(balanceCoefficientInFundingPayment).div(_DEFAULT_FUNDING_PERIOD);
}
```

- `Exchange.getPendingFundingPayment()` 计算一个用户总的未结算 funding payment，内部调用 `getLiquidityCoefficientInFundingPayment` 和 `calcPendingFundingPaymentWithLiquidityCoefficient` 来计算 maker 和 taker 部分的 funding payment

```solidity
/// @inheritdoc IExchange
function getPendingFundingPayment(address trader, address baseToken) public view override returns (int256) {
    (Funding.Growth memory fundingGrowthGlobal, , ) = _getFundingGrowthGlobalAndTwaps(baseToken);

    int256 liquidityCoefficientInFundingPayment =
        IOrderBook(_orderBook).getLiquidityCoefficientInFundingPayment(trader, baseToken, fundingGrowthGlobal);

    return
        Funding.calcPendingFundingPaymentWithLiquidityCoefficient(
            IAccountBalance(_accountBalance).getBase(trader, baseToken),
            IAccountBalance(_accountBalance).getAccountInfo(trader, baseToken).lastTwPremiumGrowthGlobalX96,
            fundingGrowthGlobal,
            liquidityCoefficientInFundingPayment
        );
}
```

> 当用户没有参与做市 `IOrderBook.getLiquidityCoefficientInFundingPayment()` 返回的是空数组，此时就只有 taker 部分的 funding payment。

## Reference

- Block-based Funding Payment On Perp v2: <https://blog.perp.fi/block-based-funding-payment-on-perp-v2-35527094635e>
- How Block-based Funding Payments are Implemented On Perp v2: <https://blog.perp.fi/how-block-based-funding-payment-is-implemented-on-perp-v2-20cfd5057384>
- Perp v2: A Numerical Example of Block-based Funding (with quote-only fee) of Makers: <https://perp.notion.site/Perp-v2-A-Numerical-Example-of-Block-based-Funding-with-quote-only-fee-of-Makers-7a14853db070481690af34ff17722f0b>
- Calculation of makers' Open Interest: <https://perp.notion.site/Calculation-of-makers-Open-Interest-fe6a4563f00d4b10805b4376d98b7833>
