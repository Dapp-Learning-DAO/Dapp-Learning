# Euler BaseLogic

## Moudles

Euler 一共9个模块，通过此函数创建 Proxy

- `DToken`
- `Etoken`
- `Exec`
- `Governance`
- `Installer`
- `Liquidiation`
- `Markets`
- `RiskManager`
- `Swap`

通过 `_createProxy` 新建模块 proxy

```solidity
function _createProxy(uint proxyModuleId) internal returns (address) {
    require(proxyModuleId != 0, "e/create-proxy/invalid-module");
    require(proxyModuleId <= MAX_EXTERNAL_MODULEID, "e/create-proxy/internal-module");

    // If we've already created a proxy for a single-proxy module, just return it:

    if (proxyLookup[proxyModuleId] != address(0)) return proxyLookup[proxyModuleId];

    // Otherwise create a proxy:

    address proxyAddr = address(new Proxy());

    if (proxyModuleId <= MAX_EXTERNAL_SINGLE_PROXY_MODULEID) proxyLookup[proxyModuleId] = proxyAddr;

    trustedSenders[proxyAddr] = TrustedSenderInfo({ moduleId: uint32(proxyModuleId), moduleImpl: address(0) });

    emit ProxyCreated(proxyAddr, proxyModuleId);

    return proxyAddr;
}

```

## Account auth

Euler 的子账户系统，并不是主次结构，即使用 mapping 或者数组结构在主账户下罗列序号，而是通过按位异或运算来生成新的地址，验证子账户隶属关系时，再通过按位或运算来判断结果是否相同。

假设主账户地址为 0x45 (为了方便举例，假设地址是 uint32 类型)

```js
// primary account
0x45

// subaccounts
0x45 ^ 0x0 // 0x45 1000101 subaccount 0 as primary
0x45 ^ 0x1 // 0x44 1000100 subaccount 1
0x45 ^ 0x2 // 0x47 1000111 subaccount 2
0x45 ^ 0x3 // 0x46 1000110 subaccount 3
...
0x45 ^ 0xF // 0x4A 1001010 subaccount 15

// subacounts verify get same result
0x45 | 0xF // 0x4F 1001111
0x44 | 0xF // 0x4F 1001111

// not subaccount verify get different result
0x3d | 0xF // 0x3F 111111

```

```solidity
function getSubAccount(address primary, uint subAccountId) internal pure returns (address) {
    require(subAccountId < 256, "e/sub-account-id-too-big");
    return address(uint160(primary) ^ uint160(subAccountId));
}

function isSubAccountOf(address primary, address subAccount) internal pure returns (bool) {
    return (uint160(primary) | 0xFF) == (uint160(subAccount) | 0xFF);
}
```

参考：<https://twitter.com/0xTomoyo/status/1519292394126012418>

## Entered markets array

### getEnteredMarketsArray

```solidity
function getEnteredMarketsArray(address account) internal view returns (address[] memory) {
    uint32 numMarketsEntered = accountLookup[account].numMarketsEntered;
    address firstMarketEntered = accountLookup[account].firstMarketEntered;

    address[] memory output = new address[](numMarketsEntered);
    if (numMarketsEntered == 0) return output;

    address[MAX_POSSIBLE_ENTERED_MARKETS] storage markets = marketsEntered[account];

    output[0] = firstMarketEntered;

    for (uint i = 1; i < numMarketsEntered; ++i) {
        output[i] = markets[i];
    }

    return output;
}
```

## AssetConfig

### resolveAssetConfig

从 storage 中取出并解析资产的配置

- 负债系数 `borrowFactor` 是在计算真实负债资产与负债资产调整值的除数
- 若该值为 `uint32.max` 即 `2**32 - 1`，表示使用默认值 `DEFAULT_BORROW_FACTOR`
- TWAP 窗口期参数同理

