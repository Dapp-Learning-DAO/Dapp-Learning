# Exchange

## Non-view

### settleFunding

1. 只能被 ClearningHouse 调用, 不能是非市场中的 token 资产
2. 获取 `Mark price`, `Index price`, 全局累计变量 `fundingGrowthGlobal`
3. 获取用户未结算的 funding payment
4. 更新 `_globalFundingGrowthX96Map` , 同一区块多笔交易，只取第一笔交易的数据

```ts
/// @inheritdoc IExchange
function settleFunding(address trader, address baseToken)
    external
    override
    returns (int256 fundingPayment, Funding.Growth memory fundingGrowthGlobal)
{
    _requireOnlyClearingHouse();
    // EX_BTNE: base token does not exists
    require(IMarketRegistry(_marketRegistry).hasPool(baseToken), "EX_BTNE");

    uint256 markTwap;
    uint256 indexTwap;
    (fundingGrowthGlobal, markTwap, indexTwap) = _getFundingGrowthGlobalAndTwaps(baseToken);

    fundingPayment = _updateFundingGrowth(
        trader,
        baseToken,
        IAccountBalance(_accountBalance).getBase(trader, baseToken),
        IAccountBalance(_accountBalance).getAccountInfo(trader, baseToken).lastTwPremiumGrowthGlobalX96,
        fundingGrowthGlobal
    );

    // funding will be stopped once the market is being paused
    uint256 timestamp =
        IBaseToken(baseToken).isOpen() ? _blockTimestamp() : IBaseToken(baseToken).getPausedTimestamp();

    // update states before further actions in this block; once per block
    if (timestamp != _lastSettledTimestampMap[baseToken]) {
        // update fundingGrowthGlobal and _lastSettledTimestamp
        Funding.Growth storage lastFundingGrowthGlobal = _globalFundingGrowthX96Map[baseToken];
        (
            _lastSettledTimestampMap[baseToken],
            lastFundingGrowthGlobal.twPremiumX96,
            lastFundingGrowthGlobal.twPremiumDivBySqrtPriceX96
        ) = (timestamp, fundingGrowthGlobal.twPremiumX96, fundingGrowthGlobal.twPremiumDivBySqrtPriceX96);

        emit FundingUpdated(baseToken, markTwap, indexTwap);

        // update tick for price limit checks
        _lastUpdatedTickMap[baseToken] = _getTick(baseToken);
    }

    return (fundingPayment, fundingGrowthGlobal);
}
```

### \_updateFundingGrowth

getPendingFundingPayment 的 non-view 版本

