# Tick

## View

### getAllFundingGrowth

根据当前价格与 price range 的位置关系，计算 price range 之外的 `FundingGrowth` 数值

1. 获取 range 边界上 lower , upper 两个 tick 上的 `GrowthOutside`
2. 根据 `currentTick` 与边界的位置关系，来确定一侧 outside 数值是直接取 tick 上的 `GrowthOutside`, 还是需要用 `GrowthGlobal` 减去 `GrowthOutside`
   - 每当 `currentTick` 穿过某个 tick，都会触发其上的 outside 数值翻转，因为该 tick 与 `currentTick` 位置关系发生翻转
   - `GrowthOutside = GrowthGlobal - GrowthOutside`
   - 所以当我们计算 price range 的 outside 数值，也需要根据位置关系来判断

- [Tick.cross](#cross)
- 具体原理同 [Uniswap V3 fees 的计算](https://github.com/Dapp-Learning-DAO/Dapp-Learning/blob/main/defi/Uniswap-V3/whitepaperGuide/understandV3Witepaper.md#%E6%89%8B%E7%BB%AD%E8%B4%B9)

```solidity
/// @return all values returned can underflow per feeGrowthOutside specs;
///         see https://www.notion.so/32990980ba8b43859f6d2541722a739b
function getAllFundingGrowth(
    mapping(int24 => GrowthInfo) storage self,
    int24 lowerTick,
    int24 upperTick,
    int24 currentTick,
    int256 twPremiumGrowthGlobalX96,
    int256 twPremiumDivBySqrtPriceGrowthGlobalX96
) internal view returns (FundingGrowthRangeInfo memory) {
    GrowthInfo storage lowerTickGrowthInfo = self[lowerTick];
    GrowthInfo storage upperTickGrowthInfo = self[upperTick];

    int256 lowerTwPremiumGrowthOutsideX96 = lowerTickGrowthInfo.twPremiumX96;
    int256 upperTwPremiumGrowthOutsideX96 = upperTickGrowthInfo.twPremiumX96;

    FundingGrowthRangeInfo memory fundingGrowthRangeInfo;
    fundingGrowthRangeInfo.twPremiumGrowthBelowX96 = currentTick >= lowerTick
        ? lowerTwPremiumGrowthOutsideX96
        : twPremiumGrowthGlobalX96 - lowerTwPremiumGrowthOutsideX96;
    int256 twPremiumGrowthAboveX96 =
        currentTick < upperTick
            ? upperTwPremiumGrowthOutsideX96
            : twPremiumGrowthGlobalX96 - upperTwPremiumGrowthOutsideX96;

    int256 lowerTwPremiumDivBySqrtPriceGrowthOutsideX96 = lowerTickGrowthInfo.twPremiumDivBySqrtPriceX96;
    int256 upperTwPremiumDivBySqrtPriceGrowthOutsideX96 = upperTickGrowthInfo.twPremiumDivBySqrtPriceX96;

    int256 twPremiumDivBySqrtPriceGrowthBelowX96 =
        currentTick >= lowerTick
            ? lowerTwPremiumDivBySqrtPriceGrowthOutsideX96
            : twPremiumDivBySqrtPriceGrowthGlobalX96 - lowerTwPremiumDivBySqrtPriceGrowthOutsideX96;
    int256 twPremiumDivBySqrtPriceGrowthAboveX96 =
        currentTick < upperTick
            ? upperTwPremiumDivBySqrtPriceGrowthOutsideX96
            : twPremiumDivBySqrtPriceGrowthGlobalX96 - upperTwPremiumDivBySqrtPriceGrowthOutsideX96;

    fundingGrowthRangeInfo.twPremiumGrowthInsideX96 =
        twPremiumGrowthGlobalX96 -
        fundingGrowthRangeInfo.twPremiumGrowthBelowX96 -
        twPremiumGrowthAboveX96;
    fundingGrowthRangeInfo.twPremiumDivBySqrtPriceGrowthInsideX96 =
        twPremiumDivBySqrtPriceGrowthGlobalX96 -
        twPremiumDivBySqrtPriceGrowthBelowX96 -
        twPremiumDivBySqrtPriceGrowthAboveX96;

    return fundingGrowthRangeInfo;
}
```

### cross

每当 `currentTick` 穿过某个 tick，都会触发其上的 outside 数值翻转，因为该 tick 与 `currentTick` 位置关系发生翻转

```solidity
function cross(
    mapping(int24 => GrowthInfo) storage self,
    int24 tick,
    GrowthInfo memory globalGrowthInfo
) internal {
    GrowthInfo storage growthInfo = self[tick];
    growthInfo.feeX128 = globalGrowthInfo.feeX128 - growthInfo.feeX128;
    growthInfo.twPremiumX96 = globalGrowthInfo.twPremiumX96 - growthInfo.twPremiumX96;
    growthInfo.twPremiumDivBySqrtPriceX96 =
        globalGrowthInfo.twPremiumDivBySqrtPriceX96 -
        growthInfo.twPremiumDivBySqrtPriceX96;
}
```
