# RAI

## 介绍

1. 什么是 RAI？和 DAI 的区别是什么？
   Reflexer 是在 2021 年推出的一款稳定币协议，RAI 是该协议的稳定币。RAI 本身由 ETH 抵押生成，但并不锚定美元或者某一特定指数，而是通过 Reflexer 特有的机制设计使得 RAI 本身的价格波动很小，从而实现“稳定币”的稳定特性。
   RAI 本身的生成机制和 DAI 一样，都是抵押某个资产而生成。但 RAI 和 DAI 的区别主要有两点，一是 RAI 的抵押资产只能是 ETH，而 DAI 的抵押资产有好几种；二是 RAI 并不像 DAI 一样锚定美元的价值，而 RAI 的价格是浮动的，并依托市场机制的博弈使得该价格的波动性并不像风险资产（BTC/ETH/各类山寨）那样剧烈。
   RAI 将比风险资产更稳定，但是比稳定币更波动。

2. RAI 的稳定机制
   RAI 有两个价格，一是赎回价格（redemption price），二是二级市场交易价格（market price）。RAI 会通过一个赎回比率（redemption rate）来控制赎回价格，以及控制市场价格始终围绕赎回价格来回波动。RAI 主要依赖这两类角色--SAFE users 和 holders 的博弈来改变 RAI 的供需。
   SAFE users 是抵押 ETH 生成 RAI 的投资者，那么 RAI 就相当于 SAFE users 的负债，注意这里的负债计价采用的是赎回价格，和市场价格无关，当 SAFE users 想要还清债务时，也是按照赎回价格偿还给协议并支付一定利息；而 holders 则是通过市场价格购买 RAI 的人。

### 平衡机制

1. **当市场价格大于赎回价格时**
   通过 PID 控制模块（后面展开叙述）协议将会输出一个负的赎回比率，负的赎回比率意味着 RAI 的赎回价格会不断下降。因为预期未来赎回价格会下降，就会鼓励 users 现在抵押生成更多的 RAI 然后在市场上卖掉，等到未来价格更低的时候再从市场上买回来还掉债务，这样就依靠 RAI 价格下跌赚取了收益（类似于融券做空）。而对于 holders 而言，未来赎回价格的下跌也会联动到市场价格的下跌，因此 holders 就有动机选择卖掉 RAI 以规避 RAI 价格的下跌。这两种行为都会导致市场上 RAI 供给的增加，从而使得 RAI 的市场价格逐渐下降，降到和赎回价格一致。
2. **当市场价格小于赎回价格时**
   协议将会输出一个正的赎回比率，正的赎回比率会导致赎回价格不断上涨，而预期到赎回价格未来会上涨，users 就从市场上购买 RAI 来尽早还清债务，否则未来再还债就会花更大的成本；holders 预期到未来价格会不断上涨，也就会更加有动力持币，甚至会吸引新的 holders 入场买 RAI。这两种行为都会导致对 RAI 的需求增大，从而导致 RAI 的价格不断上涨接近赎回价格。

3. RAI 的治理机制和治理代币 FLX 的价值捕获能力

RAI 采用的是双代币机制，有单独的治理代币，其治理代币是 FLX，FLX 对于 RAI 就像 MKR 对于 DAI 一样。

目前 FLX 除了能参与治理以外，协议向 user 收取的利息一部分会用于回购销毁 FLX，同时协议对组建 FLX/ETH 这个 LP 也有一定的激励。

## PID

1. Monetary policy and PID control: <https://www.imfs-frankfurt.de/fileadmin/user_upload/Events_2018/MMCI_Conference/Papers/09-Raymond_Hawkins-Monetary_Policy_and_PID_Control.pdf>
2. V 神文章 : Two thought experiments to evaluate automated stablecoins
3. RAI

## 参考链接

- 视频解析: <https://www.youtube.com/watch?v=ADK91Zw4sJA&list=PL-GxJch-YeZerVVV8dY8qU2VkJfbnSfdN&index=3>
- tokenengineeringcommunity: <https://tokenengineeringcommunity.github.io/website/>
- RAI--升级版的 DAI？ <https://mirror.xyz/0x4011631B550E4c5C105FE90c2b7f03Fdbd344454/Bumv5mmOt8Sj85IpcGGMJvox4XLdrH0ce-4CJS_Wd6o>
