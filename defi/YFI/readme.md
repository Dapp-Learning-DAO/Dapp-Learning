# 介绍   
Yearn.finance是一种DeFi的生态系统，该系统让较不熟悉的交易者使用许多复杂获利的工具。基本上，该系统提供整合服务，维护用户的资产，并且使利润最大化。安德烈·克罗涅是一位南非金融技术开发人员，他在发现不同DeFi应用提供的收益不一致后，受到启发，创建了Yearn.finance。    
该协议的主要功能称为机枪池。用户可以将加密货币存入其中并赚取收益。存入的资金通过一种努力实现收益最大化，同时将风险降至最低的策略来管理。在上线之初，机枪池主要面向稳定币，后来陆续支持以太币、代币化比特币产品、Chainlink和其他币种。  
机枪池非常重要，它可以降低以太坊高昂的交易成本。通过这种集资方式，只有一个账户（即每个机枪池的控制者）需要支付交易费用（燃料费）来进行流动性挖矿。

## 机制原理  
### yVault 代币  
每一个代币对应一个 Vault，用户把代币放到里面后，会得到yVault代币，协议会根据策略在不同的DeFi产品中寻求最佳回报的机会进行投资，复利产生的回报将使得yVault的净值增加，当用户赎回时，系统会扣除一部分管理费，将代币还给用户，并销毁yVault。  
yVault 代币是ERC20，这意味着它们可以像任何其他常见的以太坊代币一样转移和交易。    

### 投资策略  
针对每一个 yVault 都会存在一个或多个投资策略 ( Strategy )，在 V1 版本中每个 yVault 只支持一个 Strategy ，但是在 V2 版本中每个 yVault 最多可以实施20种策略，极大的丰富了产品的形态。截至目前，Yearn成员在不同的金库中一共部署了242种策略。   
任何人都可以构建策略，但为了将其添加到 yVault，策略师需要通过策略审查流程，包括概念审查、代码审查、安全审查和主网测试。构建策略的开发者可以获得策略收益的10%。  


### 策略收入   
yearn目前针对稳定币、DeFi代币、Curve LP三种类型的资产设计了不同的策略组合。  
1）稳定币和DeFi协议代币   
向AAVE存入DAI获得利息；  
向Curve的3pool稳定币矿池提供DAI流动性挖矿，赚取 CRV流动性挖矿激励和交易费用；   
2）Curve LP代币  
通过yearn向Curve的合约质押LP，获得流动性挖矿奖励，产出的CRV将被出售获得更多的LP。  
通过yearn向Convex的合约质押LP，获得流动性挖矿奖励，产出的CRV、CVX将被出售获得更多的LP。  

## YFI 治理代币  
YFI是yearn协议的治理代币，总量36666枚，目前全流通，市值6.7亿美元。  
yearn的收入来源主要是基础管理费用和投资绩效费用。     
20% 投资绩效费：只有当策略产生盈利时才收取20%的费用。  
2% 管理费：不管策略是否盈利，都会收取2%的费用。  
YFI代币持有者可以对社区提案投票，并获得协议收入的分红。  

## 合约代码  
[Vault](https://github.com/yearn/yearn-vaults) 源码都放在 github 上。 
访问 githubb ，然后 clone 源码到本地即可查看具体的代码实现。  
具体参考如下命令 
```shell
git clone https://github.com/yearn/yearn-vaults.git 
```

## 参考链接：
- notion: https://yearnfinance.notion.site/  
- github: https://github.com/yearn 
- yearn 官网: https://yearn.finance/#/portfolio   
- yearn 文档: https://docs.yearn.finance/  
- 机制原理介绍: https://mirror.xyz/0xB96A958A82eCAbab9e7cF14ae538c38996f2C7B6/9NtcTStvDYW3JpwWnFiYwfvJ12h0rzxQ4dHjRJ2Y06Q  
- yearn 代码解析: https://illustrious-soup-aa9.notion.site/Yearn-1a756cb0618148768be06c327ce6d649     
