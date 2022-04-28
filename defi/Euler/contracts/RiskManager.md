# Euler RiskManager

## Default market parameters

## Pricing

### getPriceInternal

根据 `pricingType` 获取价格

pricingType:

- 1 锚定类型，价格恒定为 1
- 2 取 Uniswap v3 TWAP 预言机价格
- 其他情况 revert

```solidity
uint16 internal constant PRICINGTYPE__PEGGED = 1;
uint16 internal constant PRICINGTYPE__UNISWAP3_TWAP = 2;

function getPriceInternal(AssetCache memory assetCache, AssetConfig memory config) public view FREEMEM returns (uint twap, uint twapPeriod) {
    (address underlying, uint16 pricingType, uint32 pricingParameters, uint24 twapWindow) = resolvePricingConfig(assetCache, config);

    if (pricingType == PRICINGTYPE__PEGGED) {
        twap = 1e18;
        twapPeriod = twapWindow;
    } else if (pricingType == PRICINGTYPE__UNISWAP3_TWAP) {
        address pool = computeUniswapPoolAddress(underlying, uint24(pricingParameters));
        (twap, twapPeriod) = callUniswapObserve(assetCache, pool, twapWindow);
    } else {
        revert("e/unknown-pricing-type");
    }
}
```

## Liquidity

### computeLiquidity

分别计算用户的 抵押资产 和 负债资产 的总价值（数量 \* 价格）

1. 新建缓存变量，存储之后遍历累加的数据
2. 遍历每种资产该用户的负债和抵押情况
   - 如果该资产有负债
     - 分别计算该资产类别下，负债资产价值和抵押资产价值
     - self amount 计算逻辑（mint EToken 部分的计算逻辑）
   - 如果该资产没有负债直接累计抵押资产价值

```ts
uint internal constant CONFIG_FACTOR_SCALE = 4_000_000_000; // must fit into a uint32
uint32 internal constant SELF_COLLATERAL_FACTOR = uint32(0.95 * 4_000_000_000);


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

    // calc debt and collateral every asset
    for (uint i = 0; i < underlyings.length; ++i) {
        address underlying = underlyings[i];

        config = resolveAssetConfig(underlying);
        assetStorage = eTokenLookup[config.eTokenAddress];

        // balance and owned are storage variables, not the latest value
        uint balance = assetStorage.users[account].balance;  // collateral
        uint owed = assetStorage.users[account].owed;  // debt

        // If it has debt in this asset, should calc both debt and collateral,
        // otherwise, add collateral directly
        if (owed != 0) {
            initAssetCache(underlying, assetStorage, assetCache);
            (uint price,) = getPriceInternal(assetCache, config);

            // count debts for check Isolated-level asset
            status.numBorrows++;
            if (config.borrowIsolated) status.borrowIsolated = true;

            // The latest debt value, often different from owed (greater)
            uint assetLiability = getCurrentOwed(assetStorage, assetCache, account);

            if (balance != 0) { // self-collateralisation
                // User's actually collateral (by deposit function)
                uint balanceInUnderlying = balanceToUnderlyingAmount(assetCache, balance);

                // CONFIG_FACTOR_SCALE for adjusting decimals (1)
                // SELF_COLLATERAL_FACTOR is contant variable (0.95), always less than collateral_factor
                
                // selfAmount cache debt value
                // selfAmountAdjusted cache adjusted debt value (/ self_collateral_factor)
                uint selfAmount = assetLiability;
                uint selfAmountAdjusted = assetLiability * CONFIG_FACTOR_SCALE / SELF_COLLATERAL_FACTOR;

                // This asset has self-collateral cause debt > collateral,
                // so we use balanceInUnderlying as selfAmountAdjusted
                if (selfAmountAdjusted > balanceInUnderlying) {
                    selfAmount = balanceInUnderlying * SELF_COLLATERAL_FACTOR / CONFIG_FACTOR_SCALE;
                    selfAmountAdjusted = balanceInUnderlying;
                }

                {
                    // balanceInUnderlying - selfAmountAdjusted is actually collateral (without self-collateralization)
                    // * collateralFactor is adjusted collateralValue
                    // / price  convert debt asset to collateral asset
                    uint assetCollateral = (balanceInUnderlying - selfAmountAdjusted) * config.collateralFactor / CONFIG_FACTOR_SCALE;
                    assetCollateral += selfAmount;
                    // accumulate collateralValue
                    status.collateralValue += assetCollateral * price / 1e18;
                }

                // debt without self-liabilities
                assetLiability -= selfAmount;
                // accumulate self-liabilities as debt
                status.liabilityValue += selfAmount * price / 1e18;
                status.borrowIsolated = true; // self-collateralised loans are always isolated
            }

            // accumulate debt without self-liabilities
            // this part use borrowFactor is different from self_collateral_factor (constant 0.95)
            assetLiability = assetLiability * price / 1e18;
            assetLiability = config.borrowFactor != 0 ? assetLiability * CONFIG_FACTOR_SCALE / config.borrowFactor : MAX_SANE_DEBT_AMOUNT;
            status.liabilityValue += assetLiability;
        } else if (balance != 0 && config.collateralFactor != 0) {  // collateralFactor = 0, not as liquidity
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

#### self-collateralisation & self-liabilities

EToken 有mint逻辑，即为用户同时生成 EToken 和 DToken [EToken.mint](./EToken.md#mint)

这部分同时生成的 EToken 和 DToken 称为 Self Collateral 和 Self Liability，区别于用户直接使用 `deposit` 和 `borrow` 生成的 EToken 和 DToken ，self部分的调整系数都是恒定值（Collateral Factor 0.95, Borrow Factor 1）。所以其计算逻辑需要和常规的债务和抵押区分开。

- `balanceInUnderlying` 是

