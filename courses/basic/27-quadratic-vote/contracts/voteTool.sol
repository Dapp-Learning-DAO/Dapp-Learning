pragma solidity ^0.6.6;

library SafeMath {
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "SafeMath: subtraction overflow");
        uint256 c = a - b;

        return c;
    }

    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-solidity/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }

    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        // Solidity only automatically asserts when dividing by 0
        require(b > 0, "SafeMath: division by zero");
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }

    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0, "SafeMath: modulo by zero");
        return a % b;
    }
}

contract VoteTool {

    function safeTransfer(address token, address to, uint256 value) internal {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0xa9059cbb, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TransferHelper: TRANSFER_FAILED');
    }

    function safeTransferFrom(address token, address from, address to, uint value) internal {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0x23b872dd, from, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TransferHelper: TRANSFER_FROM_FAILED');
    }

    event AddProposal(uint256 _hash);
    event Vote(address indexed _from, uint256 indexed _hash, uint256 _n);

    address emptyAddr = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    address owner = 0xBE9dD06cB0E71Dc5b13FfA0AF58e2f04a2aF50E3;
    uint256 ONE_VOTE_ETH = 1 ether;

    using SafeMath for uint256;

    struct Proposal {
        uint256 name;
        uint256 voteCount;
        uint256 amount;
        uint8 status;//1 valid ,2 expired
    }

    Proposal[]  proposals;
    mapping(uint256 => uint256) proposalMap;
    mapping(address => mapping(uint256 => uint256)) userVoteMap;


    constructor()public{
        owner = msg.sender;
    }


    modifier onlyOwner() {
        require(tx.origin == owner, "Ownable: caller is not the owner");
        _;
    }

    function vote(uint256 _proposal, uint256 _n) public payable {
        require(_n > 0, "zero");
        uint256 index = proposalMap[_proposal];
        require(index > 0, "not exists");
        Proposal storage p = proposals[index - 1];
        require(p.status == 1, "expired");
        uint256 userNum = userVoteMap[msg.sender][_proposal];
        uint256 nextNum = userNum.add(_n);
        uint256 amount;
        for (; userNum < nextNum; userNum++) {
            amount = amount.add(numPower(userNum).mul(ONE_VOTE_ETH));
        }
        require(msg.value >= amount, "not enough");
        p.amount = p.amount.add(amount);
        p.voteCount = p.voteCount.add(_n);

        userVoteMap[msg.sender][_proposal] = nextNum;

        if (msg.value > amount) {
            msg.sender.transfer(msg.value.sub(amount));
        }
        emit Vote(msg.sender, _proposal, _n);
    }

    function addProposal(uint256 _proposal) public onlyOwner {
        require(proposalMap[_proposal] == 0, "exists");
        proposals.push(Proposal(_proposal, 0, 0, 1));
        proposalMap[_proposal] = proposals.length;
        emit AddProposal(_proposal);
    }


    function expireProposal(uint256 _proposal) public onlyOwner {
        require(proposalMap[_proposal] > 0, "not exists");
        proposals[proposalMap[_proposal] - 1].status = 2;
    }

    function withdraw() public onlyOwner {
        msg.sender.transfer(address(this).balance);
    }

    function getProposalLength() public view returns (uint256){
        return proposals.length;
    }

    function getProposal(uint256 _index) public view returns (uint256, uint256, uint256, uint8){
        require(_index < proposals.length, "out");
        Proposal memory p = proposals[_index];
        return (p.name, p.voteCount, p.amount, p.status);
    }

    function getUserVoteNum(address _addr, uint256 _proposal) public view returns (uint256){
        return userVoteMap[_addr][_proposal];
    }


    function numPower(uint256 _n) public pure returns (uint256){
        return 2 ** _n;

    }

    function hash(bytes memory _b) public pure returns (bytes32){
        return keccak256(_b);
    }


}
