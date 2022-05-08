# Euler EToken

## mint&burn

### mint

```solidity
/// @notice Mint eTokens and a corresponding amount of dTokens ("self-borrow")
/// @param subAccountId 0 for primary, 1-255 for a sub-account
/// @param amount In underlying units
function mint(uint subAccountId, uint amount) external nonReentrant {
    (address underlying, AssetStorage storage assetStorage, address proxyAddr, address msgSender) = CALLER();
    address account = getSubAccount(msgSender, subAccountId);

    updateAverageLiquidity(account);
    emit RequestMint(account, amount);

    AssetCache memory assetCache = loadAssetCache(underlying, assetStorage);

    amount = decodeExternalAmount(assetCache, amount);
    uint amountInternal = underlyingAmountToBalanceRoundUp(assetCache, amount);
    amount = balanceToUnderlyingAmount(assetCache, amountInternal);

    // Mint ETokens

    increaseBalance(assetStorage, assetCache, proxyAddr, account, amountInternal);

    // Mint DTokens

    increaseBorrow(assetStorage, assetCache, assetStorage.dTokenAddress, account, amount);

    checkLiquidity(account);
    logAssetStatus(assetCache);
}
```
