
## Perpetual V1 

[白皮书](https://www.notion.so/Strike-Protocol-9049cc65e99246d886a230972d0cbd60) 
### 原理图
![原理](./imgs/perp.png)
![合约结构](./imgs/cal.png)
![合约结构1](./imgs/overview.svg)

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
