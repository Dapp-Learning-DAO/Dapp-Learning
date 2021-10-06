## Perpetual V2
「Curie」的颠覆性创新正是摆脱流动性依赖的关键，能够更大的提升资金的使用效率,将永续协议的 vAMM 模型与 Uniswap V3 耦合，经济模型与机制逻辑放在永续协议上，通过 Uniswap V3 进行交易的执行层。
**设计方案**
- Perp V2的聚合流动性依托于Uniswap V3，V1中原有的 vAMM 逻辑在Uniswap V3上运行。提高资金利用率。

- Perp V1版本USDC是真实资产，而对应资产（ETH）是vault池子是虚拟的。
Perp V2在Uniswap V3上以v-Token创建池子，比如vUSDC/vETH，v-token是Perpetual Protocol系统生成的代币，目前仅用于Perp系统内的做市和交易等，这些池子真实的建立在目前的Uniswap架设在Arbitrum的V3上。 均为真实币对。

- Perp v1中不需要做市， Perp V2 中为LP提供杠杆，称为「Leveraged LPs」（杠杆 LP）
若LP向清算所（Clearing House）提供1,000 USDC进行做市，则Leveraged LPs功能可以在10倍范围内添加vUSDC，这10,000 vUSDC就成为LP可以在系统内放置流动性的总额度（也称为“信用”），LP可以将其添加到相应资产和区间上，比如可以分为5,000 vUSDC和价值5,000 vUSDC的vETH，添加到相应流动性池中。（跟哪个池子兑换？？）
在LP确定了对相应资产的分配额度后，系统铸造相应v-token，按照上述例子，系统铸造5,000 vUSDC和价值5,000 vUSDC的2 vETH（按照ETH价格2,500美金计算），LP可以按照自己的做市策略将这些v-token分配到Uniswap V3上的相应区间。

**资金费率**
Perp上提供的是永续合约，每1小时收取一次资金费，按照加密货币衍生品交易所FTX的规则进行计算，公式如下：

FundingPayment（资金费）=PositionSize（仓位头寸）∗FundingRate（资金费率）

$\ fundingRate = \frac{P_{perp}- P_{index}}{24}$   

问题：都做多怎么办？？

**清算**
当保证金比例下降到6.25%或以下时，就会发生清算，这一规则即维持保证金（Maintenance Margin）。
清算由清算人的机器人出发，作为清算的奖励，清算人获得6.25%保证金中的1.25%，其余最高5%保证金存入协议保险基金。

**保险基金**
Perp V1协议赚取的交易费用，50%归Staking持币者，50%归入保险基金。当系统遭遇清算过程的损失和资金损失等意外损失是，保险基金将作为第一道防线首先支付这些损失。  



##参考链接
curie: https://www.chainnews.com/articles/065325628807.htm
原理： https://www.fxfrank.com/blockchain/62786.html
https://docs.google.com/document/d/e/2PACX-1vRDdN03IvJFRMLolxBl4Np7OpzmniMXmJO0zQJNmndD1vL3YZ46bVgTc9VTy8KdCD4ZrnwYz7agbJJN/pub  

