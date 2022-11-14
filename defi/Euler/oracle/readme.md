# oracle

euler 使用 uniswap v3 作为价格输入源。但是如果引用了一个流动性差的池子，会有很大风险。

## oracle 攻击文章

- 攻击成本分析论文：https://github.com/euler-xyz/uni-v3-twap-manipulation/blob/master/cost-of-attack.pdf
- euler 项目方开发的工具：https://oracle.euler.finance/
- euer 团队的 univ3 预言机分析：https://blog.euler.finance/uniswap-oracle-attack-simulator-42d18adf65af
- 具体评级指标：https://blog.euler.finance/eulers-oracle-risk-grading-system-93f47d68205c

## Euler’s Oracle Risk Grading System

影响攻击 Uniswap V3 oracle 难度的两个主要因素:tvb 和流动性的集中。
评分系统：
由三个因素组成：

1. TVL locked in the Uniswap V3 pool ,![tvl](https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/defi/Euler/img/tvl.jpg?raw=true)
2. Slippage on a $1mil XYZ vs ETH buy order on Uniswap, <center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/defi/Euler/img/pump.jpg?raw=true" /></center>
3. Slippage on a $1mil XYZ vs ETH sell order on Uniswap, <center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/defi/Euler/img/dump.jpg?raw=true" /></center>

总体评级从 A 到 F，<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/defi/Euler/img/grade.jpg?raw=true" /></center> 总之，任何低于 B 的内容都应该避免使用!

## 参考链接

- 官方文档：https://docs.euler.finance/risk-framework/oracle-rating
