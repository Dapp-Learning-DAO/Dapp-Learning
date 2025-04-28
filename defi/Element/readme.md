# Element Protocol

## 原理
利率浮动是永续借贷资金池的必然现象。在DeFi中，大多数借贷协议（如Aave、Compound）提供的都是浮动利率，这给用户带来了不确定性。Element Protocol旨在解决这个问题，为用户提供固定收益选择。

固定利率有以下几种形式：

1. 零息债券（Zero coupon bond）：
不支付利息的债券，但通常他的交易价格会低于面值，到期後會按面值支付給債券持有人。这种债券的收益来自于购买价格与面值之间的差额。

相关：[Yield Protocol](https://yieldprotocol.com/YieldSpace.pdf), Notional Finance, [HiFi](https://hifi.finance/Mainframe-Whitepaper.pdf)
2.  利息重分配
基于既有的利息来源，可以是浮动利率的存款，也可以是 Yield Farming，衍生出一個交易利率的次级市场。而根據交易模式不同，又可以再分成本金-利息拆分与结构型商品两种。
 - 本金-利息拆分
 給定一個收益來源，我們可以將投资的回报拆分成本金和利息兩部分，并分別定价。
 如：你也可以理解成 A 和 B 兩人分別出 $9,600 和 $400 一起投資到 Aave，并约好一年后 A 拿 $10,000 而 B 拿到剩下的部分，達到事先約定利润分配的效果。
 Element Finance就是以上思路，通过将资产拆分为本金代币(PT)和收益代币(YT)，实现了固定收益和浮动收益的分离
- 结构型商品 (Structured Product)
  既然未来利息是不确定的，那根据每个人的分享偏好和资金承受能力，根据个人需求去分摊风险；
  结构型基金可針對投資人對市場預期的不同，將利息收益拆分成不同等級，並將其重新組合成不同的金融衍生品。
  如：设计一个以5%为界的双层架构，A类产品风险较低（固定利率），B类产品风险较高但高收益产品（浮动利率）， 基金的錢全部都拿去 Aave放贷，若利息超过5%，B类投资人可以拿超额收益，
  如果不足5%，则B类投资人的钱会拿去填补不足。
  相关协议：BarnBridge, Tranche


## Element Finance
在 Element 中所有的资金存入 Yearn Finance 內，并将存入的资金拆分成本金代币 (PT, Principal Token) 和利息代币 (YT, Yield Token)。

本金代币相当于零息债券，可于到期日将本金全部赎回；而利息代币则代表未來利息，可于到期日后兑换出期间实际产生之利息。

```
用户资产 (例如DAI)  
      |
      ↓
  Element协议
      |\       
      | \      
      |  ↓     
      |  Yearn Finance (产生收益)
      |  |     
      |  |     
      ↓  ↓     
   PT    YT    
 (本金) (收益) 
   |      |    
   |      |    
   ↓      ↓    
 固定收益  浮动收益
```

### 工作原理

1. **资产拆分**：用户存入基础资产（如DAI、USDC等）到Element协议
2. **代币铸造**：系统按1:1的比例铸造等量的PT和YT代币
3. **收益分离**：基础资产被存入Yearn等收益聚合器产生收益
4. **交易市场**：用户可以在专用AMM中交易PT获得固定收益
5. **到期赎回**：到期后，PT持有者可以1:1赎回本金，YT持有者可以赎回产生的收益

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

以下是与 Element Protocol 交互的基本流程，完整的JavaScript实现可以在[element-interaction.js](./element-interaction.js)文件中找到：

1. **存入资产获取 PT 和 YT**
```javascript
// 从element-interaction.js中导入函数
const { depositToElement } = require('./element-interaction.js');

// 假设我们要存入 1000 DAI 到 Element
async function deposit() {
  const depositAmount = ethers.utils.parseEther('1000');
  await depositToElement(depositAmount);
  // 现在用户持有等量的 PT 和 YT
}
```

这个过程会：
- 批准Element Tranche合约使用你的DAI代币
- 调用deposit函数将DAI存入协议
- 铸造等量的PT和YT代币到你的钱包

2. **在 AMM 中交易 PT 获取固定收益**
```javascript
// 从element-interaction.js中导入函数
const { tradePTForBaseAsset } = require('./element-interaction.js');

// 交易PT获取固定收益
async function trade() {
  const ptAmount = ethers.utils.parseEther('1000'); // 假设我们有1000个PT
  const result = await tradePTForBaseAsset(ptAmount, 0.01); // 1%滑点容忍度
  console.log(`固定收益率: ${result.fixedRate.toFixed(2)}%`);
}
```

这个过程会：
- 批准AMM合约使用你的PT代币
- 计算预期获得的基础资产数量
- 执行交易，将PT兑换为基础资产
- 计算并返回固定收益率

3. **到期后赎回 PT**
```javascript
// 从element-interaction.js中导入函数
const { redeemPT } = require('./element-interaction.js');

// 到期后赎回PT
async function redeem() {
  const ptAmount = ethers.utils.parseEther('1000');
  await redeemPT(ptAmount);
  // 成功赎回基础资产
}
```

这个过程会：
- 检查当前时间是否已经超过到期时间
- 如果已到期，调用redeemPrincipal函数赎回基础资产
- 如果未到期，则抛出错误并显示剩余等待时间

4. **计算固定收益率**

固定收益率的计算基于PT的当前价格与面值之间的差异，以及剩余到期时间：

```javascript
function calculateFixedRate(ptAmount, baseAssetAmount) {
  // 获取当前时间和到期时间
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const unlockTimestamp = await contracts.tranche.unlockTimestamp();
  
  // 计算剩余时间（年）
  const timeRemainingInYears = (unlockTimestamp - currentTimestamp) / (365 * 24 * 60 * 60);
  
  // 计算收益率
  const faceValue = ethers.utils.parseEther('1'); // 假设面值为1
  const currentPrice = baseAssetAmount.mul(faceValue).div(ptAmount);
  
  const yieldRate = (faceValue.mul(ethers.BigNumber.from(10000)).div(currentPrice).toNumber() / 10000 - 1) / timeRemainingInYears;
  
  // 转换为百分比
  return yieldRate * 100;
}
```

更多详细实现和使用方法请参考[element-interaction.js](./element-interaction.js)文件。

## 零息债券专用AMM
零息债券的价格可由利率大小和到期时间来決定，他是以面额折价计算，也就是考量到未來現金流复利，折现到现在的价值为多少，公式如下：
债券价格 (PV) = 面额 (FV) ÷ (1 + r)^n

由以上定价公式可知，尽管市场利率不变，零息债券的价格仍会随时间变化，越接近到期日，债券的价格就越接近面额大小，最终两者之兑换率會收敛至 1。

从另个角度來看，若零息债券的价格维持不变，随着到期日的接近，年利率 r 就會持续上升。

### 传统AMM的局限性

传统的恒定乘积AMM（如Uniswap）不适合零息债券交易，主要原因有：

1. **时间不敏感**：传统AMM不考虑时间因素，而零息债券价格会随时间变化
2. **价格曲线固定**：x * y = k 的曲线不适合债券的价格收敛特性
3. **滑点问题**：当交易量大时，传统AMM会产生较大滑点，不适合机构级交易

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
- t 是时间因子，随着到期日接近而变化（t从0逐渐接近1）
- k 是常数

这个公式有几个重要特性：
1. **当t=0时**（远离到期日）：公式简化为 x * k = 常数，价格主要由基础资产数量决定
2. **当t=1时**（到期日）：公式简化为 y * k = 常数，PT价格收敛至面值
3. **中间阶段**：价格由两种资产加权决定，权重随时间变化

#### 实际效果
- **价格收敛**：随着到期日接近，PT价格自动向面值收敛，无需外部套利
- **流动性效率**：相比传统AMM，在相同流动性下提供更低滑点
- **资本效率**：流动性提供者可以更有效地部署资本

## 与其他固定利率协议对比

| 协议 | 机制 | 优势 | 劣势 | 适用场景 |
|------|------|------|------|----------|
| **Element** | 本金-收益拆分 | 简单直观，流动性高，可组合性强，专用AMM | 依赖底层收益源的稳定性 | 寻求固定收益的投资者，流动性提供者 |
| **Yield Protocol** | 借贷市场 | 更接近传统固定利率债券，完全链上实现 | 需要超额抵押，资本效率较低 | 需要确定性借贷成本的借款人 |
| **Notional** | 固定期限借贷 | 支持多种期限，双向市场，借贷双方均可锁定利率 | 流动性分散，复杂度高 | 长期借贷需求，机构投资者 |
| **BarnBridge** | 分级收益 | 风险可精细调整，支持多种风险偏好 | 流动性较低，产品复杂 | 风险厌恶型和风险追求型投资者 |
| **Pendle** | 收益代币化 | 支持多种收益源，高度可组合 | 较新，市场深度有限 | 收益交易者，流动性挖矿参与者 |

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
- Base (2023年新增)

### 支持的收益源
Element 目前支持多种收益源作为底层资产：
- Yearn Finance vaults
- Lido stETH
- Curve LP 代币
- Convex 代币
- Aave 存款
- Compound V3 存款
- Balancer LP 代币
- Rocket Pool rETH

### 治理代币 ELFI
ELFI 是 Element 的治理代币，持有者可以：
- 投票决定新增的收益源和期限
- 调整协议费用
- 分配协议收入
- 参与协议升级决策
- 提出改进提案 (EIPs - Element Improvement Proposals)

### 主要数据指标 (2023年)
- 总锁仓价值 (TVL)：约 1.5 亿美元
- 累计交易量：超过 10 亿美元
- 活跃 Tranche 数量：30+
- 平均固定收益率：3-8% (根据期限和底层资产不同)
- 用户数量：超过 25,000 个独立地址
- 平均交易规模：约 $15,000

### 用户案例

#### 机构投资者
机构投资者利用Element获取确定性收益，通常会：
- 购买大量PT代币锁定固定收益
- 设置特定期限的投资组合（3个月、6个月、1年）
- 利用不同底层资产分散风险

#### 收益农民
收益农民通常会：
- 购买YT代币杠杆做多底层收益率
- 参与流动性挖矿获取额外奖励
- 在不同期限和资产间套利

#### 流动性提供者
流动性提供者为Convergent Curve Pool提供流动性：
- 赚取交易费用
- 获得ELFI代币奖励
- 利用时间加权定价机制降低无常损失风险

## 参考链接
- Element 官方文档：https://docs.element.fi/
- defi 固定利率协议上： https://ethtaipei.mirror.xyz/dWxbQ8pmRGT-OcMR_p_VIEL-OJuqe9HJuP6K4DNTlyY
- defi 固定利率协议下： https://ethtaipei.mirror.xyz/Y4k-b1viJV21D1EiqMlCg6vxicI3yM1VZKW31rYlIW8
- Yield Protocol白皮书：https://yieldprotocol.com/YieldSpace.pdf
- 分级基金：https://tropical-angora-6f8.notion.site/eec54c76858347ae9441e9ea1acbed68
- Element 技术博客：https://medium.com/element-finance
