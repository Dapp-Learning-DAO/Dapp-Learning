# Euler Liquidation

## liquidate flow

1. 更新清算人的 liquidity 状态
2. 更新被清算人的 liquidity 状态
3. 根据被清算账户的状态计算需要清算的债务和需要扣除的抵押 `computeLiqOpp()`
4. 执行清算，将债务从被清算人转移到清算人，并将抵押资产转给清算人

## liquidate

调用清算函数执行清算流程，会根据被清算人的健康系数，清算人的平均流动性来决定其清算折扣（折扣越高，获得抵押资产越多）

- `violator` 被清算账户
- `underlying` 待偿还资产（需要清算的债务）
- `collateral` 清算人获得的清算抵押资产
- `repay` 清算债务的数量，不能超过最大可清算债务数量
- `minYield` 指定清算人接受抵押资产的最低数量 （少于该数量不执行清算）

```solidity
/// @notice Attempts to perform a liquidation
/// @param violator Address that may be in collateral violation
/// @param underlying Token that is to be repayed
/// @param collateral Token that is to be seized
/// @param repay The amount of underlying DTokens to be transferred from violator to sender, in units of underlying
/// @param minYield The minimum acceptable amount of collateral ETokens to be transferred from violator to sender, in units of collateral
function liquidate(address violator, address underlying, address collateral, uint repay, uint minYield) external nonReentrant {
    require(accountLookup[violator].deferLiquidityStatus == DEFERLIQUIDITY__NONE, "e/liq/violator-liquidity-deferred");

    address liquidator = unpackTrailingParamMsgSender();

    emit RequestLiquidate(liquidator, violator, underlying, collateral, repay, minYield);

    // both update average liquidity
    updateAverageLiquidity(liquidator);
    updateAverageLiquidity(violator);


    LiquidationLocals memory liqLocs;

    liqLocs.liquidator = liquidator;
    liqLocs.violator = violator;
    liqLocs.underlying = underlying;
    liqLocs.collateral = collateral;

    // Compute how much repay liquidator could pay.
    // The more repay, the more discounting collateral liquidator will receive.
    computeLiqOpp(liqLocs);

    // acually execute liquidation
    executeLiquidation(liqLocs, repay, minYield);
}

function executeLiquidation(LiquidationLocals memory liqLocs, uint desiredRepay, uint minYield) private {
    require(desiredRepay <= liqLocs.liqOpp.repay, "e/liq/excessive-repay-amount");


    // transfer DToken from violator to liquidator
    uint repay;

    {
        AssetStorage storage underlyingAssetStorage = eTokenLookup[underlyingLookup[liqLocs.underlying].eTokenAddress];
        AssetCache memory underlyingAssetCache = loadAssetCache(liqLocs.underlying, underlyingAssetStorage);

        if (desiredRepay == liqLocs.liqOpp.repay) repay = liqLocs.repayPreFees;
        else repay = desiredRepay * (1e18 * 1e18 / (1e18 + UNDERLYING_RESERVES_FEE)) / 1e18;

        {
            uint repayExtra = desiredRepay - repay;

            // Liquidator takes on violator's debt:

            transferBorrow(underlyingAssetStorage, underlyingAssetCache, underlyingAssetStorage.dTokenAddress, liqLocs.violator, liqLocs.liquidator, repay);

            // Extra debt is minted and assigned to liquidator:

            increaseBorrow(underlyingAssetStorage, underlyingAssetCache, underlyingAssetStorage.dTokenAddress, liqLocs.liquidator, repayExtra);

            // The underlying's reserve is credited to compensate for this extra debt:

            {
                uint poolAssets = underlyingAssetCache.poolSize + (underlyingAssetCache.totalBorrows / INTERNAL_DEBT_PRECISION);
                uint newTotalBalances = poolAssets * underlyingAssetCache.totalBalances / (poolAssets - repayExtra);
                increaseReserves(underlyingAssetStorage, underlyingAssetCache, newTotalBalances - underlyingAssetCache.totalBalances);
            }
        }

        logAssetStatus(underlyingAssetCache);
    }


    // transfer EToken from liquidator to violator
    uint yield;

    {
        AssetStorage storage collateralAssetStorage = eTokenLookup[underlyingLookup[liqLocs.collateral].eTokenAddress];
        AssetCache memory collateralAssetCache = loadAssetCache(liqLocs.collateral, collateralAssetStorage);

        yield = repay * liqLocs.liqOpp.conversionRate / 1e18;
        require(yield >= minYield, "e/liq/min-yield");

        // Liquidator gets violator's collateral:

        address eTokenAddress = underlyingLookup[collateralAssetCache.underlying].eTokenAddress;

        transferBalance(collateralAssetStorage, collateralAssetCache, eTokenAddress, liqLocs.violator, liqLocs.liquidator, underlyingAmountToBalance(collateralAssetCache, yield));

        logAssetStatus(collateralAssetCache);
    }


    // Since liquidator is taking on new debt, liquidity must be checked:

    checkLiquidity(liqLocs.liquidator);

    emitLiquidationLog(liqLocs, repay, yield);
}

```

