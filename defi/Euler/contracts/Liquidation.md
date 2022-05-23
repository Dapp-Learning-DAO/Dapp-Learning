# Euler Liquidation

## liquidate flow

1. 更新清算人的 liquidity 状态
2. 更新被清算人的 liquidity 状态
3. 计算清算的收益 `computeLiqOpp()`

## computeLiqOpp



```ts
function computeLiqOpp(LiquidationLocals memory liqLocs) private {
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

        // These factors are first converted into standard 1e18-scale fractions, then adjusted according to TARGET_HEALTH and the discount:
        uint borrowAdj = borrowFactor != 0 ? TARGET_HEALTH * CONFIG_FACTOR_SCALE / borrowFactor : MAX_SANE_DEBT_AMOUNT;
        uint collateralAdj = 1e18 * uint(collateralFactor) / CONFIG_FACTOR_SCALE * 1e18 / (1e18 - liqOpp.discount);

        if (borrowAdj <= collateralAdj) {
            liqOpp.repay = type(uint).max;
        } else {
            // liabilityValueTarget >= liabilityValue > collateralValue
            uint maxRepayInReference = (liabilityValueTarget - collateralValue) * 1e18 / (borrowAdj - collateralAdj);
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
