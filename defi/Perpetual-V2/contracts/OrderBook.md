# OrderBook

## Non-View

### updateFundingGrowthAndLiquidityCoefficientInFundingPayment

遍历trader的所有 range order (不同价格区间的流动性，perp 视作一种 range order)，累计其所有 funding payment 的 growth 累计值

1. 该函数只能由 Exchange 合约调用
2. 获取该 base token 的 tickMap (存储所有已激活的 tick 信息)
3. 根据用户的所有 range order id，遍历每一个 range order 的未结算 funding payment
    - 根据 order id 获取 range order 信息
    - 获取该 range order 价格区间之外的 `fundingGrowthRangeInfo`

```solidity
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

```solidity
// first key: base token, second key: tick index
// value: the accumulator of **Tick.GrowthInfo** outside each tick of each pool
mapping(address => mapping(int24 => Tick.GrowthInfo)) internal _growthOutsideTickMap;
```

### updateOrderDebt

更新 order 的债务

1. 只能由 ClearningHouse 调用
2. 分别累加 base 与 quote 的债务

```solidity
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

### replaySwap

模拟进行 Univ3 pool 交易，计算交易的手续费总额，交易后的价格，已经保险准备金额

内部逻辑与 Uniswap v3 Pool 合约 swap 方法基本相同

- `tick` 交易后的价格 tick
- `fee` 指 uniswap 的手续费
- `insuranceFundFee = fee * insuranceFundFeeRatio`

