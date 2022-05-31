# ClearningHouse

清算所，用户交互的主要合约，包含添加移除流动性，开仓多空头寸，清算等 perp 核心业务功能。

## Non-view functions

### \_settleFunding

1. 更新用户的未结算的 funding payment 和 全局累计变量 `fundingGrowthGlobal`
2. 如果未结算的 funding payment 不为 0，将其累加到用户的 Pnl 中
3. 更新用户的 `lastTwPremiumGrowthGlobalX96` 变量

```ts
/// @dev Settle trader's funding payment to his/her realized pnl.
function _settleFunding(address trader, address baseToken)
    internal
    returns (Funding.Growth memory fundingGrowthGlobal)
{
    int256 fundingPayment;
    (fundingPayment, fundingGrowthGlobal) = IExchange(_exchange).settleFunding(trader, baseToken);

    if (fundingPayment != 0) {
        _modifyOwedRealizedPnl(trader, fundingPayment.neg256());
        emit FundingPaymentSettled(trader, baseToken, fundingPayment);
    }

    IAccountBalance(_accountBalance).updateTwPremiumGrowthGlobal(
        trader,
        baseToken,
        fundingGrowthGlobal.twPremiumX96
    );
    return fundingGrowthGlobal;
}
```

### \_modifyOwedRealizedPnl

```ts
function _modifyOwedRealizedPnl(address trader, int256 amount) internal {
    IAccountBalance(_accountBalance).modifyOwedRealizedPnl(trader, amount);
}
```

### addLiquidity

指定 baseToken (quoteToken 固定是 USDC) 向对应的 virtual token 交易对池子添加流动性，参与做市。

1. 入参检查
   - base token 必须在市场列表中
