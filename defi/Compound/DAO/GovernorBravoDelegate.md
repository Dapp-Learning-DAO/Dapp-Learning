# GovernorBravoDelegate

执行投票流程的合约

## State

### GovernorBravoDelegateStorageV1

主要的 storage 变量

```js
/// @notice The delay before voting on a proposal may take place, once proposed, in blocks
/// 提案成功提交后，延迟多长时间再进入投票进程，最小1s，最大1week
uint public votingDelay;

/// @notice The duration of voting on a proposal, in blocks
/// 投票时长，最小24h，最大2weeks
uint public votingPeriod;

/// @notice The number of votes required in order for a voter to become a proposer
/// 发起提案需要的最小投票权数量（包括被委托的），最小50000，最大100000
uint public proposalThreshold;

/// @notice Initial proposal id set at become
uint public initialProposalId;

/// @notice The total number of proposals
uint public proposalCount;

/// @notice The address of the Compound Protocol Timelock
TimelockInterface public timelock;

/// @notice The address of the Compound governance token
CompInterface public comp;

/// @notice The official record of all proposals ever proposed
/// 所有提案的记录
mapping (uint => Proposal) public proposals;

/// @notice The latest proposal for each proposer
mapping (address => uint) public latestProposalIds;

```

提案结构

```js
struct Proposal {
    /// @notice Unique id for looking up a proposal
    uint id;

    /// @notice Creator of the proposal
    address proposer;

    /// @notice The timestamp that the proposal will be available for execution, set once the vote succeeds
    /// 距离提案进入待执行队列的剩余时间，一旦提案结束投票阶段，且投票通过，将立即设定该值
    uint eta;

    /// @notice the ordered list of target addresses for calls to be made
    /// 该提案需要执行的目标合约地址(cToken)
    address[] targets;

    /// @notice The ordered list of values (i.e. msg.value) to be passed to the calls to be made
    uint[] values;

    /// @notice The ordered list of function signatures to be called
    string[] signatures;

    /// @notice The ordered list of calldata to be passed to each call
    bytes[] calldatas;

    /// @notice The block at which voting begins: holders must delegate their votes prior to this block
    /// 提案发起的blockNumber，检验投票权将以此节点之前计算，即这之后的投票权委托操作将不会影响此提案
    uint startBlock;

    /// @notice The block at which voting ends: votes must be cast prior to this block
    /// 提案投票结束的blockNumber，票数的计算将以此节点之前计算
    uint endBlock;

    /// @notice Current number of votes in favor of this proposal
    /// 目前赞成的票数
    uint forVotes;

    /// @notice Current number of votes in opposition to this proposal
    /// 目前反对的票数
    uint againstVotes;

    /// @notice Current number of votes for abstaining for this proposal
    /// 目前弃权的票数
    uint abstainVotes;

    /// @notice Flag marking whether the proposal has been canceled
    /// 提案是否被取消
    bool canceled;

    /// @notice Flag marking whether the proposal has been executed
    /// 提案是否被执行
    bool executed;

    /// @notice Receipts of ballots for the entire set of voters
    /// 选民的选票回执
    mapping (address => Receipt) receipts;
}

/// @notice Ballot receipt record for a voter
/// 选票收据
struct Receipt {
    /// @notice Whether or not a vote has been cast
    bool hasVoted;

    /// @notice Whether or not the voter supports the proposal or abstains
    /// 是否支持或者弃权 0=against, 1=for, 2=abstain
    uint8 support;

    /// @notice The number of votes the voter had, which were cast
    /// 选民投出的票数
    uint96 votes;
}

```
