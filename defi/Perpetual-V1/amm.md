
## Perpetual V1 

## AMM代码解析

`IAMM`合约

 enum Dir { ADD_TO_AMM, REMOVE_FROM_AMM }

// 
 function swapInput(
        Dir _dir,
        Decimal.decimal calldata _quoteAssetAmount,
        Decimal.decimal calldata _baseAssetAmountLimit
    ) external returns (Decimal.decimal memory);

//
    function swapOutput(
        Dir _dir,
        Decimal.decimal calldata _baseAssetAmount,
        Decimal.decimal calldata _quoteAssetAmountLimit,
        bool _skipFluctuationCheck
    ) external returns (Decimal.decimal memory);

//
function migrateLiquidity(Decimal.decimal calldata _liquidityMultiplier, Decimal.decimal calldata _priceLimitRatio)
        external;


// view 方法
 function calcBaseAssetAfterLiquidityMigration(
        SignedDecimal.signedDecimal memory _baseAssetAmount,
        Decimal.decimal memory _fromQuoteReserve,
        Decimal.decimal memory _fromBaseReserve
    ) external view returns (SignedDecimal.signedDecimal memory);

    function getInputTwap(Dir _dir, Decimal.decimal calldata _quoteAssetAmount)
        external
        view
        returns (Decimal.decimal memory);

    function getOutputTwap(Dir _dir, Decimal.decimal calldata _baseAssetAmount)
        external
        view
        returns (Decimal.decimal memory);

    function getInputPrice(Dir _dir, Decimal.decimal calldata _quoteAssetAmount)
        external
        view
        returns (Decimal.decimal memory);

    function getOutputPrice(Dir _dir, Decimal.decimal calldata _baseAssetAmount)
        external
        view
        returns (Decimal.decimal memory);

    function getInputPriceWithReserves(
            Dir _dir,
            Decimal.decimal memory _quoteAssetAmount,
            Decimal.decimal memory _quoteAssetPoolAmount,
            Decimal.decimal memory _baseAssetPoolAmount
        ) external pure returns (Decimal.decimal memory);

        function getOutputPriceWithReserves(
            Dir _dir,
            Decimal.decimal memory _baseAssetAmount,
            Decimal.decimal memory _quoteAssetPoolAmount,
            Decimal.decimal memory _baseAssetPoolAmount
        ) external pure returns (Decimal.decimal memory);


event:
```
   event SwapInput(Dir dir, uint256 quoteAssetAmount, uint256 baseAssetAmount);
    event SwapOutput(Dir dir, uint256 quoteAssetAmount, uint256 baseAssetAmount);

    event ReserveSnapshotted(uint256 quoteAssetReserve, uint256 baseAssetReserve, uint256 timestamp);
    event LiquidityChanged(uint256 quoteReserve, uint256 baseReserve, int256 cumulativeNotional);
```



### AMM合约
1 初始化函数
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

2. 将usdc转换成eth，考虑滑点。 更新储备并且快照。
ADD_TO_AMM for long, REMOVE_FROM_AMM for short
调用getInputPrice
```
 function swapInput(
        Dir _dir,
        Decimal.decimal calldata _quoteAssetAmount,
        Decimal.decimal calldata _baseAssetAmountLimit
    )
```

3. 将eth换成 usdc ，考虑滑点，更新储备并且快照。
ADD_TO_AMM for short, REMOVE_FROM_AMM for long
调用getOutputPrice
``` 
function swapOutput(
        Dir _dir,
        Decimal.decimal calldata _baseAssetAmount,
        Decimal.decimal calldata _quoteAssetAmountLimit,
        bool _skipFluctuationCheck
    )
```
常用方法  
getOutputPriceWithReserves  ？？？
getInputPriceWithReserves   ???
getOutputPrice
getOutputTwap



calcBaseAssetAfterLiquidityMigration 计算新的持仓大小。 

事件：
```
 // EVENTS
    //
    event SwapInput(Dir dir, uint256 quoteAssetAmount, uint256 baseAssetAmount);
    event SwapOutput(Dir dir, uint256 quoteAssetAmount, uint256 baseAssetAmount);
    event FundingRateUpdated(int256 rate, uint256 underlyingPrice);
    event ReserveSnapshotted(uint256 quoteAssetReserve, uint256 baseAssetReserve, uint256 timestamp);
    event LiquidityChanged(uint256 quoteReserve, uint256 baseReserve, int256 cumulativeNotional);
    event CapChanged(uint256 maxHoldingBaseAsset, uint256 openInterestNotionalCap);
    event Shutdown(uint256 settlementPrice);
    event PriceFeedUpdated(address priceFeed);
```


