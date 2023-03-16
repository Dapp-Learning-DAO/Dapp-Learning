# RAI


## 介绍
1. 什么是RAI？和DAI的区别是什么？
Reflexer是在2021年推出的一款稳定币协议，RAI是该协议的稳定币。RAI本身由ETH抵押生成，但并不锚定美元或者某一特定指数，而是通过Reflexer特有的机制设计使得RAI本身的价格波动很小，从而实现“稳定币”的稳定特性。
RAI本身的生成机制和DAI一样，都是抵押某个资产而生成。但RAI和DAI的区别主要有两点，一是RAI的抵押资产只能是ETH，而DAI的抵押资产有好几种；二是RAI并不像DAI一样锚定美元的价值，而RAI的价格是浮动的，并依托市场机制的博弈使得该价格的波动性并不像风险资产（BTC/ETH/各类山寨）那样剧烈。
RAI将比风险资产更稳定，但是比稳定币更波动。

2. RAI的稳定机制
RAI有两个价格，一是赎回价格（redemption price），二是二级市场交易价格（market price）。RAI会通过一个赎回比率（redemption rate）来控制赎回价格，以及控制市场价格始终围绕赎回价格来回波动。RAI主要依赖这两类角色--SAFE users和holders的博弈来改变RAI的供需。
SAFE users是抵押ETH生成RAI的投资者，那么RAI就相当于SAFE users的负债，注意这里的负债计价采用的是赎回价格，和市场价格无关，当SAFE users想要还清债务时，也是按照赎回价格偿还给协议并支付一定利息；而holders则是通过市场价格购买RAI的人。

**平衡机制**
1. **当市场价格大于赎回价格时**
通过PID控制模块（后面展开叙述）协议将会输出一个负的赎回比率，负的赎回比率意味着RAI的赎回价格会不断下降。因为预期未来赎回价格会下降，就会鼓励users现在抵押生成更多的RAI然后在市场上卖掉，等到未来价格更低的时候再从市场上买回来还掉债务，这样就依靠RAI价格下跌赚取了收益（类似于融券做空）。而对于holders而言，未来赎回价格的下跌也会联动到市场价格的下跌，因此holders就有动机选择卖掉RAI以规避RAI价格的下跌。这两种行为都会导致市场上RAI供给的增加，从而使得RAI的市场价格逐渐下降，降到和赎回价格一致。
2. **当市场价格小于赎回价格时**
协议将会输出一个正的赎回比率，正的赎回比率会导致赎回价格不断上涨，而预期到赎回价格未来会上涨，users就从市场上购买RAI来尽早还清债务，否则未来再还债就会花更大的成本；holders预期到未来价格会不断上涨，也就会更加有动力持币，甚至会吸引新的holders入场买RAI。这两种行为都会导致对RAI的需求增大，从而导致RAI的价格不断上涨接近赎回价格。

3. RAI的治理机制和治理代币FLX的价值捕获能力

RAI采用的是双代币机制，有单独的治理代币，其治理代币是FLX，FLX对于RAI就像MKR对于DAI一样。

目前FLX除了能参与治理以外，协议向user收取的利息一部分会用于回购销毁FLX，同时协议对组建FLX/ETH这个LP也有一定的激励。
## PID
1. Monetary policy and PID control: https://www.imfs-frankfurt.de/fileadmin/user_upload/Events_2018/MMCI_Conference/Papers/09-Raymond_Hawkins-Monetary_Policy_and_PID_Control.pdf
2. V神文章 :  Two thought experiments to evaluate automated stablecoins
3. RAI

## 代码

## RAI支持LSD的讨论
https://community.reflexer.finance/t/can-oracles-double-as-co-stakers-how-rai-like-systems-might-safely-support-staked-eth/397

## 稳定币不可能三角：
https://stablecoins.wtf/resources/the-stablecoin-trillema#price-stability
与前文提到的蒙代尔的三元悖论类似，在加密世界中，也有人提出了关于加密稳定币的三元悖论，即稳定币的资本效率、价格稳定性和去中心化三者也不能同时存在。笔者认为这种分类也有一定道理，试图同时获得这三者的ESD/BAC/UST最终都走向了灭亡。

https://research.mintventures.fund/2023/03/10/zh-reflexer-finance-rai-non-pegged-over-colleteral-decentralized-stablecoin/


## 参考链接
- 视频解析: https://www.youtube.com/watch?v=ADK91Zw4sJA&list=PL-GxJch-YeZerVVV8dY8qU2VkJfbnSfdN&index=3
- tokenengineeringcommunity: https://tokenengineeringcommunity.github.io/website/
- RAI--升级版的DAI？ https://mirror.xyz/0x4011631B550E4c5C105FE90c2b7f03Fdbd344454/Bumv5mmOt8Sj85IpcGGMJvox4XLdrH0ce-4CJS_Wd6o
- 基于BTC的稳定币：https://cryptohayes.medium.com/dust-on-crust-300d4b5cf3ec