```solidity
uint32 internal constant DEFAULT_BORROW_FACTOR = uint32(0.28 * 4_000_000_000);
uint24 internal constant DEFAULT_TWAP_WINDOW_SECONDS = 30 * 60;

function resolveAssetConfig(address underlying) internal view returns (AssetConfig memory) {
    AssetConfig memory config = underlyingLookup[underlying];
    // If address is zero, means config haven't initialized yet
    require(config.eTokenAddress != address(0), "e/market-not-activated");

    if (config.borrowFactor == type(uint32).max) config.borrowFactor = DEFAULT_BORROW_FACTOR;
    if (config.twapWindow == type(uint24).max) config.twapWindow = DEFAULT_TWAP_WINDOW_SECONDS;

    return config;
}
```

## AssetCache

### struct assetCache

池内资产信息

```ts
// AssetCache

struct AssetCache {
    address underlying;

    uint112 totalBalances;
    uint144 totalBorrows;

    uint96 reserveBalance;

    uint interestAccumulator;

    uint40 lastInterestAccumulatorUpdate;
    uint8 underlyingDecimals;
    uint32 interestRateModel;
    int96 interestRate;
    uint32 reserveFee;
    uint16 pricingType;
    uint32 pricingParameters;

    uint poolSize; // result of calling balanceOf on underlying (in external units)

    uint underlyingDecimalsScaler;
    uint maxExternalAmount;
}

```

### initAssetCache

初始化一个资产信息缓存容器

1. 将storage存储的相关变量缓存到memory中
2. 将余额精度统一为 1e18
3. 更新累积利息
    - `deltaT = block.timestamp - lastInterestAccumulatorUpdate`
    - `newInterestAccumulator = (1 + interestRate)^deltaT * oldInterestAccumulator`
    - `newTotalBorrows = oldTotalBorrows * (newInterestAccumulator / oldInterestAccumulator)`
    - `reserveBalance += (newTotalBorrows - oldTotalBorrows) * feeRate`
4. 将新的值写入stroge，检查overflow

```ts
function initAssetCache(address underlying, AssetStorage storage assetStorage, AssetCache memory assetCache) internal view returns (bool dirty) {
    dirty = false;

    assetCache.underlying = underlying;

    // Storage loads

    assetCache.lastInterestAccumulatorUpdate = assetStorage.lastInterestAccumulatorUpdate;
    uint8 underlyingDecimals = assetCache.underlyingDecimals = assetStorage.underlyingDecimals;
    assetCache.interestRateModel = assetStorage.interestRateModel;
    assetCache.interestRate = assetStorage.interestRate;
    assetCache.reserveFee = assetStorage.reserveFee;
    assetCache.pricingType = assetStorage.pricingType;
    assetCache.pricingParameters = assetStorage.pricingParameters;

    assetCache.reserveBalance = assetStorage.reserveBalance;

    assetCache.totalBalances = assetStorage.totalBalances;
    assetCache.totalBorrows = assetStorage.totalBorrows;

    assetCache.interestAccumulator = assetStorage.interestAccumulator;

    // Derived state

    unchecked {
        assetCache.underlyingDecimalsScaler = 10**(18 - underlyingDecimals);
        assetCache.maxExternalAmount = MAX_SANE_AMOUNT / assetCache.underlyingDecimalsScaler;
    }

    uint poolSize = callBalanceOf(assetCache, address(this));
    if (poolSize <= assetCache.maxExternalAmount) {
        unchecked { assetCache.poolSize = poolSize * assetCache.underlyingDecimalsScaler; }
    } else {
        assetCache.poolSize = 0;
    }

    // Update interest accumulator and reserves

    if (block.timestamp != assetCache.lastInterestAccumulatorUpdate) {
        dirty = true;

        uint deltaT = block.timestamp - assetCache.lastInterestAccumulatorUpdate;

        // Compute new values

        uint newInterestAccumulator = (RPow.rpow(uint(int(assetCache.interestRate) + 1e27), deltaT, 1e27) * assetCache.interestAccumulator) / 1e27;

        uint newTotalBorrows = assetCache.totalBorrows * newInterestAccumulator / assetCache.interestAccumulator;

        uint newReserveBalance = assetCache.reserveBalance;
        uint newTotalBalances = assetCache.totalBalances;

        uint feeAmount = (newTotalBorrows - assetCache.totalBorrows)
                            * (assetCache.reserveFee == type(uint32).max ? DEFAULT_RESERVE_FEE : assetCache.reserveFee)
                            / (RESERVE_FEE_SCALE * INTERNAL_DEBT_PRECISION);

        if (feeAmount != 0) {
            uint poolAssets = assetCache.poolSize + (newTotalBorrows / INTERNAL_DEBT_PRECISION);
            newTotalBalances = poolAssets * newTotalBalances / (poolAssets - feeAmount);
            newReserveBalance += newTotalBalances - assetCache.totalBalances;
        }

        // Store new values in assetCache, only if no overflows will occur

        if (newTotalBalances <= MAX_SANE_AMOUNT && newTotalBorrows <= MAX_SANE_DEBT_AMOUNT) {
            assetCache.totalBorrows = encodeDebtAmount(newTotalBorrows);
            assetCache.interestAccumulator = newInterestAccumulator;
            assetCache.lastInterestAccumulatorUpdate = uint40(block.timestamp);

            if (newTotalBalances != assetCache.totalBalances) {
                assetCache.reserveBalance = encodeSmallAmount(newReserveBalance);
                assetCache.totalBalances = encodeAmount(newTotalBalances);
            }
        }
    }
}
```