cumulativeNotional：
在updateReserve函数使用，
```
 cumulativeNotional = cumulativeNotional.addD(_quoteAssetAmount);
```
结构体：
```
cumulativeNotional即累加的_quoteAssetAmount；

struct ReserveSnapshot {
        Decimal.decimal quoteAssetReserve;
        Decimal.decimal baseAssetReserve;
        uint256 timestamp;
        uint256 blockNumber;
    }

```
两个主要方法解析：
```
function swapInput(
    // 交易方向，ADD_TO_AMM for long, REMOVE_FROM_AMM for short
        Dir _dirOfQuote, 
        Decimal.decimal calldata _quoteAssetAmount,
        //minimum base asset amount expected to get to prevent front running  
        Decimal.decimal calldata _baseAssetAmountLimit,
        //the impact of the price MUST be less than `fluctuationLimitRatio`
        bool _canOverFluctuationLimit
    ) 
```


里面主要函数是
处理逻辑如下：
1. 通过getInputPrice 获取 需要的baseAssetAmount；
2. 通过updateReserve 更改储备值，并更改snapshot的值


根据amm池子的资产储备，以及quoteasset（usdc）资产的数量计算出baseasset(eth)的数量。 

```
function getInputPriceWithReserves(
        Dir _dirOfQuote,   // 方向
        Decimal.decimal memory _quoteAssetAmount,    // usdc金额
        Decimal.decimal memory _quoteAssetPoolAmount,   // 池子的usdc金额
        Decimal.decimal memory _baseAssetPoolAmount     // 池子eth金额
    ) public pure override returns (Decimal.decimal memory) {

        if (_quoteAssetAmount.toUint() == 0) {
            return Decimal.zero();
        }
         // 判断做空还是做多
        bool isAddToAmm = _dirOfQuote == Dir.ADD_TO_AMM;
        SignedDecimal.signedDecimal memory invariant =
            MixedDecimal.fromDecimal(_quoteAssetPoolAmount.mulD(_baseAssetPoolAmount));
        SignedDecimal.signedDecimal memory baseAssetAfter;
        Decimal.decimal memory quoteAssetAfter;
        Decimal.decimal memory baseAssetBought;

        if (isAddToAmm) {
            //做多，则usdc储备池增加
            quoteAssetAfter = _quoteAssetPoolAmount.addD(_quoteAssetAmount);
        } else {
            //做空，则usdc储备池减少
            quoteAssetAfter = _quoteAssetPoolAmount.subD(_quoteAssetAmount);
        }
        require(quoteAssetAfter.toUint() != 0, "quote asset after is 0");

        //x*y=k  计算兑换eth
        baseAssetAfter = invariant.divD(quoteAssetAfter);
        // 计算出usdc需要的量
        baseAssetBought = baseAssetAfter.subD(_baseAssetPoolAmount).abs();

        // if the amount is not dividable, return 1 wei less for trader
        if (invariant.abs().modD(quoteAssetAfter).toUint() != 0) {
            if (isAddToAmm) {
                baseAssetBought = baseAssetBought.subD(Decimal.decimal(1));
            } else {
                baseAssetBought = baseAssetBought.addD(Decimal.decimal(1));
            }
        }

        return baseAssetBought;
    }
```


根据amm池子的资产储备，以及baseasset(eth)资产的数量计算出quoteasset（usdc）的数量。 
逻辑跟getInputPriceWithReserves类似，只是反方向而已。
```
function getOutputPriceWithReserves(
        Dir _dirOfBase,
        Decimal.decimal memory _baseAssetAmount,
        Decimal.decimal memory _quoteAssetPoolAmount,
        Decimal.decimal memory _baseAssetPoolAmount
    ) public pure override returns (Decimal.decimal memory) {
        if (_baseAssetAmount.toUint() == 0) {
            return Decimal.zero();
        }

        bool isAddToAmm = _dirOfBase == Dir.ADD_TO_AMM;
        SignedDecimal.signedDecimal memory invariant =
            MixedDecimal.fromDecimal(_quoteAssetPoolAmount.mulD(_baseAssetPoolAmount));
        SignedDecimal.signedDecimal memory quoteAssetAfter;
        Decimal.decimal memory baseAssetAfter;
        Decimal.decimal memory quoteAssetSold;

        if (isAddToAmm) {
            baseAssetAfter = _baseAssetPoolAmount.addD(_baseAssetAmount);
        } else {
            baseAssetAfter = _baseAssetPoolAmount.subD(_baseAssetAmount);
        }
        require(baseAssetAfter.toUint() != 0, "base asset after is 0");

        quoteAssetAfter = invariant.divD(baseAssetAfter);
        quoteAssetSold = quoteAssetAfter.subD(_quoteAssetPoolAmount).abs();

        // if the amount is not dividable, return 1 wei less for trader
        if (invariant.abs().modD(baseAssetAfter).toUint() != 0) {
            if (isAddToAmm) {
                quoteAssetSold = quoteAssetSold.subD(Decimal.decimal(1));
            } else {
                quoteAssetSold = quoteAssetSold.addD(Decimal.decimal(1));
            }
        }

        return quoteAssetSold;
    }
```

**swapOutput**

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
 only allow to update while reaching `nextFundingTime`

**swapOutput**
把base asset 资产换成  quote asset, 在关闭仓位和清算时候使用。  


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

### 质押


## 参考链接
头等仓：https://mp.weixin.qq.com/s/Oq7g3_AjRP4Of__K9Gp_bw
