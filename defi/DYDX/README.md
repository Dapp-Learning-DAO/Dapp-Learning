## DYDX

### 白皮书
[v1版白皮书：2018-6](https://whitepaper.dydx.exchange/)
dydx 是最早成立并推出可用产品的去中心化期货交易所，为订单簿式Dex，交易者之间进行点对点交易，由做市商和多空双方交易者三方博弈。dydx架设在以太坊二层网络Starkware上，并采用了StarkEx交易引擎，实现了资产的去中心化自托管。dydx能够提供与中心化交易所接近的交易体验，也采用了与Cex相似的运营模式。目前其交易量为在交易挖矿的推动下衍生品Dex中第一。

**特点**
从交易组织方式看，它采用了订单簿式，由专业做市商进行做市，LP提供部分做市资金。  
dydx产品体验良好，采用了以太坊二层网络项目Starkware开发的交易引擎StarkEx，实现了去中心化资产的自托管（用户将资金从钱包转到智能合约上进行托管），并且实现了低Gas和高交易速度。  

### 功能
杠杆倍率：dydx永续合约产品提供了最高25倍的多空两方交易功能，最小杠杆倍率变动为0.01。  

订单簿/AMM:从交易结算形式来看，dydx永续合约是订单簿形式，由做市商提供流动性。

限价/止损：dydx永续合约具备限价单和止损单功能，可以进行限价交易和止损止盈交易。

保证金：BTC和ETH交易对，其最高杠杆倍数为25倍，因此初始保证金要求为4%，维持保证金要求为3%。其他交易对根据其最高杠杆倍率有不同的保证金要求。

强平价格/清算价格：用于清算的标记价格是由Chainlink的二层价格喂送的指数价格。

存款/取款：图2-3左上角显示了账户余额（Account），并有存款（Deposit）和取款（Withdraw）两个按钮，由于产品架设在二层网络StarkWare上，因此在dydx永续合约产品交易，需要存入资金后，在余额范围内进行交易，平仓后资金回到dydx账户内，需要进行取款才能回到交易者的以太坊钱包内。

**资金费率**（１小时费率）：与其他的永续合约一样，dydx永续合约产品有资金费设计，每8小时收取一次，但其资金费率表示为１小时的费率，每８小时收取一次１小时费率（不将１小时费率乘以８），资金费率具体计算方式为：

资金费（Premium）=（Max（0，出价冲击Impact Bit Price-指数价格）-Max（0，指数价格-卖价冲击Impact Ask Price））/指数价格

交易费用：dydx上Maker（挂单者）和Taker（吃单者）费用不同，费率随交易量增大而递减，Maker的费率从0.05%到0,交易量达到10,000,000美元之后费率为0；Taker费率从0.2%到0.05%，交易量达到200,000,000美元后为0.05%。  

Gas费用：由于在二层网络Starkware上运行，交易不需要支付Gas费用，但在存款/取款过程需要支付Gas。

结算速度：实测非常顺滑，这是由于二层网络的性能优势，也由于用户资金已经托管到了StarkEx上。

**二层方案** 
dydx不仅是架设在二层网络上，而是使用Starkware项目方开发的StarkEx作为V2永续合约产品的交易引擎。
交易和数据存储的方式分为两种，简单说是“交易数据要不要上链”，Starkware实际上两种都有（StarkNet和StarkEx分别属于这两种）  
dydx所用的StarkEx产品采取的是数据不上链的方案。  
Starkware采用的是有效性证明——这种“数据不上链+有效性证明”的方案称为Validium（不同于“数据上链”型的Rollup方案，比如另一知名项目的Arbitrum）。
dydx不仅是架设在二层网络上，而是使用Starkware项目方开发的StarkEx作为V2永续合约产品的交易引擎。

StarkEx：一种可扩展性引擎，由多个组件组成。

组件：包括StarkEx Service（Stark交易服务）、SHARP、Stark Verifier（Stark验证器）和Stark Contract（Stark合约）等。

dydx主要有永续合约交易和杠杆交易。
## dydx保证金

保证金交易：

- 出借人通过合约签名一笔交易，指明自己愿意借出什么样的 token、借出多少数量、保证金多少、利息多少，然后就可以借款给别人做保证金交易了。这些借款的 offer 可以同步到链下的交易平台，在上面列出 order book。

- 一个用户想要做保证金交易，通过向 dYdX 的智能合约发送一笔交易，指明自己要接受哪个借款、要借多少数量、指定一个未来把这些借贷来的 token（即 owed token）卖出换成另一个持有 token（即 held token）的买盘，来开始保证金交易。

- 根据这笔交易，智能合约会把保证金从用户那里转移到合约内部，然后通过外部的去中心化交易所——比如0x——再把这些借贷来的 owed token 以指定的买盘价格卖出去换成 held token，然后合约会一直帮我们保管这些保证金，一边帮我们自动卖出 owed token 换成 held token，直到用户再次发来另一笔交易，指定卖盘结束这次保证金交易。

### 代码解析
[V1版代码](https://github.com/dydxprotocol/protocol_v1)
在实现上，dYdX协议由三个主要的智能合约构成。  

Margin contract：负责保证金交易的业务逻辑。
Proxy contract：负责代表用户完成各种资产的转移。
Vault contract：作为一个存储金库，帮用户托管保证金交易中的资产。
具体原理可以看https://mp.weixin.qq.com/s/VF4JGW-XG3drUAelKbYySA  



### 保证金交易和杠杆

保证金（Margin）就是一个交易员手上可用的抵押品数量。一般来说，借入资金都需要用其它资产作为抵押，而且使用完之后还必须支付利息。

杠杆（Leverage）就是利用保证金撬动起来的资金——如不借助杠杆，交易者就没有那么多购买力投入到更高价值的交易中。杠杆提高了交易者的潜在收益率，但同时也提高了风险。

杠杆率实际上只是交易员风险资本的一个参数，决定了该交易员与平仓线的距离。

### 全仓保证金模式（cross margin）
全仓保证金模式是拿你放在 dYdX 账户中的所有资产作为抵押品。虽然表面上看起来风险更大，对交易者来说却有几个方面的好处。  


### 逐仓保证金模式（isolated margin）

逐仓保证金（isolated margin），名副其实，就是你专门 「分割」出了一部分资金、做了一个专门的杠杆合约，用在一项交易中。杆杆率决定了你需要投入多少保证金存款，而且，如果你被强制平仓，你分割出来的那部分资金就是你的损失上限了。

优势：
- 容易看出交易员动用的资金数量和每日收益（PNL）
- 可以直接从钱包中交易
- 适合短期投机




## 参考链接
- https://help.dydx.exchange/en/articles/4320633-why-should-someone-use-the-perpetual-vs-margin  永续跟杠杆差别
- https://docs.dydx.community/dydx-governance/jiao-yi-jiao-cheng/ru-he-zai-dydx-shang-kai-kong-dan-zuo-kong/ru-he-zai-dydx-shang-kai-duo-dan-zuo-duo 操作文档  
- https://www.chainnews.com/articles/669485806574.htm Validium介绍
- https://www.chainnews.com/articles/906891466719.htm  全景式解读加密货币衍生品交易赛道  
- https://mp.weixin.qq.com/s/VF4JGW-XG3drUAelKbYySA  橙皮书dydx保证金交易原理介绍
