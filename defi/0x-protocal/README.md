# 0x协议
0x 协议是一个面向以太坊的、开源的去中心化交易协议，该协议旨在作为开放标准和通用构建模块，让开发者可以将其作为底层协议来搭建 DEX 或是有交易功能的 DApp，并聚合这些 DApp 中的流动性。除此之外，0x 协议目前还可以通过 0x API 聚合 Uniswap、Curve 等其他 DEX 协议的流动性。

Website：https://0x.org/

Twitter：https://twitter.com/0xproject

Forum：https://forum.0x.org/

Docs：https://0x.org/docs

Medium：https://blog.0xproject.com/

Github：https://github.com/0xProject

##  原理介绍
 在0x系统中，有maker和taker两个角色。
 maker创建订单，并提供流动性，且可以聚合流动性：
- On-chain liquidity - DEXs, AMMs (e.g. Uniswap, Curve, Bancor)
- Off-chain liquidity - Professional Market Makers, 0x's Open Orderbook network
  taker负责吃单，消费流动性

  ### 0xAPI
  0x API是允许DeFi开发人员利用0x协议和交易ERC20资产的接口
  主要有/swap和 /orderbook 接口：
  - swap  聚合链上和链下流动性，smart order routing 可以在去中心化交易所之间拆单，保证最小滑点。
  - orderbook 查询0x开放订单的流动性，以及现价单。

  ### 工作原理
  off-chain relay  on-chain settlement 
  1. A Maker creates a 0x order which is a json object that adheres to a standard order message format
  2. The order is hashed, and the Maker signs the order to cryptographically commit to the order they authored.
  3. The order is shared with counter-parties.
    - If the Maker of the 0x order already knows their desired counter-party, they can send the order directly (via email, chat, or over-the-counter platform)
    - If the Maker doesn’t know a counter-party willing to take the trade, they can submit the order to orderbook. 
  4. 0x API aggregates liquidity across all the sources to surface the best price for the order to the Taker.
  5. The Taker fills the 0x order by submitting the order and the amount they will fill it for to the blockchain.
  6. The 0x protocol’s settlement logic verifies the Maker’s digital signature and that all the conditions of the trade are satisfied.
### Build a Token Swap Dapp With 0x API
video: https://www.web3.university/tracks/road-to-web3/build-a-blockchain-betting-game

doc: https://docs.0x.org/0x-api-swap/guides/use-0x-api-liquidity-in-your-smart-contracts

**Accessing RFQ liquidity on 0x** 
APIRequest-for-Quote (“RFQ”) System.
https://docs.0x.org/0x-api-swap/guides/accessing-rfq-liquidity-on-0x-api


### How to Build NFT Exchange in Your DApp
//todo

### 限价单
有两种类型的单子： limit order & RFQ order
https://docs.0x.org/0x-api-orderbook/introduction

### MEV-aware DEX design
## 参考链接
- 整体介绍：https://docs.qq.com/doc/DVkxxcElOdE5zcXpF
- 官方文档：<https://blog.0xproject.com/>
- github: <https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#exchange>
- 0x文档: <https://0x.org/docs/guides/use-0x-api-liquidity-in-your-smart-contracts>
- video: https://www.web3.university/tracks/road-to-web3/build-a-blockchain-betting-game