1. [IOrderBook.updateFundingGrowthAndLiquidityCoefficientInFundingPayment](./OrderBook.md#updatefundinggrowthandliquiditycoefficientinfundingpayment)
   - 遍历 trader 的所有 range order，累计其所有 funding payment 的 growth 累计值
2. 根据 base token 仓位计算未结算的 funding payment

```ts
/// @dev this is the non-view version of getPendingFundingPayment()
/// @return pendingFundingPayment the pending funding payment of a trader in one market,
///         including liquidity & balance coefficients
function _updateFundingGrowth(
    address trader,
    address baseToken,
    int256 baseBalance,
    int256 twPremiumGrowthGlobalX96,
    Funding.Growth memory fundingGrowthGlobal
) internal returns (int256 pendingFundingPayment) {
    int256 liquidityCoefficientInFundingPayment =
        IOrderBook(_orderBook).updateFundingGrowthAndLiquidityCoefficientInFundingPayment(
            trader,
            baseToken,
            fundingGrowthGlobal
        );

    return
        Funding.calcPendingFundingPaymentWithLiquidityCoefficient(
            baseBalance,
            twPremiumGrowthGlobalX96,
            fundingGrowthGlobal,
            liquidityCoefficientInFundingPayment
        );
}
```

#### calcPendingFundingPaymentWithLiquidityCoefficient

根据 base token 仓位计算未结算的 funding payment

```math
baseBalance * (fundingGrowthGlobal.twPremiumX96 - twPremiumGrowthGlobalX96)
```

```ts
// lib/Funding.sol
function calcPendingFundingPaymentWithLiquidityCoefficient(
    int256 baseBalance,
    int256 twPremiumGrowthGlobalX96,
    Growth memory fundingGrowthGlobal,
    int256 liquidityCoefficientInFundingPayment
) internal pure returns (int256) {
    int256 balanceCoefficientInFundingPayment =
        PerpMath.mulDiv(
            baseBalance,
            fundingGrowthGlobal.twPremiumX96.sub(twPremiumGrowthGlobalX96),
            uint256(PerpFixedPoint96._IQ96)
        );

    return
        liquidityCoefficientInFundingPayment.add(balanceCoefficientInFundingPayment).div(_DEFAULT_FUNDING_PERIOD);
}
```

## View

### \_getFundingGrowthGlobalAndTwaps

计算最新的 `globalFundingGrowth` 全局变量 和 TWAP 价格（Mark price TWAP, Index price TWAP）

1. 确定 twapInterval 计算 TWAP 的时间窗口，如果 token 在 market 中处于非 open 状态，取暂停的时间点作为截止
2. 获取 Mark price TWAP, Index price TWAP
3. 计算 `fundingGrowthGlobal` 全局累计变量，其中有:
   - `deltaTwPremium = (markTwap - indexTwap) * (now - lastSettledTimestamp)`
   - `twPremiumX96 += deltaTwPremium`
   - `twPremiumDivBySqrtPriceX96 += deltaTwPremium / sqrt(Mark price)`

```ts
// lib/Funding.sol

/// @dev tw: time-weighted
/// @param twPremiumX96 overflow inspection (as twPremiumX96 > twPremiumDivBySqrtPriceX96):
//         max = 2 ^ (255 - 96) = 2 ^ 159 = 7.307508187E47
//         assume premium = 10000, time = 10 year = 60 * 60 * 24 * 365 * 10 -> twPremium = 3.1536E12
struct Growth {
    int256 twPremiumX96;
    int256 twPremiumDivBySqrtPriceX96;
}

// Exchange.sol

/// @dev this function calculates the up-to-date globalFundingGrowth and twaps and pass them out
/// @return fundingGrowthGlobal the up-to-date globalFundingGrowth
/// @return markTwap only for settleFunding()
/// @return indexTwap only for settleFunding()
function _getFundingGrowthGlobalAndTwaps(address baseToken)
    internal
    view
    returns (
        Funding.Growth memory fundingGrowthGlobal,
        uint256 markTwap,
        uint256 indexTwap
    )
{
    bool marketOpen = IBaseToken(baseToken).isOpen();
    uint256 timestamp = marketOpen ? _blockTimestamp() : IBaseToken(baseToken).getPausedTimestamp();

    // shorten twapInterval if prior observations are not enough
    uint32 twapInterval;
    if (_firstTradedTimestampMap[baseToken] != 0) {
        twapInterval = IClearingHouseConfig(_clearingHouseConfig).getTwapInterval();
        // overflow inspection:
        // 2 ^ 32 = 4,294,967,296 > 100 years = 60 * 60 * 24 * 365 * 100 = 3,153,600,000
        uint32 deltaTimestamp = timestamp.sub(_firstTradedTimestampMap[baseToken]).toUint32();
        twapInterval = twapInterval > deltaTimestamp ? deltaTimestamp : twapInterval;
    }

    uint256 markTwapX96;
    if (marketOpen) {
        markTwapX96 = getSqrtMarkTwapX96(baseToken, twapInterval).formatSqrtPriceX96ToPriceX96();
        indexTwap = IIndexPrice(baseToken).getIndexPrice(twapInterval);
    } else {
        // if a market is paused/closed, we use the last known index price which is getPausedIndexPrice
        //
        // -----+--- twap interval ---+--- secondsAgo ---+
        //                        pausedTime            now

        // timestamp is pausedTime when the market is not open
        uint32 secondsAgo = _blockTimestamp().sub(timestamp).toUint32();
        markTwapX96 = UniswapV3Broker
            .getSqrtMarkTwapX96From(IMarketRegistry(_marketRegistry).getPool(baseToken), secondsAgo, twapInterval)
            .formatSqrtPriceX96ToPriceX96();
        indexTwap = IBaseToken(baseToken).getPausedIndexPrice();
    }
    markTwap = markTwapX96.formatX96ToX10_18();

    uint256 lastSettledTimestamp = _lastSettledTimestampMap[baseToken];
    Funding.Growth storage lastFundingGrowthGlobal = _globalFundingGrowthX96Map[baseToken];
    if (timestamp == lastSettledTimestamp || lastSettledTimestamp == 0) {
        // if this is the latest updated timestamp, values in _globalFundingGrowthX96Map are up-to-date already
        fundingGrowthGlobal = lastFundingGrowthGlobal;
    } else {
        // deltaTwPremium = (markTwap - indexTwap) * (now - lastSettledTimestamp)
        int256 deltaTwPremiumX96 =
            _getDeltaTwapX96(markTwapX96, indexTwap.formatX10_18ToX96()).mul(
                timestamp.sub(lastSettledTimestamp).toInt256()
            );
        fundingGrowthGlobal.twPremiumX96 = lastFundingGrowthGlobal.twPremiumX96.add(deltaTwPremiumX96);

        // overflow inspection:
        // assuming premium = 1 billion (1e9), time diff = 1 year (3600 * 24 * 365)
        // log(1e9 * 2^96 * (3600 * 24 * 365) * 2^96) / log(2) = 246.8078491997 < 255
        // twPremiumDivBySqrtPrice += deltaTwPremium / getSqrtMarkTwap(baseToken)
        fundingGrowthGlobal.twPremiumDivBySqrtPriceX96 = lastFundingGrowthGlobal.twPremiumDivBySqrtPriceX96.add(
            PerpMath.mulDiv(deltaTwPremiumX96, PerpFixedPoint96._IQ96, getSqrtMarkTwapX96(baseToken, 0))
        );
    }

    return (fundingGrowthGlobal, markTwap, indexTwap);
}
```

### getPnlToBeRealized

计算未结算的 Pnl 价值，该函数只有在减少头寸或者反响开仓时使用

1. 基于当前头寸规模 `position size` 计算将要关闭头寸的比例 `closedRatio = delta_base / takerPositionSize`
2. `closedRatio <= 1` 只是减少头寸规模或者全部关闭头寸
   - `reducedOpenNotional = takerOpenNotional * closedRatio`
   - `pnlToBeRealized = quote amount + reducedOpenNotional`
3. `closedRatio > 1` 不仅关闭当前头寸，还要反向开仓
   - `closedPositionNotional = quote amount / closedRatio` 本次反向开仓的头寸价值(与 takerOpenNotional 符号相反)
   - `pnlToBeRealized = takerOpenNotional + closedPositionNotional`

```ts
struct InternalRealizePnlParams {
    address trader;
    address baseToken;
    int256 takerPositionSize;
    int256 takerOpenNotional;
    int256 base;
    int256 quote;
}

function _getPnlToBeRealized(InternalRealizePnlParams memory params) internal pure returns (int256) {
    // closedRatio is based on the position size
    uint256 closedRatio = FullMath.mulDiv(params.base.abs(), _FULLY_CLOSED_RATIO, params.takerPositionSize.abs());

    int256 pnlToBeRealized;
    // if closedRatio <= 1, it's reducing or closing a position; else, it's opening a larger reverse position
    if (closedRatio <= _FULLY_CLOSED_RATIO) {
        // https://docs.google.com/spreadsheets/d/1QwN_UZOiASv3dPBP7bNVdLR_GTaZGUrHW3-29ttMbLs/edit#gid=148137350
        // taker:
        // step 1: long 20 base
        // openNotionalFraction = 252.53
        // openNotional = -252.53
        // step 2: short 10 base (reduce half of the position)
        // quote = 137.5
        // closeRatio = 10/20 = 0.5
        // reducedOpenNotional = openNotional * closedRatio = -252.53 * 0.5 = -126.265
        // realizedPnl = quote + reducedOpenNotional = 137.5 + -126.265 = 11.235
        // openNotionalFraction = openNotionalFraction - quote + realizedPnl
        //                      = 252.53 - 137.5 + 11.235 = 126.265
        // openNotional = -openNotionalFraction = 126.265

        // overflow inspection:
        // max closedRatio = 1e18; range of oldOpenNotional = (-2 ^ 255, 2 ^ 255)
        // only overflow when oldOpenNotional < -2 ^ 255 / 1e18 or oldOpenNotional > 2 ^ 255 / 1e18
        int256 reducedOpenNotional = params.takerOpenNotional.mulDiv(closedRatio.toInt256(), _FULLY_CLOSED_RATIO);
        pnlToBeRealized = params.quote.add(reducedOpenNotional);
    } else {
        // https://docs.google.com/spreadsheets/d/1QwN_UZOiASv3dPBP7bNVdLR_GTaZGUrHW3-29ttMbLs/edit#gid=668982944
        // taker:
        // step 1: long 20 base
        // openNotionalFraction = 252.53
        // openNotional = -252.53
        // step 2: short 30 base (open a larger reverse position)
        // quote = 337.5
        // closeRatio = 30/20 = 1.5
        // closedPositionNotional = quote / closeRatio = 337.5 / 1.5 = 225
        // remainsPositionNotional = quote - closedPositionNotional = 337.5 - 225 = 112.5
        // realizedPnl = closedPositionNotional + openNotional = -252.53 + 225 = -27.53
        // openNotionalFraction = openNotionalFraction - quote + realizedPnl
        //                      = 252.53 - 337.5 + -27.53 = -112.5
        // openNotional = -openNotionalFraction = remainsPositionNotional = 112.5

        // overflow inspection:
        // max & min tick = 887272, -887272; max liquidity = 2 ^ 128
        // max quote = 2^128 * (sqrt(1.0001^887272) - sqrt(1.0001^-887272)) = 6.276865796e57 < 2^255 / 1e18
        int256 closedPositionNotional = params.quote.mulDiv(int256(_FULLY_CLOSED_RATIO), closedRatio);
        pnlToBeRealized = params.takerOpenNotional.add(closedPositionNotional);
    }

    return pnlToBeRealized;
}
```
