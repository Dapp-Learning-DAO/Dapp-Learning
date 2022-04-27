# oracle
euler使用uniswap v3作为价格输入源。但是如果引用了一个流动性差的池子，会有很大风险。

**oracle oracle评级**
euler项目方开发的工具：https://oracle.euler.finance/
euer团队的univ3预言机分析：https://blog.euler.finance/uniswap-oracle-attack-simulator-42d18adf65af


**Attack Simulator**
具体攻击可参考此篇链接：

Given current concentrated liquidity profile of the ABC/WETH pool, what would it cost the attacker to move a N-minute TWAP of the ABC price to x?

影响攻击Uniswap V3 oracle难度的两个主要因素:tvb和流动性的集中。
评分系统：
由三个因素组成：
1. TVL locked in the Uniswap V3 pool
2. Slippage on a $1mil XYZ vs ETH buy order on Uniswap
3. Slippage on a $1mil XYZ vs ETH sell order on Uniswap 
总体评级从A到F，总之，任何低于B的内容都应该避免使用!
攻击成本分析论文：https://github.com/euler-xyz/uni-v3-twap-manipulation/blob/master/cost-of-attack.pdf  




## 参考链接
- 官方文档：https://docs.euler.finance/risk-framework/oracle-rating