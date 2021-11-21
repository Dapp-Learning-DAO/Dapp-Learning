# CrowdProposal

> Compound Autonomous Proposals allow anyone with enough COMP stake (currently 100; subject to change) to create an autonomous proposal and gather public support by receiving delegations to the autonomous proposal contract.

github 仓库： <https://github.com/compound-finance/autonomous-proposals>

Compound 自治提案允许任何拥有足够 COMP 股权（目前为 100；可能会发生变化）的人创建自治提案，并通过接收自治提案合同的委托来收集公众支持。

## CrowdProposalFactory

自治提案合约的工厂函数，帮助用户部署属于自己的 CrowdProposal 合约。需要用户质押 100COMP，待提案结束后返还。

```solidity
/**
* @notice Create a new crowd proposal
* @notice Call `Comp.approve(factory_address, compStakeAmount)` before calling this method
* @param targets The ordered list of target addresses for calls to be made
* @param values The ordered list of values (i.e. msg.value) to be passed to the calls to be made
* @param signatures The ordered list of function signatures to be called
* @param calldatas The ordered list of calldata to be passed to each call
* @param description The block at which voting begins: holders must delegate their votes prior to this block
*/
function createCrowdProposal(address[] memory targets,
                                uint[] memory values,
                                string[] memory signatures,
                                bytes[] memory calldatas,
                                string memory description) external {
    CrowdProposal proposal = new CrowdProposal(msg.sender, targets, values, signatures, calldatas, description, comp, governor);
    emit CrowdProposalCreated(address(proposal), msg.sender, targets, values, signatures, calldatas, description);

    // Stake COMP and force proposal to delegate votes to itself
    IComp(comp).transferFrom(msg.sender, address(proposal), compStakeAmount);
}
```

## CrowdProposal

自治提案合约

### constructor

构造函数，保存提案内容和提案人等信息，将初始质押的100COMP投票权委托给本合约。

```solidity
/**
* @notice Construct crowd proposal
* @param author_ The crowd proposal author
* @param targets_ The ordered list of target addresses for calls to be made
* @param values_ The ordered list of values (i.e. msg.value) to be passed to the calls to be made
* @param signatures_ The ordered list of function signatures to be called
* @param calldatas_ The ordered list of calldata to be passed to each call
* @param description_ The block at which voting begins: holders must delegate their votes prior to this block
* @param comp_ `COMP` token contract address
* @param governor_ Compound protocol `GovernorBravo` contract address
*/
constructor(address payable author_,
            address[] memory targets_,
            uint[] memory values_,
            string[] memory signatures_,
            bytes[] memory calldatas_,
            string memory description_,
            address comp_,
            address governor_) public {
    author = author_;

    // Save proposal data
    targets = targets_;
    values = values_;
    signatures = signatures_;
    calldatas = calldatas_;
    description = description_;

    // Save Compound contracts data
    comp = comp_;
    governor = governor_;

    terminated = false;

    // Delegate votes to the crowd proposal
    IComp(comp_).delegate(address(this));
}
```

### propose

当该合约被委托数量足够（65000），可以调用该方法，向bravo正式发起提案

```solidity
/// @notice Create governance proposal
function propose() external returns (uint) {
    require(govProposalId == 0, 'CrowdProposal::propose: gov proposal already exists');
    require(!terminated, 'CrowdProposal::propose: proposal has been terminated');

    // Create governance proposal and save proposal id
    govProposalId = IGovernorBravo(governor).propose(targets, values, signatures, calldatas, description);
    emit CrowdProposalProposed(address(this), author, govProposalId);

    return govProposalId;
}
```

### terminate

终止自治提案合约，将质押的100COMP返还创建者

```solidity
/// @notice Terminate the crowd proposal, send back staked COMP tokens
function terminate() external {
    require(msg.sender == author, 'CrowdProposal::terminate: only author can terminate');
    require(!terminated, 'CrowdProposal::terminate: proposal has been already terminated');

    terminated = true;

    // Transfer staked COMP tokens from the crowd proposal contract back to the author
    IComp(comp).transfer(author, IComp(comp).balanceOf(address(this)));

    emit CrowdProposalTerminated(address(this), author);
}
```

### vote

调用bravo合约进行提案投票

```solidity
/// @notice Vote for the governance proposal with all delegated votes
function vote() external {
    require(govProposalId > 0, 'CrowdProposal::vote: gov proposal has not been created yet');
    // Support the proposal, vote value = 1
    IGovernorBravo(governor).castVote(govProposalId, 1);

    emit CrowdProposalVoted(address(this), govProposalId);
}
```