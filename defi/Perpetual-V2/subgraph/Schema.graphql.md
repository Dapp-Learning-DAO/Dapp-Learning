# Perp V2 Subgraph Schema.graphql

## MarketRegistry

### Protocol

协议基本信息

### Market

每个 base token 都有对应的 Market

- `feeRatio` 交易手续费(Uniswap 收取的部分) 500 (0.05%), 3000 (0.3%), 10000 (1%)
- `tradingVolume` 该 Market 累计的交易量
- `tradingFee` 该 Market 累计的交易手续费
- `baseAmount` base token 的流动性
- `quoteAmount` quote token 的流动性

### Token

v-token 对象， `TraderTokenBalance` 与 `ProtocolTokenBalance` 的字段类型

### TraderTokenBalance

trader 的 token 余额

### ProtocolTokenBalance

协议每个 token 的余额

## Vault

### Deposited

Vault.Deposited event 事件触发，存储 token 进入 vault 合约

### Withdraw

Vault.Withdraw event 事件触发

### CollateralLiquidated

Vault.CollateralLiquidated event 事件触发

## Exchange

### PositionChanged

trader 新增头寸(开空或开多), PositionChanged 事件触发

- `exchangedPositionSize` 本次交易的头寸规模，+ 为多 - 为空
- `exchangedPositionNotional` 本次交易的头寸价值
- `fee` 本次交易手续费，（perp + uniswap）
- `openNotional` 此交易过后，trader 每笔交易的平均价值
- `realizedPnl` 此交易后，实现的 Pnl
- `positionSizeAfter` 此交易后 trader 的头寸规模
- `swappedPrice` 此次交易考虑手续费后的交易价格
- `entryPriceAfter` 所有交易的平均交易价格

### PositionClosed

trader 头寸关闭, PositionClosed 事件触发

- `closedPositionSize` 关闭头寸的规模 - 为关闭多头 + 为关闭空头
- `closedPositionNotional` 关闭头寸的价值
- `openNotionalBeforeClose` 关闭头寸之前的平均头寸价值

### FundingUpdated

更新 Mark price 和 Index price 的 TWAP，FundingUpdated 事件触发

### FundingPaymentSettled

更新 trader 的 funding payment 数值，FundingPaymentSettled 事件触发

### Trader

trader 对象，包括 taker 和 maker

- `settlementTokenBalance = settlement collateral + cumulative total pnl`
- `nonSettlementTokenBalances = non-settlement collateral`

### TraderMarket

trader 的每个 base token 的 market 信息, Trader 的子字段

### Position

已废弃，用 TraderMarket 对象代替

## ClearingHouse

### PositionLiquidated

清算头寸， PositionLiquidated 事件触发

### Maker

Maker 信息

- `collectedFee` maker 通过提供流动性获取的手续费受益
- `openOrders` maker 当前的 range orders

### OpenOrder

Maker 对象的子字段

- `lowerTick` 价格下边界
- `upperTick` 价格上边界
- `liquidity` 流动性大小
- `collectedFee` 该 range order 总共收取的手续费
- `collectedFeeInThisLifecycle` 本轮收取手续费(如果maker抽走所有流动性，又添加流动性，算两个 life cycle)

### LiquidityChanged

流动性发生改变，LiquidityChanged 事件触发

- `liquidity` + 为新增 - 为减少
- `fromFunctionSignature` 由那个函数触发，记录其函数的 select id

## AccountBalance

### PnlRealized

Pnl 发生变化，记录本次的变化量，PnlRealized 事件触发

## Trader Historical Data

### TraderDayData

Trader 每天的交易数据

- `tradingVolume` 一天的交易量
- `fee` 一天被收取的手续费
- `realizedPnl` 一天内的Pnl

### ReferralCodeTraderDayData

同上，只是在交易调用 referral code 时触发

### ReferralCodeDayData

ReferralCodeTraderDayData 的子字段

### ReferralCode

ReferralCodeDayData 的子字段

### BadDebtHappened

No such contract event, this is artificial for monitoring only
