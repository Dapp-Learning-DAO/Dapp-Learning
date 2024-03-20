# DebtToken

当用户从协议中贷出资产，获得 1:1 数量的 debt tokens。债务代币的大部分 ERC20 方法都被禁用，因为债务是不可转让。有两种类型债务币：

- `Stable debt tokens` 稳定利率债务币
- `Variable debt tokens` 浮动利率债务币

## EIP20 Methods

虽然 debt tokens 大部分遵循 ERC20 标准，但由于债务的特殊性，没有实现 `transfer()` 和 `allowance()`（这两个方法会直接revert，不会执行） 。

> `balanceOf()` 返回用户的债务数量，包含累计的利息

> `totalSupply()` 返回协议上所有用户在该资产上的总债务，包含累计利息。

## Shared Methods

### UNDERLYING_ASSET_ADDRESS

返回 aToken 对应的抵押资产地址，例如存入 WETH, 那么生成的 aWETH 对应的资产为 WETH

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

`msg.sender` 授权给目标地址 `delegatee` 债务额度，承诺可代 `delegatee` 偿还一定数量的债务。

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

查询目标地址 `fromUser` 提供给 `toUser` 可代还债务的数量

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

返回债务本金（不包含利息），债务本息（包含利息），平均利率，数据更新时间.  
需要注意的是, 这里所说的 `平均利率 = 池子中贷款总利息 / 池子中的贷款总金额`. 举例来说就是池子中总共有 100$, 用户 A 借了 40$ 利率是 20%, 用户 B 借了 60$ 利率是 30%, 那么 `平均利率 = (40 * 20% + 60 * 30%) / 100 = 26%`  

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

返回平均稳定利率

### getUserStableRate

返回用户的稳定利率（债务的固定利率）

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

