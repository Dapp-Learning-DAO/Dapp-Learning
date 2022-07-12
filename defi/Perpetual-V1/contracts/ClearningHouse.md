# ClearningHouse

- [Perpetual v1 白皮书](https://www.notion.so/Strike-Protocol-9049cc65e99246d886a230972d0cbd60)
- [官方文档](https://docs.perp.fi/)


### 核心原理

在交易环节，以虚拟 AMM 定价，实际开仓/平仓的资金从资金池（Vault）进出，资金池中仅有 USDC 一种代币，开仓/平仓仅影响池中 USDC 数量；

在清算环节，由 Chainlink 喂价，保证金率低于 6.5%时头寸将被清算，清算后的获利在保险基金与清算人之间分配。保险基金用于弥补行情剧烈波动时，平仓后穿仓的损失；

Staking 提供者在 Perp 上不作为流动性提供者，仅仅是保险基金的初始提供者，承担保险基金赔付时的损失风险，同时享有手续费收入。

### 设计方案
- 没有流动性提供者
- 基于AMM，没有订单薄
- 价格只在看仓和平仓的时候变动

vAMM 使用 AMM 的 x\*y=k 方式定价，但不实际进行两种货币的兑换，而是由 AMM 公式提供价格后，从资金池（Vault）进出资金以代替直接从 AMM 池进出资金，实现单一货币的多/空头寸在 Vault 的开仓和平仓。

 **原理图**

![How Perpetual Protocol Works](https://2133901215-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-M4NnEO7A8AjB9r6SEz8%2F-MEzbmkp0i5M8z2Odm0u%2F-MEzdPlCoS9V8mFmcxY1%2F%E6%88%AA%E5%9C%96%202020-08-18%20%E4%B8%8A%E5%8D%8811.38.19.png?alt=media&token=a7df0ed0-bd4c-439e-b995-7101ecd34a78)


首先假设 Vault 中原本有 10,000 USDC， eth/USDC= 100, 则 x=100，k=100 \* 10000

1. Alice 用 100 U 以 2 倍开多仓后变化如下，
   Alice 将 100U 存入 valut 中，Perpetual Protocol 将 Alice 的 200 vDAI（100 DAI 的 2 倍杠杆）记入 vAMM，作为回报，它根据常数函数 (x\*y = k) 计算 Alice 收到的 vETH 数量。
   Perpetual Protocol 记录 Alice 现在有 1.96 vETH，并且这个 vAMM 内部的状态变成了 98.04 vETH 和 10200 vDAI。

   | 动作                 | ETH   | USDC  | 计算             |
   | :------------------- | :---- | :---- | :--------------- |
   | 初始状态             | 100   | 10000 | -                |
   | Alice 开了 1.96 多仓 | 98.04 | 10200 | 100\*10000/10200 |

2. 同样，如果此时 Bob 继续注入 100 U 以 2 倍杠杆开多仓后，vAMM 公式将自动算出其持有多仓为 1.89 ETH；

   | 动作                 | ETH   | USDC  | 计算                |
   | :------------------- | :---- | :---- | :------------------ |
   | Bob 开了 1.89 多仓   | 96.15 | 10400 | 98.04\*10200/10400  |
   | Alice 平了 1.96 多仓 | 98.11 | 10192 | 96.15\*10400/98.115 |
   | Bob 平了 1.89 多仓   | 100   | 10000 | 98.11\*10192/100    |

3. 如果 David 以 100U 以 2 倍杠杆开空仓。David 100u 存入 valut，
   Perpetual Protocol 将 David 的 -200 vDAI 记入 vAMM，作为回报，它根据常数函数 (x\*y = k) 计算 Bob 收到的负 vETH 的数量。  
   Perpetual Protocol 记录 David 现在已经做空了 2.04 vETH，并且这个 vAMM 内部的状态现在变成了 102.04 vETH 和 9800 vDAI。

   | 动作                 | ETH    | USDC  | 计算                |
   | :------------------- | :----- | :---- | :------------------ |
   | Bob 开了 1.89 多仓   | 96.15  | 10400 | 98.04\*10200/10400  |
   | Alice 平了 1.96 多仓 | 98.11  | 10192 | 96.15\*10400/98.115 |
   | Bob 平了 1.89 多仓   | 100    | 10000 | 98.11\*10192/100    |
   | David 开了 2.04 空仓 | 102.04 | 9800  | 100\*10000/9800     |

- vault 存放真实的 USDC，而 eth 为虚拟出来的（根据 K 值计算）
- 做多则 eth 持仓为正，做空则 eth 持仓未负。 而池子数量一直为正，池子里为记账符号。
- 从实质上看，按照 AMM 的含义，后买入者将比先买入者的成本更高，后卖出者将比先卖出者得到更低的对价（换回更少的 U），因此 Alice 获利而 Bob 损失，这一点在虚拟 AMM 中也同样体现。

### 保证金率
- 初始保证金率 10% ，决定了最大可开十倍杠杆
- 维持保证金率 6.25% ，低于这个值会被清算

>  marginRatio = (margin+ unrealizedPnl)/positionNotional

未实现盈亏计算：

```math
openNotional = margin * lever

positionNotional = positonSize * price

unrealizedPnlForLongPosition = positionNotional - openNotional

badDebt = realizedPnl + realizedFundingPayment + margin
```

另外计算名义头寸positionNotional时，用的price是标记价格。
**如果标记价格跟指数价格差10%，则使用指数价格。**  

计算 unrealizedPnlForLongPosition 使用的价格是标记价格和标记价格的15分钟TWAP计算，评估清算时，哪个值大取哪个。


### 资金费率

Perp 上提供的是永续合约，每 1 小时收取一次资金费，按照加密货币衍生品交易所 FTX 的规则进行计算，公式如下：
> Funding Rate = (Premium / Index Price) / Funding Interval


> FundingPayment（资金费）=PositionSize（仓位头寸）∗ FundingRate（资金费率）

> $\ fundingRate = \frac{P_{perp}- P_{index}}{24}$
如果fundingRate为正，perp价格高于场外价格，多头要给空头付资金费率；

推荐一篇非常好的资金费率介绍文章：https://blog.perp.fi/block-based-funding-payment-on-perp-v2-35527094635e  

### 清算

当保证金比例下降到 6.25%或以下时，就会发生清算，这一规则即维持保证金（Maintenance Margin）。
清算由清算人的机器人出发，作为清算的奖励，清算人获得 6.25%保证金中的 1.25%，其余最高 5%保证金存入协议保险基金。

perp使用部分清算方案：假设及时平仓，只会将25%的仓位盈亏将变现，相应部分的名义仓位以及保证金将被平掉，剩余仓位保持不变。

**如果价格波动快于强平，并且保证金率低于2.5%或者更低**，则会发生全部强平。

```

清算奖励：2.5%杠杆后仓位 
其中1.25%分配给看护机（Keeper），1.25%分配给Insurance Fund

发起条件
杠杆后仓位=1000
杠杆=2x
保证金=500
PnL=-440
保证金率=（500-440）/1000=0.06

清算后
假设 positionNotionalliquidated = 300（具体数字取决于x*y=K的曲线）
清算奖励：300*0.025 = 7.5
保证金：500 - (440*0.25) - 7.5 = 382.5
保证金率：(382.5 - 440*0.75) / (1000 - 300) = 0.075
```


### 保险基金

Perp V1 协议赚取的交易费用，50%归 Staking 持币者，50%归入保险基金。当系统遭遇清算过程的损失和资金损失等意外损失是，保险基金将作为第一道防线首先支付这些损失。


## 代码解析

![The architecture of Perpetual Protocol with Ethereum as Layer 1 and xDai as Layer 2](https://2133901215-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-M4NnEO7A8AjB9r6SEz8%2F-MKJQ2UYqbBSmsUPyzKJ%2F-MKJV3aT6EipkwlCfK6F%2Fa10717ebf37c74b014ac289cf5527a63eae621f3_2_1035x699.png?alt=media&token=74fedade-09d8-43d5-b8c9-e4f09995a86b)

![contracts structure](https://www.notion.so/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F0d3bd42d-20e5-48c3-94a2-470e8150840c%2Fgastly-Overview.svg?table=block&id=34f2203d-4239-474b-aac9-11c88d96a776&spaceId=05f1ccc0-6ded-4692-8b7e-997dda52a8ba&userId=c99ee99e-3856-4e04-856b-3a2d5436ee79&cache=v2)

核心合约是 `clearingHouse` 和 `AMM`

几个关键变量：

- spotprice: 池子两个 reserve 相除
- margin: USDC 计（quoteAsset）
- positionNotional: positionSize * spotPrice
- exchangedPositionSize : (做多正，做空负)

用户操作主要跟`clearingHouse`交互

### ClearingHouse 合约解析

ClearingHouse 合约则复杂些，其管理着所有⽤户的持仓状态，并且管理着所有保证金(兼具vault功能)。对⽤户来说，核⼼业务的⽅法也⽐较多，主要
有：

- openPosition：开仓
- closePosition：平仓
- addMargin：增加保证⾦
- removeMargin：移除保证⾦
- liquidate：清算

个人持仓

```solidity
/// @notice This struct records personal position information
/// @param size denominated in amm.baseAsset
/// @param margin isolated margin
/// @param openNotional the quoteAsset value of position when opening position. the cost of the position
/// @param lastUpdatedCumulativePremiumFraction for calculating funding payment, record at the moment every time when trader open/reduce/close position
/// @param liquidityHistoryIndex
/// @param blockNumber the block number of the last position
struct Position {
    SignedDecimal.signedDecimal size;  //仓位大小，以baseToken计
    Decimal.decimal margin;      // 保证金，quoteToken计
    Decimal.decimal openNotional; //仓位的开仓USDC值, quoteAsset ， margin*lever
    SignedDecimal.signedDecimal  lastUpdatedCumulativePremiumFraction;  //资金费率
    uint256 liquidityHistoryIndex;     // 流动性指数
    uint256 blockNumber;    // 块高
}
```

```solidity
struct PositionResp {
    Position position;
    // the quote asset amount trader will send if open position, will receive if close
    Decimal.decimal exchangedQuoteAssetAmount;
    // if realizedPnl + realizedFundingPayment + margin is negative, it's the abs value of it
    Decimal.decimal badDebt;
    // the base asset amount trader will receive if open position, will send if close
    SignedDecimal.signedDecimal exchangedPositionSize;
    // funding payment incurred during this position response
    SignedDecimal.signedDecimal fundingPayment;
    // realizedPnl = unrealizedPnl * closedRatio
    SignedDecimal.signedDecimal realizedPnl;
    // positive = trader transfer margin to vault, negative = trader receive margin from vault
    // it's 0 when internalReducePosition, its addedMargin when internalIncreasePosition
    // it's min(0, oldPosition + realizedFundingPayment + realizedPnl) when internalClosePosition
    SignedDecimal.signedDecimal marginToVault;
    // unrealized pnl after open position
    SignedDecimal.signedDecimal unrealizedPnlAfter;
}
```

#### 可配置参数

- initMarginRatio
- maintenanceMarginRatio
- liquidationFeeRatio

未实现盈亏计算：

```math
openNotional = margin * lever
positionNotional = positonSize * price
```

```math
unrealizedPnlForLongPosition = positionNotional - openNotional

badDebt = realizedPnl + realizedFundingPayment + margin
```

仓位数据结构

```solidity
/// @notice This struct is used for avoiding stack too deep error when passing too many var between functions
struct PositionResp {
    Position position;
    // the quote asset amount trader will send if open position, will receive if close
    Decimal.decimal exchangedQuoteAssetAmount;
    // if realizedPnl + realizedFundingPayment + margin is negative, it's the abs value of it
    Decimal.decimal badDebt;
    // the base asset amount trader will receive if open position, will send if close
    SignedDecimal.signedDecimal exchangedPositionSize;
    // funding payment incurred during this position response
    SignedDecimal.signedDecimal fundingPayment;
    // realizedPnl = unrealizedPnl * closedRatio
    SignedDecimal.signedDecimal realizedPnl;
    // positive = trader transfer margin to vault, negative = trader receive margin from vault
    // it's 0 when internalReducePosition, its addedMargin when internalIncreasePosition
    // it's min(0, oldPosition + realizedFundingPayment + realizedPnl) when internalClosePosition
    SignedDecimal.signedDecimal marginToVault;
    // unrealized pnl after open position
    SignedDecimal.signedDecimal unrealizedPnlAfter;
}
```

再看仓位变化后的一个 event：

```solidity
/// @notice This event is emitted when position change
/// @param trader the address which execute this transaction
/// @param amm IAmm address
/// @param margin margin
/// @param positionNotional margin * leverage
/// @param exchangedPositionSize position size, e.g. ETHUSDC or LINKUSDC
/// @param fee transaction fee
/// @param positionSizeAfter position size after this transaction, might be increased or decreased
/// @param realizedPnl realized pnl after this position changed
/// @param unrealizedPnlAfter unrealized pnl after this position changed
/// @param badDebt position change amount cleared by insurance funds
/// @param liquidationPenalty amount of remaining margin lost due to liquidation
/// @param spotPrice quote asset reserve / base asset reserve
/// @param fundingPayment funding payment (+: trader paid, -: trader received)
event PositionChanged(
    address indexed trader,
    address indexed amm,
    uint256 margin,
    //名义仓位  margin * leverage
    uint256 positionNotional,
    // 交易的仓位 ETHUSDC
    int256 exchangedPositionSize,
    uint256 fee,
    int256 positionSizeAfter,
    int256 realizedPnl,
    int256 unrealizedPnlAfter,
    uint256 badDebt,
    uint256 liquidationPenalty,
    // 池子的现货价格 quote asset reserve / base asset reserve
    uint256 spotPrice,
    int256 fundingPayment
);
```

### 函数分析

#### addMargin

增加保证金以提高保证金率：

将保证⾦追加到持仓单的 margin 字段⾥并更新持仓状态。之后将⽤户的资产划转到该合约中。无须做其他检查

```solidity
function addMargin(IAmm _amm, Decimal.decimal calldata _addedMargin) external whenNotPaused() nonReentrant() {
    // check condition
    requireAmm(_amm, true);
    requireNonZeroInput(_addedMargin);
    // 更改个人持仓 update margin part in personal position
    address trader = _msgSender();
    Position memory position = adjustPositionForLiquidityChanged(_amm, trader);
    position.margin = position.margin.addD(_addedMargin);
    setPosition(_amm, trader, position);
    // 实际转账 transfer token from trader
    _transferFrom(_amm.quoteAsset(), trader, address(this), _addedMargin);
    emit MarginChanged(trader, address(_amm), int256(_addedMargin.toUint()), 0);
}
```

#### removeMargin

移除保证⾦则会判断其维持保证⾦是否⾜够，如果不⾜则不给移除。转账时，如果当前合约余额充⾜，则从当前合约转给⽤户；如果当前合约余额不⾜，则不⾜的部分会从保险基⾦中提取给到⽤户。

步骤：

1. 获取仓位，计算资金费率，检查是否有坏帐，并做CPF更新，具体在calcRemainMarginWithFundingPayment函数实现；
2. 检查保证金率 MarginRatio 是否大于初始保证金率；计算名义持仓的方式，有三种： TWAP , 现价，或预言机价格；具体查看getMarginRatio函数。 
```
 marginRatio = (margin + funding payment + unrealized Pnl) / positionNotional
```
使用spot和twap价格计算unrealized Pnl， 最终谁高取谁。
3. 从vault转账给用户，如果资金不够，则从InsuranceFund中取，并记录prepaidBadDebt字段。

**计算资金费率**
```
Premium = Mark Price - Index Price
Funding Rate = Premium / Index Price = (Mark - Index) / Index

Position Value = Position Size * Index Price
Funding Payment = Position Value * Funding Rate
                = Position Size * Index * Premium / Index
                = Position Size * Premium
```

#### openPosition

开仓函数

1. 开同向仓位 `internalIncreasePosition()`

   - 仓位大小：`_quoteAssetAmount * _leverage`
   - swapInput 将 USDC 换成 ETH，得到newSize
   - 检查开仓大小，以及是否仓位是否超过最大仓位值
   - 计算资金费率 `calcRemainMarginWithFundingPayment()`
   - 获取新的名义持仓，计算未结盈亏（池子现价计算）`getPositionNotionalAndUnrealizedPnl`
   - 更新用户仓位positionResp
   - 检查用户的保证金率是否大于维持保证金率
   - 转账

2. 开反向仓位 `openReversePosition()`

   - 先计算未结盈亏 unrealizedPnl；
   - 比较 oldPositionNotional 旧名义仓位跟新开仓名义仓位 `_quoteAssetAmount * _leverage`大小
   - 如果 oldPositionNotional 大于 openNotional：
     先获取此仓位 exchangedPositionSize，根据 `realizedPnl = unrealizedPnl * closedRatio` 计算盈亏； 再计算 fundingfee； 根据老仓位的正负计算 remainOpenNotional，更新仓位
   - 如果如果 oldPositionNotional 小于 openNotional：
     则先内部关仓，再看仓位， closeAndOpenReversePosition；
     剩余 openNotional:
     `_quoteAssetAmount * _leverage - closePositionResp.exchangedQuoteAssetAmount;`
   - 检查用户的保证金率是否大于维持保证金率
   - 转保证金
   - 转手续费 fee = spread + toll

开仓时，会调⽤ AMM 的 `swapInput()` 进⾏虚拟兑换；平仓时，则调⽤ Amm 的 `swapOutput()`。另外，开仓和平仓时都会收取交易⼿续费，⼿续费会分为两部分，⼀部分会转⼊保险基⾦，即 `InsuranceFund` 合约，另⼀部分则会转⼊⼿续费池 feePool，即 `StakingReserve` 合约。

```solidity
function swapInput(
    IAmm _amm,
    Side _side,
    Decimal.decimal memory _inputAmount,
    Decimal.decimal memory _minOutputAmount,
    bool _canOverFluctuationLimit
) internal returns (SignedDecimal.signedDecimal memory) {
    // for amm.swapInput, the direction is in quote asset, from the perspective of Amm
    IAmm.Dir dir = (_side == Side.BUY) ? IAmm.Dir.ADD_TO_AMM : IAmm.Dir.REMOVE_FROM_AMM;
    SignedDecimal.signedDecimal memory outputAmount =
        MixedDecimal.fromDecimal(_amm.swapInput(dir, _inputAmount, _minOutputAmount, _canOverFluctuationLimit));
    if (IAmm.Dir.REMOVE_FROM_AMM == dir) {
        return outputAmount.mulScalar(-1);
    }
    return outputAmount;
}
```

`swapinput()`: 将 `quoteToken` 换成 `baseToken`

注意， `quoteAssetAmount` 永远为正(不论多空方向), 如果多，USDC 进池子，计算 eth， 如果空，则计算输出为 `quoteAssetAmount` 的 USDC，需要多少 eth；

- `getInputPrice(_dirOfQuote, _quoteAssetAmount)`
- `getInputPriceWithReserves(Dir _dirOfQuote, Decimal.decimal memory _quoteAssetAmount, Decimal.decimal memory _quoteAssetPoolAmount, Decimal.decimal memory _baseAssetPoolAmount)`

#### closePosition

swapOutput

- `isOverFluctuationLimit` 检查价格波动
- 检查部分平仓还是全部平仓 `partialLiquidationRatio`

  1. 全部平仓 `internalClosePosition` 
  2. 部分平仓 则计算出`partiallyClosedPositionNotional`，内部开方向仓位`openReversePosition`
  3. `getPositionNotionalAndUnrealizedPnl` 计算未结盈亏
  4. `calcRemainMarginWithFundingPayment` 计算资金费率,并计算剩余保证金
  5.  转保证金
  6. 转手续费 fee = spread + toll

  `swapOutput`: 将 baseToken 换成 quoteToken；如果做多，则池子 baseToken 增加，输出 quoteToken;
  如果做空，则池子 baseToken 减少，输入 quoteToken, 计算平掉次空仓需要的 eth；

#### liquidate

- `getMarginRatio` 检查负债率，计算负债率：`MixedDecimal.fromDecimal(remainMargin).subD(badDebt).divD(_positionNotional)`;
- 如果保证金率大于 `liquidationFeeRatio` ，部分清算
- 如果保证金率小于 `liquidationFeeRatio`，调用 `internalClosePosition` 内部关仓，并且会跟 AMM 做一次交易；保证金改为负数；

```solidity
/**
* @notice liquidate trader's underwater position. Require trader's margin ratio less than maintenance margin ratio
* @dev liquidator can NOT open any positions in the same block to prevent from price manipulation.
* @param _amm IAmm address
* @param _trader trader address
*/
function liquidate(IAmm _amm, address _trader) public nonReentrant() {
    internalLiquidate(_amm, _trader);
}

function internalLiquidate(IAmm _amm, address _trader)
    internal
    returns (Decimal.decimal memory quoteAssetAmount, bool isPartialClose)
{
    requireAmm(_amm, true);
    SignedDecimal.signedDecimal memory marginRatio = getMarginRatio(_amm, _trader);

    // including oracle-based margin ratio as reference price when amm is over spread limit
    if (_amm.isOverSpreadLimit()) {
        SignedDecimal.signedDecimal memory marginRatioBasedOnOracle =
            _getMarginRatioByCalcOption(_amm, _trader, PnlCalcOption.ORACLE);
        if (marginRatioBasedOnOracle.subD(marginRatio).toInt() > 0) {
            marginRatio = marginRatioBasedOnOracle;
        }
    }
    requireMoreMarginRatio(marginRatio, maintenanceMarginRatio, false);

    PositionResp memory positionResp;
    Decimal.decimal memory liquidationPenalty;
    {
        Decimal.decimal memory liquidationBadDebt;
        Decimal.decimal memory feeToLiquidator;
        Decimal.decimal memory feeToInsuranceFund;
        IERC20 quoteAsset = _amm.quoteAsset();

        int256 marginRatioBasedOnSpot =
            _getMarginRatioByCalcOption(_amm, _trader, PnlCalcOption.SPOT_PRICE).toInt();
        if (
            // check margin(based on spot price) is enough to pay the liquidation fee
            // after partially close, otherwise we fully close the position.
            // that also means we can ensure no bad debt happen when partially liquidate
            marginRatioBasedOnSpot > int256(liquidationFeeRatio.toUint()) &&
            partialLiquidationRatio.cmp(Decimal.one()) < 0 &&
            partialLiquidationRatio.toUint() != 0
        ) {
            Position memory position = getPosition(_amm, _trader);
            Decimal.decimal memory partiallyLiquidatedPositionNotional =
                _amm.getOutputPrice(
                    position.size.toInt() > 0 ? IAmm.Dir.ADD_TO_AMM : IAmm.Dir.REMOVE_FROM_AMM,
                    position.size.mulD(partialLiquidationRatio).abs()
                );

            positionResp = openReversePosition(
                _amm,
                position.size.toInt() > 0 ? Side.SELL : Side.BUY,
                _trader,
                partiallyLiquidatedPositionNotional,
                Decimal.one(),
                Decimal.zero(),
                true
            );

            // half of the liquidationFee goes to liquidator & another half goes to insurance fund
            liquidationPenalty = positionResp.exchangedQuoteAssetAmount.mulD(liquidationFeeRatio);
            feeToLiquidator = liquidationPenalty.divScalar(2);
            feeToInsuranceFund = liquidationPenalty.subD(feeToLiquidator);

            positionResp.position.margin = positionResp.position.margin.subD(liquidationPenalty);
            setPosition(_amm, _trader, positionResp.position);

            isPartialClose = true;
        } else {
            liquidationPenalty = getPosition(_amm, _trader).margin;
            positionResp = internalClosePosition(_amm, _trader, Decimal.zero());
            Decimal.decimal memory remainMargin = positionResp.marginToVault.abs();
            feeToLiquidator = positionResp.exchangedQuoteAssetAmount.mulD(liquidationFeeRatio).divScalar(2);

            // if the remainMargin is not enough for liquidationFee, count it as bad debt
            // else, then the rest will be transferred to insuranceFund
            Decimal.decimal memory totalBadDebt = positionResp.badDebt;
            if (feeToLiquidator.toUint() > remainMargin.toUint()) {
                liquidationBadDebt = feeToLiquidator.subD(remainMargin);
                totalBadDebt = totalBadDebt.addD(liquidationBadDebt);
            } else {
                remainMargin = remainMargin.subD(feeToLiquidator);
            }

            // transfer the actual token between trader and vault
            if (totalBadDebt.toUint() > 0) {
                require(backstopLiquidityProviderMap[_msgSender()], "not backstop LP");
                realizeBadDebt(quoteAsset, totalBadDebt);
            }
            if (remainMargin.toUint() > 0) {
                feeToInsuranceFund = remainMargin;
            }
        }

        if (feeToInsuranceFund.toUint() > 0) {
            transferToInsuranceFund(quoteAsset, feeToInsuranceFund);
        }
        withdraw(quoteAsset, _msgSender(), feeToLiquidator);
        enterRestrictionMode(_amm);

        emit PositionLiquidated(
            _trader,
            address(_amm),
            positionResp.exchangedQuoteAssetAmount.toUint(),
            positionResp.exchangedPositionSize.toUint(),
            feeToLiquidator.toUint(),
            _msgSender(),
            liquidationBadDebt.toUint()
        );
    }

    // emit event
    uint256 spotPrice = _amm.getSpotPrice().toUint();
    int256 fundingPayment = positionResp.fundingPayment.toInt();
    emit PositionChanged(
        _trader,
        address(_amm),
        positionResp.position.margin.toUint(),
        positionResp.exchangedQuoteAssetAmount.toUint(),
        positionResp.exchangedPositionSize.toInt(),
        0,
        positionResp.position.size.toInt(),
        positionResp.realizedPnl.toInt(),
        positionResp.unrealizedPnlAfter.toInt(),
        positionResp.badDebt.toUint(),
        liquidationPenalty.toUint(),
        spotPrice,
        fundingPayment
    );

    return (positionResp.exchangedQuoteAssetAmount, isPartialClose);
}
```

#### funding fee

可参看 amm 的 settleFunding 函数；一小时收取一次；

获取仓位资产的数量

options: the options for ethers.js, since openPosition() costs significant gas, sometimes the x

可以参考交易 (千五手续费) <https://blockscout.com/xdai/mainnet/tx/0x925e7c24e594ec3987e3c8d67d72031ae9ca5ee3b5b7fc433759a2f958c043b1/token-transfers>

查询账户持仓信息：`clearingHouseViewer`

```solidity
/**
* @notice if funding rate is positive, traders with long position pay traders with short position and vice versa.
* @param _amm IAmm address
*/
function payFunding(IAmm _amm) external {
    requireAmm(_amm, true);

    SignedDecimal.signedDecimal memory premiumFraction = _amm.settleFunding();
    ammMap[address(_amm)].cumulativePremiumFractions.push(
        premiumFraction.addD(getLatestCumulativePremiumFraction(_amm))
    );

    // funding payment = premium fraction * position
    // eg. if alice takes 10 long position, totalPositionSize = 10
    // if premiumFraction is positive: long pay short, amm get positive funding payment
    // if premiumFraction is negative: short pay long, amm get negative funding payment
    // if totalPositionSize.side * premiumFraction > 0, funding payment is positive which means profit
    SignedDecimal.signedDecimal memory totalTraderPositionSize = _amm.getBaseAssetDelta();
    SignedDecimal.signedDecimal memory ammFundingPaymentProfit = premiumFraction.mulD(totalTraderPositionSize);

    IERC20 quoteAsset = _amm.quoteAsset();
    if (ammFundingPaymentProfit.toInt() < 0) {
        insuranceFund.withdraw(quoteAsset, ammFundingPaymentProfit.abs());
    } else {
        transferToInsuranceFund(quoteAsset, ammFundingPaymentProfit.abs());
    }
}
```

未实现盈亏计算：`UnrealizedPnl`

```solidity
function getPositionNotionalAndUnrealizedPnl(
    IAmm _amm,
    address _trader,
    PnlCalcOption _pnlCalcOption    //  { SPOT_PRICE, TWAP, ORACLE }
) public view returns (Decimal.decimal memory positionNotional, SignedDecimal.signedDecimal memory unrealizedPnl) {
    Position memory position = getPosition(_amm, _trader);
    Decimal.decimal memory positionSizeAbs = position.size.abs();
    if (positionSizeAbs.toUint() != 0) {
        bool isShortPosition = position.size.toInt() < 0;
        IAmm.Dir dir = isShortPosition ? IAmm.Dir.REMOVE_FROM_AMM : IAmm.Dir.ADD_TO_AMM;
        // 从amm获取价格，根据仓位值计算名义仓位
        if (_pnlCalcOption == PnlCalcOption.TWAP) {
            positionNotional = _amm.getOutputTwap(dir, positionSizeAbs);
        } else if (_pnlCalcOption == PnlCalcOption.SPOT_PRICE) {
            positionNotional = _amm.getOutputPrice(dir, positionSizeAbs);
        } else {
            Decimal.decimal memory oraclePrice = _amm.getUnderlyingPrice();
            positionNotional = positionSizeAbs.mulD(oraclePrice);
        }
        // 未实现持仓根据名义持仓和开仓价相减计算
        // unrealizedPnlForLongPosition = positionNotional - openNotional
        // unrealizedPnlForShortPosition = positionNotionalWhenBorrowed - positionNotionalWhenReturned =
        // openNotional - positionNotional = unrealizedPnlForLongPosition * -1
        unrealizedPnl = isShortPosition
            ? MixedDecimal.fromDecimal(position.openNotional).subD(positionNotional)
            : MixedDecimal.fromDecimal(positionNotional).subD(position.openNotional);
    }
}
```


### 手续费

### K值调节
K值调节会影响所有用户仓位;
 cumulativeNotional = cumulativeNotional.addD(_quoteAssetAmount); 计价是用USDC计算净头寸。
1. 此段时间的新增头寸 notionalDelta （netP1-netP0），按K0时刻的储备进行swap，得到baseAssetWorth;
2. 得到这些净头寸在K0时候发生时，造成的baseReserve和quoteReserve;
3. 计算用户仓位（positionSize）在baseReserve和quoteReserve下仓位的名义值(posNotional);
4. 仓位名义值再按K1的时刻的池子储备进行兑换，计算用户调整后的持仓（newPositionSize）。

## 参考链接

- 头等仓：<https://mp.weixin.qq.com/s/Oq7g3_AjRP4Of__K9Gp_bw>
- perp a-deep-dive-into-our-virtual-amm-vamm: <https://medium.com/perpetual-protocol/a-deep-dive-into-our-virtual-amm-vamm-40345c522eeb>
- 资金费率：<https://medium.com/derivadex/funding-rates-under-the-hood-352e6be83ab>
- perp 资金费率：<https://blog.perp.fi/block-based-funding-payment-on-perp-v2-35527094635e>
