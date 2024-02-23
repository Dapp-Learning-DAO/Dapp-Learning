# GMX

## GMX分享会

- GMX项目分享视频回放
  - YouTube
    - 1p <https://www.youtube.com/watch?v=_KyDkEu0sYs>
    - 2p <https://www.youtube.com/watch?v=7wTPIUw6iGo>
  - Bilibili
    - 1p <https://www.bilibili.com/video/BV12P411374D>
    - 2p <https://www.bilibili.com/video/BV1Ae411u7iG>

- [GMX分享会文档](./Share.md)

## 原理介绍

永续合约三种形式：

1. 以 dydx 为代表的订单薄模式，与币安、FTX 等 CEX 的交易模式相同。
2. 以 Perpetual 为代表的 AMM(自动做市商)模式，合约版的 Uniswap。
3. 以 GMX 为代表的 LP 共享流动性模式，LP 与所有多方和空方互为对手盘。该模式是目前较为创新的模式，提升了资本的使用效率。

GMX 系統中存在两种代币，分別为平台治理代币 GMX、流动性提供者代币 GLP。

### GLP

GMX 不采用 AMM 和订单簿的机制，转而采用 GLP 池子来满足用户做空或做多的需求。LP 在 GMX 体系內被称为 GLP。GLP 池是一个多资产池，池子里有 BTC/ETH/AVAX/USDC/USDT 等主流的代币按照一定比例组合而成，以此支持用户做多或做多的合约需求。

采用 GLP 池子配合 Chainlink 预言机报价（数据来自 Binance&FTX），来确定代币“真实价格”

GLP 的价格除了由组成的资产价格決定外，还需考虑 GLP 在与交易员博弈过程中的盈亏情況。因为 GLP 与交易员是零和博弈，交易员亏损则 GLP 获利，其币价上涨，反之亦然。
GLP 的铸造和赎回的价格是根据（指数中的资产总价值，包括未平仓头寸的损益）/（GLP 供应量）计算的。

当用户做多比特币时则相当于向池子“租赁”比特币。反之，当用户做空比特币时则相当于向池子“租赁”稳定币。这使得 GLP 池能够为协议赚取 LP 费用，而一切的盈利将分配给 GMX 和 GLP 的质押者。为了保障 GLP 池子的稳定运作，池子对各个资产有明确的比例规定。Arbitrum 及 Avax 公链上的 GLP 池子分别拥有 46%及 45%风险资产，其余 54%及 55%则为稳定币姿产。
用户做空或做多会消耗不同代币在池子中的存量，因此协议规定不同代币铸造 GLP 有不一样的价格。换而言之，当特定姿产超过目标权重时，用户使用该代币购买 GLP 会相对而言昂贵，以此来平衡池子中各个代币的比例。

### GLP 再平衡

代币权重会根据交易者的未平仓头寸进行调整，以帮助对冲 GLP 持有者。如，如果很多交易者做多 ETH，那 ETH 的代币权重会更高，，如果交易者做空居多，那么稳定比的代币权重会更高。

### 特点

1. 使用 chainlink 预言机价格，这使得 GMX 能够以更低的流动性实现资产的“真实价格”，不仅为用户提供零滑点的永续合约服务，而且 GLP 池子的资金使用率也会大幅提升。链上数据显示，GLP 的资金使用率经常性超过 100%，年化回报也常年保持在 50%之上。

2. 用户铸造 GLP，相当于购买了一篮子的加密货币姿产。越多用户铸造 GLP，GLP 池子则越深，越能支撑更多交易量。GLP 池子本质上是一个流动性池，GMX 的交易者是 GLP 池子的交易对手。当 GMX 的交易者获利时，GLP 持有者便会亏损。但，通过过往数据可知 GMX 交易员长期保持亏损的状态。这便是 GLP 池子能够长期盈利的核心原因。


## 参考链接

- GMX 原理介绍： <https://mirror.xyz/0x8f87F347904e84F97f51D957C17F4B4F8996ae54/BgFi9YIB-flIrzfYNQmgBQpx5HWg1NaW4FzM69Pva3s>
- 币圈科学家 youtube: <https://www.youtube.com/watch?v=FmCE9GxDlVo>
- On-Chain Analysis of GMX and Perp v2:
  <https://0xatomist.substack.com/p/on-chain-analysis-of-gmx-and-perp>
