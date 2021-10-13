
## Perpetual V1 

## AMM代码解析

`IAMM`合约

// 交易方向：  
 enum Dir { ADD_TO_AMM, REMOVE_FROM_AMM }

// 开仓时将quoteAsset（usdc）转换成 baseAsset（eth）
```
 function swapInput(
        Dir _dir,
        Decimal.decimal calldata _quoteAssetAmount,
        Decimal.decimal calldata _baseAssetAmountLimit
    ) external returns (Decimal.decimal memory);
```
// 关仓时候将baseAsset（eth）转换成 quoteAsset（usdc）
    function swapOutput(
        Dir _dir,
        Decimal.decimal calldata _baseAssetAmount,
        Decimal.decimal calldata _quoteAssetAmountLimit,
        bool _skipFluctuationCheck
    ) external returns (Decimal.decimal memory);

**view 方法**
```
//功能： 获取池子当前的现货价格； reserveA/reserveB
- function getSpotPrice() external view returns (Decimal.decimal memory);

//功能： 获取池子当前的现货价格；
- function getInputTwap(Dir _dir, Decimal.decimal calldata _quoteAssetAmount)
        external
        view
        returns (Decimal.decimal memory);

//根据TWAP价格获取quoteAsset数量
- function getOutputTwap(Dir _dir, Decimal.decimal calldata _baseAssetAmount)
        external
        view
        returns (Decimal.decimal memory);

// 根据池子的储备以及quoteAsset的数量计算出baseAsset数量。 swapInput的实现函数。
 -  function getInputPriceWithReserves(
            Dir _dir,
            Decimal.decimal memory _quoteAssetAmount,
            Decimal.decimal memory _quoteAssetPoolAmount,
            Decimal.decimal memory _baseAssetPoolAmount
        ) external pure returns (Decimal.decimal memory);

// 根据池子的储备以及baseAsset的数量计算出quoteAsset数量。 swapOutput的实现函数。
-  function getOutputPriceWithReserves(
            Dir _dir,
            Decimal.decimal memory _baseAssetAmount,
            Decimal.decimal memory _quoteAssetPoolAmount,
            Decimal.decimal memory _baseAssetPoolAmount
        ) external pure returns (Decimal.decimal memory);

// 计算TWAP价格(方便计算pnl)，两种方式： 
// RESERVE_ASSET means price comes from quoteAssetReserve/baseAssetReserve ， 即时价格
// INPUT_ASSET means getInput/Output price with snapshot's reserve   //交易价格
-  function calcTwap(TwapPriceCalcParams memory _params, uint256 _interval)


//根据TWAP价格用usdc换取eth，
//计算持仓价值用positionNotional， 以及未实现盈利unrealizedPnl。
//（unrealizedPnlForLongPosition = positionNotional - openNotional）
- function  getInputTwap(Dir _dirOfQuote, Decimal.decimal memory _quoteAssetAmount)

//根据TWAP价格用eth换取usdc
- function  getOutputTwap(Dir _dirOfBase, Decimal.decimal memory _baseAssetAmount)
        public

```


**event:**
```
    event SwapInput(Dir dir, uint256 quoteAssetAmount, uint256 baseAssetAmount);
    event SwapOutput(Dir dir, uint256 quoteAssetAmount, uint256 baseAssetAmount);

    event ReserveSnapshotted(uint256 quoteAssetReserve, uint256 baseAssetReserve, uint256 timestamp);
    event LiquidityChanged(uint256 quoteReserve, uint256 baseReserve, int256 cumulativeNotional);
```



### AMM合约其他函数
1. 初始化函数
```
  function initialize(
        uint256 _quoteAssetReserve,
        uint256 _baseAssetReserve,
        uint256 _tradeLimitRatio,
        uint256 _fundingPeriod,
        IPriceFeed _priceFeed,
        bytes32 _priceFeedKey,
        address _quoteAsset,
        uint256 _fluctuationLimitRatio,
        uint256 _tollRatio,
        uint256 _spreadRatio
    )
``` 

2.cumulativeNotional：  
cumulativeNotional即累加的_quoteAssetAmount；
```
 cumulativeNotional = cumulativeNotional.addD(_quoteAssetAmount);
```

