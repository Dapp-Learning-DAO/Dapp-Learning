# AAVE Distribute Mechanism

## WHAT IS AAVE

> The native asset of the Aave ecosystem, which constitutes the foundation of governance and safety for the Aave Protocol.

AAVE是由Aave平台发布的平台管理代币，持有者可以使用AAVE发起AIP,投票等参与到社区的政策管理中。

## WHAT AAVE CAN DO

根据Aave的AAVENOMICS，AAVE主要有两个功能：

1. 发起倡议并投票。AAVE的持有者可以参与Aave平台的政策管理。持有者可以在AAVE论坛提出自己的 [Aave Request for Comments (ARC)](https://governance.aave.com/)，然后进一步在 [Aave Snapshot](https://snapshot.org/#/aave.eth) 上进一步和社区分享，争取投票。在取得一定共识后通过 [Aave Improvement Proposal (AIP)](https://docs.aave.com/governance/aips) 的方式发起投票。提案根据影响范围可以分为两种，一种是关乎整个协议的，另一种是只关乎单个资金池。

2. 保障协议，抵御攻击。在Aave的风险管理中，AAVE持有者可以将AAVE质押在Safe Module中，保障协议遇到 [Short Fall Event](https://docs.aave.com/aavenomics/safety-module#shortfall-events) 时可以通过出售AAVE的方式抵抗攻击，具体可以看 [Safe Module](https://docs.aave.com/aavenomics/safety-module)。作为回报，Aave会以协议的交易费或AAVE的方式发放给质押者。

## HOW Aave DISTRIBUTE AAVE

目前AAVE的总量在16M。
1. 13M将会被LEND持有者以100:1的兑换率换取AAVE，从而促进用户从AAVE V1转移到AAVE V2。

2. 3M的AAVE将会存储在 [Aave Reserve](https://etherscan.io/address/0x25f2226b597e8f9514b3f68f00f494cf4f286491)。其中部分AAVE会存放在Safe Module中保障协议。剩余部分将会当作Ecosystem Incentives奖励给参与市场的流动性提供者以及借贷人，从2021年开始，Aave社区通过了几个称为 liquidity mining program 的协议，主要目的是促使Aave v1的用户转移到V2。根据通过几个的AIP协议，Aave Reserve将在一定时间内以 [stkAAVE](https://etherscan.io/token/0x4da27a545c0c5b758a6ba100e3a049001de870f5) 的形式按比例发放给在Ethereum Markert上的资产价值最高的几个市场，又根据每个市场的风险以不同的比例实际发放给市场借贷双方。相关的通过的协议包括:
- [AIP-16](https://app.aave.com/governance/proposal/11/):自26/4/2021起3个月的时间内以每天2,200 stkAAVE的方式发放给几个市场中的借贷双方，其中稳定币市场是借贷双方平分，WETH和WBTC则是以95:5的比例分发给储户和借款人； 
- [AIP-25](https://app.aave.com/governance/proposal/21/):在AIP-16的基础上延长四周；
- [AIP-32](https://app.aave.com/governance/proposal/28/): 从24/8/2021开始，在此前的基础上，每日发放的stkAAVE减少9%，即每日发放2002枚stkAAVE，仍然发放3个月，增加了需要分发的token市场; 
- [AIP-47](https://app.aave.com/governance/proposal/47/): 从22/11/2021开始，分发三个月，每日发放的stkAAVE减少为1540枚，增加BUSD,CRV,FRAX和DPI四个分发对象，去除UNI, GUSD; 在稳定币等低波动的资产上，AAVE的分发更倾向于借款人，储户和借款人的分发比例为1：2，高波动的资产则只发给储户;
- [AIP-59](https://app.aave.com/governance/proposal/60/): 从21/2/2022开始，分发三个月；每日发放的stkAAVE减少到1078。

## HOW liquidity mining program WORK

在通过一个AIP提案决定分发后，在Incentives Controller中会记录每一个资产的`emissionPerSecond`，并且会记录每一个资产assetIndex，每一个用户userIndex已经累计的奖励，当每一次aToken/debt Token被minted/burn时都会触发一次incentive controller的handleAction(具体的代码定义在 [IncentiveERC20代码](https://github.com/aave/protocol-v2/blob/master/contracts/protocol/tokenization/IncentivizedERC20.sol)中)， handleAction会更新assetIndex和userIndex从而实现AAVE的分发。

## 链上合约及代码

目前已看见的好几个Aave Ethereum Mainnet资产如abusd，ausdc在链上的incentive controller都是[Incentives Controller Proxy](https://etherscan.io/address/0xd784927Ff2f95ba542BfC824c8a8a98F3495f6b5)，其实际的实现合约是 [Incentives Controller Impl](https://etherscan.io/address/0xd9ed413bcf58c266f95fe6ba63b13cf79299ce31)，Incentive Controller的合约代码是 [Incentives Controller Github](https://github.com/aave/incentives-controller)

## 参考资料

- [Aavenomics](https://docs.aave.com/aavenomics/)

- [Aave Governance](https://app.aave.com/governance/)

- [Aave Governance Forum](https://governance.aave.com/c/governance/4)

