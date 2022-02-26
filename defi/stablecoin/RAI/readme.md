# RAI

## 背景
  由 Reflexer Labs 开发、由 ETH 支持的稳定资产 RAI 是一种降低或延迟资产波动性的方案，以便为其它 DeFi 协议提供这类低波动性的资产作为基础的标的资产。  
  RAI 是一种仅由 ETH 支持的稳定资产，与其他由央行发行的稳定币不同的是，RAI 依靠算法来维持价格的稳定，而无需与美元等外部价格挂钩，主打的特点是治理最小化，在尽可能少的人为干预下工作，这也是为什么创始团队 Reflexer Labs 把 RAI 称为金钱之神。
  格里芬困境：：即为了保证全球主要结算货币（美元）的充足性，不得「印出」超本国需求的美元；但由于货币超发，难以保证本国通货膨胀处于正常水平，在确保国际资金充足的情况下，实际上是伤害了本国的利益。  
 
 ## 原理
 RAI 在很多方面与 DAI 相似，是 MCD 系统的硬分叉。
 RAI 有一个任意设定的初始目标价格（发行时初始目标价格为 3.14 美元），只要市场价格与目标价格不同，RAI 就会通过算法调整利率——也就是「赎回率」（redblockquoteption rate）以应对价格变化。当赎回率调整时，人们就会选择铸造或销毁他们的 RAI，通过改变代币供应量，RAI 价格也就能保持稳定了。 

 用户收到的 RAI 单位数取决于目标价格，但价值不取决于目标价格。例如，假设 RAI 的最小抵押比率为 145%，用户存入了 1 ETH，1 ETH = $100 USD。用户可以提取价值高达 69 美元的 RAI。如果 RAI = 1 美元的目标价，那么价值 69 美元的 RAI 将相当于 69 RAI。如果目标价为 RAI = 3 美元，那么价值 69 美元的 RAI 将只有 23 RAI。因此，RAI 的目标价格可以理解为系统内债务的价格。
 当 RAI 的市场价格等于其目标价格时，可以说 RAI 到达了均衡模式。当 RAI 的均衡被扰动时，控制器设定反向市场利率，具体说根据目标价格与市场价格的相对差来确定利率。

 在 MakerDAO，向 DAI 的贷款人收取稳定费（stability fee）。如果稳定费是 3%，你借了 100DAI，那么一年后你就欠了 103DAI。MakerDAO 促进稳定性的方法之一是，当 DAI 的价格下降时，让 MKR 持有人投票增加稳定费，借贷人到期需要偿还更多的 DAI，这意味借款人需要在市场中买更多的 DAI 以偿还贷款（总体贷款美元计价不变），这就将 DAI 的价格推回到 1 美元的固定汇率。

 RAI 的利率更有趣。例如，如果 RAI 的市场价格从均衡点下跌了 10%，而 RAI 调节机制的反应就是设置 x%/天的利率，那么 RAI 实际上是将目标价格提高了 x%/天。对 RAI 借款人来说，由于将债务重新定价为更高的成本，这与直接向他们收取利率具有同样的影响，这也将促使其买入更多的 RAI 以偿还 RAI 贷款（但实际锚定美元成本不变）。RAI 的这种机制鼓励借款人偿还债务 (为此他们需要购买 RAI)，这有助于 RAI 恢复平衡。  

 ETH 杠杆需求上升→ 质押并卖出 RAI → RAI 价格下降；（质押出 RAI，并用 RAI 买入 ETH）
RAI 需求上升→购买 RAI → RAI 价格上升。


## 技术解析
技术文档：https://docs.reflexer.finance/
medium :https://medium.com/reflexer-labs/stability-without-pegs-8c6a1cbc7fbd


## 参考链接
- Ameen Soleimani 详细解释了RAI如何解决稳定币特里芬困境： https://zhuanlan.zhihu.com/p/358193948
- Reflexer：不同于稳定币的另一原生加密稳定资产RAI： https://zhuanlan.zhihu.com/p/352154160
- 一文读懂新型算法稳定币三杰Fei、Float、Reflexer： https://www.blockvalue.com/blockchain/20210323845831.html
- 看Reflexer如何将PID控制理论应用于加密货币: https://xw.qq.com/partner/hwbrowser/20210412A0AYVE/20210412A0AYVE00?ADTAG=hwb&pgv_ref=hwb&appid=hwbrowser&ctype=news
- Advanced DeFi Management: https://defisaver.com/
- 特里芬难题: https://wisburg.com/articles/194355