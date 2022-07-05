# MakerDAO
MakerDAO是以太坊上的去中心化自治组织和智能合约系统，采用双币（MKR和Dai两个币）模式运行，MKR负责承载权益，Dai是稳定币。用户可以在系统中抵押以太坊而折价获得稳定币Dai。Dai与美元保持1:1锚定。

## DAI


## MAKER
MKR是MakerDAO系统的权益代币。MKR的持有人是整个系统中的最后买家。当系统出现巨大问题时，MKR持有人可以投票决定是否进行全局结算。MKR还可以用来投票决定偿还Dai时候的利息水平。通过支付借Dai的稳定费用以及参与管理系统而凝聚了这个系统的价值。MKR的价值和整个系统的表现息息相关。

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