**settleFunding**
```
function settleFunding() external override onlyOpen onlyCounterParty returns (SignedDecimal.signedDecimal memory) {
        require(_blockTimestamp() >= nextFundingTime, "settle funding too early");

        // premium = twapMarketPrice - twapIndexPrice
        // timeFraction = fundingPeriod(1 hour) / 1 day
        // premiumFraction = premium * timeFraction
        Decimal.decimal memory underlyingPrice = getUnderlyingTwapPrice(spotPriceTwapInterval);
        SignedDecimal.signedDecimal memory premium =
            MixedDecimal.fromDecimal(getTwapPrice(spotPriceTwapInterval)).subD(underlyingPrice);
        SignedDecimal.signedDecimal memory premiumFraction = premium.mulScalar(fundingPeriod).divScalar(int256(1 days));

        // update funding rate = premiumFraction / twapIndexPrice
        updateFundingRate(premiumFraction, underlyingPrice);

        // in order to prevent multiple funding settlement during very short time after network congestion
        uint256 minNextValidFundingTime = _blockTimestamp().add(fundingBufferPeriod);

        // floor((nextFundingTime + fundingPeriod) / 3600) * 3600
        uint256 nextFundingTimeOnHourStart = nextFundingTime.add(fundingPeriod).div(1 hours).mul(1 hours);

        // max(nextFundingTimeOnHourStart, minNextValidFundingTime)
        nextFundingTime = nextFundingTimeOnHourStart > minNextValidFundingTime
            ? nextFundingTimeOnHourStart
            : minNextValidFundingTime;

        // DEPRECATED only for backward compatibility before we upgrade ClearingHouse
        // reset funding related states
        baseAssetDeltaThisFundingPeriod = SignedDecimal.zero();

        return premiumFraction;
    }
```

**查询AMM状态**
```
function getAmmStates(address _amm) external view returns (AmmStates memory) {
        Amm amm = Amm(_amm);
        (bool getSymbolSuccess, bytes memory quoteAssetSymbolData) =
            address(amm.quoteAsset()).staticcall(abi.encodeWithSignature("symbol()"));
        (Decimal.decimal memory quoteAssetReserve, Decimal.decimal memory baseAssetReserve) = amm.getReserve();

        bytes32 priceFeedKey = amm.priceFeedKey();
        return
            AmmStates({
                quoteAssetReserve: quoteAssetReserve.toUint(),
                baseAssetReserve: baseAssetReserve.toUint(),
                //每次交易最大比率
                tradeLimitRatio: amm.tradeLimitRatio(),
                // 资金费率周期
                fundingPeriod: amm.fundingPeriod(),
                //喂价
                priceFeed: address(amm.priceFeed()),
                //
                priceFeedKey: priceFeedKey,
                quoteAssetSymbol: getSymbolSuccess ? abi.decode(quoteAssetSymbolData, (string)) : "",
                baseAssetSymbol: bytes32ToString(priceFeedKey)
            });
    }

```

**calcPositionAfterLiquidityMigration**
计算仓位根据流动性变化；
```
 function calcPositionAfterLiquidityMigration(
        IAmm _amm,
        Position memory _position,
        uint256 _latestLiquidityIndex
    ) internal view returns (Position memory) {
        if (_position.size.toInt() == 0) {
            _position.liquidityHistoryIndex = _latestLiquidityIndex;
            return _position;
        }
        // get the change in Amm notional value
        // notionalDelta = current cumulative notional - cumulative notional of last snapshot
        IAmm.LiquidityChangedSnapshot memory lastSnapshot =
            _amm.getLiquidityChangedSnapshots(_position.liquidityHistoryIndex);
        SignedDecimal.signedDecimal memory notionalDelta =
            _amm.getCumulativeNotional().subD(lastSnapshot.cumulativeNotional);
        // update the old curve's reserve
        // by applying notionalDelta to the old curve
        Decimal.decimal memory updatedOldBaseReserve;
        Decimal.decimal memory updatedOldQuoteReserve;
        if (notionalDelta.toInt() != 0) {
            Decimal.decimal memory baseAssetWorth =
                _amm.getInputPriceWithReserves(
                    notionalDelta.toInt() > 0 ? IAmm.Dir.ADD_TO_AMM : IAmm.Dir.REMOVE_FROM_AMM,
                    notionalDelta.abs(),
                    lastSnapshot.quoteAssetReserve,
                    lastSnapshot.baseAssetReserve
                );
            updatedOldQuoteReserve = notionalDelta.addD(lastSnapshot.quoteAssetReserve).abs();
            if (notionalDelta.toInt() > 0) {
                updatedOldBaseReserve = lastSnapshot.baseAssetReserve.subD(baseAssetWorth);
            } else {
                updatedOldBaseReserve = lastSnapshot.baseAssetReserve.addD(baseAssetWorth);
            }
        } else {
            updatedOldQuoteReserve = lastSnapshot.quoteAssetReserve;
            updatedOldBaseReserve = lastSnapshot.baseAssetReserve;
        }
        // calculate the new position size
        _position.size = _amm.calcBaseAssetAfterLiquidityMigration(
            _position.size,
            updatedOldQuoteReserve,
            updatedOldBaseReserve
        );
        _position.liquidityHistoryIndex = _latestLiquidityIndex;
        return _position;
    }
```



### 质押


## 参考链接
头等仓：https://mp.weixin.qq.com/s/Oq7g3_AjRP4Of__K9Gp_bw