## computeLiqOpp

以将被清算账户健康系数 `HealthScore` 调整到 1.25 作为目标，计算清算折扣 `discount`, 需要偿还的债务资产数量 `repay`, 应扣除的抵押资产数量 `yield` 等

```math
repay
```

1. 条件检查
   - 不能清算同一母账户的子账户
   - 被清算人的清算资产都已进入市场
2. 检查 `HealthScore` 必须 < 1, 否则 revert
3. 计算清算折扣率
   - `baseDiscount` 基础清算折扣率，`HealthScore` 比 1 越小折扣越大，并且需要附加准备金的费率
   - `discountBooster` 清算折扣的附加乘数（清算人如果提供的流动性越多，享受的清算折扣则越大）
   - `discount` 该笔清算享受的实际折扣率
4. 计算需要偿还的金额，使被清算人达到目标健康系数 1.25
   - 将抵押和负债都竟有风险价值调整因子调整到 `RiskAdjustment`, 便于比较和计算
   - 计算将当前账户调整到目标健康系数需要清算多少债务资产
   - 清算债务价值不能超过该账户的所有抵押价值
   - 期间考虑了清算折扣
5. 换算清算债务到偿还抵押的数量
   - `repay` 清算债务数量 / `conversionRate` = `yeild` 需要偿还的抵押数量
   - 其中准备金费将从 repay 中扣除 `UNDERLYING_RESERVES_FEE`