```solidity
struct ReplaySwapParams {
    address baseToken;
    bool isBaseToQuote;
    bool shouldUpdateState;
    int256 amount;
    uint160 sqrtPriceLimitX96;
    uint24 exchangeFeeRatio;
    uint24 uniswapFeeRatio;
    Funding.Growth globalFundingGrowth;
}

/// @param insuranceFundFee = fee * insuranceFundFeeRatio
struct ReplaySwapResponse {
    int24 tick;
    uint256 fee;
    uint256 insuranceFundFee;
}

/// @inheritdoc IOrderBook
function replaySwap(ReplaySwapParams memory params) external override returns (ReplaySwapResponse memory) {
    _requireOnlyExchange();

    address pool = IMarketRegistry(_marketRegistry).getPool(params.baseToken);
    bool isExactInput = params.amount > 0;
    uint24 insuranceFundFeeRatio =
        IMarketRegistry(_marketRegistry).getMarketInfo(params.baseToken).insuranceFundFeeRatio;
    uint256 fee;
    uint256 insuranceFundFee; // insuranceFundFee = fee * insuranceFundFeeRatio

    UniswapV3Broker.SwapState memory swapState =
        UniswapV3Broker.getSwapState(pool, params.amount, _feeGrowthGlobalX128Map[params.baseToken]);

    params.sqrtPriceLimitX96 = params.sqrtPriceLimitX96 == 0
        ? (params.isBaseToQuote ? TickMath.MIN_SQRT_RATIO + 1 : TickMath.MAX_SQRT_RATIO - 1)
        : params.sqrtPriceLimitX96;

    // if there is residue in amountSpecifiedRemaining, makers can get a tiny little bit less than expected,
    // which is safer for the system
    int24 tickSpacing = UniswapV3Broker.getTickSpacing(pool);

    while (swapState.amountSpecifiedRemaining != 0 && swapState.sqrtPriceX96 != params.sqrtPriceLimitX96) {
        InternalSwapStep memory step;
        step.initialSqrtPriceX96 = swapState.sqrtPriceX96;

        // find next tick
        // note the search is bounded in one word
        (step.nextTick, step.isNextTickInitialized) = UniswapV3Broker.getNextInitializedTickWithinOneWord(
            pool,
            swapState.tick,
            tickSpacing,
            params.isBaseToQuote
        );

        // ensure that we do not overshoot the min/max tick, as the tick bitmap is not aware of these bounds
        if (step.nextTick < TickMath.MIN_TICK) {
            step.nextTick = TickMath.MIN_TICK;
        } else if (step.nextTick > TickMath.MAX_TICK) {
            step.nextTick = TickMath.MAX_TICK;
        }

        // get the next price of this step (either next tick's price or the ending price)
        // use sqrtPrice instead of tick is more precise
        step.nextSqrtPriceX96 = TickMath.getSqrtRatioAtTick(step.nextTick);

        // find the next swap checkpoint
        // (either reached the next price of this step, or exhausted remaining amount specified)
        (swapState.sqrtPriceX96, step.amountIn, step.amountOut, step.fee) = SwapMath.computeSwapStep(
            swapState.sqrtPriceX96,
            (
                params.isBaseToQuote
                    ? step.nextSqrtPriceX96 < params.sqrtPriceLimitX96
                    : step.nextSqrtPriceX96 > params.sqrtPriceLimitX96
            )
                ? params.sqrtPriceLimitX96
                : step.nextSqrtPriceX96,
            swapState.liquidity,
            swapState.amountSpecifiedRemaining,
            // isBaseToQuote: fee is charged in base token in uniswap pool; thus, use uniswapFeeRatio to replay
            // !isBaseToQuote: fee is charged in quote token in clearing house; thus, use exchangeFeeRatioRatio
            params.isBaseToQuote ? params.uniswapFeeRatio : params.exchangeFeeRatio
        );

        // user input 1 quote:
        // quote token to uniswap ===> 1*0.98/0.99 = 0.98989899
        // fee = 0.98989899 * 2% = 0.01979798
        if (isExactInput) {
            swapState.amountSpecifiedRemaining = swapState.amountSpecifiedRemaining.sub(
                step.amountIn.add(step.fee).toInt256()
            );
        } else {
            swapState.amountSpecifiedRemaining = swapState.amountSpecifiedRemaining.add(step.amountOut.toInt256());
        }

        // update CH's global fee growth if there is liquidity in this range
        // note CH only collects quote fee when swapping base -> quote
        if (swapState.liquidity > 0) {
            if (params.isBaseToQuote) {
                step.fee = FullMath.mulDivRoundingUp(step.amountOut, params.exchangeFeeRatio, 1e6);
            }

            fee += step.fee;
            uint256 stepInsuranceFundFee = FullMath.mulDivRoundingUp(step.fee, insuranceFundFeeRatio, 1e6);
            insuranceFundFee += stepInsuranceFundFee;
            uint256 stepMakerFee = step.fee.sub(stepInsuranceFundFee);
            swapState.feeGrowthGlobalX128 += FullMath.mulDiv(stepMakerFee, FixedPoint128.Q128, swapState.liquidity);
        }

        if (swapState.sqrtPriceX96 == step.nextSqrtPriceX96) {
            // we have reached the tick's boundary
            if (step.isNextTickInitialized) {
                if (params.shouldUpdateState) {
                    // update the tick if it has been initialized
                    mapping(int24 => Tick.GrowthInfo) storage tickMap = _growthOutsideTickMap[params.baseToken];
                    // according to the above updating logic,
                    // if isBaseToQuote, state.feeGrowthGlobalX128 will be updated; else, will never be updated
                    tickMap.cross(
                        step.nextTick,
                        Tick.GrowthInfo({
                            feeX128: swapState.feeGrowthGlobalX128,
                            twPremiumX96: params.globalFundingGrowth.twPremiumX96,
                            twPremiumDivBySqrtPriceX96: params.globalFundingGrowth.twPremiumDivBySqrtPriceX96
                        })
                    );
                }

                int128 liquidityNet = UniswapV3Broker.getTickLiquidityNet(pool, step.nextTick);
                if (params.isBaseToQuote) liquidityNet = liquidityNet.neg128();
                swapState.liquidity = LiquidityMath.addDelta(swapState.liquidity, liquidityNet);
            }

            swapState.tick = params.isBaseToQuote ? step.nextTick - 1 : step.nextTick;
        } else if (swapState.sqrtPriceX96 != step.initialSqrtPriceX96) {
            // update state.tick corresponding to the current price if the price has changed in this step
            swapState.tick = TickMath.getTickAtSqrtRatio(swapState.sqrtPriceX96);
        }
    }
    if (params.shouldUpdateState) {
        // update global states since swap state transitions are all done
        _feeGrowthGlobalX128Map[params.baseToken] = swapState.feeGrowthGlobalX128;
    }

    return ReplaySwapResponse({ tick: swapState.tick, fee: fee, insuranceFundFee: insuranceFundFee });
}
```

