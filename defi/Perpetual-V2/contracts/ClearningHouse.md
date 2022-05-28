# ClearningHouse

清算所，用户交互的主要合约，包含添加移除流动性，开仓多空头寸，清算等 perp 核心业务功能。

## Non-view functions

### addLiquidity

指定 baseToken (quoteToken 固定是USDC) 向对应的 virtual token 交易对池子添加流动性，参与做市。

1. 入参检查
    - base token 必须在市场列表中
2. `_settleFunding()` 结算之前累计的 funding payment, 更新全局累计变量
3. `OrderBook.addLiquidity()` 向 UniV3 pool 添加流动性(v-token)
4. 是否使用 taker 仓位参与做市
5. 更新 Pnl
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

### openPosition

### closePosition

### liquidate

### uniswapV3MintCallback

### uniswapV3SwapCallback

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