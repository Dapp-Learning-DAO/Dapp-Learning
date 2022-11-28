# Euler RiskManager

## Default market parameters

### getNewMarketParameters

获取资产在 Markets 中的初始化参数，若非 PToken， 则需要自动匹配 UniswapV3Pool 地址，选择流动性最好的一档费率池子

1. 默认资产参数都将给予最低的安全权限
   - 资产是安全等级最低的隔离层资产 （Isolation-tier）
   - collateralFactor 为 0，因为 `collateral risk-adjustment = assetValue * collateralFactor`
   - borrowFactor 为最大值，因为 `liability risk-adjustment = assetValue / borrowFactor`
   - twap 价格给予最大值
2. 若是参考资产（目前是 WETH，所有资产在 Euler 中都是以 WETH 计价）
3. 若是 PToken，价格初始化为 0
4. 剩下的资产即为拥有 EToken 和 DToken 的类别，需要初始化对应的 UniswapV3Pool 的地址
   - 遍历该资产与 WETH 组成的交易对，所有费率档次的池子，取其中流动性最好的作为默认交易池子地址
   - 若不合适，需要后期通过治理投票更改
   - `pricingParameters` 存储交易池子的费率，只对该类资产有效

```solidity
// Constants.col
// Pricing types
uint16 internal constant PRICINGTYPE__PEGGED = 1;           //  WETH
uint16 internal constant PRICINGTYPE__UNISWAP3_TWAP = 2;    // EToken and DToken
uint16 internal constant PRICINGTYPE__FORWARDED = 3;        // PToken

// RiskManager.sol
function getNewMarketParameters(address underlying) external override returns (NewMarketParameters memory p) {
    p.config.borrowIsolated = true;
    p.config.collateralFactor = uint32(0);
    p.config.borrowFactor = type(uint32).max;
    p.config.twapWindow = type(uint24).max;

    // referenceAsset now is WETH
    // so WETH's price is always 1
    if (underlying == referenceAsset) {
        // 1:1 peg

        p.pricingType = PRICINGTYPE__PEGGED; // 1
        p.pricingParameters = uint32(0);
    } else if (pTokenLookup[underlying] != address(0)) {
        p.pricingType = PRICINGTYPE__FORWARDED;
        p.pricingParameters = uint32(0);

        p.config.collateralFactor = underlyingLookup[pTokenLookup[underlying]].collateralFactor;
    } else {
        // Uniswap3 TWAP

        // The uniswap pool (fee-level) with the highest in-range liquidity is used by default.
        // This is a heuristic and can easily be manipulated by the activator, so users should
        // verify the selection is suitable before using the pool. Otherwise, governance will
        // need to change the pricing config for the market.

        address pool = address(0);
        uint24 fee = 0;

        {
            uint24[4] memory fees = [uint24(3000), 10000, 500, 100];
            uint128 bestLiquidity = 0;

            for (uint i = 0; i < fees.length; ++i) {
                address candidatePool = IUniswapV3Factory(uniswapFactory).getPool(underlying, referenceAsset, fees[i]);
                if (candidatePool == address(0)) continue;

                uint128 liquidity = IUniswapV3Pool(candidatePool).liquidity();

                if (pool == address(0) || liquidity > bestLiquidity) {
                    pool = candidatePool;
                    fee = fees[i];
                    bestLiquidity = liquidity;
                }
            }
        }

        require(pool != address(0), "e/no-uniswap-pool-avail");
        require(computeUniswapPoolAddress(underlying, fee) == pool, "e/bad-uniswap-pool-addr");

        p.pricingType = PRICINGTYPE__UNISWAP3_TWAP;
        p.pricingParameters = uint32(fee);

        try IUniswapV3Pool(pool).increaseObservationCardinalityNext(MIN_UNISWAP3_OBSERVATION_CARDINALITY) {
            // Success
        } catch Error(string memory err) {
            if (keccak256(bytes(err)) == keccak256("LOK")) revert("e/risk/uniswap-pool-not-inited");
            revert(string(abi.encodePacked("e/risk/uniswap/", err)));
        } catch (bytes memory returnData) {
            revertBytes(returnData);
        }
    }
}
```

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

关于 Liquidity 的原理参见 [README Liquidity](../README.md#Liquidity)

### computeLiquidity

分别计算用户的每种资产的 抵押资产 和 负债资产 的总价值（数量 \* 价格），其中抵押资产分为 `Supply` 和 `Self-Collateral`, 负债资产分为 `Liabilities` 和 `Self-Liability`，四种资产均有不同的价值调整系数 factor 。

关于 self 部分的抵押和负债，详细可看官方文档 [self-collateralisation](https://github.com/euler-xyz/euler-contracts/blob/master/docs/self-collateralisation.md)

首先，我们假设该资产的 assetLiability 全部都是 self-collateral ，如果此时 assetLiability > 该资产的所有抵押数量，这显然不合理，说明假设不成立；
所以我们将 self-collateral 重设为 balanceInUnderlying，而剩下的一部分 assetLiability - balanceInUnderlying 则为实际的 Liabilities

```solidity
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
                // User's actually collateral balance of underlying
                uint balanceInUnderlying = balanceToUnderlyingAmount(assetCache, balance);

                // CONFIG_FACTOR_SCALE for adjusting decimals (1 in uint32)
                // SELF_COLLATERAL_FACTOR is constant variable (0.95)

                // selfAmount cache Liabilities amount (Self_Collateral_RA)
                // First of all, we assume that all debt are Self_Liability,
                // then we can get Self_Collateral
                // Self_Collateral * SCF = Self_Collateral_RA = Self_Liability
                // Self_Collateral = Self_Liability / SCF
                uint selfAmount = assetLiability;   // self-Liability
                uint selfAmountAdjusted = assetLiability * CONFIG_FACTOR_SCALE / SELF_COLLATERAL_FACTOR; // self-collateral

                // If assetLiability > all mortgages of the asset at this time, this is obviously
                // unreasonable, indicating that the assumption does not hold.
                // So we reset self-collateral to balanceInUnderlying and the remaining part of
                // assetLiability - balanceInUnderlying is the actual Liabilities
                if (selfAmountAdjusted > balanceInUnderlying) {
                    selfAmount = balanceInUnderlying * SELF_COLLATERAL_FACTOR / CONFIG_FACTOR_SCALE;
                    selfAmountAdjusted = balanceInUnderlying;
                }

                {
                    // (balanceInUnderlying - selfAmountAdjusted)*BF*price is
                    // actually Collateral_RA without Self_Collateral
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

            // convert Etoken amount to underlying amount
            // collateralValue += underlying amount * collateralFactor
            uint balanceInUnderlying = balanceToUnderlyingAmount(assetCache, balance);  // EToken balance -> underlying token balance
            uint assetCollateral = balanceInUnderlying * price / 1e18;  // amount * price = value
            assetCollateral = assetCollateral * config.collateralFactor / CONFIG_FACTOR_SCALE;
            status.collateralValue += assetCollateral;
        }
    }
}
```
