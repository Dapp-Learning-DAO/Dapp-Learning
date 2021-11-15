# Compound Governance

> The Compound protocol is governed and upgraded by COMP token-holders, using three distinct components; the COMP token, governance module (Governor Bravo), and Timelock. Together, these contracts allow the community to propose, vote, and implement changes through the administrative functions of a cToken or the Comptroller. Proposals can modify system parameters, support new markets, or add entirely new functionality to the protocol.

Compound 治理主要由三部分组成，COMP token ，governance module(Governor Bravo), TimeLock. 社区通投票决定提案是否执行，提案主要的内容是修改协议系统的参数，增加协议的资产类别，或新增协议的功能。

## COMP token

compound的原生token，继承ERC20的token合约，额外增加了投票权委托的相关功能。

当用户持有协议的治理代币 COMP 时，它会将用户提升为决策者的角色。
**只有 10,000,000 COMP 将永远存在，而超过 5,400,000 COMP 已经分发给 Compound 用户。**
更具体地说，该协议每天向活跃的贷方和借方分发 2,312 个 COMP 作为奖励。本质上，用户在参与 Compound 生态系统的借贷经济时倾向于累积 COMP 代币。

## 提案流程

![proposal period](https://compound.finance/images/gov_diagram.png)

有趣的是，任何人都可以通过在地址中锁定 100 个 COMP 来自主创建提案以更改协议的某些方面。

但是，在提案人的地址被委派 65,000 COMP 之前，不会考虑对该提案进行投票。经过 3 天的投票过程，获得至少 400,000 张赞成票的提案在实施前会在协议的 Timelock 上排队两天。可以提出的一些更改是资产的抵押品因素、利率模型、市场的添加或删除以及 Compound 协议使用的其他参数。与目前提到的所有 DAO 一样，Compound 允许进行投票授权。

虽然最初的治理模型于 2020 年 2 月推出，但改进版本于 2021 年 3 月激活。这些改进为链上治理提供了更强大的方法。升级的一部分是决定为选民增加一个投票选项。选民已经可以选择是或否投票。通过升级，选民现在可以选择第三个选项，即弃权。此外，他们可以添加评论来解释支持或拒绝提案的原因。此外，提议者可以调整投票延迟、投票周期和提交阈值等参数。

## 参考链接

- COMPOUND Governance DOC <https://compound.finance/docs/governance>
- Building a Governance Interface <https://medium.com/compound-finance/building-a-governance-interface-474fc271588c>
