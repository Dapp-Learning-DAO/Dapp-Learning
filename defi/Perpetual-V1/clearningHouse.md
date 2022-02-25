
## Perpetual V1 

[白皮书](https://www.notion.so/Strike-Protocol-9049cc65e99246d886a230972d0cbd60) 
### 原理图
![原理](./imgs/perp.png)

### 核心原理
在交易环节，以虚拟AMM定价，实际开仓/平仓的资金从资金池（Vault）进出，资金池中仅有USDC一种代币，开仓/平仓仅影响池中USDC数量；

在清算环节，由Chainlink喂价，保证金率低于6.5%时头寸将被清算，清算后的获利在保险基金与清算人之间分配。保险基金用于弥补行情剧烈波动时，平仓后穿仓的损失；  

Staking提供者在Perp上不作为流动性提供者，仅仅是保险基金的初始提供者，承担保险基金赔付时的损失风险，同时享有手续费收入。

**设计方案**
vAMM使用AMM的x*y=k方式定价，但不实际进行两种货币的兑换，而是由AMM公式提供价格后，从资金池（Vault）进出资金以代替直接从AMM池进出资金，实现单一货币的多/空头寸在Vault的开仓和平仓。
首先
假设Vault中原本有10,000 USDC， eth/usdc= 100, 则x=100，k=100 * 10000， 
1. Alice用100 U以2倍开多仓后变化如下， 
Alice将100U存入valut中，Perpetual Protocol 将 Alice 的 200 vDAI（100 DAI 的 2 倍杠杆）记入vAMM，作为回报，它根据常数函数 (x*y = k) 计算 Alice 收到的 vETH 数量。
Perpetual Protocol 记录 Alice 现在有 1.96 vETH，并且这个vAMM内部的状态变成了  98.04  vETH 和 10200 vDAI。


| 动作 | ETH | USDC | 计算|
| :-----| :---- | :---- | :---- |
| 初始状态 | 100 | 10000 | - |
| Alice开了1.96多仓 | 98.04 | 10200 | 100*10000/10200 |

2. 同样，如果此时Bob继续注入100 U以2倍杠杆开多仓后，vAMM公式将自动算出其持有多仓为1.89 ETH；

| 动作 | ETH | USDC | 计算|
| :-----| :---- | :---- | :---- |
| Bob开了1.89多仓 | 96.15 | 10400 | 98.04*10200/10400|
| Alice平了1.96多仓 | 98.11 | 10192 | 96.15*10400/98.115 |
| Bob平了1.89多仓 | 100 | 10000 | 98.11*10192/100 |

3. 如果 David 以100U以2倍杠杆开空仓。David 100u存入valut，
Perpetual Protocol 将 David 的 -200 vDAI 记入vAMM，作为回报，它根据常数函数 (x*y = k) 计算 Bob 收到的负 vETH 的数量。  
Perpetual Protocol 记录 David 现在已经做空了 2.04 vETH，并且这个vAMM内部的状态现在变成了 102.04 vETH 和 9800 vDAI。

| 动作 | ETH | USDC | 计算|
| :-----| :---- | :---- | :---- |
| Bob开了1.89多仓 | 96.15 | 10400 | 98.04*10200/10400|
| Alice平了1.96多仓 | 98.11 | 10192 | 96.15*10400/98.115 |
| Bob平了1.89多仓 | 100 | 10000 | 98.11*10192/100 |
| David开了2.04空仓 | 102.04  | 9800 | 100*10000/9800 |

- vault存放真实的usdc，而eth为虚拟出来的（根据K值计算）
- 做多则eth持仓为正，做空则eth持仓未负。 而池子数量一直为正，池子里为记账符号。
- 从实质上看，按照AMM的含义，后买入者将比先买入者的成本更高，后卖出者将比先卖出者得到更低的对价（换回更少的U），因此Alice获利而Bob损失，这一点在虚拟AMM中也同样体现。

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

### 代码解析
![合约结构](./imgs/cal.png)
![合约结构1](./imgs/overview.svg)
核心合约是`clearingHouse`和`AMM`
几个关键变量：  
spotprice: 池子两个reserve相除     
margin:  usdc计（quoteAsset）  
positionNotional:   positionSize* spotPrice  
exchangedPositionSize : (做多正，做空负)   

用户操作主要跟`clearingHouse`交互  
### clearingHouse 合约解析
ClearingHouse 合约则复杂些，其管理着所有⽤户的持仓状态。对⽤户来说，核⼼业务的⽅法也⽐较多，主要
有：
- openPosition：开仓
- closePosition：平仓
- addMargin：增加保证⾦
- removeMargin：移除保证⾦
- liquidate：清算

个人持仓
```
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
        Decimal.decimal openNotional; //仓位的开仓usdc值quoteAsset ， margin*lever
        SignedDecimal.signedDecimal  lastUpdatedCumulativePremiumFraction;  //资金费率
        uint256 liquidityHistoryIndex;     // 流动性指数
        uint256 blockNumber;    // 块高
    }
    
```

```
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

**可配置参数**
initMarginRatio
maintenanceMarginRatio
liquidationFeeRatio


未实现盈亏计算：
openNotional = margin * lever
positionNotional = positonSize * price 

unrealizedPnlForLongPosition = positionNotional - openNotional

badDebt = realizedPnl + realizedFundingPayment + margin；

仓位数据结构
```
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

再看仓位变化后的一个event：
```
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

#### 函数分析
**addMargin**
增加保证金以提高保证金率：
将保证⾦追加到持仓单的 margin 字段⾥并更新持仓状态。之后将⽤户的资产划转到该合约中。
无须做其他检查
```
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
        
**removeMargin**
移除保证⾦则会判断其维持保证⾦是否⾜够，如果不⾜则不给移除。转账时，如果当前合约余额充⾜，则从当前合
约转给⽤户；如果当前合约余额不⾜，则不⾜的部分会从保险基⾦中提取给到⽤户。
步骤：1 获取仓位，计算资金费率，检查是否有坏帐；
     2 检查保证金率MarginRatio是否大于初始保证金率；计算名义持仓的方式，有三种： twap,现价，或预言机价格；
     

**openPosition**
开仓函数
1 开同向仓位 internalIncreasePosition
   - 仓位大小：_quoteAssetAmount.mulD(_leverage)
   - swapInput讲usdc换成eth
   - 计算资金费率；calcRemainMarginWithFundingPayment
   - 获取新的名义持仓，计算未结盈亏（池子现价计算）；getPositionNotionalAndUnrealizedPnl
   - 更新用户仓位
   - 同向不用检查保证金率
  
2 开反向仓位 openReversePosition
- 先计算未结盈亏unrealizedPnl；
- 比较oldPositionNotional旧名义仓位跟开仓名义仓位（_quoteAssetAmount.mulD(_leverage)）
-  如果oldPositionNotional大于openNotional：
   先获取此仓位exchangedPositionSize，根据realizedPnl = unrealizedPnl * closedRatio计算盈亏； 再计算fundingfee； 根据老仓位的正负计算remainOpenNotional，更新仓位
-  如果如果oldPositionNotional小于openNotional：
   则先内部关仓，再看仓位， closeAndOpenReversePosition；
   剩余openNotional: 
    _quoteAssetAmount.mulD(_leverage).subD(closePositionResp.exchangedQuoteAssetAmount);


开仓时，会调⽤ Amm 的 swapInput() 进⾏虚拟兑换；平仓时，则调⽤ Amm 的 swapOutput()。另外，开仓和平仓时都会收取交易⼿续费，⼿续费会分为两部分，⼀部分会转⼊保险基⾦，即 InsuranceFund 合约，另⼀部分则会转⼊⼿续费池 feePool，其实现为 StakingReserve 合约。

swapInput:
( // for amm.swapInput, the direction is in quote asset, from the perspective of Amm)
看quotetoken的进出，以池子的视角；
```
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
swapinput逻辑:  将quoteToken换成baseToken；
注意，quoteAssetAmount永远为正，根据多空不同，如果多，usdc进池子，计算eth， 如果空，则计算输出为quoteAssetAmount的usdc，需要多少eth；
- getInputPrice(_dirOfQuote, _quoteAssetAmount);
- getInputPriceWithReserves(
        Dir _dirOfQuote,
        Decimal.decimal memory _quoteAssetAmount,
        Decimal.decimal memory _quoteAssetPoolAmount,
        Decimal.decimal memory _baseAssetPoolAmount）



**closePosition**
swapOutput
(for amm.swapOutput, the direction is in base asset, from the perspective of Amm,
 if it is long position, close a position means short it(which means base dir is ADD_TO_AMM) and vice versa 跟初始方向的值相同；)

- isOverFluctuationLimit检查价格波动
- 检查部分平仓还是全部平仓partialLiquidationRatio
  1. 全部平仓internalClosePosition
  2. getPositionNotionalAndUnrealizedPnl计算未结盈亏
  3. calcRemainMarginWithFundingPayment计算资金费率
  4. 根据_amm.swapOutput计算quoteAssetAmount，计算盈余
      - 根据getOutputPrice函数，getOutputPriceWithReserves函数

  swapOutput：将baseToken换成quoteToken；如果做多，则池子baseToken增加，输出quoteToken;
              如果做空，则池子baseToken减少，输入quoteToken, 计算平掉次空仓需要的eth；

  
  **liquidate**

  - 1 getMarginRatio检查负债率，
  计算负债率：MixedDecimal.fromDecimal(remainMargin).subD(badDebt).divD(_positionNotional);
  - 2  如果保证金率大于liquidationFeeRatio，部分清算
       如果保证金率小于 liquidationFeeRatio，调用internalClosePosition内部关仓，并且会跟amm做一次交易；保证金改为负数；


 
  

 获取仓位资产的数量

options: the options for ethers.js, since openPosition() costs significant gas, sometimes the x 
可以参考交易`https://blockscout.com/xdai/mainnet/tx/0x925e7c24e594ec3987e3c8d67d72031ae9ca5ee3b5b7fc433759a2f958c043b1/token-transfers`
千五手续费

查询账户持仓信息：
`clearingHouseViewer`
```
 function getPersonalPositionWithFundingPayment(IAmm _amm, address _trader)
        public
        view
        returns (ClearingHouse.Position memory position)
    {
        //getpostion 会调用calcPositionAfterLiquidityMigration 
        position = clearingHouse.getPosition(_amm, _trader);
        
        SignedDecimal.signedDecimal memory marginWithFundingPayment =
            MixedDecimal.fromDecimal(position.margin).addD(
                getFundingPayment(position, clearingHouse.getLatestCumulativePremiumFraction(_amm))
            );
        position.margin = marginWithFundingPayment.toInt() >= 0 ? marginWithFundingPayment.abs() : Decimal.zero();
    }
``` 


未实现盈亏计算：UnrealizedPnl
```
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


## 参考链接
- 头等仓：https://mp.weixin.qq.com/s/Oq7g3_AjRP4Of__K9Gp_bw
- perp: https://medium.com/perpetual-protocol/a-deep-dive-into-our-virtual-amm-vamm-40345c522eeb
