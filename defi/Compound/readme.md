# Compound

是一个以太坊上的货币市场，一个任何用户、机构和 dApps 都可以使用的链上账本。它提供了存币和借币的功能，就像一个银行，用户可以存币获的利息收益，或进行抵押借币。在实现原理上，Compound 的帐本模型也与银行类似，并遵循了国际会计准则。
基础特性：
● 资金池
● 基于供需法则，由算法生成利率
● 浮动利率，无需协商
● 完全透明的代币余额信息，记录所有历史利率

利率模型：
U = 借款 /（ 现金 + 借款 ）
借款利率 = 10% + U *30%
存款利率 = 借款利率* U *（ 1 - S ）

## 分析工具

[GeoGebra](https://www.geogebra.org/) -- 数学作图工具

## dao治理
  comp治理： https://docs.qq.com/doc/DVHRTcGlld1RNanN0
## 参考链接

- <https://learnblockchain.cn/article/1357> 代理投票
- <https://medium.com/coinmonks/math-in-solidity-part-4-compound-interest-512d9e13041b>
- <https://github.com/compound-developers/compound-governance-examples>
- <https://medium.com/steaker-com/defi-%E7%9A%84%E4%B8%96%E7%95%8C-compound-%E5%AE%8C%E5%85%A8%E8%A7%A3%E6%9E%90-%E5%88%A9%E7%8E%87%E6%A8%A1%E5%9E%8B%E7%AF%87-95e9b303c284>
- <https://medium.com/steaker-com/defi-%E7%9A%84%E4%B8%96%E7%95%8C-compound-%E5%AE%8C%E5%85%A8%E8%A7%A3%E6%9E%90-%E6%96%B0%E7%89%88-dai-%E5%88%A9%E7%8E%87%E7%AF%87-f72bae7a54f6>
- <https://github.com/codenamejason/compound-supply-examples/tree/master/solidity-examples>
- <https://learnblockchain.cn/article/1015>
- <https://github.com/compound-developers/compound-supply-examples>
- 清算机器人：https://blog.baowebdev.com/2019/11/how-to-build-a-compound-liquidation-bot/
