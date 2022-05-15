# Silo

silo 是一个无许可的借贷协议，可以使用任意资产借贷另一种资产。silo 在设计上隔离了风险，为所有 crypto token 创建了一个安全的借贷市场。

- 通过设计划分风险，而不是通过跟踪每个代币的风险
- 最小化治理；不需要治理来将资产列入白名单
- 接受所有代币资产
- 具有高度流动性和流动性。流动性集中和桥接，接受任何代币作为抵押品
- 流动性限制是由市场而不是治理设定的。资产用作抵押品的能力仅取决于其找到交易对手的能力。

## 原理

目前的借贷协议，AAVE Compound，都是共享资金池。这种设计，一旦资金池中有一种资产出现问题，就会给整个借贷池带来巨大的风险。因此，共享资金池大部分都仅支持很少的几种资产，牺牲可扩展性为代价来提高效率。

### 安全性

![silo-isolate](https://miro.medium.com/max/1400/1*7MFa-SS0P-90hK0_MusqLQ.png)

silo 协议通过设计降低了风险。它实现了孤立的货币市场——我们称之为 silo——每个 silo 仅由两种资产组成，即桥梁资产和独特的代币。通过将任何资产的风险隔离到特定的 silo，新的和高风险资产可以立即用于借贷市场，而不会对其他 silo 中持有的资产造成系统性风险。

### 高效率

![silo-effect](https://miro.medium.com/max/1400/1*0MTmbsVtswOkyeJXtRaDeQ.png)

该协议仅对代币资产实施一个 Silo。这种设计将流动性集中在单个池中，并允许将任何代币用作抵押品来借入其他代币。

## 名词解释

Silo: Silo 是一个孤立的货币市场，仅支持两种资产，即桥梁资产（例如 ETH）和独特的代币。创建时，所有 Silo 共享配置的参数。

![silo](https://miro.medium.com/max/1400/1*yq6Zek7_TI1wQA0l7MPttg.png)

桥接资产: 桥接资产（例如 ETH）连接协议中的所有 Silo。对于一个抵押代币借入另一个代币，该过程需要创建两个头寸，两者都以 ETH 计价，因此它们大致相互抵消。用户对 ETH 的敞口被最小化，但多头和空头的敞口被最大化。

![silo-bridge](https://miro.medium.com/max/1400/1*uuB5UGPlFhzWo4pE1tZlGQ.png)

抵押因素: SILO 提供与 Uniswap 等 AMM 上的流动性提供者 (LP) 池类似的风险隔离。与 Uniswap v1 类似，每个 Silo v1 具有相同的贷款价值 (LTV)、清算阈值、清算惩罚和预言机参数。和 Uniswap 一样，可以为任何资产创建 Silo。用户最多可以借入其抵押品价值的 50%。当债务头寸达到抵押品的 62.5%时，抵押品将被清算。这种高清算门槛降低了在清算事件期间任何 SILO 抵押不足的风险。所有因素都可以在 SILO 上进行调整。

利息模型: 利率是根据抵押品 80% 的目标利用率动态设置的。借助动态利率，Silos 会继续增加或减少资产的借贷利率，直到使用 80% 的抵押品。这优化了利用率，同时也最大化了流动性。动态利率是对 Aave 线性利用率模型的一个有意义的改进，Aave 对 100% 利用率的利率有一个上限，偶尔会导致存款人无法随意提取存款。

Token: 用于参与协议治理的网络原生代币。代币持有者将组成一个 DAO，该 DAO 将监督协议控制的资产并调整抵押因子等功能。

## DAO

Silo 将启动一个完全去中心化的 DAO——我们称之为 Silo DAO。治理代币通过投票权和委托权赋予持有者对协议未来的发言权。核心贡献者团队为协议的蓬勃发展奠定了基础，但社区将确保我们成为安全货币市场的领先协议。我们要求社区加入这一旅程。它对所有人开放。

Silo 可能会实施委托投票的治理模型，类似于 Compound 使用的一种。为保证协议早期的技术落地顺利进行，核心开发团队将作为协议的守护者和快照投票的执行者。开发团队在任何时候都无法控制 Silo DAO 的金库。同时，社区将对 Silo DAO 的金库保持 100% 的控制权，并可以通过投票创建提案来影响更改。随着协议启动后尘埃落定，开发团队将慢慢将管理职责完全移交给 Silo DAO。

当实施委托治理模型时，代币持有者可以对提案进行投票，也可以将其投票权委托给社区的其他成员。随着时间的推移，我们将构建一个完整的链上治理应用程序，其中包括一个投票仪表板，可以实时报告和跟踪 DAO 的资产。有关 DAO 的确切后勤及其治理的更多信息将在以后提供。

Silo 遵循最小化治理原则。借贷货币市场是无需许可的，因此不需要干预借贷市场资产的创建或运行。

代币持有者将能够对以下方面进行投票：

- 将协议控制的资产引导到有利于协议发展的地方。
- 打开/关闭 DAO 的收入机制。
- 调整每个 Silo 的抵押品因素，例如 LTV 和清算阈值。
- 批准重要的产品里程碑。

与已建立的 DAO 类似，Silo 治理论坛将是治理成员可以通过向组织的其他成员广播提案来分享他们的意见的地方。然后，每个代币持有者都可以投票接受或拒绝任何提案。

## 代币分配

未来 4 年，将发行 10 亿 silo 代币，分配:

![alloc-chart](<https://776318507-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FUGrWaE3fhxC8AsolAgPJ%2Fuploads%2F1xGU2TPh3mZrwA9rb1Ta%2FMed-2-TokenAllV3%20(2).png?alt=media&token=7ef7d709-a5cb-4f33-86e3-85dd2f3a6987>)

![release-chart](<https://776318507-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FUGrWaE3fhxC8AsolAgPJ%2Fuploads%2FLwxykeDa0AyozhVjfGWW%2FMed-2-ScheduleV2%20(1).png?alt=media&token=330b525c-d44c-468c-8b47-ee42caa3bcb6>)

- Genesis Protocol-Owned Liquidity (10%) — Distributed in the public auction; claimable immediately after the auction
- Community Treasury (45%) — Linear vesting for 3 years; controlled by the community through governance
- Early Contributors (6.75%) — Linear vesting for 4 years with 6-month cliff starting after TGE
- Founding Contributors (21.75%) — Linear vesting for 3 years with 6-month cliff starting after Token Generation Event (TGE)
- Early Community Rewards (0.2%) — Airdropped to community members in January 2022
- Early Investors & Early Advisors (6.30%) — Linear vesting for 2 years with 6-month lock starting after TGE
- Future Contributors & Future Advisors (10%) — Linear vesting for 4 years with 1-year cliff starting after joining the DAO

Token 地址: https://etherscan.io/token/0x6f80310CA7F2C654691D1383149Fa1A57d8AB1f8

## 路线图

![silo-roadmap](https://776318507-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FUGrWaE3fhxC8AsolAgPJ%2Fuploads%2FECaQoX46146UbOAPjKb3%2FRoadmap%20v0205a.png?alt=media&token=d0bbfc55-6186-4f76-b77e-53452b5c636d)

## Silo 稳定币

https://www.silo.finance/post/proposal-silo-stablecoin

- 将发行稳定币, 名字是 SiloDollar, USDs. 这个稳定币将和 ETH 一起作为 bridge asset
- 将推出 veSilo 激励计划, 激励大家为 SiloDollar 提供流动性
- peg 其他稳定币
- 加入 discord, 分享您的想法并与团队和社区成员进行讨论

社区有一个提议，将一半 Bridge asset 使用 Silo 稳定币。

https://gov.silo.finance/t/proposal-silo-stablecoin/170

![asset-pool](https://aws1.discourse-cdn.com/standard11/uploads/silo/original/1X/79bb8da44f63b69eb19cdc869913670725974232.png)

## 参考资料

- 官网: <https://www.silo.finance/>
- github: <https://github.com/silo-finance>
- medium: <https://medium.com/silo-protocol/>
- 介绍: <https://medium.com/silo-protocol/introducing-silo-secure-money-markets-for-all-crypto-assets-73cecc479fa6>
- 下一代借贷协议 —— Silo Finance: <https://liaoph.com/silo-finance/>
