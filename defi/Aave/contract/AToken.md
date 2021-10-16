# AToken

## methods

### mint

```solidity
/**
  * @dev Mints `amount` aTokens to `user`
  * - Only callable by the LendingPool, as extra state updates there need to be managed
  * @param user The address receiving the minted tokens
  * @param amount The amount of tokens getting minted
  * @param index The new liquidity index of the reserve
  * @return `true` if the the previous balance of the user was 0
  */
function mint(
  address user,
  uint256 amount,
  uint256 index
) external override onlyLendingPool returns (bool) {
  uint256 previousBalance = super.balanceOf(user);

  uint256 amountScaled = amount.rayDiv(index);
  require(amountScaled != 0, Errors.CT_INVALID_MINT_AMOUNT);
  _mint(user, amountScaled);

  emit Transfer(address(0), user, amount);
  emit Mint(user, amount, index);

  return previousBalance == 0;
}
```
