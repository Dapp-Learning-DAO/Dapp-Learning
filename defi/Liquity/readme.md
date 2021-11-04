# Liquity
Liquity是一种去中心化的借贷协议，让您用以太币作抵押提取无息贷款。 贷款以LUSD（一种与美元挂钩的稳定币）的形式支付，并且要求110％的最低抵押率。

Liquity的主要优势包括：
●  利率为0％——作为借款人，您无需担心不断产生新的债务。
●  110％的最低抵押率——更有效地利用储蓄的ETH。
●  无治理——所有操作都是算法化的和自动化的，并且在协议部署时就已经设置好了协议参数。
●  可直接赎回——LUSD可以随时按面值赎回相关抵押品。
●  完全去中心化——Liquity协议没有管理密钥，并且可以通过由不同前端运营商提供的多个接口进行访问，从而使其不受审查。

Liquity应用场景：
- 通过打开金库，用ETH作抵押借入LUSD
- 通过向稳定池提供LUSD来换取奖励，以确保Liquity的安全性
- 质押LQTY以赚取其他用户借入或赎回LUSD所支付的费用收入
- 当LUSD价格低于1美元时，用1 LUSD兑换价值1 USD的ETH


## 什么是LQTY？

LQTY是Liquity协议发行的二级代币。它捕获系统产生的费用收入并以此激励早期用户和前端运营商。
 LQTY的总供应量上限为100,000,000个代币。
LQTY奖励只会累积发放给稳定提供者，即将LUSD存入稳定池的用户、促成这些存款的前端以及LUSD:ETH Uniswap池的流动性提供者。
LQTY的社区发行（在LP激励和社区储备之外）遵循每年减半的时间表，由以下函数描述：32,000,000*(1–0.5^year)。设置这条发行曲线的目的是有力地激励早期采用者，同时保持一定的长期激励。

## 白皮书介绍
请参考[白皮书概述](./whitepaper/Liquity白皮书概述.md)  
## 合约解析
请参考[代码解析](./contract/协议代码库解析.md)  
## 参考链接
- [Liquity 官网](https://www.liquity.org/)
- [Liquity Github](https://github.com/liquity/)
- [Liquity 白皮书](https://docsend.com/view/bwiczmy)
- [微信公共号](https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=MzkzODI1MTk2MQ==&scene=124#wechat_redirect)
- [Dune 数据分析](https://dune.xyz/projects/liquity) 
- [「Rebase 大学」课程：项目解读——去中心化稳定币协议 Liquity](https://www.bilibili.com/video/BV1iV411J7dr)