```solidity

/// @notice Information about a prospective liquidation opportunity
struct LiquidationOpportunity {
    uint repay;
    uint yield;
    uint healthScore;

    // Only populated if repay > 0:
    uint baseDiscount;
    uint discount;
    uint conversionRate;
}

struct LiquidationLocals {
    address liquidator;
    address violator;
    address underlying;
    address collateral;

    uint underlyingPrice;
    uint collateralPrice;

    LiquidationOpportunity liqOpp;

    uint repayPreFees;
}

function computeLiqOpp(LiquidationLocals memory liqLocs) private {
    // Can't liquidate self
    require(!isSubAccountOf(liqLocs.violator, liqLocs.liquidator), "e/liq/self-liquidation");
    require(isEnteredInMarket(liqLocs.violator, liqLocs.underlying), "e/liq/violator-not-entered-underlying");
    require(isEnteredInMarket(liqLocs.violator, liqLocs.collateral), "e/liq/violator-not-entered-collateral");

    liqLocs.underlyingPrice = getAssetPrice(liqLocs.underlying);
    liqLocs.collateralPrice = getAssetPrice(liqLocs.collateral);

    LiquidationOpportunity memory liqOpp = liqLocs.liqOpp;

    AssetStorage storage underlyingAssetStorage = eTokenLookup[underlyingLookup[liqLocs.underlying].eTokenAddress];
    AssetCache memory underlyingAssetCache = loadAssetCache(liqLocs.underlying, underlyingAssetStorage);

    AssetStorage storage collateralAssetStorage = eTokenLookup[underlyingLookup[liqLocs.collateral].eTokenAddress];
    AssetCache memory collateralAssetCache = loadAssetCache(liqLocs.collateral, collateralAssetStorage);

    liqOpp.repay = liqOpp.yield = 0;

    (uint collateralValue, uint liabilityValue) = getAccountLiquidity(liqLocs.violator);

    if (liabilityValue == 0) {
        liqOpp.healthScore = type(uint).max;
        return; // no violation
    }

    liqOpp.healthScore = collateralValue * 1e18 / liabilityValue;

    if (collateralValue >= liabilityValue) {
        return; // no violation
    }

    // At this point healthScore must be < 1 since collateral < liability

    // Compute discount

    {
        uint baseDiscount = UNDERLYING_RESERVES_FEE + (1e18 - liqOpp.healthScore);

        uint discountBooster = computeDiscountBooster(liqLocs.liquidator, liabilityValue);

        uint discount = baseDiscount * discountBooster / 1e18;

        if (discount > (baseDiscount + MAXIMUM_BOOSTER_DISCOUNT)) discount = baseDiscount + MAXIMUM_BOOSTER_DISCOUNT;
        if (discount > MAXIMUM_DISCOUNT) discount = MAXIMUM_DISCOUNT;

        liqOpp.baseDiscount = baseDiscount;
        liqOpp.discount = discount;
        liqOpp.conversionRate = liqLocs.underlyingPrice * 1e18 / liqLocs.collateralPrice * 1e18 / (1e18 - discount);
    }

    // Determine amount to repay to bring user to target health

    if (liqLocs.underlying == liqLocs.collateral) {
        liqOpp.repay = type(uint).max;
    } else {
        AssetConfig memory collateralConfig = resolveAssetConfig(liqLocs.collateral);
        AssetConfig memory underlyingConfig = resolveAssetConfig(liqLocs.underlying);

        uint collateralFactor = collateralConfig.collateralFactor;
        uint borrowFactor = underlyingConfig.borrowFactor;

        uint liabilityValueTarget = liabilityValue * TARGET_HEALTH / 1e18;

        // factor will unique value to risk-adjusted
        // These factors are first converted into standard 1e18-scale fractions, then adjusted according to TARGET_HEALTH and the discount:
        uint borrowAdj = borrowFactor != 0 ? TARGET_HEALTH * CONFIG_FACTOR_SCALE / borrowFactor : MAX_SANE_DEBT_AMOUNT;
        uint collateralAdj = 1e18 * uint(collateralFactor) / CONFIG_FACTOR_SCALE * 1e18 / (1e18 - liqOpp.discount);

        if (borrowAdj <= collateralAdj) {
            liqOpp.repay = type(uint).max;
        } else {
            // liabilityValueTarget >= liabilityValue > collateralValue
            uint maxRepayInReference = (liabilityValueTarget - collateralValue) * 1e18 / (borrowAdj - collateralAdj); // ??
            liqOpp.repay = maxRepayInReference * 1e18 / liqLocs.underlyingPrice;
        }
    }

    // Limit repay to current owed
    // This can happen when there are multiple borrows and liquidating this one won't bring the violator back to solvency

    {
        uint currentOwed = getCurrentOwed(underlyingAssetStorage, underlyingAssetCache, liqLocs.violator);
        if (liqOpp.repay > currentOwed) liqOpp.repay = currentOwed;
    }

    // Limit yield to borrower's available collateral, and reduce repay if necessary
    // This can happen when borrower has multiple collaterals and seizing all of this one won't bring the violator back to solvency

    liqOpp.yield = liqOpp.repay * liqOpp.conversionRate / 1e18;

    {
        uint collateralBalance = balanceToUnderlyingAmount(collateralAssetCache, collateralAssetStorage.users[liqLocs.violator].balance);

        if (collateralBalance < liqOpp.yield) {
            liqOpp.repay = collateralBalance * 1e18 / liqOpp.conversionRate;
            liqOpp.yield = collateralBalance;
        }
    }

    // Adjust repay to account for reserves fee

    liqLocs.repayPreFees = liqOpp.repay;
    liqOpp.repay = liqOpp.repay * (1e18 + UNDERLYING_RESERVES_FEE) / 1e18;
}
```

### computeDiscountBooster

根据清算人的 `AverageLiquidity` 返回清算折扣的附加乘数（清算人如果提供的流动性越多，享受的清算折扣则越大）

```solidity
// Returns 1e18-scale fraction > 1 representing how much faster the booster grows for this liquidator

function computeDiscountBooster(address liquidator, uint violatorLiabilityValue) private returns (uint) {
    uint booster = getUpdatedAverageLiquidityWithDelegate(liquidator) * 1e18 / violatorLiabilityValue;
    if (booster > 1e18) booster = 1e18;

    booster = booster * (DISCOUNT_BOOSTER_SLOPE - 1e18) / 1e18;

    return booster + 1e18;
}
```
