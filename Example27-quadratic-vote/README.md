### 参考资料
参考链接

二次方投票和二次方资助
https://www.matataki.io/p/6113


1. voteTool 二次方投票
2. FinancingTool 二次方融资

**共性一**
两个的提案都是先通过hash获取到id

``

    function hash(bytes memory _b) public pure returns (bytes32){
	        return keccak256(_b);
    }
``
在实际添加或者投票的时候用的上面获取到的id, 内部用的数字，是为了event可以保持该id  

实际好像bytes32也可以，但是bytes/string不行，event中会被hash

**共性二**
0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE  
表示接受以太坊，其他表示接受代币

另外， 两个都是例子，实际按照需求稍微修改即可

#### voteTool
    
二次方投票， 票数越多，需要金额越多
例： 第一票1eth, 第二票2eth,第三票4eth,第四票8eth
票数n  
金额 = 2**(n-1)  

暂未兼容eth/token一起投

- addProposal(uint256 _proposal) public onlyOwner （添加提案）
- expireProposal(uint256 _proposal) public onlyOwner （过期后无法再投票）
- vote(uint256 _proposal, uint256 _n) public payable(投票)
- withdraw() public onlyOwner(内部只是提eth, 代币需要修改)

#### financingTool
每个用户针对某个提案投票都是总金额的开平方
公式解读由 **rebase_Harry** 大佬提供~

``

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






    struct Proposal {
        uint256 name;//提案id
        uint256 amount;//获得的金额
        uint256 voteCount;//获得的份额
        address owner;
        address[] userAddrArr;//捐助用户地址
        uint8 isEnd;//0,1
    }

    struct UserVote {//每个用户每个提案会有一个实例
        uint256 count;//份额
        uint256 amount;//金额
    }

``

场景： 每个人可以对多个提案进行捐助，在一定时间内结束,结束后给一定时间用于增加配捐时间，确认完整结束后，可以由提案owner去领取捐助额

- addProposal(uint256 _proposal) public onlyOwner(添加提案，内部的p.owner=msg.sender有误，看需求修改)
- vote(uint256 _proposal, uint256 _inAmount) public payable(捐助)
- addExtraAmount(address _maker, uint256 _inAmount) public payable(配捐，_maker标记谁配捐的)
- withdrawProposal(uint256 _proposal) public checkEnd(结束后提取捐助额)
- function getResult(uint256 _proposal) public view returns (uint256, uint256) (查询提案目前的捐助额/份额)
- 其他就是相关查询方法， test开头的只是测试方法