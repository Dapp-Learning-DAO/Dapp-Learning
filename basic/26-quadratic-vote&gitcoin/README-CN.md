中文 / [English](./README.md)
# Quadratic Voting and Quadratic Funding

## 概念介绍

在公共领域的治理中，需要投票决定资金的使用，进而决定哪些项目获得优先的资助。例如，一个城市在修公园、修医院、修路等项目中分配预算，或一个由社区和机构共同资助的公链生态基金在钱包、开发者工具、文档编辑、黑客马拉松、社区播客、隐私协议等项目中分配预算。  
投票通常有两种方式：“一人一票”和“一块钱一票”。

### 一人一票

一人一票的本质是无论你多在意一件事，你只能给它投一票。在 Vitalik 的文章中，一人一票被解释为：如果你关心一件事（或者一个公共物品/项目），那么你投一第一票的成本极低，但如果还想继续贡献的话，成本变为无限高（因为你只有一票）

### 一块钱一票

一块钱一票是一种用钱（或 Token）投票的方式。这种方式让更关心一个问题的人可以贡献更多（前提是你有足够多的钱/Token）。例如，PoS 共识就实现了这种想法。很明显，这种方式导致可以用钱买影响力。例如一个社区希望在修路和在街角建花园两个公共基础设施项目上分配预算。可能大多数人都更关心道路，但有一个住在街角的富人非常关心在街角建花园。这时，这个富人可以付出很多钱，结果是大部分人关心的项目可能输给极少人关心的项目

### 思考

如果我们希望同时考虑人们对不同问题的关注程度，又避免完全“用钱买影响力”的困局，应该怎么办呢？ 这个时候就可以使用 "二次方投票" 和 "二次方资助"

### Quadratic-Voting

平方投票允许投票者为额外投票“付费”，以更强烈地表达对特定议题的支持，从而导致投票结果与支付结果的最高意愿一致，而不仅仅是用户偏好的结果。无论个人偏好的强度如何。投票的支付可以通过人工或真实货币（例如，在投票成员之间平均分配代币或使用真实货币）。平方投票是基数投票类别中累积投票的变体。它与累积投票的不同之处在于将“成本”和“投票”关系从线性变为平方。

基于市场原则，平方投票每个投票者都会事先获得了一些投票点数。他们可以使用这些点数来投票，藉以影响投票结果。如果投票者强烈支持或反对特定决定，可以花费点数，来取得额外的选票。平方投票，借此显示选民的支持、反对程度。选票价格规则决定了额外投票的成本，每多取得一次额外投票的成本会变得越来越昂贵。通过增加选民点数成本，来凸显个人对特定决定的支持。如果使用金钱，而非点数，这些花费最终会透过公共支出返回至选民身上。格伦·韦尔和 Steven Lalley 进行了相关研究，主张平方投票法的决策效率会随着选民数量的增加而增加。平方投票函数的简化公式是:

```math
选民的投票成本 = (投票数)^2
```

智能合约中的公式稍有不同：

```math
选民的投票成本 = 2^0 + 2^1 + 2^2 + ... + 2^(n-1)
```

## 代码解读

1. voteTool 二次方投票
2. FinancingTool 二次方融资

### 共性一

两个的提案都是先通过 hash 获取到 id

```solidity
function hash(bytes memory _b) public pure returns (bytes32){
    return keccak256(_b);
}
```

由于 `bytes` 和 `string` 等动态类型作为 event 的 indexed 参数，将会被 hash，所以直接把 hash 数值作为投票的 id 值。

### 共性二

0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
表示接受以太坊，其他表示接受代币

另外， 两个都是例子，实际按照需求稍微修改即可

### voteTool

二次方投票， 票数越多，需要金额越多

例： 第一票 1eth，第二票 2eth， 第三票 4eth，第四票 8eth...

那么第 n 票的成本则是：

```math
cost to the voter = 2^(n-1)
```

暂未兼容 eth/token 一起投

- `addProposal(uint256 _proposal) public onlyOwner` （添加提案）
- `expireProposal(uint256 _proposal) public onlyOwner` （过期后无法再投票）
- `vote(uint256 _proposal, uint256 _n) public payable` (投票)
- `withdraw() public onlyOwner` (内部只是提 eth, 代币需要修改)

### financingTool

![quadratic_funding.png](https://vitalik.ca/images/qv-files/quadratic_funding.png)

每个用户针对某个提案投票都是总金额的开平方

1. 每个绿色的方块代表一次捐助的金额，大正方形的面积 C 可以理解为总资助池金额，而黄色部分面积 S 可以理解为一个由外部支持的补助资金池。我们把所有绿色方块排列在大正方形的对角线上。这时，每一个贡献者投入的金额是 `c_i`，那么大正方形的面积是 `C=(sum(sqrt(c_i)))^2`，补助金额 `S=C−sum(c_i)`
2. 在任何时候，只要有多于一个贡献者，那么 `C > sum(c_i)`
3. 如果 S 和补助资金池不完全一致，可以根据黄色的面积按比例分配
4. 多次小额的捐助可以导致很大的黄色面积，从而让项目赢得更多的资金配比

```solidity
/**
    公式解读由 Harry 提供:
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

```

场景：每个人可以对多个提案进行捐助，在一定时间内结束，结束后给一定时间用于增加配捐时间，确认完整结束后，可以由提案 owner 去领取捐助额。

- `addProposal(uint256 _proposal) public onlyOwner` (添加提案, 内部的 p.owner=msg.sender 有误, 看需求修改)
- `vote(uint256 _proposal, uint256 _inAmount) public payable` (捐助)
- `addExtraAmount(address _maker, uint256 _inAmount) public payable` (配捐, _maker 标记谁配捐的)
- `withdrawProposal(uint256 _proposal) public checkEnd` (结束后提取捐助额)
- `function getResult(uint256 _proposal) public view returns (uint256, uint256)` (查询提案目前的捐助额/份额)
- 其他就是相关查询方法,  test 开头的只是测试方法

## 测试步骤

- 安装依赖

  ```sh
  yarn
  ```

- 编译合约

  ```sh
  npx hardhat compile
  ```

- 执行测试脚本

  ```sh
  npx hardhat test
  ```

## 参考资料

- [Quadratic Payments: A Primer](https://vitalik.ca/general/2019/12/07/quadratic.html)
- [二次方投票和二次方资助](https://www.matataki.io/p/6113)
- [视频](https://www.bilibili.com/video/BV1Y5411w77b/)
- [gitcoin](https://gitcoin.co/blog/gitcoin-grants-quadratic-funding-for-the-world/)
- [Quadratic voting-WIKI](https://en.wikipedia.org/wiki/Quadratic_voting)
