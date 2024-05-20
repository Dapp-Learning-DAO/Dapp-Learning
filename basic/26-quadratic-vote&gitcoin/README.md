[中文](./README-CN.md) / English
# Quadratic Voting and Quadratic Funding

## Concept

In the governance of the public sphere, votes are needed to decide where the funds will be spent, and which projects will receive priority funding. For example, a city may allocate its budget for projects such as parks, hospitals, roads. Or a blockchain project funded by communities and institutions may allocate its budget for projects such as wallets, developer tools, document editing, hackathons, community podcasts, privacy agreements, etc.

There are usually two ways to vote: "one-person-one-vote" and "one-dollar-one-vote."

### One-Person-One-Vote

The nature of "one-person-one-vote" is that no matter how much you care about something, you can only vote for it once. In Vitalik's article, one-person-one-vote is: if you care about an issue (or a public good/project), the cost of your first vote is extremely low, but if you want to continue to contribute, the cost becomes infinitely high (because you only have one vote).

### One-Dollar-One-Vote

One-dollar-one-vote is a way to vote with money (or Token), people who care more about an issue can contribute more (provided you have enough money/tokens). For example, the PoS consensus implements this idea. This approach leads to the ability to buy influence.

Suppose a community wants to allocate its budget for two public infrastructure projects: a road and a garden on a street corner. Perhaps most people are more concerned about the road, but the rich man who lives on the corner is very concern about having a garden on the corner. The rich man will pay a lot of money, and as a result, projects that most people care about may lose out to projects that few people care about.

### Think

What if we want to take into account people's concerns about different issues at the same time, without completely "buying influence"? That's when you can use quadratic vote and quadratic fund.

### Quadtratic-Voting

Quadratic voting is a collective decision-making procedure which involves individuals allocating votes to express the degree of their preferences, rather than just the direction of their preferences. By doing so, quadratic voting seeks to address issues of voting paradox and majority rule. Quadratic voting works by allowing users to "pay" for additional votes on a given matter to express their support for given issues more strongly, resulting in voting outcomes that are aligned with the highest willingness to pay outcome, rather than just the outcome preferred by the majority regardless of the intensity of individual preferences. The payment for votes may be through either artificial or real currencies (e.g. with tokens distributed equally among voting members or with real money). Quadratic voting is a variant of cumulative voting in the class of cardinal voting. It differs from cumulative voting by altering "the cost" and "the vote" relation from linear to quadratic.

Quadratic voting is based upon market principles, where each voter is given a budget of vote credits that they have the personal decisions and delegation to spend in order to influence the outcome of a range of decisions. If a participant has a strong support for or against a specific decision, additional votes could be allocated to proportionally demonstrate the voter's support. A vote pricing rule determines the cost of additional votes, with each vote becoming increasingly more expensive. By increasing voter credit costs, this demonstrates an individual's support and interests toward the particular decision. If money is used, it is eventually cycled back to the voters based upon per capita. Both E Glen Weyl and Steven Lalley conducted research in which they claim to demonstrate that this decision-making policy expedites efficiency as the number of voters increases. The simplified formula on how quadratic voting functions is:

```math
cost to the voter = (number of votes)^2
```

The formula in smart contracts is slightly different:

```math
cost to the voter =  = 2^0 + 2^1 + 2^2 + ... + 2^(number of votes - 1)
```

## Code Review

1. voteTool quadratic vote
2. FinancingTool quadratic fund

### Common One

In both cases, the ID is obtained using hash

```solidity
function hash(bytes memory _b) public pure returns (bytes32){
    return keccak256(_b);
}
```

Since dynamic value types such as `bytes` and `string` will be hashed in the event indexed parameters, the hash value is directly used as the id value of the vote.

### Common Two

Address `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE` means accepting ETH, and the other means accepting tokens.

Both Addresses are examples and can be modified as required.

### VoteTool

Quadratic vote, the more votes, the more money needed.

