# Euler Markets

## active markets

### doActivateMarket

用户激活资产进入 Markets，之后可以对该资产进行抵押和借贷操作

1. 激活的资产不包括 PToken
2. 激活列表用户之间相互独立
3. token地址不能为modules地址以及本Market合约地址
4. token精度不能超过18
5. 初始化资产相关配置 `assetStorage`

```solidity
/// @notice Create an Euler pool and associated EToken and DToken addresses.
/// @param underlying The address of an ERC20-compliant token. There must be an initialised uniswap3 pool for the underlying/reference asset pair.
/// @return The created EToken, or the existing EToken if already activated.
function activateMarket(address underlying) external nonReentrant returns (address) {
    require(pTokenLookup[underlying] == address(0), "e/markets/invalid-token");
    return doActivateMarket(underlying);
}

function doActivateMarket(address underlying) private returns (address) {
    // Pre-existing

    if (underlyingLookup[underlying].eTokenAddress != address(0)) return underlyingLookup[underlying].eTokenAddress;


    // Validation

    require(trustedSenders[underlying].moduleId == 0 && underlying != address(this), "e/markets/invalid-token");

    uint8 decimals = IERC20(underlying).decimals();
    require(decimals <= 18, "e/too-many-decimals");


    // Get risk manager parameters

    IRiskManager.NewMarketParameters memory params;

    {
        bytes memory result = callInternalModule(MODULEID__RISK_MANAGER,
                                                    abi.encodeWithSelector(IRiskManager.getNewMarketParameters.selector, underlying));
        (params) = abi.decode(result, (IRiskManager.NewMarketParameters));
    }


    // Create proxies

    address childEToken = params.config.eTokenAddress = _createProxy(MODULEID__ETOKEN);
    address childDToken = _createProxy(MODULEID__DTOKEN);


    // Setup storage

    underlyingLookup[underlying] = params.config;

    dTokenLookup[childDToken] = childEToken;

    AssetStorage storage assetStorage = eTokenLookup[childEToken];

    assetStorage.underlying = underlying;
    assetStorage.pricingType = params.pricingType;
    assetStorage.pricingParameters = params.pricingParameters;

    assetStorage.dTokenAddress = childDToken;

    assetStorage.lastInterestAccumulatorUpdate = uint40(block.timestamp);
    assetStorage.underlyingDecimals = decimals;
    assetStorage.interestRateModel = uint32(MODULEID__IRM_DEFAULT);
    assetStorage.reserveFee = type(uint32).max; // default

    assetStorage.interestAccumulator = INITIAL_INTEREST_ACCUMULATOR;


    emit MarketActivated(underlying, childEToken, childDToken);

    return childEToken;
}
```

- [getNewMarketParameters](./RiskManager.md#getNewMarketParameters)