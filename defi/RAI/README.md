# RAI

RAI具有非法币锚定、完全去中心化、以及最小化治理的极致去信任特性，是以太坊网络上最去中心化的稳定币之一，也被以太坊创始人Vitalik称为是“仅由 ETH 支持的抵押自动稳定币的纯粹理想类型”。
- whitepaper: [Rai: A Low Volatility, Trust Minimized Collateral for the DeFi Ecosystem](https://github.com/reflexer-labs/whitepapers/blob/master/English/rai-english.pdf)
- doc: <https://docs.reflexer.finance/>
- site: <https://reflexer.finance/>

V神和Dankrad都有文章介绍RAI的机制：
- [Two thought experiments to evaluate automated stablecoins](https://vitalik.ca/general/2022/05/25/stable.html)
- [RAI -- one of the coolest experiments in crypto](https://dankradfeist.de/ethereum/2023/01/31/rai-crypto-experiment.html)

RAI系统的这一套机制，正符合货币主义奠基人、诺贝尔经济学奖获得者米尔顿·弗里德曼理想情况下对美联储的预期。弗里德曼认为，"Abolish the FED.  Replace it with a computer."（这同时也是Reflexer社区的重要Meme）。

参考文档：https://dapplearning.notion.site/RAI-e39c867e62ac4c749344097b36996a09


## 介绍

### 历史
**2020年2月**, RAI 最早来自于**[ameensol](https://ethresear.ch/u/ameensol) （SpankChain 和 MolochDAO 的联合创始人 ）的一篇博客：** https://ethresear.ch/t/announcing-metacoin-the-governance-minimized-decentralized-stablecoin/6897，博客里还是叫Metacoin， 主要是为了改造MakerDAO。

鉴于 MakerDAO 最近升级到多抵押品 DAI (MCD) 并决定放弃 ETH 作为唯一抵押品形式
（从而为链下资产引入交易对手风险），Ameensol 提出了一种新的信任最小化的稳定币系统：
此类系统 (MetaCoin) 的一种潜在设计具有以下组件：

```
一个名为 META 的治理和奖励代币
一种叫做 COIN 的稳定币
存入 ETH 时铸造新的 COIN
法币支持的稳定币（即 USDC、USDT、TUSD）的代币管理注册表 (TCR)
Uniswap 上稳定币篮子的成交量加权平均价格作为价格预言机
如果价格暴跌，清算 ETH 抵押品
向 COIN 铸币商收取可变利率，目标是 1 COIN = $1
自动更新利率的算法控制器 (PID)
MakerDAO 和 MetaCoin 之间最重要的区别是 价格预言机 和 治理在利率设定方面的作用。保留 ETH 作为抵押品以铸造新的稳定币（DAI 或 COIN），并在抵押品价值下降时主动清算用户仓位。

预言机： 
RAI选择了几个法币支持的稳定币（即 USDC、USDT、TUSD），然后使用 Uniswap 上该篮子的成交量加权平均价格来确定 ETHUSD 的参考价格。
``` 

**2020.5** 发布白皮书 [RAI whitepaper.](https://github.com/reflexer-labs/whitepapers/blob/master/English/rai-english.pdf)

**2021.2.17**  RAI正式上线以太坊主网，上线5天之后，总锁仓ETH超过10万枚。一个月后公布了FLX的代币经济学和用例（ FLX 对于 RAI 就像 MKR 对于 DAI 一样）。

**2022.2**  协议开始增加intergral参数；

**2022.5** 对部分合约进行了“无治理”升级；


### 核心业务流程
RAI 本身由 ETH 抵押生成，但并不锚定美元或者某一特定指数，而是通过 Reflexer 特有的机制设计(PID)使得 RAI 本身的价格波动很小，从而实现“稳定币”的稳定特性。

RAI 类似于单一抵押 DAI （SCD）, 用户超额抵押ETH按照赎回价格（也就是目标价格）生成稳定币RAI，用户付出2%的年利息即可持续使用RAI。同时用户随时按照系统的赎回价格偿还 RAI，并支付借贷利息，就可以赎回ETH。

与DAI和其他绝大多数稳定币不同的是，RAI并不锚定任何汇率，而是为了减少其抵押品的波动性。

RAI 采用的是双代币机制，有单独的治理代币，其治理代币是 FLX，FLX 对于 RAI 就像 MKR 对于 DAI 一样。

目前 FLX 除了能参与治理以外，协议向 user 收取的利息一部分会用于回购销毁 FLX，同时协议对组建 FLX/ETH 这个 LP 也有一定的激励。

#### 基本组成模块

- **Reflex-index**：RAI，非锚定资产，与自身抵押品相比波动性较低
- **赎回价格**：系统希望RAI具有的价格；DAI 始终停留在 1 美元，但RAI可变
- **市场价格**：市场评估RAI的价格
- **赎回率**：用于激励用户产生更多杠杆或偿还债务的利率（可以是正数或负数）；赎回率逐渐改变赎回价格；
- **借贷能力**：一个单位的抵押品可以借出多少个RAI；每次系统收到其接受的抵押品类型的价格供给更新时，供给数据除以赎回价格，然后再除以清算率，可以计算借贷能力；以ETH为例：假设ETH的价格为1000美元，清算比例为150%，如果当前RAI赎回价格为3美元；1ETH 的借贷能力大约等于 1000 / 3/ 1.5 = 222.2 RAI
- **稳定费率：**年化2%
- **清算罚金**：18-20%


#### RAI 的稳定机制
   RAI 有两个价格，一是赎回价格（redemption price），二是二级市场价格（market price）。RAI 会通过一个赎回比率（redemption rate）来控制赎回价格，以及控制市场价格始终围绕赎回价格来回波动。
   在Reflexer的系统中有两类角色：Holder：RAI系统的出借人。 Borrower:  RAI系统的借款人（即minter）。
   SAFE users 是抵押 ETH 生成 RAI 的投资者，那么 RAI 就相当于 SAFE users 的负债，注意这里的负债计价采用的是赎回价格，和市场价格无关，当 SAFE users 想要还清债务时，也是按照赎回价格偿还给协议并支付一定利息；而 holders 则是通过市场价格购买 RAI 的人。

### PID平衡机制

1. **当市场价格大于赎回价格时**
   当市场对RAI的需求旺盛，导致RAI的市场价格上涨时：
   系统通过 PID 控制模块（后面展开叙述）将会输出一个负的赎回比率，负的赎回比率意味着 RAI 的赎回价格会不断下降。这样使得RAI的赎回价格更加显著的低于市场价格，从而使得系统内的Borrower倾向于增加借款，即通过质押ETH获得新的RAI并出售给市场来获利，从而使得RAI供应量提高，市场价格降低。整个过程如下图所示。 而对于 holders 而言，未来赎回价格的下跌也会联动到市场价格的下跌，因此 holders 就有动机选择卖掉 RAI 以规避 RAI 价格的下跌。这两种行为都会导致市场上 RAI 供给的增加，从而使得 RAI 的市场价格逐渐下降，降到和赎回价格一致。
2. **当市场价格小于赎回价格时**
   当市场对RAI的需求萎靡，导致RAI的市场价格下跌时：
   系统通过 PID 控制模块将会输出一个正的赎回比率，正的赎回比率会导致赎回价格不断上涨，而预期到赎回价格未来会上涨。
   这样使得RAI的赎回价格更加显著的高于市场价格，从而使得系统内的Borrower更加倾向于偿还借款，即从市场购买RAI偿还给系统，否则未来再还债就会花更大的成本，这样使得RAI供应量降低。 而同时holders 预期到未来价格会不断上涨，也就会更加有动力持币，甚至会吸引新的 holders 入场买 RAI。 这两种行为都会导致对 RAI 的需求增大，从而导致 RAI 的价格不断上涨接近赎回价格。



## 代码
![GEB_overview](<https://1187825898-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-M9jdHretGKCtWYz5jZR%2F-MZCEBuqpWiVDbzkVeUa%2F-MZCEJv2Xvz-xIw0JAwy%2FGEB_overview%20(1).png?alt=media&token=d1233706-ec95-443b-8d45-97f973d18208>)

[GEB Overview Diagram](https://viewer.diagrams.net/?target=blank&highlight=0000ff&layers=1&nav=1&title=GEB_overview.drawio#Uhttps%3A%2F%2Fdrive.google.com%2Fuc%3Fid%3D1nIcaY8N8StVCfyAL_ztbmETJX2bvY3a9%26export%3Ddownload)



## 扩展
### RAI 支持 LSD 的讨论

<https://community.reflexer.finance/t/can-oracles-double-as-co-stakers-how-rai-like-systems-might-safely-support-staked-eth/397>

### 稳定币不可能三角

<https://stablecoins.wtf/resources/the-stablecoin-trillema#price-stability>

与前文提到的蒙代尔的三元悖论类似，在加密世界中，也有人提出了关于加密稳定币的三元悖论，即稳定币的资本效率、价格稳定性和去中心化三者也不能同时存在。笔者认为这种分类也有一定道理，试图同时获得这三者的 ESD/BAC/UST 最终都走向了灭亡。

<https://research.mintventures.fund/2023/03/10/zh-reflexer-finance-rai-non-pegged-over-colleteral-decentralized-stablecoin/>

### PID

1. Monetary policy and PID control: <https://www.imfs-frankfurt.de/fileadmin/user_upload/Events_2018/MMCI_Conference/Papers/09-Raymond_Hawkins-Monetary_Policy_and_PID_Control.pdf>

3. RAI

![controller_monitoring_small](https://reflexer-labs.github.io/geb-data-science/controller/output/controller_monitoring_small.png)

RAI history 180 days

redemption price 受到 market price 的反馈(p_rate, i_rate)，再影响 market price

## 用途

### Unique Money Markets

如果 Alice 从货币市场借款并支付 5%的年利率来借出 RAI，而且 RAI 的赎回价格每年下降 10%，那么她实际上每年获得 5%的收益。这是因为预计 RAI 的市场价格在一年内会下降 10%。 另一方面，Bob 可能以 4%的年利率出借 RAI，但如果赎回率是-10%，他的净利率为-6%。

还有另一种情况，Bob 以 4%的年利率出借 RAI，而赎回率为每年 10%。总的来说，Bob 在他的头寸上每年赚取 14%的利润（假设 RAI 在下一年中的价格会升值 10%）。同时，借用 RAI 以每年 5%的利率的 Alice 将支付总计 15%的费用（5%的货币借贷利率加上预计的一年内 RAI 价格上涨 10%）。

### Stacked Funding Rates

### 期权

开发者可以构建一个期权协议，考虑到赎回利率的变化来确定看涨/看跌期权的价格。这是因为赎回利率可以被认为是 RAI 的内在利率。

### Pegged Coins/Synthetic Assets

构建固定货币的项目可以使用 RAI 作为 ETH 的更稳定的替代品。在 ETH 市场严重崩溃的情况下，RAI 可以为其持有者提供更多时间解除其仓位，然后再进行清算。

### Yield Aggregator

部署资本以为用户获得最佳收益的协议（例如 Yearn）可以利用 RAI（及其内在的赎回利率）来提高收益。例如，将 RAI 的正赎回利率与在 Compound 或 Aave 上的借贷相结合，是一种优化收益的可能方式。

### Sophisticated Arbitrageurs

套利者（或其他交易者）可以查看赎回价格行为并将此数据点与其他数据（例如市场情绪）相结合，以找到执行交易的理想时间。

一些套利商可以向资本池提供专门的 RAI 交易服务。他们可以借用资金，并与资本池分成利润。

### Portfolio Management Strategies

## Governance Minimization

最小化治理意味着在 GEB 部署过程中采取的一系列步骤，最终使治理无法控制或升级大多数核心合约，许多参数将由其他外部合约自主设置。

[Governance Minimization.md](./GovernanceMinimization.md)

## GEB

GEB 协议的核心仓库，是 MCD(MakerDAO-dss)的修改版，具有几个核心的改进：

- 可以理解的变量名称
- 自主反馈机制，改变系统参与者的激励
- 可添加 SAFE 保险
- 固定和递增的折扣拍卖（而不是英国式拍卖）用于出售抵押品
- 自动调整系统中的几个参数
- 一组合约，约束了长期治理的参数控制
- 可以一次将稳定费用发送到多个地址
- 可以在盈余拍卖和其他类型的策略之间切换，以删除系统中的盈余
- 每种抵押品类型有两个价格：一个用于生成债务，另一个专门用于清算 SAFE
- stability fee treasury 可以支付 Oracle 调用或其他自动化系统的 gas 费用

## FLX

FLX token 在 RAI 协议中有两个主要功能：

- 后备机制：FLX 股东是 RAI 协议出现问题时的第一道防线。第二道防线是通过债务拍卖市场发行新的 FLX 代币，以 RAI 代币为交换获取这些新的 FLX 代币。
- 取消治理：一旦治理最小化完成，FLX 持有人将能够从 RAI 中移除任何剩余的治理组件，或者如果需要的话，继续管理可能难以取得治理的组件（例如预言机或与其他协议交互的任何组件）。

在协议最小化治理之前，RAI 将设置三种手续费（向借款人收取的稳定费率）：

1. stability fee treasury，这是智能合约，负责支付 Oracle 更新或任何其他旨在自动化 RAI 参数的合约。
2. FLX 持有人，这是协议的第一道防线。
3. 回购和销毁，旨在通过以 RAI 代币交换 FLX 代币并随后销毁 FLX 代币来拍卖 RAI 代币。

对于 FLX 持有人而言，为其所产生的 RAI 代币将以 FLX 代币的形式进行拍卖。拍卖所得的 FLX 代币将随后发送到股权池。

至于回购和销毁，则首先在协议的资产负债表中累积 RAI 代币。一旦资产负债表中的 RAI 代币足够多，协议就可以开始拍卖一些 RAI 代币，以换取随后销毁的 FLX 代币。

为了更直观地理解这些信息，您可以查看下面的图表：

![visualize](https://1187825898-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-M9jdHretGKCtWYz5jZR%2F-MgQYhDfSPb3lErtlIOO%2F-MgQbThRT20MvC16AqVK%2FUntitled%20Diagram.png?alt=media&token=104fb695-efee-4d5c-8a67-9079a9e6a662)

## Addresses

```json
// geb-subgraph/config/main.json

{
  "NETWORK": "mainnet",
  "PROXY_REGISTRY_STARTING_BLOCK": "5834628",
  "ETH_FROM": "0x7FAfc11677649DB6AbFEC127B4B776D585520ae1",
  "STARTING_BLOCK_NUMBER": "11848304",
  "PROXY_DEPLOYER": "0x631e38D6Dc0F4A26F6BE0d3d0E4ebA3d02033aB4",
  "COIN_TYPE": "INDEX",
  "GOVERNANCE_TYPE": "MULTISIG-SAFE",
  "MULTICALL": "0x51812e07497586ce025D798Bb44b6d11bBEe3a01",
  "FAUCET": "0x0000000000000000000000000000000000000000",
  "GEB_MULTISIG": "0x427A277eA53e25143B3b509C684aA4D0EB8bA01b",
  "GEB_MULTISIG_PROXY": "0x2695b1dC32899c07d177A287f006b6569216a5a1",
  "GEB_DEPLOY": "0x24AcC85528e6dd5B9C297fb8821522D36B1Ae09f",
  "GEB_PROT": "0x6243d8CEA23066d098a15582d81a598b4e8391F4",
  "PROTOCOL_TOKEN_AUTHORITY": "0xcb8479840A5576B1cafBb3FA7276e04Df122FDc7",
  "GEB_PAUSE_AUTHORITY": "0x1490a828957f1E23491c8d69273d684B15c6E25A",
  "GEB_POLLING_EMITTER": "0xf7Da963B88194a9bc6775e93d39c70c6e3f04f6F",
  "GEB_SAFE_ENGINE": "0xCC88a9d330da1133Df3A7bD823B95e52511A6962",
  "GEB_TAX_COLLECTOR": "0xcDB05aEda142a1B0D6044C09C64e4226c1a281EB",
  "GEB_LIQUIDATION_ENGINE": "0x4fFbAA89d648079Faafc7852dE49EA1dc92f9976",
  "GEB_ACCOUNTING_ENGINE": "0xcEe6Aa1aB47d0Fb0f24f51A3072EC16E20F90fcE",
  "GEB_COIN_JOIN": "0x0A5653CCa4DB1B6E265F47CAf6969e64f1CFdC45",
  "GEB_SURPLUS_AUCTION_HOUSE": "0x4EEfDaE928ca97817302242a851f317Be1B85C90",
  "GEB_DEBT_AUCTION_HOUSE": "0x1896adBE708bF91158748B3F33738Ba497A69e8f",
  "GEB_PAUSE": "0x2cDE6A1147B0EE61726b86d83Fd548401B1162c7",
  "GEB_PAUSE_PROXY": "0xa57A4e6170930ac547C147CdF26aE4682FA8262E",
  "GEB_GOV_ACTIONS": "0x0463bF18c2457B00402A7639fa1DFB7d60f659Ee",
  "GEB_COIN": "0x03ab458634910AaD20eF5f1C8ee96F1D6ac54919",
  "GEB_ORACLE_RELAYER": "0x4ed9C0dCa0479bC64d8f4EB3007126D5791f7851",
  "GEB_GLOBAL_SETTLEMENT": "0xee4cf96e5359d9619197fd82b6ef2a9eae7b91e1",
  "GEB_STABILITY_FEE_TREASURY": "0x83533fdd3285f48204215E9CF38C785371258E76",
  "GEB_ESM": "0xa33Ea2Ac39902d4A206D6A1F8D38c7330C80f094",
  "GEB_ESM_TOKEN_BURNER": "0xB10409FC293F987841964C4FcFEf887D9ece799B",
  "GEB_RRFM_CALCULATOR": "0xddA334de7A9C57A641616492175ca203Ba8Cf981",
  "GEB_DUMMY_RRFM_CALCULATOR": "0x9F02ddBFb4B045Df83D45c4d644027FBD7d72A6D",
  "GEB_RRFM_SETTER": "0x7acfc14dbf2decd1c9213db32ae7784626daeb48",
  "PROXY_ACTIONS": "0x880CECbC56F48bCE5E0eF4070017C0a4270F64Ed",
  "PROXY_ACTIONS_INCENTIVES": "0x88A77b8Ff53329f88B8B6F9e29835FEc287349e0",
  "PROXY_ACTIONS_GLOBAL_SETTLEMENT": "0x17b5d9914194a08c7Ef14451BA15E8aE4f92Cb93",
  "PROXY_DEBT_AUCTION_ACTIONS": "0x3615A303674eC8bC0432f7e1BE8449A63a19d6Ef",
  "PROXY_SURPLUS_AUCTION_ACTIONS": "0x16B0BF0Bf031A3691f4bD600e5340fEDd149C0ED",
  "SAFE_MANAGER": "0xEfe0B4cA532769a3AE758fD82E1426a03A94F185",
  "GET_SAFES": "0xdf4BC9aA98cC8eCd90Ba2BEe73aD4a1a9C8d202B",
  "FSM_GOV_INTERFACE": "0xe24F8B30fd28c90462c9BbC87A9A2a823636F533",
  "PROXY_FACTORY": "0xA26e15C895EFc0616177B7c1e7270A4C7D51C997",
  "PROXY_REGISTRY": "0x4678f0a6958e4D2Bc4F1BAF7Bc52E8F3564f3fE4",
  "MEDIANIZER_RAI": "0x92dC9b16be52De059279916c1eF810877f85F960",
  "SPOT_RAI": "0x7235a0094eD56eB2Bd0de168d307C8990233645f",
  "SPOT_FEED_SECURITY_MODULE_RAI": "0x0000000000000000000000000000000000000000",
  "ETH": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  "MEDIANIZER_ETH": "0xb825e25856bD98b3f2FAF2aEb6Cb8742B38C4025",
  "FEED_SECURITY_MODULE_ETH": "0xD4A0E3EC2A937E7CCa4A192756a8439A8BF4bA91",
  "GEB_JOIN_ETH_A": "0x2D3cD7b81c93f188F3CB8aD87c8Acc73d6226e3A",
  "GEB_COLLATERAL_AUCTION_HOUSE_ETH_A": "0x7fFdF1Dfef2bfeE32054C8E922959fB235679aDE",
  "PROXY_PAUSE_ACTIONS": "0x27a54e99dE813CE2E41BAa7F44d1F19FBA22B36D",
  "PROXY_PAUSE_SCHEDULE_ACTIONS": "0x6a2714404Be6613A952A80266840ffe916194632",
  "GEB_INCENTIVES_MINER": "0xa706d4c39c315288113020f3e2D7e1095e912a20",
  "UNISWAP_FACTORY": "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
  "UNISWAP_ROUTER": "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  "GEB_DS_COMPARE": "0x10122261ff9520C590c0c3A679b7E3dFC8B09C64",
  "GEB_TX_MANAGER": "0xB7272627825D1cb633f705BC269F8e11126D7A25",
  "GEB_COIN_UNISWAP_POOL": "0x8aE720a71622e824F576b4A8C03031066548A3B1",
  "GEB_SINGLE_CEILING_SETTER": "0x54999Ee378b339f405a4a8a1c2f7722CD25960fa",
  "CHAINLINK_AGGREGATOR": "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
  "GEB_STAKING_AUCTION_HOUSE": "0x0000000000000000000000000000000000000000"
}
```

## 参考链接

- Stability without Pegs: <https://medium.com/reflexer-labs/stability-without-pegs-8c6a1cbc7fbd>
- 视频解析: <https://www.youtube.com/watch?v=ADK91Zw4sJA&list=PL-GxJch-YeZerVVV8dY8qU2VkJfbnSfdN&index=3>
- tokenengineeringcommunity: <https://tokenengineeringcommunity.github.io/website/>
- RAI--升级版的 DAI？ <https://mirror.xyz/0x4011631B550E4c5C105FE90c2b7f03Fdbd344454/Bumv5mmOt8Sj85IpcGGMJvox4XLdrH0ce-4CJS_Wd6o>
- 基于 BTC 的稳定币：<https://cryptohayes.medium.com/dust-on-crust-300d4b5cf3ec>
