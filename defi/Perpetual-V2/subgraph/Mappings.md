# Perp V2 Subgraph Mappings

## AccountBalance

### handlePnlRealized

每当 PnlRealized 事件触发

1. 新建 PnlRealized 对象
2. 更新 Trader 对象的交易数据， `totalPnl` `settlementTokenBalance` `collateral`
3. 更新 Protocol 对象

## ClearningHouse

### handlePositionClosed

PositionClosed 事件触发

1. 新建 PositionClosed 对象
2. 更新 Protocol 对象，`tradingVolume` 字段
3. 更新 Market 对象，`tradingVolume` 字段
4. 更新 Trader 对象，`tradingVolume`, `realizedPnl` 字段
5. 更新 TraderMarket 对象，`takerPositionSize` `openNotional` `entryPrice` 清零, `tradingVolume` `realizedPnl` 累计
6. 更新 Position 对象，`timestamp` `blockNumber` 更新，`PositionSize` `openNotional` `entryPrice` 清零, `tradingVolume` `realizedPnl` 累计
7. 更新 traderDayData 对象，累计 `tradingVolume` `realizedPnl`

### handlePositionChanged

1. 新建 PositionChanged 对象，`swappedPrice` 交易价格需要根据头寸规模的情况判断是否等于 0，因为添加移除流动性有可能没有进行交易（不实用 take 仓位添加流动性）
2. 更新 Protocol 对象
3. 更新 Market 对象
4. 更新 Trader 对象
5. 更新 TraderMarket 对象，若更新后的 `takerPositionSize` 字段小于 DUST_POSITION_SIZE 将 `takerPositionSize`, `openNotional`, `entryPrice` 字段置零
6. 更新 Position 对象
7. 更新 traderDayData 对象

### handlePositionLiquidated

PositionLiquidated 事件触发

1. 新建 PositionLiquidated 对象
2. 更新 Position 对象
3. 更新 Trader 对象
4. 更新 TraderMarket 对象

### handleLiquidityChanged

LiquidityChanged 事件触发

1. 新建 LiquidityChanged 对象
2. 更新 Maker 对象
3. 更新 Trader 对象
4. 更新 TraderMarket 对象
5. 更新 OpenOrder 对象
6. 更新 Market 对象

### handleFundingPaymentSettled

FundingPaymentSettled 事件触发

1. 新建 FundingPaymentSettled 对象
2. 更新 Position 对象
3. 更新 Trader 对象
4. 更新 TraderMarket 对象

### handleReferralPositionChanged

ReferredPositionChanged 事件触发，在触发后，累计上一次 PositionChanged 事件的数据

更新 `referralCodeDayData` `referralCodeTraderDayData` `PositionChanged` 对象

## CollateralManager

### handleCollateralAdded

CollateralAdded 事件触发

## Exchange

### handleFundingUpdated

FundingUpdated 事件触发，每当 funding payment 更新时

- `daily funding rate = (markTwap - indexTwap) / indexTwap`
  - ?? TWAP interal = 15 minutes, 这里直接认为是 daily ??

## MarketRgistry

### handlePoolAdded

PoolAdded 事件触发，添加新的 base token pool

### handleFeeRatioChanged

FeeRatioChanged 事件触发，改变 perp 手续费率

## Reffer

?? 暂未找到相关事件 ??

## Vault

### handleDeposited

Deposited 事件触发，当用户使用 deposit 函数存入抵押品

1. 更新 Token 对象 （Vault 中的 token），`totalDeposited`
2. 新建 Deposited 对象
3. 更新 Trader 对象
4. 更新 Protocol 对象
5. 更新 Deposited 对象的 amount 字段, 判断是存入 USDC 还是 WETH

### handleWithdrawn

Withdrawn 事件触发

1. 更新 Token 对象 （Vault 中的 token），`totalDeposited`
2. 新建 Withdrawn 对象
3. 更新 Trader 对象
4. 更新 Protocol 对象
5. 更新 Deposited 对象的 amount 字段, 判断是赎回的 USDC 还是 WETH

### handleCollateralLiquidated

CollateralLiquidated 事件触发

1. 新建 CollateralLiquidated 对象
2. 更新 Trader 对象
   - trader‘s token balance 分为 non settlement 和 setlement 两部分
3. 更新 Protocol 对象，其 balance 同样分为两部分
