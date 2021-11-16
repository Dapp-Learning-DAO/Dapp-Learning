# Compound Governance

> The Compound protocol is governed and upgraded by COMP token-holders, using three distinct components; the COMP token, governance module (Governor Bravo), and Timelock. Together, these contracts allow the community to propose, vote, and implement changes through the administrative functions of a cToken or the Comptroller. Proposals can modify system parameters, support new markets, or add entirely new functionality to the protocol.

Compound 治理主要由三部分组成，COMP token ，governance module(Governor Bravo), TimeLock. 社区通投票决定提案是否执行，提案主要的内容是修改协议系统的参数，增加协议的资产类别，或新增协议的功能。

## COMP token

compound 的原生 token，继承 ERC20 的 token 合约，额外增加了投票权委托的相关功能。

当用户持有协议的治理代币 COMP 时，它会将用户提升为决策者的角色。
**只有 10,000,000 COMP 将永远存在，而超过 5,400,000 COMP 已经分发给 Compound 用户。**
更具体地说，该协议每天向活跃的贷方和借方分发 2,312 个 COMP 作为奖励。本质上，用户在参与 Compound 生态系统的借贷经济时倾向于累积 COMP 代币。

详情参见 :point_right: [COMP.md](./COMP.md)

## GovernorBravo module

Bravo 模块，执行具体的投票流程。主要由三部分组成：

- `GovernorBravoDelegator` 作为可升级合约的 proxy
- `GovernorBravoDelegateStorageV1` 定义了模块的存储接口，后续升级必须继承前一代的结构
- `GovernorBravoDelegate` 投票的执行逻辑合约

其他的依赖合约：

- `Timelock` 用于对投票操作的交易进行队列排序
- `COMP` 原生治理代币

详情参见 :point_right: [GovernorBravo.md](./GovernorBravo.md)

## 提案流程

![proposal period](https://compound.finance/images/gov_diagram.png)

有趣的是，任何人都可以通过在地址中锁定 100 个 COMP 来自主创建提案以更改协议的某些方面。

但是，在提案人的地址被委派 65,000 COMP 之前，不会考虑对该提案进行投票。经过 3 天的投票过程，获得至少 400,000 张赞成票的提案在实施前会在协议的 Timelock 上排队两天，投票期间如果委托投票权的变化导致少于 400,000 提案将不能通过。可以提出的一些更改是资产的抵押品因素、利率模型、市场的添加或删除以及 Compound 协议使用的其他参数。与目前提到的所有 DAO 一样，Compound 允许进行投票授权。

虽然最初的治理模型于 2020 年 2 月推出，但改进版本于 2021 年 3 月激活。这些改进为链上治理提供了更强大的方法。升级的一部分是决定为选民增加一个投票选项。选民已经可以选择是或否投票。通过升级，选民现在可以选择第三个选项，即弃权。此外，他们可以添加评论来解释支持或拒绝提案的原因。此外，提议者可以调整投票延迟、投票周期和提交阈值等参数。

提案的流程：

1. 发起提案者调用 `GovernorBravoDelegate.propose()` 发起提案 proposal
   - 入参以数组形式传入，提案中包含的操作，最多 10 组操作
   - 提案会存储在合约 storage 中
2. proposal 进入 Pending 状态（当前 blockNumber < startBlock）
3. proposal 进入 Active 状态（当前 startBlock < blockNumber < endBlock），即投票阶段
4. 投票阶段结束：
   - Defeated 提案未通过，流程终止（赞成票 <= 反对票 或 赞成票 < quorumVotes 400,000）
   - Succeeded 提案通过，待执行
5. admin 调用 `GovernorBravoDelegate.queue()` 将新提案中的操作推入待执行队列
   - proposal 进入 Queued 状态
   - 自动赋值 eta 字段，设置操作的过期时间，超过该时间未执行提案自动作废
6. admin 调用 `GovernorBravoDelegate.execute()` 批量执行提案中的操作
   - proposal 进入 Executed 状态
   - 若时间超过 eta 仍未被执行，proposal 进入 Expired 状态

选民投票：

1. COMP 持有者将投票权委托给被委托者（可以是自己，如果没有调用过委托方法则无法参与投票）
2. 在 proposal 进入 Active 状态后，调用 castVote 相关接口投票
   - `castVote()` COMP 持有人直接进行投票
   - `castVoteWithReason()` COMP 持有人直接进行投票，并广播自定义消息
   - `castVoteBySig()` COMP 持有人委托给代理人进行投票。
     - 持有人将 EIP712 标准的消息签名发送给代理人
     - 代理人使用该签名代持有人投票
     - 代理人一般是 COMP 项目方，这样可以避免让用户承担主网高昂的 gas
     - 注意这里的代理和第 1 步中的不同，1 中是持有人将自己的投票权转交给其他人，在合约中会有记录；而 bysig 的方法是为了让用户节省 gas 参与投票，虽然由代理人操作，但本质上还是持有人自己投票

## 参考链接

- COMPOUND Governance DOC <https://compound.finance/docs/governance>
- Building a Governance Interface <https://medium.com/compound-finance/building-a-governance-interface-474fc271588c>