## Utils

### updateInterestRate

根据资金利用率 `utilisation` 计算利率，利率有最大值 `MAX_ALLOWED_INTEREST_RATE` 和最小值 `MIN_ALLOWED_INTEREST_RATE`。

利率模型是分段函数 （折线）

```ts
// BaseLogic.sol
function updateInterestRate(AssetStorage storage assetStorage, AssetCache memory assetCache) internal {
    uint32 utilisation;

    {
        uint totalBorrows = assetCache.totalBorrows / INTERNAL_DEBT_PRECISION;
        uint poolAssets = assetCache.poolSize + totalBorrows;
        if (poolAssets == 0) utilisation = 0; // empty pool arbitrarily given utilisation of 0
        else utilisation = uint32(totalBorrows * (uint(type(uint32).max) * 1e18) / poolAssets / 1e18);
    }

    bytes memory result = callInternalModule(assetCache.interestRateModel,
                                                abi.encodeWithSelector(BaseIRM.computeInterestRate.selector, assetCache.underlying, utilisation));

    (int96 newInterestRate) = abi.decode(result, (int96));

    assetStorage.interestRate = assetCache.interestRate = newInterestRate;
}

// BaseIRM.sol
function computeInterestRate(address underlying, uint32 utilisation) external returns (int96) {
    int96 rate = computeInterestRateImpl(underlying, utilisation);

    if (rate > MAX_ALLOWED_INTEREST_RATE) rate = MAX_ALLOWED_INTEREST_RATE;
    else if (rate < MIN_ALLOWED_INTEREST_RATE) rate = MIN_ALLOWED_INTEREST_RATE;

    return rate;
}

// BaseIRMLinearKink

function computeInterestRateImpl(address, uint32 utilisation) internal override view returns (int96) {
    uint ir = baseRate;

    if (utilisation <= kink) {
        ir += utilisation * slope1;
    } else {
        ir += kink * slope1;
        ir += slope2 * (utilisation - kink);
    }

    return int96(int(ir));
}
```

## Balances

### computeExchangeRate

## Borrow

## Reserves

## Token asset transfers

## Liquidity

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

计算用户在时间窗口内的流动性，按照时间加权算法

```math
AVERAGE_LIQUIDITY_PERIOD = prevDuration + currDuration
NewAverageLiquidity = (prevDuration * prevAverageLiquidity + currDuration * currAverageLiquidity) / AVERAGE_LIQUIDITY_PERIOD
```

1. 计算 `currDuration` 最大不超过窗口时间 24 小时
2. `prevDuration = AVERAGE_LIQUIDITY_PERIOD - currDuration`
3. 计算当前的流动性 `currAverageLiquidity` 即抵押资产价值超出负债资产价值的部分，最小为 0
4. 根据时间加权公式计算时间窗口内的平均流动性

```solidity
uint internal constant AVERAGE_LIQUIDITY_PERIOD = 24 * 60 * 60;


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
