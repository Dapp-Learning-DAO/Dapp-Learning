# Euler RiskManager

## Liquidity

### computeLiquidity

分别计算用户的 抵押资产 和 负债资产 的总价值（数量 \* 价格）

```solidity
function computeLiquidity(address account) public view override returns (LiquidityStatus memory) {
    return computeLiquidityRaw(account, getEnteredMarketsArray(account));
}

function computeLiquidityRaw(address account, address[] memory underlyings) private view returns (LiquidityStatus memory status) {
    status.collateralValue = 0;
    status.liabilityValue = 0;
    status.numBorrows = 0;
    status.borrowIsolated = false;

    AssetConfig memory config;
    AssetStorage storage assetStorage;
    AssetCache memory assetCache;

    for (uint i = 0; i < underlyings.length; ++i) {
        address underlying = underlyings[i];

        config = resolveAssetConfig(underlying);
        assetStorage = eTokenLookup[config.eTokenAddress];

        uint balance = assetStorage.users[account].balance;
        uint owed = assetStorage.users[account].owed;

        if (owed != 0) {
            initAssetCache(underlying, assetStorage, assetCache);
            (uint price,) = getPriceInternal(assetCache, config);

            status.numBorrows++;
            if (config.borrowIsolated) status.borrowIsolated = true;

            uint assetLiability = getCurrentOwed(assetStorage, assetCache, account);

            if (balance != 0) { // self-collateralisation
                uint balanceInUnderlying = balanceToUnderlyingAmount(assetCache, balance);

                uint selfAmount = assetLiability;
                uint selfAmountAdjusted = assetLiability * CONFIG_FACTOR_SCALE / SELF_COLLATERAL_FACTOR;

                if (selfAmountAdjusted > balanceInUnderlying) {
                    selfAmount = balanceInUnderlying * SELF_COLLATERAL_FACTOR / CONFIG_FACTOR_SCALE;
                    selfAmountAdjusted = balanceInUnderlying;
                }

                {
                    uint assetCollateral = (balanceInUnderlying - selfAmountAdjusted) * config.collateralFactor / CONFIG_FACTOR_SCALE;
                    assetCollateral += selfAmount;
                    status.collateralValue += assetCollateral * price / 1e18;
                }

                assetLiability -= selfAmount;
                status.liabilityValue += selfAmount * price / 1e18;
                status.borrowIsolated = true; // self-collateralised loans are always isolated
            }

            assetLiability = assetLiability * price / 1e18;
            assetLiability = config.borrowFactor != 0 ? assetLiability * CONFIG_FACTOR_SCALE / config.borrowFactor : MAX_SANE_DEBT_AMOUNT;
            status.liabilityValue += assetLiability;
        } else if (balance != 0 && config.collateralFactor != 0) {
            initAssetCache(underlying, assetStorage, assetCache);
            (uint price,) = getPriceInternal(assetCache, config);

            uint balanceInUnderlying = balanceToUnderlyingAmount(assetCache, balance);
            uint assetCollateral = balanceInUnderlying * price / 1e18;
            assetCollateral = assetCollateral * config.collateralFactor / CONFIG_FACTOR_SCALE;
            status.collateralValue += assetCollateral;
        }
    }
}
```
