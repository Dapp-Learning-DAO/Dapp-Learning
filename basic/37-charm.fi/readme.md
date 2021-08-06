# charm.fi
 Uniswap V3 做市工具
策略研究：
分为两种单，基础单和限价单，区别在于做市区间的不同：
B (base threshold)   [X-B, X+B]
L (limit threshold)   [X-R, X], or [X, X+R]
每隔12小时，触发rebalance函数。

## 项目执行步骤
 [源码地址](https://github.com/charmfinance/alpha-vaults-contracts)
 rinkeby测试网部署步骤：
 ```
  1 brownie pm install Uniswap/uniswap-v3-periphery@1.0.0
  2 brownie test
  3 brownie addcounts new deployer
  4 export WEB3_INFURA_PROJECT_ID=0aae8358bfe04803b8e75bb4755eaf07
  5 export ETHERSCAN_TOKEN=xxxxxxxxxx
  6 brownie run deploy_rinkeby.py --network rinkeby
```
## 参考链接：
- 策略研究：https://learn.charm.fi/charm-finance/alpha-vaults/strategy