传入的 `rate` 由利率更新模块更新，其值与流动性利用率高度相关 [ReserveInterestRateStrategy.calculateInterestRates](./7-DefaultReserveInterestRateStrategy.md#calculateInterestRates)

函数中计算了两种固定利率：

- `newStableRate` 用户的平均利率（包含当前贷款）
  - 由当前用户借贷后，对用户的利息和债务的加权平均得出
  - `(usersStableRate * currentBalance + amount * rate) / (currentBalance + amount)`
  - 该值会更新在 `_usersStableRate` 这个 mapping 变量中，即每个借贷用户都会单独记录一个该值
  - 用户的平均利率会用来计算用户当前的债务本息总额，例如 `StableDebtToken.balanceOf()` 会使用该公式来计算
- `currentAvgStableRate` 池子平均的固定利率，计算逻辑上述一致，但是用的池子的总债务数量计算
  - `(currentAvgStableRate * previousSupply + rate * amount) / (previousSupply + amount)`
- 上述三个公式在V2白皮书 3.4 Stable Debt

```solidity
// 缓存计算结果的结构
struct MintLocalVars {
  uint256 previousSupply; // 之前的总发行量
  uint256 nextSupply; // 即将更新的总发行量
  uint256 amountInRay;  // 新增数量（单位是ray）
  uint256 newStableRate;  // 平均固定利率（用户）
  uint256 currentAvgStableRate; // 平均固定利率（池子）
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
  uint256 rate  // 当前新贷款使用的借贷利率（由利率更新策略模块更新）
) external override onlyLendingPool returns (bool) {
  MintLocalVars memory vars;

  // 如果贷款受益人和还款人不同，需要减去还款人对受益人授权的还款额度
  if (user != onBehalfOf) {
    _decreaseBorrowAllowance(onBehalfOf, user, amount);
  }

  // 获取债务本息总额（本金+利息），缩放数量的增量
  (, uint256 currentBalance, uint256 balanceIncrease) = _calculateBalanceIncrease(onBehalfOf);

  vars.previousSupply = totalSupply(); // 缓存池子债务总额 （本金+利息）
  vars.currentAvgStableRate = _avgStableRate; // 缓存平均固定利率
  vars.nextSupply = _totalSupply = vars.previousSupply.add(amount); // 计算增加后的债务总额

  // 将数量从wad单位转成ray单位
  // 1 wad = 1e18
  // 1 ray = 1e27
  vars.amountInRay = amount.wadToRay();

  // 计算固定利率（用户的）
  // 增加后的累计总利息 / 增加后的本金总额
  // (usersStableRate * currentBalance + amount * rate) / (currentBalance + amount)
  // rate 这笔新贷款使用的利率，由利率更新策略合约更新
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

  // 返回该笔贷款是否是用户的第一笔
  return currentBalance == 0;
}
```

相关代码：

- [\_calculateBalanceIncrease](#_calculateBalanceIncrease-stable)

### burn-stable

销毁债务 token，整体的逻辑是 mint 的逆运算。需要注意的是当 `销毁数量 >= 池子总量` 时，池子和用户的债务都清零，平均利率也清零。

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

- [\_calculateBalanceIncrease](#_calculateBalanceIncrease-stable)

### \_calculateBalanceIncrease-stable

计算用户债务的增长量，返回 缩放数量(债务的在t_0时刻的数量)，债务本息总额，债务增量(前两者的差)

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
  // 获取用户的债务缩放数量
  // super.balanceOf 是ERC20类的方法
  uint256 previousPrincipalBalance = super.balanceOf(user);

  // 如果没有债务本金，全部返回0
  if (previousPrincipalBalance == 0) {
    return (0, 0, 0);
  }

  // Calculation of the accrued interest since the last accumulation
  // 计算债务自上次累计后的增量
  // balanceOf() 返回的是用户债务本息总额 (DebtToken 重载后的方法)
  // 债务增量 = 债务总额 - 缩放数量
  uint256 balanceIncrease = balanceOf(user).sub(previousPrincipalBalance);

  return (
    previousPrincipalBalance,
    previousPrincipalBalance.add(balanceIncrease),
    balanceIncrease
  );
}
```

相关代码：

- [balanceOf](#balanceOf)

### _mint-stable

内部mint方法，若有激励控制合约，则会按持仓额外奖励

```solidity
/**
  * @dev Mints stable debt tokens to an user
  * @param account The account receiving the debt tokens
  * @param amount The amount being minted
  * @param oldTotalSupply the total supply before the minting event
  **/
function _mint(
  address account,
  uint256 amount,
  uint256 oldTotalSupply
) internal {
  uint256 oldAccountBalance = _balances[account];
  _balances[account] = oldAccountBalance.add(amount);

  if (address(_incentivesController) != address(0)) {
    _incentivesController.handleAction(account, oldTotalSupply, oldAccountBalance);
  }
}
```

### _burn-table

### balanceOf-stable

返回用户的债务总数，包含利息。根据记录的用户平均固定利率和时间来线性的累计利息。

```solidity
/**
  * @dev Calculates the current user debt balance
  * @return The accumulated debt of the user
  **/
function balanceOf(address account) public view virtual override returns (uint256) {
  // 获取ERC20.balanceOf, 即用户之前借贷总量（缩放数值）
  uint256 accountBalance = super.balanceOf(account);
  // 获取用户的平均固定利率
  uint256 stableRate = _usersStableRate[account];
  // 如果没有借贷返回0
  if (accountBalance == 0) {
    return 0;
  }
  // 每单位debtToken应还款数量 （本息总额）
  // cumulatedInterest = (1+rate)^time
  uint256 cumulatedInterest =
    MathUtils.calculateCompoundedInterest(stableRate, _timestamps[account]);
  // 缩放后数量 * 每单位应还款数量 = 债务总额
  return accountBalance.rayMul(cumulatedInterest);
}
```

## VariableDebtToken

### mint-variable

生成浮动利率的 VariableDebtToken 转给借贷还款人。实际mint数量是 amountScaled。

```solidity
/**
  * @dev Mints debt token to the `onBehalfOf` address
  * -  Only callable by the LendingPool
  * @param user The address receiving the borrowed underlying, being the delegatee in case
  * of credit delegate, or same as `onBehalfOf` otherwise
  * @param onBehalfOf The address receiving the debt tokens
  * @param amount The amount of debt being minted
  * @param index The variable debt index of the reserve
  * @return `true` if the  previous balance of the user is 0
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
  uint256 amountScaled = amount.rayDiv(index);  // 该笔贷款的缩放到t_0时刻的数量
  require(amountScaled != 0, Errors.CT_INVALID_MINT_AMOUNT);

  _mint(onBehalfOf, amountScaled);

  emit Transfer(address(0), onBehalfOf, amount);  // 发送事件仍用缩放前的数量
  emit Mint(user, onBehalfOf, amount, index);

  return previousBalance == 0;  // 是否为还款人第一笔贷款
}
```

### burn-variable

销毁amount数量的VariableDebtToken，实际burn掉amountScaled。只能被 LendingPool 调用。

```solidity
/**
  * @dev Burns user variable debt
  * - Only callable by the LendingPool
  * @param user The user whose debt is getting burned
  * @param amount The amount getting burned
  * @param index The variable debt index of the reserve
  **/
function burn(
  address user,
  uint256 amount,
  uint256 index // reserve.variableBorrowIndex
) external override onlyLendingPool {
  uint256 amountScaled = amount.rayDiv(index);  // 对数量缩放到t_0时刻
  require(amountScaled != 0, Errors.CT_INVALID_BURN_AMOUNT);

  _burn(user, amountScaled);  // 销毁 amountScaled 数量

  emit Transfer(user, address(0), amount);  // 广播 amount 数量
  emit Burn(user, amount, index);
}
```

### balanceOf-variable

返回用户当前的浮动类型债务数量。由于浮动利率会经常变化，所以需要利用全局记录的 `variableBorrowIndex` 来对缩放后的token数量还原。

> variable 类型的债务利率不断随着池子的利用率产生变化，所以每个池子会全局记录一个 `variableBorrowIndex` 来实时更新债务和缩放数量的比例；而 stable 类型的债务，对于用户来说，每一笔的债务利率都是固定在初始借贷时刻的，所以只需要以固定利率和时间来线性的计算债务数量；由于用户可能借出多笔不同固定利率的债务，实际计算需要使用加权平均后的固定利率，具体公式在V2白皮书 3.4 Stable Debt

```solidity
/**
  * @dev Calculates the accumulated debt balance of the user
  * @return The debt balance of the user
  **/
function balanceOf(address user) public view virtual override returns (uint256) {
  uint256 scaledBalance = super.balanceOf(user);

  if (scaledBalance == 0) {
    return 0;
  }

  // 内部调用了 ReserveLogic 的 getNormalizedDebt 方法
  // 返回最新的 variableBorrowIndex
  // scaledBalance * variableBorrowIndex
  return scaledBalance.rayMul(_pool.getReserveNormalizedVariableDebt(_underlyingAsset));
}
```

相关代码

- [getNormalizedDebt](./ReserveLogic.md#getNormalizedDebt)
