# Curve V2

## 原理

### 预言机
这里就要说到Curve V2一项最关键的改进，就是当代币市场价格偏离原聚合范围时，可以对流动性进行自动再平衡，重新构造一条适用于新价格的曲线。对于如何感知代币市场价格的变化，大多数项目会选择采用外部预言机，但外部预言机会存在被操纵的风险。

Curve V2为了彻底杜绝预言机攻击的可能性，选择以内部数据作为参考价格，并将这种机制称为指数移动平均（exponentially moving average）预言机，简称EMA。这个EMA预言机提供的报价，是根据Curve的历史成交价以及最新的交易信息综合计算得出一种参考价格。这个参考价格有些类似于技术分析中的均线，将根据最新的成交价格进行动态调整，但在调整的同时也会保有一定的滞后性，以免在价格剧烈波动时过度频繁地触发再平衡机制。

有了内部预言机提供的参考价格，系统便有了进行再平衡的触发依据。当EMA预言机报出的价格偏离原始价格超过一定范围后，协议便会自动对整条曲线的形状进行调整，使得流动性重新聚合于最新的交易价格附近。


### 预言机

- CurveV2 : https://www.yuque.com/docs/share/d902a3d4-f246-420c-b971-6487e38999dc#%20
- anchorDao: https://medium.com/anchordao-lab/automated-market-maker-amm-algorithms-and-its-future-f2d5e6cc624a#18c4  
**V2论文**
https://curve.fi/files/crypto-pools-paper.pdf

## 参考链接
- V2论文：https://curve.fi/files/crypto-pools-paper.pdf
- defi之道: https://mp.weixin.qq.com/s/50E5t1O4cxipnBpaao8ZxQ  
- twitter: https://twitter.com/Kurt_M_Barry/status/1404496502240727041
- curve总结：https://www.zvstus.com/article/news/1/75d87ffffe8454c353fd2a2a4e140000.html  

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
