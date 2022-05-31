# OrderBook

## Non-View

### updateFundingGrowthAndLiquidityCoefficientInFundingPayment

遍历trader的所有 range order (不同价格区间的流动性，perp 视作一种 range order)，累计其所有 funding payment 的 growth 累计值

1. 该函数只能由 Exchange 合约调用
2. 获取该 base token 的 tickMap (存储所有已激活的 tick 信息)
3. 根据用户的所有 range order id，遍历每一个 range order 的未结算 funding payment
    - 根据 order id 获取 range order 信息
    - 获取该 range order 价格区间之外的 `fundingGrowthRangeInfo`

```ts
/// @inheritdoc IOrderBook
function updateFundingGrowthAndLiquidityCoefficientInFundingPayment(
    address trader,
    address baseToken,
    Funding.Growth memory fundingGrowthGlobal
) external override returns (int256 liquidityCoefficientInFundingPayment) {
    _requireOnlyExchange();

    bytes32[] memory orderIds = _openOrderIdsMap[trader][baseToken];
    mapping(int24 => Tick.GrowthInfo) storage tickMap = _growthOutsideTickMap[baseToken];
    address pool = IMarketRegistry(_marketRegistry).getPool(baseToken);

    // funding of liquidity coefficient
    uint256 orderIdLength = orderIds.length;
    (, int24 tick, , , , , ) = UniswapV3Broker.getSlot0(pool);
    for (uint256 i = 0; i < orderIdLength; i++) {
        OpenOrder.Info storage order = _openOrderMap[orderIds[i]];
        Tick.FundingGrowthRangeInfo memory fundingGrowthRangeInfo =
            tickMap.getAllFundingGrowth(
                order.lowerTick,
                order.upperTick,
                tick,
                fundingGrowthGlobal.twPremiumX96,
                fundingGrowthGlobal.twPremiumDivBySqrtPriceX96
            );

        // the calculation here is based on cached values
        liquidityCoefficientInFundingPayment = liquidityCoefficientInFundingPayment.add(
            Funding.calcLiquidityCoefficientInFundingPaymentByOrder(order, fundingGrowthRangeInfo)
        );

        // thus, state updates have to come after
        order.lastTwPremiumGrowthInsideX96 = fundingGrowthRangeInfo.twPremiumGrowthInsideX96;
        order.lastTwPremiumGrowthBelowX96 = fundingGrowthRangeInfo.twPremiumGrowthBelowX96;
        order.lastTwPremiumDivBySqrtPriceGrowthInsideX96 = fundingGrowthRangeInfo
            .twPremiumDivBySqrtPriceGrowthInsideX96;
    }

    return liquidityCoefficientInFundingPayment;
}
```

`_growthOutsideTickMap` 是根据 token 地址分类存储 tick 信息的 mapping

```ts
// first key: base token, second key: tick index
// value: the accumulator of **Tick.GrowthInfo** outside each tick of each pool
mapping(address => mapping(int24 => Tick.GrowthInfo)) internal _growthOutsideTickMap;
```

### updateOrderDebt

更新 order 的债务

1. 只能由 ClearningHouse 调用
2. 分别累加 base 与 quote 的债务

```ts
/// @inheritdoc IOrderBook
function updateOrderDebt(
    bytes32 orderId,
    int256 base,
    int256 quote
) external override {
    _requireOnlyClearingHouse();
    OpenOrder.Info storage openOrder = _openOrderMap[orderId];
    openOrder.baseDebt = openOrder.baseDebt.toInt256().add(base).toUint256();
    openOrder.quoteDebt = openOrder.quoteDebt.toInt256().add(quote).toUint256();
}
```