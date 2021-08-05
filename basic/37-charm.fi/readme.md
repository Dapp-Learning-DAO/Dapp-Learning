# charm.fi
 Uniswap V3 做市工具
策略研究：
分为两种单，基础单和限价单，区别在于做市区间的不同：
B (base threshold)   [X-B, X+B]
L (limit threshold)   [X-R, X], or [X, X+R]
每隔12小时，触发rebalance函数。


## 参考链接：
- 策略研究：https://learn.charm.fi/charm-finance/alpha-vaults/strategy