2. `_settleFunding()` 结算之前累计的 funding payment, 更新全局累计变量
3. `OrderBook.addLiquidity()` 向 UniV3 pool 添加流动性(v-token)，由于 `UniswapV3MintCallback` 回调函数中会进行余额检查和转账操作，所以这里不需要提前检查余额
4. 如果选择使用 taker 仓位参与做市
   - 不能在 price 处于 range 之内使用 take 仓位作为流动性添加
   - 将 take 部分的仓位移入流动性
   - `takerOpenNotional` 移除之前的仓位价值 (Position size \* Mark Price)
   - `removedPositionSize / takerPositionSize` 移除的仓位数量 比 总仓位数量
   - 移除后的仓位价值 `removedOpenNotional = takerOpenNotional * removedPositionSize / takerPositionSize`
   - 更新 order 的债务 [OrderBook.updateOrderDebt](./OrderBook.md#updateorderdebt), 将新增流动性累加到 debt 字段上；由于添加 pool 中的流动性都是 v-token，都属于用户的负债；
   - 更新 taker balance，从中扣除添加流动性部分
5. 更新用户 Pnl
6. 检查用户抵押是否充足

```ts
// IClearingHouse.osl

/// @param useTakerBalance only accept false now
struct AddLiquidityParams {
    address baseToken;
    uint256 base;
    uint256 quote;
    int24 lowerTick;
    int24 upperTick;
    uint256 minBase;
    uint256 minQuote;
    bool useTakerBalance;
    uint256 deadline;
}

// ClearingHouse.osl

/// @inheritdoc IClearingHouse
function addLiquidity(AddLiquidityParams calldata params)
    external
    override
    whenNotPaused
    nonReentrant
    checkDeadline(params.deadline)
    returns (AddLiquidityResponse memory)
{
    // input requirement checks:
    //   baseToken: in Exchange.settleFunding()
    //   base & quote: in LiquidityAmounts.getLiquidityForAmounts() -> FullMath.mulDiv()
    //   lowerTick & upperTick: in UniswapV3Pool._modifyPosition()
    //   minBase, minQuote & deadline: here

    _checkMarketOpen(params.baseToken);

    // CH_DUTB: Disable useTakerBalance
    require(!params.useTakerBalance, "CH_DUTB");

    address trader = _msgSender();
    // register token if it's the first time
    IAccountBalance(_accountBalance).registerBaseToken(trader, params.baseToken);

    // must settle funding first
    Funding.Growth memory fundingGrowthGlobal = _settleFunding(trader, params.baseToken);

    // note that we no longer check available tokens here because CH will always auto-mint in UniswapV3MintCallback
    IOrderBook.AddLiquidityResponse memory response =
        IOrderBook(_orderBook).addLiquidity(
            IOrderBook.AddLiquidityParams({
                trader: trader,
                baseToken: params.baseToken,
                base: params.base,
                quote: params.quote,
                lowerTick: params.lowerTick,
                upperTick: params.upperTick,
                fundingGrowthGlobal: fundingGrowthGlobal
            })
        );

    // CH_PSCF: price slippage check fails
    require(response.base >= params.minBase && response.quote >= params.minQuote, "CH_PSCF");

    // if !useTakerBalance, takerBalance won't change, only need to collects fee to oweRealizedPnl
    if (params.useTakerBalance) {
        bool isBaseAdded = response.base != 0;

        // can't add liquidity within range from take position
        require(isBaseAdded != (response.quote != 0), "CH_CALWRFTP");

        AccountMarket.Info memory accountMarketInfo =
            IAccountBalance(_accountBalance).getAccountInfo(trader, params.baseToken);

        // the signs of removedPositionSize and removedOpenNotional are always the opposite.
        int256 removedPositionSize;
        int256 removedOpenNotional;
        if (isBaseAdded) {
            // taker base not enough
            require(accountMarketInfo.takerPositionSize >= response.base.toInt256(), "CH_TBNE");

            removedPositionSize = response.base.neg256();

            // move quote debt from taker to maker:
            // takerOpenNotional(-) * removedPositionSize(-) / takerPositionSize(+)

            // overflow inspection:
            // Assume collateral is 2.406159692E28 and index price is 1e-18
            // takerOpenNotional ~= 10 * 2.406159692E28 = 2.406159692E29 --> x
            // takerPositionSize ~= takerOpenNotional/index price = x * 1e18 = 2.4061597E38
            // max of removedPositionSize = takerPositionSize = 2.4061597E38
            // (takerOpenNotional * removedPositionSize) < 2^255
            // 2.406159692E29 ^2 * 1e18 < 2^255
            removedOpenNotional = accountMarketInfo.takerOpenNotional.mul(removedPositionSize).div(
                accountMarketInfo.takerPositionSize
            );
        } else {
            // taker quote not enough
            require(accountMarketInfo.takerOpenNotional >= response.quote.toInt256(), "CH_TQNE");

            removedOpenNotional = response.quote.neg256();

            // move base debt from taker to maker:
            // takerPositionSize(-) * removedOpenNotional(-) / takerOpenNotional(+)
            // overflow inspection: same as above
            removedPositionSize = accountMarketInfo.takerPositionSize.mul(removedOpenNotional).div(
                accountMarketInfo.takerOpenNotional
            );
        }

        // update orderDebt to record the cost of this order
        IOrderBook(_orderBook).updateOrderDebt(
            OpenOrder.calcOrderKey(trader, params.baseToken, params.lowerTick, params.upperTick),
            removedPositionSize,
            removedOpenNotional
        );

        // update takerBalances as we're using takerBalances to provide liquidity
        (, int256 takerOpenNotional) =
            IAccountBalance(_accountBalance).modifyTakerBalance(
                trader,
                params.baseToken,
                removedPositionSize,
                removedOpenNotional
            );

        uint256 sqrtPrice = _getSqrtMarkTwapX96(params.baseToken, 0);
        _emitPositionChanged(
            trader,
            params.baseToken,
            removedPositionSize, // exchangedPositionSize
            removedOpenNotional, // exchangedPositionNotional
            0, // fee
            takerOpenNotional, // openNotional
            0, // realizedPnl
            sqrtPrice
        );
    }

    // fees always have to be collected to owedRealizedPnl, as long as there is a change in liquidity
    _modifyOwedRealizedPnl(trader, response.fee.toInt256());

    // after token balances are updated, we can check if there is enough free collateral
    _requireEnoughFreeCollateral(trader);

    emit LiquidityChanged(
        trader,
        params.baseToken,
        _quoteToken,
        params.lowerTick,
        params.upperTick,
        response.base.toInt256(),
        response.quote.toInt256(),
        response.liquidity.toInt128(),
        response.fee
    );

    return
        AddLiquidityResponse({
            base: response.base,
            quote: response.quote,
            fee: response.fee,
            liquidity: response.liquidity
        });
}
```

### removeLiuqidity

移除指定的流动性(base token, 价格边界，流动性数量，最小获得的 token 数量)

1. 入参检查
   - base token 必须在市场列表中
2. `_settleFunding()` 结算之前累计的 funding payment, 更新全局累计变量
3. `IOrderBook.removeLiquidity` 从 Uniswap V3 pool 中移除指定流动性
4. 由于做市会有被动的资产变动(受 taker 交易影响)，所以在操作流动性之前，需要先将未结算的 Pnl 结算掉 [`_settleBalanceAndRealizePnl`](#_settleBalanceAndRealizePnl)

```ts
/// @param liquidity collect fee when 0
struct RemoveLiquidityParams {
    address baseToken;
    int24 lowerTick;
    int24 upperTick;
    uint128 liquidity;
    uint256 minBase;
    uint256 minQuote;
    uint256 deadline;
}


/// @inheritdoc IClearingHouse
function removeLiquidity(RemoveLiquidityParams calldata params)
    external
    override
    whenNotPaused
    nonReentrant
    checkDeadline(params.deadline)
    returns (RemoveLiquidityResponse memory)
{
    // input requirement checks:
    //   baseToken: in Exchange.settleFunding()
    //   lowerTick & upperTick: in UniswapV3Pool._modifyPosition()
    //   liquidity: in LiquidityMath.addDelta()
    //   minBase, minQuote & deadline: here

    // CH_MP: Market paused
    require(!IBaseToken(params.baseToken).isPaused(), "CH_MP");

    address trader = _msgSender();

    // must settle funding first
    _settleFunding(trader, params.baseToken);

    IOrderBook.RemoveLiquidityResponse memory response =
        IOrderBook(_orderBook).removeLiquidity(
            IOrderBook.RemoveLiquidityParams({
                maker: trader,
                baseToken: params.baseToken,
                lowerTick: params.lowerTick,
                upperTick: params.upperTick,
                liquidity: params.liquidity
            })
        );

    int256 realizedPnl = _settleBalanceAndRealizePnl(trader, params.baseToken, response);

    // CH_PSCF: price slippage check fails
    require(response.base >= params.minBase && response.quote >= params.minQuote, "CH_PSCF");

    emit LiquidityChanged(
        trader,
        params.baseToken,
        _quoteToken,
        params.lowerTick,
        params.upperTick,
        response.base.neg256(),
        response.quote.neg256(),
        params.liquidity.neg128(),
        response.fee
    );

    uint256 sqrtPrice = _getSqrtMarkTwapX96(params.baseToken, 0);
    int256 openNotional = _getTakerOpenNotional(trader, params.baseToken);
    _emitPositionChanged(
        trader,
        params.baseToken,
        response.takerBase, // exchangedPositionSize
        response.takerQuote, // exchangedPositionNotional
        0,
        openNotional,
        realizedPnl, // realizedPnl
        sqrtPrice
    );

    return RemoveLiquidityResponse({ quote: response.quote, base: response.base, fee: response.fee });
}
```

### openPosition

### closePosition

### liquidate

### uniswapV3MintCallback

Uniswap v3 pool 的 mint 回调函数，将对应的 token 转给 pool 合约。如果金额不足会报错。

```ts
/// @inheritdoc IUniswapV3MintCallback
/// @dev namings here follow Uniswap's convention
function uniswapV3MintCallback(
    uint256 amount0Owed,
    uint256 amount1Owed,
    bytes calldata data
) external override {
    // input requirement checks:
    //   amount0Owed: here
    //   amount1Owed: here
    //   data: X

    // For caller validation purposes it would be more efficient and more reliable to use
    // "msg.sender" instead of "_msgSender()" as contracts never call each other through GSN.
    // not orderbook
    require(msg.sender == _orderBook, "CH_NOB");

    IOrderBook.MintCallbackData memory callbackData = abi.decode(data, (IOrderBook.MintCallbackData));

    if (amount0Owed > 0) {
        address token = IUniswapV3Pool(callbackData.pool).token0();
        // CH_TF: Transfer failed
        require(IERC20Metadata(token).transfer(callbackData.pool, amount0Owed), "CH_TF");
    }
    if (amount1Owed > 0) {
        address token = IUniswapV3Pool(callbackData.pool).token1();
        // CH_TF: Transfer failed
        require(IERC20Metadata(token).transfer(callbackData.pool, amount1Owed), "CH_TF");
    }
}
```

### uniswapV3SwapCallback

### \_settleBalanceAndRealizePnl

结算未实现的 Pnl，并返回其数量；该函数只有在 remove liquidity 时使用；

由于做市会有被动的资产变动(受 taker 交易影响)，其 Pnl 不是实时更新，需要在操作流动性之前结算这部分未更新的 Pnl

1. 若有 base token 需要移除，计算反向开仓造成的未结算 Pnl
2. 结算当前未实现的 Pnl

```ts
/// @dev Calculate how much profit/loss we should settled,
/// only used when removing liquidity. The profit/loss is calculated by using
/// the removed base/quote amount and existing taker's base/quote amount.
function _settleBalanceAndRealizePnl(
    address maker,
    address baseToken,
    IOrderBook.RemoveLiquidityResponse memory response
) internal returns (int256) {
    int256 pnlToBeRealized;
    if (response.takerBase != 0) {
        pnlToBeRealized = IExchange(_exchange).getPnlToBeRealized(
            IExchange.RealizePnlParams({
                trader: maker,
                baseToken: baseToken,
                base: response.takerBase,
                quote: response.takerQuote
            })
        );
    }

    // pnlToBeRealized is realized here
    IAccountBalance(_accountBalance).settleBalanceAndDeregister(
        maker,
        baseToken,
        response.takerBase,
        response.takerQuote,
        pnlToBeRealized,
        response.fee.toInt256()
    );

    return pnlToBeRealized;
}
```

#### settleBalanceAndDeregister

减少仓位数值，若此时已无 range order 则直接让 `realizedPnl = getQuote()`，消除未能扣除干净的极小数值 (dust)

1. 根据传入数值更新仓位价值
2. 若此时已无 range order，则直接以 takerOpenNotional 赋值（完全以 take 部分为准，舍弃 make 部分的 dust 价值）

```ts
/// @inheritdoc IAccountBalance
function settleBalanceAndDeregister(
    address maker,
    address baseToken,
    int256 takerBase,
    int256 takerQuote,
    int256 realizedPnl,
    int256 fee
) external override {
    _requireOnlyClearingHouse();
    _modifyTakerBalance(maker, baseToken, takerBase, takerQuote);
    _modifyOwedRealizedPnl(maker, fee);

    // to avoid dust, let realizedPnl = getQuote() when there's no order
    if (
        getTakerPositionSize(maker, baseToken) == 0 &&
        IOrderBook(_orderBook).getOpenOrderIds(maker, baseToken).length == 0
    ) {
        // only need to take care of taker's accounting when there's no order
        int256 takerOpenNotional = _accountMarketMap[maker][baseToken].takerOpenNotional;
        // AB_IQBAR: inconsistent quote balance and realizedPnl
        require(realizedPnl.abs() <= takerOpenNotional.abs(), "AB_IQBAR");
        realizedPnl = takerOpenNotional;
    }

    // @audit should merge _addOwedRealizedPnl and settleQuoteToOwedRealizedPnl in some way.
    // PnlRealized will be emitted three times when removing trader's liquidity
    _settleQuoteToOwedRealizedPnl(maker, baseToken, realizedPnl);
    _deregisterBaseToken(maker, baseToken);
}
```

## view functions

### getQuoteToken

### getUniswapV3Factory

### getClearingHouseConfig

### getExchange

### getOrderBook

### getAccountBalance

### getInsuranceFund

### getAccountValue

## Reference

- Perp v2 Integration Guide & Code Samples: <https://perp.notion.site/Perp-v2-Integration-Guide-Code-Samples-01943c0520624e43bf58bc4c3368db07>
