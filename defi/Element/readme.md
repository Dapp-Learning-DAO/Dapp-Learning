# Element Protocol

## 原理
利率浮动是永续借贷资金池的必然现象。
固定利率有以下几种形式：

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

### 技术架构
Element Protocol 的核心架构包括以下几个部分：

1. **Tranche 系统**：负责创建和管理本金代币(PT)和收益代币(YT)
2. **Balancer AMM**：基于 Balancer v2 定制的 AMM，专为零息债券交易优化
3. **Yearn Finance 集成**：作为底层收益来源
4. **治理系统**：由 ELFI 代币持有者控制协议参数和升级

### 核心合约

- **Tranche Factory**：创建新的 Tranche 合约，每个 Tranche 对应一个特定的收益来源和到期日
- **Principal Token (PT)**：ERC-20 代币，代表用户的本金部分
- **Yield Token (YT)**：ERC-20 代币，代表用户的收益部分
- **Convergent Curve Pool (CCP)**：专为零息债券设计的 AMM 池，基于 Balancer v2 构建
- **Vault Adapters**：连接不同收益来源（如 Yearn、Aave 等）的适配器

**使用流程**
固定利率存款： 购买本金代币相当于以固定利率存款，而年化的大小由本金代币的价格来決定。价格越小代表到期时的获利越多，年化利率越高，反之亦然。
杠杆做多未来利率：利息代币 (YT) 的价格代表市场对未來利息的预期，而期间累积利息越高 YT 的结算价就越高。
我們能通过购买 YT 來杠杆做多利率，只要于到期日后能赎回的资产高于购买成本，即可从中获利。

### 交互示例

以下是与 Element Protocol 交互的基本流程：

1. **存入资产获取 PT 和 YT**
```solidity
// 假设我们要存入 1000 DAI 到 Element
function depositToElement(uint256 amount) external {
    // 批准 Element Tranche 合约使用 DAI
    dai.approve(address(tranche), amount);
    
    // 存入 DAI 并获取 PT 和 YT
    tranche.deposit(amount, msg.sender);
    
    // 现在用户持有等量的 PT 和 YT
}
```

2. **在 AMM 中交易 PT 获取固定收益**
```solidity
function tradePTForBaseAsset(uint256 ptAmount) external {
    // 批准 AMM 使用 PT
    principalToken.approve(address(amm), ptAmount);
    
    // 计算预期获得的基础资产数量
    uint256 baseAssetAmount = amm.getAmountOut(ptAmount, address(principalToken), address(baseAsset));
    
    // 执行交易
    amm.swap(
        address(principalToken),
        address(baseAsset),
        ptAmount,
        baseAssetAmount * 0.99, // 设置滑点容忍度
        msg.sender
    );
}
```

3. **到期后赎回 PT**
```solidity
function redeemPT(uint256 ptAmount) external {
    // 确保已经到期
    require(block.timestamp >= tranche.unlockTimestamp(), "Not yet matured");
    
    // 赎回基础资产
    tranche.redeemPrincipal(ptAmount, msg.sender);
}
```

## 零息债券专用AMM
零息债券的价格可由利率大小和到期时间来決定，他是以面额折价计算，也就是考量到未來現金流复利，折现到现在的价值为多少，公式如下：
债券价格 (PV) = 面额 (FV) ÷ (1 + r)^n

由以上定价公式可知，尽管市场利率不变，零息债券的价格仍会随时间变化，越接近到期日，债券的价格就越接近面额大小，最终两者之兑换率會收敛至 1。

从另个角度來看，若零息债券的价格维持不变，随着到期日的接近，年利率 r 就會持续上升。

### Convergent Curve Pool (CCP)
Element 开发了专门的 AMM 池 - Convergent Curve Pool，它基于 Balancer v2 构建，但针对零息债券交易进行了优化：

1. **时间感知定价**：AMM 会根据距离到期日的时间自动调整价格曲线
2. **收敛机制**：随着到期日接近，PT 价格会自动收敛至面值
3. **动态费用**：根据市场条件和时间调整交易费用

定价公式：
```
f(x, y, t) = x^(1-t) * y^t * k
```
其中：
- x 是基础资产数量
- y 是 PT 数量
- t 是时间因子，随着到期日接近而变化
- k 是常数

## 与其他固定利率协议对比

| 协议 | 机制 | 优势 | 劣势 |
|------|------|------|------|
| **Element** | 本金-收益拆分 | 简单直观，流动性高，可组合性强 | 依赖底层收益源的稳定性 |
| **Yield Protocol** | 借贷市场 | 更接近传统固定利率债券 | 需要超额抵押，资本效率较低 |
| **Notional** | 固定期限借贷 | 支持多种期限，双向市场 | 流动性分散，复杂度高 |
| **BarnBridge** | 分级收益 | 风险可精细调整 | 流动性较低，产品复杂 |
| **Pendle** | 收益代币化 | 支持多种收益源 | 较新，市场深度有限 |

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

## Element 最新发展

### 多链部署
Element Protocol 已经从以太坊扩展到多个网络：
- 以太坊主网
- Arbitrum
- Optimism
- Polygon

### 支持的收益源
Element 目前支持多种收益源作为底层资产：
- Yearn Finance vaults
- Lido stETH
- Curve LP 代币
- Convex 代币
- Aave 存款

### 治理代币 ELFI
ELFI 是 Element 的治理代币，持有者可以：
- 投票决定新增的收益源和期限
- 调整协议费用
- 分配协议收入
- 参与协议升级决策

### 主要数据指标 (2023年)
- 总锁仓价值 (TVL)：约 1.5 亿美元
- 累计交易量：超过 10 亿美元
- 活跃 Tranche 数量：30+
- 平均固定收益率：3-8% (根据期限和底层资产不同)

## 参考链接
- Element 官方文档：https://docs.element.fi/
- defi 固定利率协议上： https://ethtaipei.mirror.xyz/dWxbQ8pmRGT-OcMR_p_VIEL-OJuqe9HJuP6K4DNTlyY
- defi 固定利率协议下： https://ethtaipei.mirror.xyz/Y4k-b1viJV21D1EiqMlCg6vxicI3yM1VZKW31rYlIW8
- Yield Protocol白皮书：https://yieldprotocol.com/YieldSpace.pdf
- 分级基金：https://tropical-angora-6f8.notion.site/eec54c76858347ae9441e9ea1acbed68
- Element 技术博客：https://medium.com/element-finance
