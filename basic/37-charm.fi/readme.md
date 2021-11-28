## charm.fi

Uniswap V3 做市工具  
策略研究：  
-分为两种单，基础单和限价单，区别在于做市区间的不同：  
B (base threshold) [X-B, X+B]  
L (limit threshold) [X-R, X], or [X, X+R]  
每隔 12 小时，触发 rebalance 函数。

## 相关依赖

- python3
- [brownie](https://eth-brownie.readthedocs.io/en/stable/toctree.html)

## 操作步骤

- 安装 brownie 包依赖

```bash
brownie pm install OpenZeppelin/openzeppelin-contracts@3.4.0
brownie pm install Uniswap/uniswap-v3-core@1.0.0
brownie pm install Uniswap/uniswap-v3-periphery@1.0.0
```

- 进行包 clone

```bash
brownie pm clone Uniswap/uniswap-v3-periphery@1.0.0
```

- 执行测试

```bash
brownie test
```

## rinkeby 测试网部署

- 配置账户

```bash
brownie addcounts new deployer
```

- 设置 WEB3_INFURA_PROJECT_ID

```bash
export WEB3_INFURA_PROJECT_ID=0aae8358bfe04803b8e75bb4755eaf07
```

- 设置 ETHERSCAN_TOKEN

```bash
export ETHERSCAN_TOKEN=xxxxxxxxxx
```

- 部署

```bash
brownie run deploy_rinkeby.py --network rinkeby
```

## 参考链接

- 策略研究: https://learn.charm.fi/charm-finance/alpha-vaults/strategy
- git 代码: https://github.com/charmfinance/alpha-vaults-contracts
