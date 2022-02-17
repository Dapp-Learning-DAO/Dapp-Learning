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

- `Timelock` 用于设定提案操作的执行时间，关键变量是 `delay`, 决定了提案通过后，可以执行操作的最早时间
- `COMP` 原生治理代币，与投票权 1:1 关系

详情参见 :point_right: [GovernorBravo.md](./GovernorBravo.md)

## 提案流程

![proposal period](https://compound.finance/images/gov_diagram.png)

有趣的是，任何人都可以通过在地址中锁定 100 个 COMP 来自主创建提案以更改协议的某些方面。

但是，在提案人的地址被委派 65,000 COMP 之前，不会考虑对该提案进行投票。经过 3 天的投票过程，获得至少 400,000 张赞成票的提案在实施前会在协议的 Timelock 上排队两天，投票期间如果委托投票权的变化导致少于 400,000 提案将不能通过。可以提出的一些更改是资产的抵押品因素、利率模型、市场的添加或删除以及 Compound 协议使用的其他参数。与目前提到的所有 DAO 一样，Compound 允许进行投票授权。

虽然最初的治理模型于 2020 年 2 月推出，但改进版本于 2021 年 3 月激活。这些改进为链上治理提供了更强大的方法。升级的一部分是决定为选民增加一个投票选项。选民已经可以选择是或否投票。通过升级，选民现在可以选择第三个选项，即弃权。此外，他们可以添加评论来解释支持或拒绝提案的原因。此外，提议者可以调整投票延迟、投票周期和提交阈值等参数。

### proposal-process

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
   - 自动赋值 eta 字段，设置操作的开始时间, 这之前提案不能被执行
6. admin 调用 `GovernorBravoDelegate.execute()` 批量执行提案中的操作
   - proposal 进入 Executed 状态
   - 若时间超过 `eta + GRACE_PERIOD` 仍未被执行，proposal 进入 Expired 状态；
   - `GRACE_PERIOD` 固定为 14days，即所有提案在进入可执行队列后未被执行，超过 14 天自动作废

选民投票：

1. COMP 持有者将投票权委托给被委托者（可以是自己，如果没有调用过委托方法则无法参与投票）
2. 在 proposal 进入 Active 状态后，调用 castVote 相关接口投票
   - `castVote()` COMP 持有人直接进行投票
   - `castVoteWithReason()` COMP 持有人直接进行投票，并广播自定义消息
   - `castVoteBySig()` COMP 持有人委托给代理人进行投票。
     - 持有人将 EIP712 标准的消息签名发送给代理人
     - 代理人使用该签名代持有人投票
     - 代理人一般是委托给大户，这样可以避免让用户承担主网高昂的 gas
     - [leaderboard](https://compound.finance/governance/leaderboard?target_network=mainnet)
     - 注意这里的代理和第 1 步中的不同，1 中是持有人将自己的投票权转交给其他人，在合约中会有记录；而 bysig 的方法是为了让用户节省 gas 参与投票，虽然由代理人操作，但本质上还是持有人自己投票

### 实操演示

COMP 提供了 [vote ui 交互界面](https://app.compound.finance/#vote)，可以切换到 Kovan 测试网进行测试操作

1. 点击 `getStart` 按钮，会弹出两种 Choose Delegation Type 方式
   - Manual voting 用户直接投票
   - Delegate voting 用户将自己的投票权数量委托给其他人
   - 选择后会弹出交易确认，这里会调用 `Bravo.delegate()` 将投票权授权给自己或代理人
2. 当你持有超过 100COMP，可以看到界面上有 `Approve proposal creation` 按钮
3. 按钮变成 `Create Autonomous Proposal` 创建自治提案（并非正式的提案）
4. 进入提案内容标记
   - 标题
   - 内容
   - 操作
     - 操作的目标合约，例如 cDai， GovernorBravoDelegate
     - 调用的函数
     - 入参
5. 提案上链，可以在这里查看事件里包含了提案的标题和描述
   - 注意这里调用的是 [autonomous-proposals](https://github.com/compound-finance/autonomous-proposals) 仓库中的 `CrowdProposalFactory.sol`
   - [交易事件](https://kovan.etherscan.io/tx/0xb05437455d5ca3b45de7457ceb747ee308112632fcc54b39a23b4cc95eb0d6d8#eventlog)
6. 属于你的自治提案合约已创建，当你的合约被委托的投票权超过100,000时，可以发起正式提案。
   - 作为初始的票，你的100枚COMP会被质押到该合约
   - 等到该合约被委托投票数超过 65,000 可以调用该合约的 `propose()` 方法向bravo合约发起正式提案
   - 调用该合约 `vote()` 方法对提案进行投票
   - 调用该合约 `terminate()` 方法终止该自治提案，返还之前质押的 100COMP
   - [详见 :point_right:](./CrowdProposal.md)

另外提案列表上有可执行的提案，上面显示 `execute` 按钮，你可以点击并消耗 gas 发起交易，但是最后会失败，因为虽然 bravo 的 execute 方法是 external，但是内部调用的方法会限制只能 admin 调用。

### proposal-timeline

关于提案从创建到执行的时间轴，其规则的梳理

- 首先是 Pending 状态的时间
  - 即提案创建后进入 voteActive 状态之前，有一个合约强制的 pending 时间
  - 这个时间的由 `votingDelay` 变量表示，在 bravo 合约初始化时设定
  - `MIN_VOTING_DELAY <= votingDelay <= MAX_VOTING_DELAY` 大约介于 1 个区块间隔（13s-15s） 与 40320 个区块间隔 （大约 1week） 之间
- 接着是 Active 状态的时间
  - 即投票阶段的持续时间
  - 这段时间长度依旧是合约决定，由 `votingPeriod` 表示，在 bravo 合约初始化时设定
  - `MIN_VOTING_PERIOD <= votingPeriod <= MAX_VOTING_PERIOD` 大约介于 24h 与 2week 之间
- 然后待 admin 将提案推入等待队列 `queue()`
  - 提案最早可执行的时间是调用 queue 方法的时刻 + delay 时间
  - 即这里必须等待 delay 时间段
  - `MINIMUM_DELAY <= Timelock.delay <= MAXIMUM_DELAY` 大约介于 2days 与 30days 之间
- admin 执行提案 `execute()`, 时间轴结束

理论最短和最长时间：

- 以忽略 admin 的 queue 和 execute 操作的时间为前提，决定时间轴长度的实际是 `votingDelay + votingPeriod + Timelock.delay`
- 最短是 `15s + 24h + 2days` , 大约 3 天
- 最长是 `1week + 2week + 30days`, 大约 51 天

目前(2021-11-17)链上 bravo 和 Timelock 合约的设定是

- `votingDelay` 13140 blocks 约 2days
- `votingPeriod` 19710 blocks 约 3days
- `Timelock.delay` 172800 s = 48 hours = 2days
- 最新调整上述参数的提案是 [COMP-proposal-43](https://compound.finance/governance/proposals/43)

所以当前最短的时间大约是 7days

相关代码参考

- [GovernorBravo.propose()](./GovernorBravo.md#propose)
- [GovernorBravo.proposal-state](./GovernorBravo.md#proposal-state)

## 参考链接

- COMPOUND Governance DOC <https://compound.finance/docs/governance>
- Building a Governance Interface <https://medium.com/compound-finance/building-a-governance-interface-474fc271588c>
