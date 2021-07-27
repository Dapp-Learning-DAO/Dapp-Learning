pragma solidity ^0.8.0;

interface IERC20 {

    function balanceOf(address account) external view returns (uint256);

    function transfer(address recipient, uint256 amount) external returns (bool);

    function allowance(address owner, address spender) external view returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

}

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

contract FinancingTool {
    function safeTransfer(address token, address to, uint256 value) internal {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0xa9059cbb, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TransferHelper: TRANSFER_FAILED');
    }

    function safeTransferFrom(address token, address from, address to, uint value) internal {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0x23b872dd, from, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TransferHelper: TRANSFER_FROM_FAILED');
    }

    event AddProposal(uint256 _proposals);
    event Vote(address indexed _from, uint256 indexed _proposal, uint256 _lastCount, uint256 _amount);
    event AddExtraAmount(address indexed _from, uint256 _amount);
    event Withdraw(address indexed _from, uint256 _proposals, uint256 _amount, uint256 _count);

    address tokenAddr;
    address emptyAddr = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    address owner = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    uint256 ONE_VOTE_ETH = 1 ether;

    using SafeMath for uint256;


    struct Proposal {
        uint256 name;
        uint256 amount;
        uint256 voteCount;
        address owner;
        address[] userAddrArr;
        uint8 isEnd;//0,1
    }

    struct UserVote {
        uint256 count;
        uint256 amount;
    }

    Proposal[]  proposals;
    mapping(uint256 => uint256) proposalMap;
    //提案id => 用户地址 => 票数
    mapping(uint256 => mapping(address => UserVote)) userVoteMap;

    uint256 startTime;
    uint256 endTime;
    uint256 public userVoteAmount;//只是投票用户

    uint256 totalAmount;
    uint256 extraAmount;
    bool firstClaim;//首次提取

    constructor() public {
        owner = msg.sender;
        tokenAddr = emptyAddr;
        startTime = block.timestamp;
        endTime = block.timestamp + 10 days;
    }


    modifier onlyOwner() {
        require(tx.origin == owner, "Ownable: caller is not the owner");
        _;
    }


    modifier checkStart(){
        require(block.timestamp >= startTime, "not start");
        _;
    }
    modifier checkEnd(){
        require(block.timestamp >= endTime, "not end");
        _;
    }



    function vote(uint256 _proposal, uint256 _inAmount) public payable {
        require(_inAmount > 0, "zero");
        uint256 index = proposalMap[_proposal];
        require(index > 0, "not exists");
        //-1

        if (tokenAddr != emptyAddr) {
            require(msg.value == 0, "eth 0");
            safeTransferFrom(tokenAddr, msg.sender, address(this), _inAmount);
        } else {
            require(msg.value > 0, "eth 00");
            _inAmount = msg.value;
        }
        totalAmount = totalAmount.add(_inAmount);
        _vote(msg.sender, index, _proposal, _inAmount);
    }
    //_index 从1开始
    function testVote(address _addr, uint256 _index, uint256 _proposal, uint256 _inAmount) public {
        _vote(_addr, _index, _proposal, _inAmount);
    }

    function testSetEndTime(uint256 _time) public {
        endTime = _time;
    }

    function _vote(address _addr, uint256 _index, uint256 _proposal, uint256 _inAmount) internal {
        //-1
        Proposal storage p = proposals[_index - 1];
        p.amount = p.amount.add(_inAmount);
        userVoteAmount = userVoteAmount.add(_inAmount);

        UserVote storage usVote = userVoteMap[_proposal][_addr];
        if (usVote.amount == 0) {
            p.userAddrArr.push(_addr);
            uint256 vCount = sqrt(_inAmount);
            p.voteCount = p.voteCount.add(vCount);
            usVote.amount = _inAmount;
            usVote.count = vCount;
        } else {
            p.voteCount = p.voteCount.sub(usVote.count);
            //
            uint256 newAmount = usVote.amount.add(_inAmount);
            uint256 newCount = sqrt(newAmount);
            p.voteCount = p.voteCount.add(newCount);
            usVote.amount = newAmount;
            usVote.count = newCount;

        }


        emit Vote(_addr, _proposal, usVote.count, _inAmount);
    }

    function addProposal(uint256 _proposal) public onlyOwner {
        require(proposalMap[_proposal] == 0, "exists");
        Proposal memory p;
        p.name = _proposal;
        p.voteCount = 0;
        p.owner = msg.sender;

        proposals.push(p);
        proposalMap[_proposal] = proposals.length;
        emit AddProposal(_proposal);
    }


    function addExtraAmount(address _maker, uint256 _inAmount) public payable {
        if (tokenAddr != emptyAddr) {
            require(msg.value == 0, "eth 0");
            safeTransferFrom(tokenAddr, msg.sender, address(this), _inAmount);
        } else {
            require(msg.value > 0, "eth 00");
            _inAmount = msg.value;
        }
        extraAmount = extraAmount.add(_inAmount);
        totalAmount = totalAmount.add(_inAmount);
        emit AddExtraAmount(_maker, _inAmount);
    }

    function withdrawProposal(uint256 _proposal) public checkEnd {
        Proposal storage p = proposals[proposalMap[_proposal]];
        require(p.owner == msg.sender, "now owner");
        require(p.isEnd == 0, "withdrawn");
        (uint256 amount,uint256 count) = getResult(_proposal);
        _withdrawToken(tokenAddr, msg.sender, amount);
        p.isEnd = 1;
        emit Withdraw(msg.sender, _proposal, amount, count);
    }

    function withdraw() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function withdrawToken(address _tokenAddr, uint256 _amount) public onlyOwner {
        safeTransfer(_tokenAddr, msg.sender, _amount);
    }

    function getProposalLength() public view returns (uint256){
        return proposals.length;
    }

    function getProposal(uint256 _index) public view returns (uint256, uint256, uint256, uint256){
        require(_index < proposals.length, "out");
        Proposal  memory p = proposals[_index];
        return (p.name, p.amount, p.voteCount, p.userAddrArr.length);
    }


    function getUserVoteNum(address _addr, uint256 _proposal) public view returns (uint256, uint256){
        UserVote memory usVote = userVoteMap[_proposal][_addr];
        return (usVote.amount, usVote.count);
    }

    function getProposalUser(uint256 _proposal, uint256 start, uint256 len) public view returns (address[] memory arr){
        Proposal  memory p = proposals[proposalMap[_proposal]];
        uint256 end = start.add(len);
        require(end <= p.userAddrArr.length, "out range");
        arr = new address[](len);
        uint256 index = 0;
        for (; start < end; start++) {
            arr[index] = p.userAddrArr[start];
            index ++;
        }
    }


    function numPower(uint256 _n) public pure returns (uint256){
        return 2 ** _n;

    }

    function hash(bytes memory _b) public pure returns (bytes32){
        return keccak256(_b);
    }

    /**

        绿色：
        项目A：1*1 = 1
        项目B：
        用户1：4：边长2
        用户2：16：边长4，总计 6
        用户1：12，总计：6-2+（4+12)开根号=8
        项目C：2*2=4
        项目D：3*3=9

        底边总长度：1+8+2+3=14

        总方块面积：14*14 = 196

        配捐 = 196-（1+32+4+9） = 150

        最终：
        A：1 + 1/14 * 150 = 11.714285714
        B: 32 + 8/14 * 150 = 117.714285714
        C: 4 + 2/14 * 150 = 25.428571429
        D: 9 + 3/14 * 150 = 41.142857143

    */
    function getTotalCount() public view returns (uint256){
        uint256 total;
        for (uint i = 0; i < proposals.length; i++) {
            total = total.add(proposals[i].voteCount);
        }
        return total;
    }

    function getResult(uint256 _proposal) public view returns (uint256, uint256){
        uint ba = totalAmount;
        require(ba >= userVoteAmount, "eee");
        Proposal memory p = proposals[proposalMap[_proposal] - 1];
        if (ba > userVoteAmount) {
            uint256 total = getTotalCount();
            // uint256 acreage = total.mul(total);
            uint256 extraTotalAmount = ba.sub(userVoteAmount);
            uint256 pExtraAmount = p.voteCount.mul(extraTotalAmount).div(total);

            return (p.amount.add(pExtraAmount), p.voteCount);
        } else {
            return (p.amount, p.voteCount);
        }


    }

    function _withdrawToken(address erc, address _to, uint256 _value) internal {
        if (erc == emptyAddr) {
            payable(_to).transfer(_value);
        } else {
            safeTransfer(erc, _to, _value);
        }
    }

    function viewBalance(address erc, address holder) internal view returns (uint256) {
        if (erc == emptyAddr) {
            return owner.balance;
        } else {
            return IERC20(erc).balanceOf(holder);
        }
    }

    function sqrt(uint256 x) private pure returns (uint256) {
        uint z = (x + 1) / 2;
        uint y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }

    receive()external payable   {
        revert("not allowed");
    }
}
