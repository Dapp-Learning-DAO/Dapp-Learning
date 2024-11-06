# Curve V2

## 原理
**V2论文**
https://curve.fi/files/crypto-pools-paper.pdf

## V2改进

v2 的 CryptoSwap 希望比 v1 StableSwap 更近一步，不仅仅只做锚定资产(例如稳定币或 ETH-sETH)之间的兑换。在 v1 中 D 的定义是在价格处于平衡点状态下：

$\sum{x_i}=D$

其中 `x_i` 代表 token 实际的数量(balance)，可以替换为 b 来表示。但由于 v2 中并不是相互锚定的资产，波动比较大，需要将定义中的数量 b 替换为价值 b'。

我们引入一个内部缩放价格 p , 在代码中是 `price_scale`，令其作为锚定第一个资产的价格，例如 USDC-WBTC-WETH 池子，将会以 USDC 作为锚定标的，假设 WBTC 和 WETH 市价为 40000 和 3000 美元, 那么价格数组为 `[1, 40000, 3000]`。第一个价格始终是 1，因为该资产和自身锚定，比值永远是 1。

价值 b' 的定义是数量乘以价格 $b'=bp$。

我们将所有资产的数量和余额分别整合到一起，组成 2 个向量 b 和 b'，他们之间的转换关系如下

$b=T(b',p)=(\frac{b'_0}{p_0},\frac{b'_1}{p_1},\frac{b'_2}{p_2}...)$

$b'=T(b,p)=(b_0 p_0,b_1 p_1,b_2 p_2 ...)$


v2 中对于 D 的定义如下

$D=N x_{eq}$

当池子价格处于平衡点时(例如首次注入流动性时)，每个资产的价值相等，其值为 `x_eq`

虽然定义了基于 `x_eq` 给出了 D 的定义，但价格总在变化，大部分情况不在平衡点，我们很难去求出当时的 `x_eq`。所以代码中的 D 是根据平衡方程利用牛顿法求解。

## V2方程

curve v2 的平衡方程

$KD^{N-1}\sum{x_i}+\prod{x_i}=KD^N+(\frac{D}{N})^N$

其中 K 的定义与 v1 中的 A 不同

$K_0=\frac{\prod{x_i}N^N}{D^N}$

$K=AK_0\frac{\gamma^2}{(\gamma+1-K_0)^2}$

A \* K_0 实际就是 v1 的系数 $\chi$

$A*K_0=A\frac{\prod{x_i}N^N}{D^N}=\chi$

v2 的系数 K 定义中多了关于 gamma 的调整系数

$\frac{\gamma^2}{(\gamma+1-K_0)^2}$


## reg

每次交易产生的价格 `last_price` 经过时间加权组成一个预言机价格 `price_oracle`。

`price_oracle` 预言机价格以时间加权的方式更新，即 EMA (Exponential Moving Average)

price_oracle: $p^* = p_{last}(1-\alpha)+\alpha p^*_{prev}$

只有当 LP 每单位收益超过之前收益的一半时，进行 repegging，反言之，跌到之前收益一半以下，将不进行价格调整。


## Dynamic fees

手续费从 v1 的固定费率，改为动态调整，手续费会根据调整系数 g，在 f_mid 和 f_out 之间波动，距离平衡点越远，手续费将越高。

$g=\frac{\gamma_{fee}}{\gamma_{fee}+1-\frac{\prod{x_i}}{(\sum{x_i}/N)^N}}$

$f=g \cdot f_{mid}+(1-g)\cdot f_{out}$
## 预言机
这里就要说到Curve V2一项最关键的改进，就是当代币市场价格偏离原聚合范围时，可以对流动性进行自动再平衡，重新构造一条适用于新价格的曲线。对于如何感知代币市场价格的变化，大多数项目会选择采用外部预言机，但外部预言机会存在被操纵的风险。

Curve V2为了彻底杜绝预言机攻击的可能性，选择以内部数据作为参考价格，并将这种机制称为指数移动平均（exponentially moving average）预言机，简称EMA。这个EMA预言机提供的报价，是根据Curve的历史成交价以及最新的交易信息综合计算得出一种参考价格。这个参考价格有些类似于技术分析中的均线，将根据最新的成交价格进行动态调整，但在调整的同时也会保有一定的滞后性，以免在价格剧烈波动时过度频繁地触发再平衡机制。

有了内部预言机提供的参考价格，系统便有了进行再平衡的触发依据。当EMA预言机报出的价格偏离原始价格超过一定范围后，协议便会自动对整条曲线的形状进行调整，使得流动性重新聚合于最新的交易价格附近。


### 预言机

- CurveV2 : https://www.yuque.com/docs/share/d902a3d4-f246-420c-b971-6487e38999dc#%20
- anchorDao: https://medium.com/anchordao-lab/automated-market-maker-amm-algorithms-and-its-future-f2d5e6cc624a#18c4  



**行业数据** 
- https://curve.fi/

- https://debank.com/

- https://www.tokenterminal.com/

- https://dune.xyz/hagaetc/dex-metrics

**报道与研究报告**

- 头等舱：Curve研究报告

- 链闻：简明理解 Curve V2 原理：它与 Uniswap V3 流动性方案有何不同？

- 链闻：多维度解析头部 AMM：Uniswap V3、Curve V2 与 Balancer V2

- Rekt：Curve Wars

- Messari：Valuation of Curve Finance: The Most Overlooked Protocol


## 参考链接
- V2论文：https://curve.fi/files/crypto-pools-paper.pdf
- defi之道: https://mp.weixin.qq.com/s/50E5t1O4cxipnBpaao8ZxQ  
- twitter: https://twitter.com/Kurt_M_Barry/status/1404496502240727041
- curve总结：https://www.zvstus.com/article/news/1/75d87ffffe8454c353fd2a2a4e140000.html  


