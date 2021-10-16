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

稳定债务 token 的主要方法

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

## StableDebtToken

### mint-stable

生成固定利率的 StableDebtToken 转给借贷还款人。

传入的 `rate` 由利率更新模块更新，其值与流动性利用率高度相关 [ReserveInterestRateStrategy.calculateInterestRates](./ReserveInterestRateStrategy.md#calculateInterestRates)

函数中计算了两种固定利率：

- `newStableRate` 池子实时的固定利率
  - 由当前用户借贷后，对用户的利息和债务的加权平均得出
  - `(usersStableRate * currentBalance + amount * rate) / (currentBalance + amount)`
  - 该值会更新在 `_usersStableRate` 这个 mapping 变量中
- `currentAvgStableRate` 池子平均的固定利率，计算逻辑上述一致，但是用的池子的总债务数量计算
  - `(currentAvgStableRate * previousSupply + rate * amount) / (previousSupply + amount)`

```solidity
// 缓存计算结果的结构
struct MintLocalVars {
  uint256 previousSupply; // 之前的总发行量
  uint256 nextSupply; // 即将更新的总发行量
  uint256 amountInRay;  // 新增数量（单位是ray）
  uint256 newStableRate;  // 新的固定利率
  uint256 currentAvgStableRate; // 当前平均的固定利率
}

/**
  * @dev Mints debt token to the `onBehalfOf` address.
  * -  Only callable by the LendingPool
  * - The resulting rate is the weighted average between the rate of the new debt
  * and the rate of the previous debt
  * @param user The address receiving the borrowed underlying, being the delegatee in case
  * of credit delegate, or same as `onBehalfOf` otherwise
  * @param onBehalfOf The address receiving the debt tokens
  * @param amount The amount of debt tokens to mint
  * @param rate The rate of the debt being minted
  **/
function mint(
  address user, // 借贷受益人
  address onBehalfOf, // 借贷还款人
  uint256 amount, // 借贷数量
  uint256 rate  // 借贷利率
) external override onlyLendingPool returns (bool) {
  MintLocalVars memory vars;

  // 如果贷款受益人和还款人不同，需要减去还款人对受益人授权的还款额度
  if (user != onBehalfOf) {
    _decreaseBorrowAllowance(onBehalfOf, user, amount);
  }

  // 获取债务总额（本金+利息），利息总额
  (, uint256 currentBalance, uint256 balanceIncrease) = _calculateBalanceIncrease(onBehalfOf);

  vars.previousSupply = totalSupply(); // 缓存池子债务总额 （本金+利息）
  vars.currentAvgStableRate = _avgStableRate; // 缓存平均固定利率
  vars.nextSupply = _totalSupply = vars.previousSupply.add(amount); // 计算增加后的债务总额

  // 将数量从wad单位转成ray单位
  // 1 wad = 1e18
  // 1 ray = 1e27
  vars.amountInRay = amount.wadToRay();

  // 计算新的固定利率（用户的）
  // 增加后的累计总利息 / 增加后的本金总额
  // (usersStableRate * currentBalance + amount * rate) / (currentBalance + amount)
  // rate 是池子中的固定利率，由利率更新策略合约更新
  // _usersStableRate[onBehalfOf] 是针对用户记录的固定利率，和池子中的固定利率可能不同
  vars.newStableRate = _usersStableRate[onBehalfOf]
    .rayMul(currentBalance.wadToRay())
    .add(vars.amountInRay.rayMul(rate))
    .rayDiv(currentBalance.add(amount).wadToRay());

  // 计算结果是uint256 后面需要转成uint128，所以这里要检查大小
  require(vars.newStableRate <= type(uint128).max, Errors.SDT_STABLE_DEBT_OVERFLOW);
  _usersStableRate[onBehalfOf] = vars.newStableRate;

  // 记录更新时间
  //solium-disable-next-line
  _totalSupplyTimestamp = _timestamps[onBehalfOf] = uint40(block.timestamp);

  // Calculates the updated average stable rate
  // 计算池子新的平均固定利率
  // 增加后的累计总利息 / 增加后的本金总额
  // (currentAvgStableRate * previousSupply + rate * amount) / (previousSupply + amount)
  vars.currentAvgStableRate = _avgStableRate = vars
    .currentAvgStableRate
    .rayMul(vars.previousSupply.wadToRay())
    .add(rate.rayMul(vars.amountInRay))
    .rayDiv(vars.nextSupply.wadToRay());

  _mint(onBehalfOf, amount.add(balanceIncrease), vars.previousSupply);

  emit Transfer(address(0), onBehalfOf, amount);

  emit Mint(
    user,
    onBehalfOf,
    amount,
    currentBalance,
    balanceIncrease,
    vars.newStableRate,
    vars.currentAvgStableRate,
    vars.nextSupply
  );

  return currentBalance == 0;
}
```

相关代码：

- [\_calculateBalanceIncrease](###_calculateBalanceIncrease-stable)

### burn-stable

销毁债务 token，整体的逻辑是 mint 的逆运算。需要注意的是 `当销毁数量 >= 池子总量` 时，池子和用户的债务都清零，平均利率也清零。

```solidity
/**
  * @dev Burns debt of `user`
  * @param user The address of the user getting his debt burned
  * @param amount The amount of debt tokens getting burned
  **/
function burn(address user, uint256 amount) external override onlyLendingPool {
  (, uint256 currentBalance, uint256 balanceIncrease) = _calculateBalanceIncrease(user);

  uint256 previousSupply = totalSupply();
  uint256 newAvgStableRate = 0;
  uint256 nextSupply = 0;
  uint256 userStableRate = _usersStableRate[user];

  // 由于债务总额和用户的债务分别累积，可能存在累积错误
  // 因此当最后一个还款的借款人，实际尝试偿还的债务数量超过债务总量
  // 在这种情况下，我们只需将债务总额和平均利率清零
  if (previousSupply <= amount) {
    _avgStableRate = 0;
    _totalSupply = 0;
  } else {
    nextSupply = _totalSupply = previousSupply.sub(amount);
    // 池子总利息
    uint256 firstTerm = _avgStableRate.rayMul(previousSupply.wadToRay());
    // 利息的减量 （该笔还款抵消的利息）
    uint256 secondTerm = userStableRate.rayMul(amount.wadToRay());

    // 和上述情况类似，当 user rate * user balance > avg rate * total supply
    // 我们直接将债务总额 和 平均利率清零
    if (secondTerm >= firstTerm) {
      newAvgStableRate = _avgStableRate = _totalSupply = 0;
    } else {
      // (池子总利息 - 利息的减量) / 债务总量
      newAvgStableRate = _avgStableRate = firstTerm.sub(secondTerm).rayDiv(nextSupply.wadToRay());
    }
  }

  // 如果还款数量和债务数量相等，用户债务清零
  if (amount == currentBalance) {
    _usersStableRate[user] = 0;
    _timestamps[user] = 0;
  } else {
    // 用户仍有债务，更新还款时间
    //solium-disable-next-line
    _timestamps[user] = uint40(block.timestamp);
  }
  // 更新全局的债务总量时间戳
  //solium-disable-next-line
  _totalSupplyTimestamp = uint40(block.timestamp);

  // 可能存在 债务增量 > 还款数量 的情况
  // 这时反而需要 mint
  if (balanceIncrease > amount) {
    uint256 amountToMint = balanceIncrease.sub(amount);
    _mint(user, amountToMint, previousSupply);
    emit Mint(
      user,
      user,
      amountToMint,
      currentBalance,
      balanceIncrease,
      userStableRate,
      newAvgStableRate,
      nextSupply
    );
  } else {
    // 销毁相应的还款数量
    uint256 amountToBurn = amount.sub(balanceIncrease);
    _burn(user, amountToBurn, previousSupply);
    emit Burn(user, amountToBurn, currentBalance, balanceIncrease, newAvgStableRate, nextSupply);
  }

  emit Transfer(user, address(0), amount);
}
```

相关代码：

- [\_calculateBalanceIncrease](###_calculateBalanceIncrease-stable)

### \_calculateBalanceIncrease-stable

计算用户债务的增长量，返回 债务的本金，债务总额（本金+利息），利息数量

```solidity
/**
  * @dev Calculates the increase in balance since the last user interaction
  * @param user The address of the user for which the interest is being accumulated
  * @return The previous principal balance, the new principal balance and the balance increase
  **/
function _calculateBalanceIncrease(address user)
  internal
  view
  returns (
    uint256,
    uint256,
    uint256
  )
{
  // 获取用户的债务本金数量
  // super.balanceOf 是ERC20类的方法
  uint256 previousPrincipalBalance = super.balanceOf(user);

  // 如果没有债务本金，全部返回0
  if (previousPrincipalBalance == 0) {
    return (0, 0, 0);
  }

  // Calculation of the accrued interest since the last accumulation
  // 计算债务的利息
  // balanceOf() 返回的是包含利息的用户债务总额 (DebtToken 重载后的方法)
  // 利息 = 债务总额 - 本金
  uint256 balanceIncrease = balanceOf(user).sub(previousPrincipalBalance);

  return (
    previousPrincipalBalance,
    previousPrincipalBalance.add(balanceIncrease),
    balanceIncrease
  );
}
```

相关代码：

- [balanceOf](###balanceOf)

### balanceOf-stable

返回用户的债务总数，包含利息。

```solidity
/**
  * @dev Calculates the current user debt balance
  * @return The accumulated debt of the user
  **/
function balanceOf(address account) public view virtual override returns (uint256) {
  // 获取ERC20.balanceOf, 即用户借贷出的本金数量
  uint256 accountBalance = super.balanceOf(account);
  // 获取用户的固定借贷利率
  uint256 stableRate = _usersStableRate[account];
  // 如果没有本金返回0
  if (accountBalance == 0) {
    return 0;
  }
  // 每单位本金应还款数量 （本金+利息）
  // cumulatedInterest = (1+rate)^time
  uint256 cumulatedInterest =
    MathUtils.calculateCompoundedInterest(stableRate, _timestamps[account]);
  // 利息总额
  // 本金 * 每单位本金应还款数量 = 债务总额
  return accountBalance.rayMul(cumulatedInterest);
}
```

## VariableDebtToken

### mint-variable

生成浮动利率的 VariableDebtToken 转给借贷还款人。

```solidity
/**
  * @dev Mints debt token to the `onBehalfOf` address
  * -  Only callable by the LendingPool
  * @param user The address receiving the borrowed underlying, being the delegatee in case
  * of credit delegate, or same as `onBehalfOf` otherwise
  * @param onBehalfOf The address receiving the debt tokens
  * @param amount The amount of debt being minted
  * @param index The variable debt index of the reserve
  * @return `true` if the the previous balance of the user is 0
  **/
function mint(
  address user,
  address onBehalfOf,
  uint256 amount,
  uint256 index // variableBorrowIndex
) external override onlyLendingPool returns (bool) {
  if (user != onBehalfOf) {
    _decreaseBorrowAllowance(onBehalfOf, user, amount);
  }

  uint256 previousBalance = super.balanceOf(onBehalfOf);  // 还款人的浮动债务总额
  uint256 amountScaled = amount.rayDiv(index);  // 该笔贷款的本金数量
  require(amountScaled != 0, Errors.CT_INVALID_MINT_AMOUNT); // 本金不能为0

  _mint(onBehalfOf, amountScaled);

  emit Transfer(address(0), onBehalfOf, amount);
  emit Mint(user, onBehalfOf, amount, index);

  return previousBalance == 0;  // 是否为还款人第一笔贷款
}
```
