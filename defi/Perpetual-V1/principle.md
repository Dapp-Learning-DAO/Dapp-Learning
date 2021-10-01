
## Perpetual V1 

[白皮书](https://www.notion.so/Strike-Protocol-9049cc65e99246d886a230972d0cbd60) 
### 原理图
![原理](./imgs/perp.png)
![合约结构](./imgs/cal.png)
![合约结构1](./imgs/overview.svg)

### 核心原理
在交易环节，以虚拟AMM定价，实际开仓/平仓的资金从资金池（Vault）进出，资金池中仅有USDC一种代币，开仓/平仓仅影响池中USDC数量；

在清算环节，由Chainlink喂价，保证金率低于6.5%时头寸将被清算，清算后的获利在保险基金与清算人之间分配。保险基金用于弥补行情剧烈波动时，平仓后穿仓的损失；  

Staking提供者在Perp上不作为流动性提供者，仅仅是保险基金的初始提供者，承担保险基金赔付时的损失风险，同时享有手续费收入。

**设计方案**
vAMM使用AMM的x*y=k方式定价，但不实际进行两种货币的兑换，而是由AMM公式提供价格后，从资金池（Vault）进出资金以代替直接从AMM池进出资金，实现单一货币的多/空头寸在Vault的开仓和平仓。

假设Vault中原本有10,000 USDC，并且x=100，k=100*10,000，
1. Alice用100 U以2倍开多仓后变化如下：

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

- vault存放真实的usdc，而eth为虚拟出来的（根据K值计算）
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
核心合约是`clearingHouse`和`AMM`
用户操作主要跟`clearingHouse`交互  

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
        SignedDecimal.signedDecimal size;  //基础资产计价的大小
        Decimal.decimal margin;      // 保证金
        Decimal.decimal openNotional; //名义持仓
        SignedDecimal.signedDecimal  lastUpdatedCumulativePremiumFraction;  //
        uint256 liquidityHistoryIndex;
        uint256 blockNumber;
    }
```

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

然后看`openPosition`函数

开仓：
`openPosition(address _amm, uint8 _side, (uint256) _quoteAssetAmount, (uint256) _leverage, (uint256) _baseAssetAmountLimit)`

amm.address: AMM contract address to be interacted with  

side: Long or short, 0 or 1 respectively  

quoteAssetAmount: The amount of margin , usdc保证金金额

leverage: Amount of leverage up to 10x  

minBaseAssetAmount: Minimum size of new position (slippage protection). Transactions will fail if the transaction will result in a position size below this value. Set to 0 to accept any position size.  
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


#### AMM合约





### 质押


## 参考链接
头等仓：https://mp.weixin.qq.com/s/Oq7g3_AjRP4Of__K9Gp_bw
