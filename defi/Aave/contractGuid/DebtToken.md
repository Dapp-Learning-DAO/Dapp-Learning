# DebtToken

当用户从协议中贷出资产，获得 1:1 数量的 debt tokens。债务代币的大部分 ERC20 方法都被禁用，因为债务是不可转让。有两种类型债务币：

- `Stable debt tokens` 稳定利率债务币
- `Variable debt tokens` 浮动利率债务币

## EIP20 Methods

虽然 debt tokens 大部分遵循 ERC20 标准，但由于债务的特殊性，没有实现 `transfer()` 和 `allowance()` 。

> `balanceOf()` 返回用户的债务数量，包含累计的利息

> `totalSupply()` 返回协议上所有用户在该资产上的总债务，包含累计利息。

## Shared Methods

### UNDERLYING_ASSET_ADDRESS

返回借出时的数量，不含利息。

```solidity
/**
  * @dev Returns the address of the underlying asset of this aToken (E.g. WETH for aWETH)
  **/
function UNDERLYING_ASSET_ADDRESS() public view returns (address) {
  return _underlyingAsset;
}
```

### POOL

返回 LendingPool 的地址

```solidity
/**
  * @dev Returns the address of the lending pool where this aToken is used
  **/
function POOL() public view returns (ILendingPool) {
  return _pool;
}
```

### approveDelegation

授权给目标地址可代还债务的数量。

```solidity
/**
  * @dev delegates borrowing power to a user on the specific debt token
  * @param delegatee the address receiving the delegated borrowing power
  * @param amount the maximum amount being delegated. Delegation will still
  * respect the liquidation constraints (even if delegated, a delegatee cannot
  * force a delegator HF to go below 1)
  **/
function approveDelegation(address delegatee, uint256 amount) external override {
  _borrowAllowances[_msgSender()][delegatee] = amount;
  emit BorrowAllowanceDelegated(_msgSender(), delegatee, _getUnderlyingAssetAddress(), amount);
}
```

### borrowAllowance

查询目标地址可代还债务的数量

```solidity
/**
  * @dev returns the borrow allowance of the user
  * @param fromUser The user to giving allowance
  * @param toUser The user to give allowance to
  * @return the current allowance of toUser
  **/
function borrowAllowance(address fromUser, address toUser)
  external
  view
  override
  returns (uint256)
{
  return _borrowAllowances[fromUser][toUser];
}
```

## Stable Debt Methods

稳定债务token的主要方法

### getSupplyData

返回债务总数量（不包含利息），债务总数量（包含利息），平均利率，数据更新时间

```solidity
/**
  * @dev Returns the principal and total supply, the average borrow rate and the last supply update timestamp
  **/
function getSupplyData()
  public
  view
  override
  returns (
    uint256,
    uint256,
    uint256,
    uint40
  )
{
  uint256 avgRate = _avgStableRate;
  return (super.totalSupply(), _calcTotalSupply(avgRate), avgRate, _totalSupplyTimestamp);
}
```

### getTotalSupplyAndAvgRate

返回债务总数量（包含利息）和平均利率

### principalBalanceOf

返回用户的债务数量（不包含利息）

### getAverageStableRate

返回平均利率

### getUserStableRate

返回用户的利率（债务的固定利率）

## Variable Debt Methods

### scaledBalanceOf

返回用户的债务数量（不包含利息）

### scaledTotalSupply

返回总债务数量（不包含利息）

### getScaledUserBalanceAndSupply

返回用户的债务数量（不包含利息）和总债务数量（不包含利息）
