# GovernorBravo

Bravo 模块，执行具体的投票流程。主要由三部分组成：

- `GovernorBravoDelegator` 作为可升级合约的 proxy
- `GovernorBravoDelegateStorageV1` 定义了模块的存储接口，后续升级必须继承前一代的结构
- `GovernorBravoDelegate` 投票的执行逻辑合约

其他的依赖合约：

- `Timelock` 用于对投票操作的交易进行队列排序
- `COMP` 原生治理代币

## GovernorBravoDelegateStorageV1

Bravo 的存储结构合约，主要定义了 storage 变量

```solidity
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

```solidity
struct Proposal {
    /// @notice Unique id for looking up a proposal
    uint id;

    /// @notice Creator of the proposal
    address proposer;

    /// @notice The timestamp that the proposal will be available for execution, set once the vote succeeds
    /// 提案在投票通过后，应在多久之后才能被执行。这个时间用户不需要自己设置，由合约进行设置
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

## GovernorBravoDelegate

Bravo 模块的逻辑合约。功能包括发起提案，接受用户对提案的投票，裁决提案结果，执行提案中的操作。

开头定义了一些对于 storage 变量的限制数值，比如 `MIN_PROPOSAL_THRESHOLD` 和 `MAX_PROPOSAL_THRESHOLD` 定义了 `proposalThreshold` 的最大值和最小值，保证 bravo 模块的初始参数在一个合理的范围内。

### propose

发起新的提案，调用者的被委托投票权数量必须超过 `proposalThreshold`。入参需要提供了该提案将会修改哪些目标合约，及其对应的 value 和 calldata，以数组形式分别传入。另外 signatures 字段提供了将 calldata 加密的功能。

propose 的函数主要逻辑：

1. 调用者的被委托投票权数量是否大于 `proposalThreshold`
2. 校验入参数组长度是否一致
3. 操作组数不能为 0 且不能超过最大数量限制(10)
4. 检查调用者是否已有处于 Active 或 Pending 状态的提案，若有则 revert
5. 更新提案的总数量
6. 存入新提案数据
7. 返回提案 id

```solidity
/**
    * @notice Function used to propose a new proposal. Sender must have delegates above the proposal threshold
    * @param targets Target addresses for proposal calls
    * @param values Eth values for proposal calls
    * @param signatures Function signatures for proposal calls
    * @param calldatas Calldatas for proposal calls
    * @param description String description of the proposal
    * @return Proposal id of new proposal
    */
function propose(address[] memory targets, uint[] memory values, string[] memory signatures, bytes[] memory calldatas, string memory description) public returns (uint) {
    // Reject proposals before initiating as Governor
    require(initialProposalId != 0, "GovernorBravo::propose: Governor Bravo not active");
    require(comp.getPriorVotes(msg.sender, sub256(block.number, 1)) > proposalThreshold, "GovernorBravo::propose: proposer votes below proposal threshold");
    require(targets.length == values.length && targets.length == signatures.length && targets.length == calldatas.length, "GovernorBravo::propose: proposal function information arity mismatch");
    require(targets.length != 0, "GovernorBravo::propose: must provide actions");
    require(targets.length <= proposalMaxOperations, "GovernorBravo::propose: too many actions");

    uint latestProposalId = latestProposalIds[msg.sender];
    if (latestProposalId != 0) {
        ProposalState proposersLatestProposalState = state(latestProposalId);
        require(proposersLatestProposalState != ProposalState.Active, "GovernorBravo::propose: one live proposal per proposer, found an already active proposal");
        require(proposersLatestProposalState != ProposalState.Pending, "GovernorBravo::propose: one live proposal per proposer, found an already pending proposal");
    }

    // 提案的投票开始和结束时间是根据当前时间自动生成的，固这个阶段的时长受到规则的限制
    // 并不能设置太短或太长
    uint startBlock = add256(block.number, votingDelay);
    uint endBlock = add256(startBlock, votingPeriod);

    proposalCount++;
    Proposal memory newProposal = Proposal({
        id: proposalCount,
        proposer: msg.sender,
        eta: 0,
        targets: targets,
        values: values,
        signatures: signatures,
        calldatas: calldatas,
        startBlock: startBlock,
        endBlock: endBlock,
        forVotes: 0,
        againstVotes: 0,
        abstainVotes: 0,
        canceled: false,
        executed: false
    });

    proposals[newProposal.id] = newProposal;
    latestProposalIds[newProposal.proposer] = newProposal.id;

    emit ProposalCreated(newProposal.id, msg.sender, targets, values, signatures, calldatas, startBlock, endBlock, description);
    return newProposal.id;
}
```

### proposal-state

提案的 8 种状态：

- Canceled 提案被取消
- Pending 提案还在等待期，即处于 created 和 Voting active 之间，时长取决于 votingDelay
- Active 投票阶段
- Defeated 投票结束，提案未通过（赞成票 <= 反对票 或 赞成票 < quorumVotes 400,000）
- Succeeded 投票结束，提案通过，待执行
- Executed 提案已执行
- Expired 提案通过，但未执行，并且已过期作废
- Queued 提案通过，正在待执行队列中

```solidity
/**
    * @notice Gets the state of a proposal
    * @param proposalId The id of the proposal
    * @return Proposal state
    */
function state(uint proposalId) public view returns (ProposalState) {
    require(proposalCount >= proposalId && proposalId > initialProposalId, "GovernorBravo::state: invalid proposal id");
    Proposal storage proposal = proposals[proposalId];
    if (proposal.canceled) {
        return ProposalState.Canceled;
    } else if (block.number <= proposal.startBlock) {
        return ProposalState.Pending;
    } else if (block.number <= proposal.endBlock) {
        return ProposalState.Active;
    } else if (proposal.forVotes <= proposal.againstVotes || proposal.forVotes < quorumVotes) {
        return ProposalState.Defeated;
    } else if (proposal.eta == 0) {
        return ProposalState.Succeeded;
    } else if (proposal.executed) {
        return ProposalState.Executed;
    } else if (block.timestamp >= add256(proposal.eta, timelock.GRACE_PERIOD())) {
        return ProposalState.Expired;
    } else {
        return ProposalState.Queued;
    }
}
```

### queue

将投票阶段结束且投票通过的提案的具体操作推入待执行队列, 仅限 admin 角色可调用。

1. 提案必须是 Succeeded 状态，即 eta 字段没有被赋值，还是 0
2. 根据当前 blockNumber + timelock.delay 赋值给 eta 字段，eta 是操作最早可执行的时间，这之前不能执行
3. 遍历提案的具体执行操作，将对每个目标合约的操作顺序推入待执行队列

```solidity
/**
    * @notice Queues a proposal of state succeeded
    * @param proposalId The id of the proposal to queue
    */
function queue(uint proposalId) external {
    require(state(proposalId) == ProposalState.Succeeded, "GovernorBravo::queue: proposal can only be queued if it is succeeded");
    Proposal storage proposal = proposals[proposalId];
    uint eta = add256(block.timestamp, timelock.delay());
    for (uint i = 0; i < proposal.targets.length; i++) {
        queueOrRevertInternal(proposal.targets[i], proposal.values[i], proposal.signatures[i], proposal.calldatas[i], eta);
    }
    proposal.eta = eta;
    emit ProposalQueued(proposalId, eta);
}

function queueOrRevertInternal(address target, uint value, string memory signature, bytes memory data, uint eta) internal {
    require(!timelock.queuedTransactions(keccak256(abi.encode(target, value, signature, data, eta))), "GovernorBravo::queueOrRevertInternal: identical proposal action already queued at eta");
    timelock.queueTransaction(target, value, signature, data, eta);
}
```

TimeLock.queueTransaction

1. 只能 admin 调用
2. 检查 `eta >= blockTimestamp + delay`
   - 检查 eta 是否有被赋值，因为初始值是 0，如果没有赋值这条件不成立
   - 当前时间还未超过提案最早的可执行时间，防止提案在进入可执行时间段后，被执行后，再次通过 `TimeLock.queueTransaction` 方法执行操作
3. 检查通过，将该操作推入队列
4. 返回操作在队列中的键

```solidity
function queueTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) public returns (bytes32) {
    require(msg.sender == admin, "Timelock::queueTransaction: Call must come from admin.");
    require(eta >= getBlockTimestamp().add(delay), "Timelock::queueTransaction: Estimated execution block must satisfy delay.");

    bytes32 txHash = keccak256(abi.encode(target, value, signature, data, eta));
    queuedTransactions[txHash] = true;

    emit QueueTransaction(txHash, target, value, signature, data, eta);
    return txHash;
}
```

### execute

执行提案，任意用户可调用

1. 提案处于 Queued 状态，即完成了排队阶段
2. 更改提案状态为已执行
3. 遍历执行提案的操作

```solidity
/**
    * @notice Executes a queued proposal if eta has passed
    * @param proposalId The id of the proposal to execute
    */
function execute(uint proposalId) external payable {
    require(state(proposalId) == ProposalState.Queued, "GovernorBravo::execute: proposal can only be executed if it is queued");
    Proposal storage proposal = proposals[proposalId];
    proposal.executed = true;
    for (uint i = 0; i < proposal.targets.length; i++) {
        timelock.executeTransaction.value(proposal.values[i])(proposal.targets[i], proposal.values[i], proposal.signatures[i], proposal.calldatas[i], proposal.eta);
    }
    emit ProposalExecuted(proposalId);
}
```

TimeLock.executeTransaction

1. 只能 admin 调用
2. 由操作的调用参数组成的 hash 作为该操作在队列中的键 (`txHash`)
3. 通过 `txHash` 检查：
   - 该操作是否存在于队列中
   - eta (执行阶段开始时间) <= blockTimestamp <= eta + GRACE_PERIOD (执行阶段结束时间)
4. 将带执行的操作移除队列
5. 对目标合约执行操作

```solidity
// timelock.executeTransaction
function executeTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) public payable returns (bytes memory) {
    require(msg.sender == admin, "Timelock::executeTransaction: Call must come from admin.");

    bytes32 txHash = keccak256(abi.encode(target, value, signature, data, eta));
    require(queuedTransactions[txHash], "Timelock::executeTransaction: Transaction hasn't been queued.");
    require(getBlockTimestamp() >= eta, "Timelock::executeTransaction: Transaction hasn't surpassed time lock.");
    require(getBlockTimestamp() <= eta.add(GRACE_PERIOD), "Timelock::executeTransaction: Transaction is stale.");

    queuedTransactions[txHash] = false;

    bytes memory callData;

    if (bytes(signature).length == 0) {
        callData = data;
    } else {
        callData = abi.encodePacked(bytes4(keccak256(bytes(signature))), data);
    }

    // solium-disable-next-line security/no-call-value
    (bool success, bytes memory returnData) = target.call.value(value)(callData);
    require(success, "Timelock::executeTransaction: Transaction execution reverted.");

    emit ExecuteTransaction(txHash, target, value, signature, data, eta);

    return returnData;
}
```

### cancel

取消提案。在提案操作被执行之前都可以由提案者调用，或者当提案者的投票权掉到 proposalThreshold 以下，由任意用户调用。

1. 检查提案不处于 Executed 状态
2. 检查调用者是否为提案人，或者当提案者的投票权掉到 proposalThreshold 以下
3. 更改提案为 `cancel` 状态
4. `timelock.cancelTransaction()`

```solidity
/**
    * @notice Cancels a proposal only if sender is the proposer, or proposer delegates dropped below proposal threshold
    * @param proposalId The id of the proposal to cancel
    */
function cancel(uint proposalId) external {
    require(state(proposalId) != ProposalState.Executed, "GovernorBravo::cancel: cannot cancel executed proposal");

    Proposal storage proposal = proposals[proposalId];
    require(msg.sender == proposal.proposer || comp.getPriorVotes(proposal.proposer, sub256(block.number, 1)) < proposalThreshold, "GovernorBravo::cancel: proposer above threshold");

    proposal.canceled = true;
    for (uint i = 0; i < proposal.targets.length; i++) {
        timelock.cancelTransaction(proposal.targets[i], proposal.values[i], proposal.signatures[i], proposal.calldatas[i], proposal.eta);
    }

    emit ProposalCanceled(proposalId);
}
```

timelock.cancelTransaction() 将提案从待执行队列中移除。

（这里仅限管理员调用，但如果调用者作为提案人不是管理员，这里就会revert，感觉欠妥）

```solidity
function cancelTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) public {
    require(msg.sender == admin, "Timelock::cancelTransaction: Call must come from admin.");

    bytes32 txHash = keccak256(abi.encode(target, value, signature, data, eta));
    queuedTransactions[txHash] = false;

    emit CancelTransaction(txHash, target, value, signature, data, eta);
}
```

### castVote

选民对提案进行投票，有三种外部接口，内部逻辑调用相同的方法，只是广播事件有所不同。

external functions:

```solidity
/**
    * @notice Cast a vote for a proposal
    * @param proposalId The id of the proposal to vote on
    * @param support The support value for the vote. 0=against, 1=for, 2=abstain
    */
function castVote(uint proposalId, uint8 support) external;

/**
    * @notice Cast a vote for a proposal with a reason
    * @param proposalId The id of the proposal to vote on
    * @param support The support value for the vote. 0=against, 1=for, 2=abstain
    * @param reason The reason given for the vote by the voter
    */
function castVoteWithReason(uint proposalId, uint8 support, string calldata reason) external;

/**
    * @notice Cast a vote for a proposal by signature
    * @dev External function that accepts EIP-712 signatures for voting on proposals.
    */
function castVoteBySig(uint proposalId, uint8 support, uint8 v, bytes32 r, bytes32 s) external;
```

castVoteInternal 执行投票的内部方法。

1. 检查提案状态为 Active
2. support 入参只能为 0=against, 1=for, 2=abstain
3. 选票的回执 hasVoted 字段应还是 false
4. 将选票数量增加到对应的选择上
5. 存储选票回执
6. 返回生效的票数

```solidity
/**
    * @notice Internal function that caries out voting logic
    * @param voter The voter that is casting their vote
    * @param proposalId The id of the proposal to vote on
    * @param support The support value for the vote. 0=against, 1=for, 2=abstain
    * @return The number of votes cast
    */
function castVoteInternal(address voter, uint proposalId, uint8 support) internal returns (uint96) {
    require(state(proposalId) == ProposalState.Active, "GovernorBravo::castVoteInternal: voting is closed");
    require(support <= 2, "GovernorBravo::castVoteInternal: invalid vote type");
    Proposal storage proposal = proposals[proposalId];
    Receipt storage receipt = proposal.receipts[voter];
    require(receipt.hasVoted == false, "GovernorBravo::castVoteInternal: voter already voted");
    uint96 votes = comp.getPriorVotes(voter, proposal.startBlock);

    if (support == 0) {
        proposal.againstVotes = add256(proposal.againstVotes, votes);
    } else if (support == 1) {
        proposal.forVotes = add256(proposal.forVotes, votes);
    } else if (support == 2) {
        proposal.abstainVotes = add256(proposal.abstainVotes, votes);
    }

    receipt.hasVoted = true;
    receipt.support = support;
    receipt.votes = votes;

    return votes;
}
```

## 参考链接

- Compound Governance 合约地址 <https://etherscan.io/address/0xc0da02939e1441f497fd74f78ce7decb17b66529>
- TimeLock 合约地址 <https://etherscan.io/address/0x6d903f6003cca6255d85cca4d3b5e5146dc33925>
- COMP token 合约地址 <https://etherscan.io/token/0xc00e94cb662c3520282e6f5717214004a7f26888>