Example: the first ticket 1ETH, the second ticket 2ETH, the third ticket 4ETH, the fourth ticket 8ETH...

Then the cost of the n-th vote is:

```math
cost of n-th vote = 2^(n-1)
```

Using both eth and Token for voting is not implemented for now.

- `addProposal(uint256 _proposal) public onlyOwner` add proposal
- `expireProposal(uint256 _proposal) public onlyOwner` make proposal expired (Voters will no longer be able to vote)
- `vote(uint256 _proposal, uint256 _n) public payable` vote
- `withdraw() public onlyOwner` withdraw eth to voter

### FinancingTool

![quadratic_funding.png](https://vitalik.eth.limo/images/qv-files/quadratic_funding.png)

Each user vote on a proposal is the square root of the total amount ().

1. Each green square represents the amount of a donation, the area of the large square C can be interpreted as the total grant pool amount, and the yellow area S can be interpreted as an externally supported grant pool. Now, the amount each contributor contributes is `c_i`, so the area of that big square is `C=(sum(sqrt(c_i)))^2`, amount of math `S=C−sum(c_i)`
2. At any one time, if there is more than one contributor, then `C > sum(c_i)`
3. If S and the subsidy pool are not exactly the same, they can be allocated proportionally according to the yellow area
4. Multiple small donations can result in large yellow acreage, allowing projects to win more funding allocations

```solidity
/**
    Formula interpretation provided by Harry:
    Green: 
    project A: 1*1 = 1
    project B: 
    user1: 4: length 2
    user2: 16: length 4, total 6
    user1: 12, total: 6 - 2 + sqrt(4+12) = 8
    project C: 2*2=4
    project D: 3*3=9

    Total bottom length : 1+8+2+3=14

    Total square area: 14*14 = 196

    math amount = 196-（1+32+4+9） = 150

    Finally: 
    A: 1 + 1/14 * 150 = 11.714285714
    B: 32 + 8/14 * 150 = 117.714285714
    C: 4 + 2/14 * 150 = 25.428571429
    D: 9 + 3/14 * 150 = 41.142857143
*/

struct Proposal {
    uint256 name;// proposal id
    uint256 amount;// received amount
    uint256 voteCount;
    address owner;
    address[] userAddrArr;// voter address
    uint8 isEnd;// 0 not end, 1 ended
}

struct UserVote {// Each user will have one instance of each proposal
    uint256 count;
    uint256 amount;
}

```

Case: Each person can donate to multiple proposals within a certain period of time. A certain amount of time will be allocated to increase the donation time after the proposal complete. After confirming the complete completion, the proposal owner can claim the donation amount.

- `addProposal(uint256 _proposal) public onlyOwner` add new proposal, the code p.owner=msg.sender is wrongand can be modified
- `vote(uint256 _proposal, uint256 _inAmount) public payable` vote and donate
- `addExtraAmount(address _maker, uint256 _inAmount) public payable` add money to subsidy, _maker is donator
- `withdrawProposal(uint256 _proposal) public checkEnd` withdraw money after proposal ended
- `function getResult(uint256 _proposal) public view returns (uint256, uint256)` View the current contribution amount/share of the proposal

## Quick Start

- install dependencies

  ```sh
  yarn
  ```

- compile contracts

  ```sh
  npx hardhat compile
  ```

- run test scripts

  ```sh
  npx hardhat test
  ```

## Reference

- [Quadratic Payments: A Primer (by vitalik)](https://vitalik.eth.limo/general/2019/12/07/quadratic.html)
- [Quadratic vote and quadratic funde (from zhihu)](https://www.matataki.io/p/6113)
- [video intro](https://www.bilibili.com/video/BV1Y5411w77b/)
- [gitcoin](https://gitcoin.co/blog/gitcoin-grants-quadratic-funding-for-the-world/)
- [Quadratic voting-WIKI](https://en.wikipedia.org/wiki/Quadratic_voting)
