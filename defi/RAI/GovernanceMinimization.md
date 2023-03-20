# Governance Minimization

最小化治理意味着在 GEB 部署过程中采取的一系列步骤，最终使治理无法控制或升级大多数核心合约，许多参数将由其他外部合约自主设置。

## Requirements for Governance Minimization

为了实现 GEB 的治理最小化，需要满足以下几个要求

- 协议的治理不能添加或计划添加更多的抵押品种类
- 所有治理最小化基础设施必须经过生产环境的审计和测试
- 系统必须积累足够的盈余在其主要财政中，以承担至少 6 个月的预言机、PID、状态管理等费用

## How Much Can GEB Be Governance Minimized

GEB 的每个组件都有不同程度的治理最小化潜力。

- Accounting Engine - 治理可能需要继续控制系统 Staking 池的设置，直到该池实现治理最小化为止；initialDebtAuctionMintedTokens 和 debtAuctionBidSize 将需要由连接到预言机的外部合约进行设置（因此该外部合约将无法完全实现治理最小化）；可选的合约可以设置 surplusBuffer，以覆盖系统货币未偿还的供应量减去来自账户引擎和稳定费用财政的盈余的特定比例；另一个外部合约应该奖励调用 popDebtFromQueue 的地址。

- Liquidation Engine - 治理将保持控制连接和断开救世者的能力；治理可以选择授权外部合约自动设置 onAuctionSystemCoinLimit

- Oracle Relayer - 治理可能被允许将兑换率设为 0％；除此之外，治理完全可以被移除

- SAFE Engine - 治理需要允许外部合约每隔几个小时/天自动设置每种抵押品的债务上限；治理应该允许合约根据最新的赎回价格调整债务下限；取决于系统中有多少种抵押品，自动设置债务上限可能不可行，而是需要手动投票来降低/提高债务上限

- Stability Fee Treasury - 治理应该长期维护这个组件

- Tax Collector - 治理可以选择有限控制设置稳定费率；有限控制指的是为每种抵押品设置上限和下限，例如每年 1-2％之间；除此之外，合约可以最小化治理

- PID 控制器 - 治理可能需要长期保持对该组件的一定控制；社区将在 GEB 在主网运行至少 1 年后更了解需要多少控制；保持（有限的）控制的一个原因是当系统的稳定币在交易所上没有足够的流动性时，控制器应该被暂停；注：即使治理对 PID 保持某种程度的控制，OracleRelayer 也会对赎回率设置上限和下限，以防止潜在的治理攻击立即摧毁协议

...

其他组件情况: <https://docs.reflexer.finance/ungovernance/governance-minimization-guide>

## 自动化基础设施

几个 GEB 合约需要授权其他组件在治理最小化之后自动设置其某些参数。以下是每个 GEB 合约的外部组件

- 清算引擎 - 可选合约，以系统货币减去会计引擎和稳定费用库中的剩余依据为百分比自动设置 onAuctionSystemCoinLimit。

- 会计引擎 - 可选合约可能会设置 surplusBuffer，以覆盖系统货币未偿还供应量的特定百分比，不包括会计引擎和稳定费用库中的剩余金还有稳定费用库/，一个强制性的合约，根据协议令牌和系统币市场价格定期设置 initialDebtAuctionMintedTokens 和 debtAuctionBidSize。

- ESM - thresholdSetter，自动将 triggerThreshold 设置为当前协议令牌未偿还供应量的百分比。

- Stability Fee Treasury - 治理可能需要创建外部合约，以重置具有 perBlock 津贴> 0 的地址的总津贴，并允许根据最新的赎回价格自动设置参数，例如 minimumFundsRequired， pullFundsMinThreshold 等。

- SAFE Engine - 一个定期调整每种抵押品类型的债务上限的合约；另一个定期根据最新的赎回价格调整债务下限的合约；实现取决于每个 GEB 的设置（它具有多少种抵押品类型，每种抵押品应覆盖多少百分比的系统货币等）。

最后，从 Stability Fee Treasury 中提取资金的合约可能需要根据最新的赎回价格定期调整其 baseUpdateCallerReward 和 maxUpdateCallerReward。

## 治理最小化层次

GEB（例如 RAI）将经历三个级别（或阶段）的治理最小化：

### Level 1

发布后 14 个月截止日期

在此阶段，治理将从以下控制中删除：

- LiquidationEngine
- DebtAuctionHouse
- SurplusAuctionHouse
- Collateral Auction Houses
- OracleRelayer
- Coin (ERC20)
- CollateralJoin contracts
- 协议中自动设置参数的合约（除了自动剩余缓冲区设置器）
- TaxCollector
- ESM

### Level 2

发布后 18 个月的截止日期

在此阶段，治理将从以下控制中删除：

- SAFEEngine
- AccountingEngine
- GlobalSettlement
- Lender of First Resort Pool (and adjacent contracts)
- RAI Controller
- ProtocolTokenAuthority（因此放弃授权/撤销授权新旧债务拍卖行打印令牌的可能性）
- ProtocolTokenPrintingPermissions
- Auto Surplus Buffer Setter

## Level 3

此时，所有剩余的治理必须由社区掌握。社区将评估完全从更多合约中删除控制的可行性（例如 PID）。