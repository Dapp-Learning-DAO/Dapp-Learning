# Sushi 
## 简介  
SushiSwap于2020年9月由两位匿名开发者推出，他们被称为“大厨”Nomi和0xMaki。作为目前以太坊区块链最受欢迎的去中心化应用程序(DApp)之一，SushiSwap在自己的去中心化交易平台(DEX)协议中采用自动化做市商(AMM)模式。简而言之，SushiSwap不存在订单簿。相反，加密货币的买卖由智能合约促成。  

## 和 Uniswap 关系  
SushiSwap 最初是 Uniswap的 分叉，以 Uniswap 的代码为基础构建而成，同时引入了一些关键差异。其中最大的差异是奖励以 SUSHI 代币形式发放。SushiSwap 的流动性供应商获得的奖励是协议的原生代币SUSHI，它同时是一种治理代币。与 Uniswap (UNI)不同，即使在停止提供流动性之后，SUSHI 持有者仍能继续赚取收益。    
虽然 SushiSwap 最初可能是作为 Uniswap 的分支和直接竞争对手开始的，但今天这两个协议服务于两个非常不同的市场。 SushiSwap 的团队通过构建一整套产品来支持代币生命周期，而不仅仅是专注于二级市场，证明了他们提供和保持先发优势的能力。这给了他们一个独特的地位，因为他们不仅在产品方面进行了纵向扩展，而且还将其产品扩展到第一层链和第二层扩展解决方案。这使 Sushi 成为活跃参与者的一个家喻户晓的 DeFi 名字，并在进入一个新的生态系统时提供了一定程度的信任和舒适度

## SushiSwap 功能介绍 
- 代币兑换  
和其他去中心化交易所一样，SushiSwap 提供了去中心化的代币兑换功能，可以通过 SushiSwap 进行代币的兑换，交易過程中，你除了可以知道自己的成交價格、手續費、購買數量外，也可以設定滑點的容許限制、Gas Fee 上限…等，對用戶來說相當方便  

- 流动性挖矿  
用户通过锁定代币，可以获得其他用户进行代币兑换而收取的手续费，从而获得收益 

- 借贷 (Kashi)  
Kashi 是建立在 Sushiswap 平台中的资金庫，简单來说 Kashi 是一個以借贷协议为基础的融资平台。  
与大家常見的 DeFi 借贷平台不同的是，Kashi 会将「不同的借贷交易對进行隔离」，这样即使某個交易对发生狀況時，也不至于对整個平台造成重大損失，大大降低了用戶使用平台內借贷的风险。 

- IDO 平台 (MISO) 
IDO 即为首次在去中心化平台 (DEX) 進行的新代币发售模式；而 Sushiswap上的 IDO 平台 MISO （Minimal Initial SushiSwap Offering） 成立於 2021 年 5 月， 提供项目方能直接向平台上的用戶进行募资。 
不仅提供用户能即早布局潜力代币的机会，若項目方募資成功也能直接在 Sushiswap 上建立流动性，省去从零開始宣傳相目力气。  

- BentoBox  
BentoBox 是一个代币库，也能够被是为是一个渠道，既能够让用户用十分低的 Gas 体会到上面的多个 Dapp，也能够让开发者十分容易地、低成本地在上面进行使用开发。  
目前，上面的第一个 Dapp 借贷产品 Kashi，用户可在此放贷和借贷。为了更好地激励用户参加，咱们也启动了借贷流动性挖矿，用户只需在 Lend 中借出代币（生成 km 代币），再在 Yield 中抵押 km 代币即可参加流动性挖矿。  
换成国内用户熟悉的比如，BentoBox 能够类比成微信渠道，Kashi 则是上面的第一个小程序。 

## 原理介绍  
限价单实现： https://docs.sushi.com/products/limit-order-v2

## 合约源码  
Sushi 的源码放在 github 上，访问 [SushiSwap github](https://github.com/sushiswap/sushiswap) ，然后 clone 源码到本地即可。  
具体参考如下命令 

```shell
git clone https://github.com/sushiswap/sushiswap.git 
```

## 合约分析  
选取了 SushiSwap 中几个重要的合约进行分析，具体的分析文档存放在 analyze 目录下。
在上一步的 "合约源码" 中 clone 下 SushiSwap 的源码后，可以参考 analyze 目录下的合约分析文档，同时结合具体的源码进行 SushiSwap 源码的学习解读。

## 参考链接
- notion 总览: https://wasabinews.notion.site/wasabinews/Wasabi-News-5d63320777c04b51bd71928b318c3247     
- notion sushi: https://rielychen.notion.site/SUSHI-6568764f66a5446eb9deb0db1527513b  
- sushi 官网文档： https://docs.sushi.com/   
- SushiSwap 研究笔记： https://zhuanlan.zhihu.com/p/376117695   
- SushiSwap 攻击事件(2021年1月27号) 分析: https://zhuanlan.zhihu.com/p/372058217  
- 由寄生到新生: http://www.liandu24.com/archives/6275.html  
- 全面理解Sushi的产品与估值逻辑: https://www.defidaonews.com/article/6721072  
- sushiswap 竞品比较 ： https://sourceforge.net/software/product/SushiSwap/alternatives   


