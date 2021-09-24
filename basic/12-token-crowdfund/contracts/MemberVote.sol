pragma solidity >=0.4.0 <0.8.0;

/**
 * membersVote contract:
 * 1. Secure funds from investment club members (ether)
 * 2. Track member contributions with shares
 * 3. Allow members to transfer shares
 * 4. Allow investment proposals to be created and voted
 * 5. Approve successful investment proposals (i.e send money)
 */

contract MembersVote {
    struct Proposal {
        uint id;
        string name;
        uint amount;
        address payable recipient;
        uint votes;
        uint end;
        bool approved;
    }
    mapping(address => bool) public members;
    mapping(address => uint) public shares;
    mapping(address => mapping(uint => bool)) public votes;
    mapping(uint => Proposal) public proposals;
    uint public totalShares;
    uint public availableFunds;
    uint public contributionEnd;
    uint public nextProposalId;
    uint public voteTime;
    uint public quorum;
    address public owner;

    constructor(uint contributionTime, uint _voteTime, uint _quorum) public {
        require(_quorum > 1, 'quorum must be more than 1 member');
        contributionEnd = block.timestamp + contributionTime;
        voteTime = _voteTime;
        quorum = _quorum;
        owner = msg.sender;
    }

    function contribute() payable external {
        require(block.timestamp < contributionEnd, 'cannot contribute after contributionEnd');
        members[msg.sender] = true;
        shares[msg.sender] += msg.value;
        totalShares += msg.value;
        availableFunds += msg.value;
    }

    function redeemShare(uint amount) external {
        require(shares[msg.sender] >= amount, 'not enough shares');
        require(availableFunds >= amount, 'not enough available funds');
        shares[msg.sender] -= amount;
        availableFunds -= amount;
        msg.sender.transfer(amount);
    }

    function transferShare(uint amount, address payable to) external {
        require(shares[msg.sender] >= amount, 'not enough shares');
        shares[msg.sender] -= amount;
        shares[to] += amount;
        members[to] = true;
    }

    function createProposal(string calldata name, uint amount, address payable recipient) external onlyMembers() {
        require(availableFunds >= amount, 'amount too big');
        proposals[nextProposalId] = Proposal(
            nextProposalId,
            name,
            amount,
            recipient,
            0,
            block.timestamp + voteTime,
            false
        );
        nextProposalId++;
    }

    function vote(uint proposalId) external onlyMembers() {
        Proposal storage proposal = proposals[proposalId];
        require(votes[msg.sender][proposalId] == false, 'members can only vote once for a proposal');
        require(block.timestamp < proposal.end, 'can only vote until proposal end date');
        votes[msg.sender][proposalId] = true;
        proposal.votes += shares[msg.sender];
    }

    function approveProposal(uint proposalId) external onlyOwner() {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.end, 'cannot approve proposal before end date');
        require(proposal.approved == false, 'current proposal already approved');
        require(((proposal.votes * 100) / totalShares) >= quorum, 'cannot approve proposal with votes # below quorum');
        proposal.approved = true;
        _transferEther(proposal.amount, proposal.recipient);
    }

    function withdrawEther(uint amount, address payable to) external onlyOwner() {
        _transferEther(amount, to);
    }

    function _transferEther(uint amount, address payable to) internal {
        require(amount <= availableFunds, 'not enough availableFunds');
        availableFunds -= amount;
        to.transfer(amount);
    }

    //For ether returns of proposal investments
    function receive() payable external {
        availableFunds += msg.value;
    }

    modifier onlyMembers() {
        require(members[msg.sender] == true, 'only members');
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, 'only owner');
        _;
    }
}