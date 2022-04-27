# Euler BaseLogic

## Account

## Market

## Amount&Balance

## Rate

### computeExchangeRate

## Borrow

## Reserves

## Liquidity

Liquidity 流动性在 Euler 中代表了用户的 抵押资产价值 和 负债资产价值

### updateAverageLiquidity

更新用户在时间窗口内的平均流动性（抵押资产价值 - 负债资产价值），时间窗口 `AVERAGE_LIQUIDITY_PERIOD = 24 * 60 * 60` 即 24 小时

1. 判断最后一次用户的 liquidity 更新时间 `lastAverageLiquidityUpdate` 是否为 0

   - 若为 0 说明该用户之前未添加过流动性（抵押资产），不更新

2. 计算上次更新到目前的时间 `deltaT`

   - 若为 0 说明该用户在一个区块内重复触发了更新进程，不更新

3. 更新用户平均流动性更新时间 `lastAverageLiquidityUpdate`

4. 调用 `computeNewAverageLiquidity` 更新用户的平均流动性

```solidity
function updateAverageLiquidity(address account) internal {
    uint lastAverageLiquidityUpdate = accountLookup[account].lastAverageLiquidityUpdate;
    if (lastAverageLiquidityUpdate == 0) return;

    uint deltaT = block.timestamp - lastAverageLiquidityUpdate;
    if (deltaT == 0) return;

    accountLookup[account].lastAverageLiquidityUpdate = uint40(block.timestamp);
    accountLookup[account].averageLiquidity = computeNewAverageLiquidity(account, deltaT);
}
```

### computeNewAverageLiquidity

计算用户在时间窗口内的流动性

```solidity
function computeNewAverageLiquidity(address account, uint deltaT) private returns (uint) {
    uint currDuration = deltaT >= AVERAGE_LIQUIDITY_PERIOD ? AVERAGE_LIQUIDITY_PERIOD : deltaT;
    uint prevDuration = AVERAGE_LIQUIDITY_PERIOD - currDuration;

    uint currAverageLiquidity;

    {
        (uint collateralValue, uint liabilityValue) = getAccountLiquidity(account);
        currAverageLiquidity = collateralValue > liabilityValue ? collateralValue - liabilityValue : 0;
    }

    return (accountLookup[account].averageLiquidity * prevDuration / AVERAGE_LIQUIDITY_PERIOD) +
            (currAverageLiquidity * currDuration / AVERAGE_LIQUIDITY_PERIOD);
}
```

### getAccountLiquidity

计算用户当前的 抵押资产价值 和 负债资产价值，调用 `RiskManager.computeLiquidity`

```solidity
function getAccountLiquidity(address account) internal returns (uint collateralValue, uint liabilityValue) {
    bytes memory result = callInternalModule(MODULEID__RISK_MANAGER, abi.encodeWithSelector(IRiskManager.computeLiquidity.selector, account));
    (IRiskManager.LiquidityStatus memory status) = abi.decode(result, (IRiskManager.LiquidityStatus));

    collateralValue = status.collateralValue;
    liabilityValue = status.liabilityValue;
}
```

- [RiskManager.computeLiquidity](./RiskManager.md#computeliquidity)
