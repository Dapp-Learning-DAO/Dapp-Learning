# MakerDAO
MakerDAO 是一个基于以太坊的去中心化自治组织（DAO）和智能合约系统。它以双币模式运行，其中 MKR 是治理代币，Dai 是与美元锚定的稳定币。通过 MakerDAO，用户可以抵押数字资产以获得稳定币 Dai，用于去中心化金融（DeFi）生态中的交易、支付和储值。MakerDAO 系统是去中心化金融领域的基石之一，推动了稳定币和去中心化治理的发展。


## DAI
Dai 是一种与美元 1:1 锚定的去中心化稳定币。它通过超额抵押资产来保持价格稳定，避免了对传统银行系统的依赖。Dai 的特性包括：

抵押生成：用户将数字资产（如 ETH 或其他支持的资产）存入 Maker Vault，作为抵押品来生成 Dai。
去中心化：Dai 的生成和管理完全依赖于区块链上的智能合约，无需任何中心化机构的参与。
应用场景广泛：Dai 可用于支付、借贷、储值、交易以及其他 DeFi 协议中的操作。
Dai 的供应量随着用户需求动态变化，维持其稳定性主要依赖于 MakerDAO 的治理和市场机制。

## MAKER
MKR 是 MakerDAO 系统的治理代币，也是整个系统的价值承载工具。MKR 的功能包括：

治理投票：MKR 持有者可以参与 MakerDAO 的治理决策，如调整抵押率、债务上限和稳定费用等关键参数。
风险管理：在系统无法覆盖所有债务的极端情况下，MKR 持有者通过投票决定是否进行全局清算，或通过发行更多 MKR 来覆盖债务缺口。
稳定费用支付：借贷生成 Dai 的用户需要支付稳定费用，这些费用通过智能合约以 MKR 支付并销毁，减少 MKR 总供应量，从而提升 MKR 的价值。
MKR 的价值与 MakerDAO 系统的稳定性和发展息息相关，其供需关系也直接影响 MKR 在市场上的价格。


**清算**
清算要进行13%的罚款；
当抵押物的价值下降得太快以至于抵押物价值不足以抵偿债务的时候，会发生什么情况？
中心化的交易所通常通过一些保险基金或者一些面向用户的公关手段来弥补此类损失。
一旦系统到了全部抵押物价值不足以偿还全部债务的时候，Maker会通过发行和拍卖新的MKR（MakerDAO系统的治理代币）来进行资本重组。把新发行的MKR出售，买家需要从市场上收回Dai来购买MKR，购买新发行MKR的这些Dai被销毁，直到Maker系统回到抵押物价值大于全部债务的状态。投标人可以尽可能高的报出MKR/Dai价格（当然要在自己的意愿可接受范围内），出价最高的投标人会中标，实现交易，完成偿还系统债务。

拍卖规则：
在拍卖过程中，清算者要为固定数量的ETH用Dai出价来竞标，直到达到一个底价。这些出价要满足：
- 必须在距上一次出价后的一个固定时间窗口内完成出价
- 必须比上一次出价高出固定数量的Dai
- 必须在拍卖结束之前出价



## 参考链接
- maker 文档： 
https://makerdao.com/zh-CN/whitepaper/#%E6%91%98%E8%A6%81
- makerdao介绍简书：
https://www.jianshu.com/p/098ccb4122ef
- maker清算：
https://medium.com/dragonfly-research/liquidators-the-secret-whales-helping-defi-function-acf132fbea5e

- maker 312暴跌： 
https://medium.com/dragonfly-research/daos-ex-machina-an-in-depth-timeline-of-makers-recent-crisis-66d2ae39dd65

- makerdao 总述：
https://icode9.com/content-4-831617.html  
- makerDAO 治理：https://frosted-source-636.notion.site/Makerdao-61f91a71b32e4a3093a683ae6e4bab19