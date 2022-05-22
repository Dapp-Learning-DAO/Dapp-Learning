# Element Protocol
## 原理
利率浮动是永续借贷资金池的必然现象。
固定利率有一下几种形式：

1. 零息债券（Zero coupon bond）：
不支付利息的债券，但通常他的交易价格会低于面值，到期後會按面值支付給債券持有人

相关：[Yield Protocol](https://yieldprotocol.com/YieldSpace.pdf), Notional Finance, [HiFi](https://hifi.finance/Mainframe-Whitepaper.pdf)
2.  利息重分配
基于既有的利息来源，可以是浮动利率的存款，也可以是 Yield Farming，衍生出一個交易利率的次级市场。而根據交易模式不同，又可以再分成本金-利息拆分与结构型商品两种。
 - 本金-利息分析
 給定一個收益來源，我們可以將投资的回报拆分成本金和利息兩部分，并分別定价。
 如：你也可以理解成 A 和 B 兩人分別出 $9,600 和 $400 一起投資到 Aave，并约好一年后 A 拿 $10,000 而 B 拿到剩下的部分，達到事先約定利润分配的效果。
 Element Finance就是以上思路
- 结构型商品 (Structured Product)
  既然未来利息是不确定的，那根据每个人的分享偏好和资金承受能力，根据个人需求去分摊风险；
  结构型基金可針對投資人對市場預期的不同，將利息收益拆分成不同等級，並將其重新組合成不同的金融衍生品。
  如：设计一个以5%为界的双层架构，A类产品风险较低（固定利率），B类产品风险较高但高收益产品（浮动利率）， 基金的錢全部都拿去 Aave放贷，若利息超过5%，B类投资人可以拿超额收益，
  如果不足5%，则B类投资人的钱会拿去填补不足。
  相关协议：BarnBridge, Tranche


## Element Finance
在 Element 中所有的资金存入 Yearn Finance 內，并将存入的资金拆分成本金代币 (PT, Principal Token) 和利息代币 (YT, Yield Token)。

本金代币相当于零息债券，可于到期日将本金全部赎回；而利息代币则代表未來利息，可于到期日后兑换出期间实际产生之利息。

**使用流程**
固定利率存款： 购买本金代币相当于以固定利率存款，而年化的大小由本金代币的价格来決定。价格越小代表到期时的获利越多，年化利率越高，反之亦然。
杠杆做多未来利率：利息代币 (YT) 的价格代表市场对未來利息的预期，而期间累积利息越高 YT 的结算价就越高。
我們能通过购买 YT 來杠杆做多利率，只要于到期日后能赎回的资产高于购买成本，即可从中获利。

## 零息债券专用AMM
零息债券的价格可由利率大小和到期时间来決定，他是以面额折价计算，也就是考量到未來現金流复利，折现到现在的价值为多少，公式如下：
债券价格 (PV) = 面额 (FV) ÷ (1 + r)^n

由以上定价公式可知，尽管市场利率不变，零息债券的价格仍会随时间变化，越接近到期日，债券的价格就越接近面额大小，最终两者之兑换率會收敛至 1。

从另个角度來看，若零息债券的价格维持不变，随着到期日的接近，年利率 r 就會持续上升。

## 分级基金
分级基金（structured fund），他是通过对基金收益或是净资产的分割与再分配，打造出不同等级风险收益不同的投资标的。常见情況是分为两级，一级收取固定报酬，另一级则收取剩余报酬。
A级基金：预期风险和收益均较低且优先享受收益分配
B级基金：预期风险和收益均较高且次后分配收益

### BarnBridge
BranBridge是分级基金产品，由 Junior Pool 和 Senior Bond 组成。两者的资金都会存入底层的协议（Comp,Aave）去产生利息，但收益分配的方式不同。
Junior Pool的流动性提供者会拿到ERC20 token， 代表投资份额。 Junior没有到期日，并且领取变动收益。而购买Senior Bond的人能自动选择投资时间（最长一年），仓位以ERC721的形式持有，Senior可以得到固定收益。到期日之前只能转让不能赎回。
Junior 的赎回要经过特定的流程，有两个选择：
1 立即赎回：预先扣除承诺要分给 Senior 的部分，剩下才能领回。
2 换成债券延后赎回：根据 Senior 的加权到期日 mint 出 NFT，到期日后才能赎回，不额外扣除费用。 

 $Senior Yield = JunniorLoanableLiquidity/TotalPoolLiquidity * AverateYieldRate




## 参考链接
- defi 固定利率协议上： https://ethtaipei.mirror.xyz/dWxbQ8pmRGT-OcMR_p_VIEL-OJuqe9HJuP6K4DNTlyY
- defi 固定利率协议下： https://ethtaipei.mirror.xyz/Y4k-b1viJV21D1EiqMlCg6vxicI3yM1VZKW31rYlIW8
-  Yield Protocol白皮书：https://yieldprotocol.com/YieldSpace.pdf
- 分级基金：https://tropical-angora-6f8.notion.site/eec54c76858347ae9441e9ea1acbed68





