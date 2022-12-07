# LendingPool

Aave 协议最主要的入口合约，大部分情况下，用户与此合约交互。

> deposit, borrow, withdraw 和 repay 方法仅针对 ERC20 类型代币，如果要操作 ETH（原生代币），需要使用 `WETHGateway`

## methods

主要的交互接口。

### deposit

存入资产，将**相同数量**的 aToken 转给调用者（`onBehalfOf`，一般是 `msg.sender`）。

**注意：**

1. 存入资产之前需要确保其有足够数量的 `allowance()` ，若不足需要先调用它的 `approve()` 授权给 `LendingPool`
2. `onBehalfOf` 如果该存入资产是第一次被存入（之前没有人存入过相同的资产），则将用户（onBehalfOf）的配置中该资产自动转换为抵押类型
3. 转给用户的 aToken 查询余额与 amount 相等，但实际上 mint 的数量要进行缩放，详见 [aToken.mint](./3-aToken.md#mint)

| Parameter Name | Type    | Description                                                |
| -------------- | ------- | ---------------------------------------------------------- |
| asset          | address | 抵押资产的 token 地址                                      |
| amount         | uint256 | 抵押资产的数量                                             |
| onBehalfOf     | address | aToken 转账的目标地址，即债权人，默认填写 `msg.sender`     |
| referralCode   | uint16  | 推介码，用于广播的自定义事件代码，当用户直接调用时推荐写 0 |

```solidity
/**
  * @dev Deposits an `amount` of underlying asset into the reserve, receiving in return overlying aTokens.
  * - E.g. User deposits 100 USDC and gets in return 100 aUSDC
  * @param asset The address of the underlying asset to deposit
  * @param amount The amount to be deposited
  * @param onBehalfOf The address that will receive the aTokens, same as msg.sender if the user
  *   wants to receive them on his own wallet, or a different address if the beneficiary of aTokens
  *   is a different wallet
  * @param referralCode Code used to register the integrator originating the operation, for potential rewards.
  *   0 if the action is executed directly by the user, without any middle-man
  **/
function deposit(
  address asset,
  uint256 amount,
  address onBehalfOf,
  uint16 referralCode
) external override whenNotPaused {
  // 根据抵押资产的地址获取资产的相关数据
  DataTypes.ReserveData storage reserve = _reserves[asset];

  // 验证抵押数量是否符合要求：
  // 抵押数量不能为0，资产必须是激活状态，且没有处于冻结状态
  ValidationLogic.validateDeposit(reserve, amount);

  // 获取抵押资产对应的 aToken 地址
  address aToken = reserve.aTokenAddress;

  // 更新资产的状态变量
  reserve.updateState();
  // 更新资产的利率模型变量
  reserve.updateInterestRates(asset, aToken, amount, 0);

  // 把你的资产传给协议
  IERC20(asset).safeTransferFrom(msg.sender, aToken, amount);

  // 将 aToken mint给 onBehalfOf 地址（一般是 msg.sender）
  // isFirstDeposit 代表该资产是否是用户第一次存入或之前抵押余额为0
  bool isFirstDeposit = IAToken(aToken).mint(onBehalfOf, amount, reserve.liquidityIndex);

  // 若第一次被存入，默认将用户 onBehalfOf 的配置中相应资产转为可抵押类型
  if (isFirstDeposit) {
    _usersConfig[onBehalfOf].setUsingAsCollateral(reserve.id, true);
    emit ReserveUsedAsCollateralEnabled(asset, onBehalfOf);
  }

  // 广播事件
  emit Deposit(asset, msg.sender, onBehalfOf, amount, referralCode);
}
```

相关代码

- [DataTypes](#DataTypes)
- [reserve.updateState()](./6-ReserveLogic.md#updateState)
- [reserve.updateInterestRates()](./6-ReserveLogic.md#updateInterestRates)
- [AToken.mint()](./3-AToken.md#mint)
- [Configuration.setUsingAsCollateral()](./2-Configuration.md#setUsingAsCollateral)

### withdraw

赎回 `amount` 数量抵押资产，销毁相应数量的 `aToken`。例如赎回抵押的 100 USDC 资产，则会销毁 100 aUSDC。

| Parameter Name | Type    | Description                                            |
| -------------- | ------- | ------------------------------------------------------ |
| asset          | address | 抵押资产的 token 地址                                  |
| amount         | uint256 | 赎回的数量，如果使用 `type(uint).max` 则会赎回最大数量 |
| to             | address | 赎回资产的转账的目标地址                               |

```solidity
/**
  * @dev Withdraws an `amount` of underlying asset from the reserve, burning the equivalent aTokens owned
  * E.g. User has 100 aUSDC, calls withdraw() and receives 100 USDC, burning the 100 aUSDC
  * @param asset The address of the underlying asset to withdraw
  * @param amount The underlying amount to be withdrawn
  *   - Send the value type(uint256).max in order to withdraw the whole aToken balance
  * @param to Address that will receive the underlying, same as msg.sender if the user
  *   wants to receive it on his own wallet, or a different address if the beneficiary is a
  *   different wallet
  * @return The final amount withdrawn
  **/
function withdraw(
  address asset,
  uint256 amount,
  address to
) external override whenNotPaused returns (uint256) {
  DataTypes.ReserveData storage reserve = _reserves[asset]; // 获取reserve数据

  address aToken = reserve.aTokenAddress; // 获取aToken地址

  uint256 userBalance = IAToken(aToken).balanceOf(msg.sender); // 查询aToken数量，本息总额

  uint256 amountToWithdraw = amount;

  // 如果是 uin256 最大值，赎回用户所有余额
  if (amount == type(uint256).max) {
    amountToWithdraw = userBalance;
  }

  // 验证参数合法性
  ValidationLogic.validateWithdraw(
    asset,
    amountToWithdraw,
    userBalance,
    _reserves,
    _usersConfig[msg.sender],
    _reservesList,
    _reservesCount,
    _addressesProvider.getPriceOracle()
  );

  // 更新资产的状态变量
  reserve.updateState();

  // 更新资产的利率模型变量
  reserve.updateInterestRates(asset, aToken, 0, amountToWithdraw);

  // 如果用户赎回了全部余额，则设置用户的该资产不再是抵押品
  if (amountToWithdraw == userBalance) {
    _usersConfig[msg.sender].setUsingAsCollateral(reserve.id, false);
    emit ReserveUsedAsCollateralDisabled(asset, msg.sender);
  }

  // aToken.burn()
  IAToken(aToken).burn(msg.sender, to, amountToWithdraw, reserve.liquidityIndex);

  emit Withdraw(asset, msg.sender, to, amountToWithdraw);

  return amountToWithdraw;
}
```

相关代码

- [DataTypes](#DataTypes)
- [reserve.updateState()](./6-ReserveLogic.md#updateState)
- [reserve.updateInterestRates()](./6-ReserveLogic.md#updateInterestRates)
- [AToken.burn()](./3-AToken.md#burn)

### borrow

选择浮动利率或者固定利率，调用方法后借贷资产转给调用者(`msg.sender`)，债务由 `onBehalfOf` 承担，一般也是 `msg.sender` 。调用者即借款人必须有足够的抵押资产，或被授予了足够的信用额度。信用额度即为 AToken 拥有者对其他用户授予的 allowance 数量。

parameters:

| Parameter Name   | Type    | Description                                             |
| ---------------- | ------- | ------------------------------------------------------- |
| asset            | address | 借贷资产的 token 地址                                   |
| amount           | uint256 | 借贷资产的数量                                          |
| interestRateMode | uint256 | 借贷利率类型，固定 1，浮动 2                            |
| onBehalfOf       | address | debtToken 转账地址，即债务偿还人，默认填写 `msg.sender` |
| referralCode     | uint16  | 用于广播的自定义事件代码，当用户直接调用时推荐写 0      |

债务偿还人和债务受益人可以不同，比如抵押资产在冷钱包中，将信用额度转让给热钱包，便于操作。

```solidity
/**
  * @dev Allows users to borrow a specific `amount` of the reserve underlying asset, provided that the borrower
  * already deposited enough collateral, or he was given enough allowance by a credit delegator on the
  * corresponding debt token (StableDebtToken or VariableDebtToken)
  * - E.g. User borrows 100 USDC passing as `onBehalfOf` his own address, receiving the 100 USDC in his wallet
  *   and 100 stable/variable debt tokens, depending on the `interestRateMode`
  * @param asset The address of the underlying asset to borrow
  * @param amount The amount to be borrowed
  * @param interestRateMode The interest rate mode at which the user wants to borrow: 1 for Stable, 2 for Variable
  * @param referralCode Code used to register the integrator originating the operation, for potential rewards.
  *   0 if the action is executed directly by the user, without any middle-man
  * @param onBehalfOf Address of the user who will receive the debt. Should be the address of the borrower itself
  * calling the function if he wants to borrow against his own collateral, or the address of the credit delegator
  * if he has been given credit delegation allowance
  **/
function borrow(
  address asset,  // 借贷资产地址
  uint256 amount, // 借贷数量
  uint256 interestRateMode, // 利率模式 1 固定 2 浮动
  uint16 referralCode,  // 推介码，一般为0
  address onBehalfOf  // 债务承担者地址
) external override whenNotPaused {
  // 从storage中读取借贷资产信息
  DataTypes.ReserveData storage reserve = _reserves[asset];

  // 调用借贷内部方法
  _executeBorrow(
    ExecuteBorrowParams(
      asset,
      msg.sender,
      onBehalfOf,
      amount,
      interestRateMode,
      reserve.aTokenAddress,
      referralCode,
      true
    )
  );
}
```

内部借贷方法的入参结构体

```solidity
struct ExecuteBorrowParams {
  address asset;  // 借贷资产地址
  address user;   // 借贷受益人
  address onBehalfOf; // 还款人
  uint256 amount; // 借贷数量
  uint256 interestRateMode; // 借贷类型 固定 1 浮动 2
  address aTokenAddress;  // aToken的地址
  uint16 referralCode;  // 推介码
  bool releaseUnderlying; // 是否释放借贷资产给受益人，一般为true
}
```

具体执行借贷的内部方法

```solidity
function _executeBorrow(ExecuteBorrowParams memory vars) internal {
  // 从storage中读取借贷资产信息
  DataTypes.ReserveData storage reserve = _reserves[vars.asset];
  // 从storage中读取用户设置信息
  DataTypes.UserConfigurationMap storage userConfig = _usersConfig[vars.onBehalfOf];

  // 获取预言机价格提供合约的地址
  address oracle = _addressesProvider.getPriceOracle();

  // 将借贷资产数量换算成等价的ETH数量
  uint256 amountInETH =
    IPriceOracleGetter(oracle).getAssetPrice(vars.asset).mul(vars.amount).div(
      10**reserve.configuration.getDecimals()
    );

  // 检验入参是否合法
  ValidationLogic.validateBorrow(
    vars.asset,
    reserve,
    vars.onBehalfOf,
    vars.amount,
    amountInETH,
    vars.interestRateMode,
    _maxStableRateBorrowSizePercent,
    _reserves,
    userConfig,
    _reservesList,
    _reservesCount,
    oracle
  );

  // 更新资产状态
  reserve.updateState();

  // 初始化固定利率
  uint256 currentStableRate = 0;

  // 代表是否是该用户在此资产上的第一笔借贷
  bool isFirstBorrowing = false;
  // 使用固定利率的借贷
  if (DataTypes.InterestRateMode(vars.interestRateMode) == DataTypes.InterestRateMode.STABLE) {
    // 读取当前的固定利率
    currentStableRate = reserve.currentStableBorrowRate;

    // 调用固定利率债务token的mint方法
    //  1. 将debtToken转给 msg.sender
    //  2. 返回该笔借贷前，用户借贷额是否为0，即判断该笔借贷是否为用户的第一笔
    isFirstBorrowing = IStableDebtToken(reserve.stableDebtTokenAddress).mint(
      vars.user,
      vars.onBehalfOf,
      vars.amount,
      currentStableRate
    );
  } else {
    // 使用浮动利率的借贷
    isFirstBorrowing = IVariableDebtToken(reserve.variableDebtTokenAddress).mint(
      vars.user,
      vars.onBehalfOf,
      vars.amount,
      reserve.variableBorrowIndex
    );
  }

  // 如果是该用户的第一笔借贷，自动将该资产设为用户的借贷资产类
  if (isFirstBorrowing) {
    userConfig.setBorrowing(reserve.id, true);
  }

  // 跟新资产的利率（固定 和 浮动）
  // 根据是否释放了借贷资产来判断liquidityTaken的数量
  reserve.updateInterestRates(
    vars.asset,
    vars.aTokenAddress,
    0,  // liquidityAdded
    vars.releaseUnderlying ? vars.amount : 0 // liquidityTaken
  );

  // 如果releaseUnderlying为true 将借贷资产转给借贷受益人
  // 在合约中只在LendingPool.borrow() 方法中找到该入参，其值固定为true
  if (vars.releaseUnderlying) {
    IAToken(vars.aTokenAddress).transferUnderlyingTo(vars.user, vars.amount);
  }

  emit Borrow(
    vars.asset,
    vars.user,
    vars.onBehalfOf,
    vars.amount,
    vars.interestRateMode,
    DataTypes.InterestRateMode(vars.interestRateMode) == DataTypes.InterestRateMode.STABLE
      ? currentStableRate
      : reserve.currentVariableBorrowRate,
    vars.referralCode
  );
}
```

相关代码

- [DataTypes](#DataTypes)
- [reserve.updateState()](./6-ReserveLogic.md#updateState)
- [reserve.updateInterestRates()](./6-ReserveLogic.md#updateInterestRates)
- [StableDebtToken.mint()](./4-DebtToken.md#mint-stable)
- [VariableDebtToken.mint()](./4-DebtToken.md#mint-variable)

### repay

偿还债务，并销毁相应的 debtToken。

parameters:

| Parameter Name | Type    | Description                                  |
| -------------- | ------- | -------------------------------------------- |
| asset          | address | 借贷资产的 token 地址                        |
| amount         | uint256 | 偿还的数量，使用 `uint(-1)` 表示偿还所有债务 |
| rateMode       | uint256 | 偿还借贷的利率类型，固定 1，浮动 2           |
| onBehalfOf     | address | 承担债务的用户地址，默认填写 `msg.sender`    |

```solidity
/**
  * @notice Repays a borrowed `amount` on a specific reserve, burning the equivalent debt tokens owned
  * - E.g. User repays 100 USDC, burning 100 variable/stable debt tokens of the `onBehalfOf` address
  * @param asset The address of the borrowed underlying asset previously borrowed
  * @param amount The amount to repay
  * - Send the value type(uint256).max in order to repay the whole debt for `asset` on the specific `debtMode`
  * @param rateMode The interest rate mode at of the debt the user wants to repay: 1 for Stable, 2 for Variable
  * @param onBehalfOf Address of the user who will get his debt reduced/removed. Should be the address of the
  * user calling the function if he wants to reduce/remove his own debt, or the address of any other
  * other borrower whose debt should be removed
  * @return The final amount repaid
  **/
function repay(
  address asset,
  uint256 amount,
  uint256 rateMode,
  address onBehalfOf
) external override whenNotPaused returns (uint256) {
  DataTypes.ReserveData storage reserve = _reserves[asset];

  // 获取偿还人的债务数量，分别调用 stableDectToken 和 variableDebtToken 的 balanceOf 方法
  (uint256 stableDebt, uint256 variableDebt) = Helpers.getUserCurrentDebt(onBehalfOf, reserve);

  // 获取偿债的类型 固定还是浮动
  DataTypes.InterestRateMode interestRateMode = DataTypes.InterestRateMode(rateMode);

  ValidationLogic.validateRepay(
    reserve,
    amount,
    interestRateMode,
    onBehalfOf,
    stableDebt,
    variableDebt
  );

  // 根据偿债类型赋值待还款数量
  uint256 paybackAmount =
    interestRateMode == DataTypes.InterestRateMode.STABLE ? stableDebt : variableDebt;

  // 偿债数量 < 待还款数量 调整待还款数量
  if (amount < paybackAmount) {
    paybackAmount = amount;
  }

  // 更新资产状态信息 主要更新利率指数相关变量
  reserve.updateState();

  // 根据不同类型还款，调用debtToken.burn()
  // 浮动类型债务需要资产的variableBorrowIndex
  if (interestRateMode == DataTypes.InterestRateMode.STABLE) {
    IStableDebtToken(reserve.stableDebtTokenAddress).burn(onBehalfOf, paybackAmount);
  } else {
    IVariableDebtToken(reserve.variableDebtTokenAddress).burn(
      onBehalfOf,
      paybackAmount,
      reserve.variableBorrowIndex
    );
  }

  address aToken = reserve.aTokenAddress;
  reserve.updateInterestRates(asset, aToken, paybackAmount, 0);

  if (stableDebt.add(variableDebt).sub(paybackAmount) == 0) {
    _usersConfig[onBehalfOf].setBorrowing(reserve.id, false);
  }

  IERC20(asset).safeTransferFrom(msg.sender, aToken, paybackAmount);

  IAToken(aToken).handleRepayment(msg.sender, paybackAmount);

  emit Repay(asset, onBehalfOf, msg.sender, paybackAmount);

  return paybackAmount;
}
```

相关代码

- [DataTypes](#DataTypes)
- [reserve.updateState()](./6-ReserveLogic.md#updateState)
- [reserve.updateInterestRates()](./6-ReserveLogic.md#updateInterestRates)
- [StableDebtToken.burn()](./4-DebtToken.md#burn-stable)
- [VariableDebtToken.burn()](./4-DebtToken.md#burn-variable)

### swapBorrowRateMode

切换用户(`msg.sender`)特定资产的借贷模式，浮动或固定利率。

parameters:

| Parameter Name | Type    | Description                        |
| -------------- | ------- | ---------------------------------- |
| asset          | address | 借贷资产的 token 地址              |
| rateMode       | uint256 | 设置借贷的利率类型，固定 1，浮动 2 |

```solidity
/**
  * @dev Allows a borrower to swap his debt between stable and variable mode, or viceversa
  * @param asset The address of the underlying asset borrowed
  * @param rateMode The rate mode that the user wants to swap to
  **/
function swapBorrowRateMode(address asset, uint256 rateMode) external override whenNotPaused {
  DataTypes.ReserveData storage reserve = _reserves[asset];

  // 获取偿还人的债务数量，分别调用 stableDectToken 和 variableDebtToken 的 balanceOf 方法
  (uint256 stableDebt, uint256 variableDebt) = Helpers.getUserCurrentDebt(msg.sender, reserve);

  // 获取偿债的类型 固定还是浮动
  DataTypes.InterestRateMode interestRateMode = DataTypes.InterestRateMode(rateMode);

  ValidationLogic.validateSwapRateMode(
    reserve,
    _usersConfig[msg.sender],
    stableDebt,
    variableDebt,
    interestRateMode
  );

  // 更新资产状态信息 主要更新利率指数相关变量
  reserve.updateState();

  // 切换借贷类型，将原类型debtToken burn掉，然后mint出新类型的 debtToken
  if (interestRateMode == DataTypes.InterestRateMode.STABLE) {
    IStableDebtToken(reserve.stableDebtTokenAddress).burn(msg.sender, stableDebt);
    IVariableDebtToken(reserve.variableDebtTokenAddress).mint(
      msg.sender,
      msg.sender,
      stableDebt,
      reserve.variableBorrowIndex
    );
  } else {
    IVariableDebtToken(reserve.variableDebtTokenAddress).burn(
      msg.sender,
      variableDebt,
      reserve.variableBorrowIndex
    );
    IStableDebtToken(reserve.stableDebtTokenAddress).mint(
      msg.sender,
      msg.sender,
      variableDebt,
      reserve.currentStableBorrowRate
    );
  }

  reserve.updateInterestRates(asset, reserve.aTokenAddress, 0, 0);

  emit Swap(asset, msg.sender, rateMode);
}
```

### setUserUseReserveAsCollateral

设置用户(`msg.sender`)特定资产是否作为抵押品。

parameters:

| Parameter Name  | Type    | Description           |
| --------------- | ------- | --------------------- |
| asset           | address | 抵押资产的 token 地址 |
| useAsCollateral | bool    | true 代表设置为抵押品 |

```solidity
/**
  * @dev Allows depositors to enable/disable a specific deposited asset as collateral
  * @param asset The address of the underlying asset deposited
  * @param useAsCollateral `true` if the user wants to use the deposit as collateral, `false` otherwise
  **/
function setUserUseReserveAsCollateral(address asset, bool useAsCollateral)
  external
  override
  whenNotPaused
{
  DataTypes.ReserveData storage reserve = _reserves[asset];

  ValidationLogic.validateSetUseReserveAsCollateral(
    reserve,
    asset,
    useAsCollateral,
    _reserves,
    _usersConfig[msg.sender],
    _reservesList,
    _reservesCount,
    _addressesProvider.getPriceOracle()
  );

  // 将用户设置的bitmap相应的位修改数值 （0 或 1）
  _usersConfig[msg.sender].setUsingAsCollateral(reserve.id, useAsCollateral);

  if (useAsCollateral) {
    emit ReserveUsedAsCollateralEnabled(asset, msg.sender);
  } else {
    emit ReserveUsedAsCollateralDisabled(asset, msg.sender);
  }
}
```

相关代码

- [UserConfiguration.setUsingAsCollateral](./2-Configuration.md#setUsingAsCollateral)

### liquidationCall

清算健康系数低于 1 的头寸。

当借款人的健康系数 `health factor` 低于 1 时，清算人可以代表借款人偿还部分或全部未偿还的债务，并获得一部分的抵押品作为奖励。

```solidity
/**
  * @dev Function to liquidate a non-healthy position collateral-wise, with Health Factor below 1
  * - The caller (liquidator) covers `debtToCover` amount of debt of the user getting liquidated, and receives
  *   a proportionally amount of the `collateralAsset` plus a bonus to cover market risk
  * @param collateralAsset The address of the underlying asset used as collateral, to receive as result of the liquidation
  * @param debtAsset The address of the underlying borrowed asset to be repaid with the liquidation
  * @param user The address of the borrower getting liquidated
  * @param debtToCover The debt amount of borrowed `asset` the liquidator wants to cover
  * @param receiveAToken `true` if the liquidators wants to receive the collateral aTokens, `false` if he wants
  * to receive the underlying collateral asset directly
  **/
function liquidationCall(
  address collateralAsset,
  address debtAsset,
  address user,
  uint256 debtToCover,
  bool receiveAToken
) external override whenNotPaused {
  // 获取抵押管理合约地址
  address collateralManager = _addressesProvider.getLendingPoolCollateralManager();

  // 调用抵押管理合约进行清算，返回处理结果
  //solium-disable-next-line
  (bool success, bytes memory result) =
    collateralManager.delegatecall(
      abi.encodeWithSignature(
        'liquidationCall(address,address,address,uint256,bool)',
        collateralAsset,
        debtAsset,
        user,
        debtToCover,
        receiveAToken
      )
    );

  // 断言执行成功
  require(success, Errors.LP_LIQUIDATION_CALL_FAILED);

  // 解析执行返回码
  (uint256 returnCode, string memory returnMessage) = abi.decode(result, (uint256, string));

  // 当返回码不为0，revert返回信息
  require(returnCode == 0, string(abi.encodePacked(returnMessage)));
}
```

相关代码

- [LendingPoolCollateralManager.liquidationCall](./8-LendingPoolCollateralManager.md#liquidationCall)

#### Liquidation process

详情参见 [Liquidations guide](https://docs.aave.com/developers/guides/liquidations)

0. Prerequisites

   - 确认被清算人健康系数 < 1.
   - 确认可清算债务数量和用于支付的资产数量
     - 清算债务不能超过总债务的 50%
     - `debtToCover` 传入 `uint(-1)` 或 `type(uint).max` 将自动使用可清算的最大数量
     - 保证充足的可用于支付清算的资产
   - 确认你将要平仓的抵押资产，即被清算人的抵押资产用于还款后，你将收到其中一部分作为赏金
   - 确认你要收到的是 aToken 还是原始资产

1. Getting accounts to liquidate

   - On-chain
     - 监听链上事件
     - 直接查询 LendingPool 合约接口 `getUserAccountData()`
   - GraphQL(subgraph)
     - graph 不提供实时的健康系数计算，可以通过 `Aave.js` package 本地计算
     - [Aave 官方 subgraph](https://docs.aave.com/developers/getting-started/using-graphql)

2. Executing the liquidation call

   - 使用 `AaveProtocolDataProvider` 合约的 `getUserReserveData()` 接口，或者 subgraph 的 `UserReserve`
   - 计算最大可清算的数量，总债务的 50%。`debtToCover = (userStableDebt + userVariableDebt) * LiquidationCloseFactorPercent`
   - 对于每个 `usageAsCollateralEnabled` 属性为 true 的资产，可以由清算奖励比例计算最大的清算数量
     `maxAmountOfCollateralToLiquidate = (debtAssetPrice * debtToCover * liquidationBonus)/ collateralPrice`

3. Setting up a bot

   - 确保有足够的清算资金
   - 计算贷款成本和 gas 成本，同时考虑最有利的清算方案
   - 确认机器人可以获取最新的用户数据
   - 能应对突发故障或恶意攻击

#### Calculating profitability vs gas cost

1. 检索存储每一个抵押资产相关信息 [地址，精度，清算奖励比例等等](https://docs.aave.com/risk/asset-risk/risk-parameters)
2. 获取被清算用户的抵押品余额 `aTokenBalance`
3. 通过 `AaveOracle` 合约 `getAssetPrice` 接口获取资产价格
4. 最大清算奖励价值 = 抵押品余额(2) \* 清算奖励比例(1) \* 抵押资产的 ETH 价格(3)。注意资产的精度区别，比如 USDC 精度只有 6.
5. 交易最大成本应该还是 gas 费
6. 估算利润 = 清算奖励价值(4) - 交易成本(5)

#### Health Factor

`Hf 健康系数 = 用户抵押资产ETH价值 * LiquidationThreshold / 总借贷资产ETH价值`

当 Hf < 1 时用户可以被清算以维持偿债能力

![liquidation process](https://files.gitbook.com/v0/b/gitbook-28427.appspot.com/o/assets%2F-M51Fy3ipxJS-0euJX3h%2F-Mk1qqmrNtNTqFzc0Eel%2F-Mk1qzfsd56GDwzmytSo%2FRisk%20-%20Alexandra%402x.jpg?alt=media&token=d686b9eb-4145-49ef-a214-123030bbd074)

橙色部分的抵押资产会被以清算奖励折扣卖给清算人，其折扣部分的价值即为清算奖励。在合约中 `liquidationBonus` 是清算奖励比例+1，如 DAI 的清算比例设置为 5%，则合约中 `liquidationBonus = 105%`。

#### Liquidator

清算调用合约示例

```solidity
pragma solidity ^0.6.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ILendingPoolAddressesProvider.sol";
import "./ILendingPool.sol";


contract Liquidator {

    address constant lendingPoolAddressProvider = INSERT_LENDING_POOL_ADDRESS

    function myLiquidationFunction(
        address _collateral,
        address _reserve,
        address _user,
        uint256 _purchaseAmount,
        bool _receiveaToken
    )
        external
    {
        ILendingPoolAddressesProvider addressProvider = ILendingPoolAddressesProvider(lendingPoolAddressProvider);

        ILendingPool lendingPool = ILendingPool(addressProvider.getLendingPool());

        //  调用前保证LendingPool合约可以转入用于清算债务的资产
        require(IERC20(_reserve).approve(address(lendingPool), _purchaseAmount), "Approval error");

        // Assumes this contract already has `_purchaseAmount` of `_reserve`.
        lendingPool.liquidationCall(_collateral, _reserve, _user, _purchaseAmount, _receiveaToken);
    }
}
```

### flashloan

允许池子中的流动性被用于闪电贷。调用合约发送所需的资产和数量调用该接口，在交易结束之前需要归还借贷数量+手续费的资产。

如果交易结束时没有归还足够的资产，则：

- `mode = 0` 时，交易 revert
- `mode = 1` 时，`onBehalfOf` 地址产生固定利率债务
- `mode = 2` 时，`onBehalfOf` 地址产生浮动利率债务

parameters:

| Parameter Name  | Type               | Description        |
| --------------- | ------------------ | ------------------ |
| receiverAddress | address            | 贷款受益人         |
| assets          | address[] calldata | 借贷资产地址(数组) |
| amounts         | unit256[] calldata | 借贷数量地址(数组) |
| modes           | unit256[] calldata | 借贷模式(数组)     |
| onBehalfOf      | address            | 贷款还款人         |
| params          | bytes              | 入参编码           |
| referralCode    | uint16             | 推介码             |

闪电具体使用方法参考官方的指引文档 [Flash Loans Guides](https://docs.aave.com/developers/guides/flash-loans)

```solidity
/**
  * @dev Allows smartcontracts to access the liquidity of the pool within one transaction,
  * as long as the amount taken plus a fee is returned.
  * IMPORTANT There are security concerns for developers of flashloan receiver contracts that must be kept into consideration.
  * For further details please visit https://developers.aave.com
  * @param receiverAddress The address of the contract receiving the funds, implementing the IFlashLoanReceiver interface
  * @param assets The addresses of the assets being flash-borrowed
  * @param amounts The amounts amounts being flash-borrowed
  * @param modes Types of the debt to open if the flash loan is not returned:
  *   0 -> Don't open any debt, just revert if funds can't be transferred from the receiver
  *   1 -> Open debt at stable rate for the value of the amount flash-borrowed to the `onBehalfOf` address
  *   2 -> Open debt at variable rate for the value of the amount flash-borrowed to the `onBehalfOf` address
  * @param onBehalfOf The address  that will receive the debt in the case of using on `modes` 1 or 2
  * @param params Variadic packed params to pass to the receiver as extra information
  * @param referralCode Code used to register the integrator originating the operation, for potential rewards.
  *   0 if the action is executed directly by the user, without any middle-man
  **/
function flashLoan(
  address receiverAddress,
  address[] calldata assets,
  uint256[] calldata amounts,
  uint256[] calldata modes,
  address onBehalfOf,
  bytes calldata params,
  uint16 referralCode
) external override whenNotPaused { // 1. 提问: 为什么这里不用加nonReentrant
  FlashLoanLocalVars memory vars;

  ValidationLogic.validateFlashloan(assets, amounts); // 验证资产地址和借贷数量，两个参数（数组）的长度相等

  address[] memory aTokenAddresses = new address[](assets.length);  // 缓存 aToken 地址
  uint256[] memory premiums = new uint256[](assets.length); // 缓存每笔资产闪电的手续费

  vars.receiver = IFlashLoanReceiver(receiverAddress);  // 闪电贷调用者合约实例（接受贷款的合约）

  for (vars.i = 0; vars.i < assets.length; vars.i++) {  // 遍历缓存aToken地址 和 累加手续费，并先将贷款转给调用者
    aTokenAddresses[vars.i] = _reserves[assets[vars.i]].aTokenAddress;

    premiums[vars.i] = amounts[vars.i].mul(_flashLoanPremiumTotal).div(10000);  // premium = amount * 9 / 10000

    IAToken(aTokenAddresses[vars.i]).transferUnderlyingTo(receiverAddress, amounts[vars.i]); // 先将贷款转给调用者
  }

  // 1. 回答: 因为这里有判断返回值, 无法递归调用闪电贷函数
  require(  // 调用回调函数，回调方法必须返回true，否则交易失败
    vars.receiver.executeOperation(assets, amounts, premiums, msg.sender, params),
    Errors.LP_INVALID_FLASH_LOAN_EXECUTOR_RETURN
  );

  for (vars.i = 0; vars.i < assets.length; vars.i++) {  // 遍历入参，执行闪电贷逻辑
    vars.currentAsset = assets[vars.i];
    vars.currentAmount = amounts[vars.i];
    vars.currentPremium = premiums[vars.i];
    vars.currentATokenAddress = aTokenAddresses[vars.i];
    vars.currentAmountPlusPremium = vars.currentAmount.add(vars.currentPremium);

    if (DataTypes.InterestRateMode(modes[vars.i]) == DataTypes.InterestRateMode.NONE) { // mode = 0, 代表执行闪电贷
      // 更新池子状态，增发手续费部分的流动性（对于池子来说，手续费是增加的资产）
      _reserves[vars.currentAsset].updateState();
      _reserves[vars.currentAsset].cumulateToLiquidityIndex(
        IERC20(vars.currentATokenAddress).totalSupply(),
        vars.currentPremium
      );
      _reserves[vars.currentAsset].updateInterestRates(
        vars.currentAsset,
        vars.currentATokenAddress,
        vars.currentAmountPlusPremium,
        0
      );

      IERC20(vars.currentAsset).safeTransferFrom( // 从调用者合约转入token （借贷数量+手续费）
        receiverAddress,
        vars.currentATokenAddress,
        vars.currentAmountPlusPremium
      );
    } else {  // mode != 0 执行常规借贷逻辑
      // If the user chose to not return the funds, the system checks if there is enough collateral and
      // eventually opens a debt position
      _executeBorrow(
        ExecuteBorrowParams(
          vars.currentAsset,
          msg.sender,
          onBehalfOf,
          vars.currentAmount,
          modes[vars.i],
          vars.currentATokenAddress,
          referralCode,
          false
        )
      );
    }
    emit FlashLoan(
      receiverAddress,
      msg.sender,
      vars.currentAsset,
      vars.currentAmount,
      vars.currentPremium,
      referralCode
    );
  }
}
```

闪电贷调用合约示例，主要实现了以下逻辑

- 保证有 `executeOperation` 回调方法，让 LendingPool 合约回调
  - 方法内可以写使用贷款的逻辑
  - 保证每一种资产都授予了 LendingPool 足够的使用数量（approve），还款金额+手续费
  - 最后返回 true，代表执行成功，否则闪电贷失败
- 组装调用 `LendingPool.flashLoan()` 的入参，主要是三个数组入参，资产地址，借贷数量，调用模式
- [示例 github 地址](https://github.com/aave/code-examples-protocol/tree/main/V2/Flash%20Loan%20-%20Batch)

```solidity
// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.6.12;

import { FlashLoanReceiverBase } from "FlashLoanReceiverBase.sol";
import { ILendingPool, ILendingPoolAddressesProvider, IERC20 } from "Interfaces.sol";
import { SafeMath } from "Libraries.sol";

/**
    !!!
    Never keep funds permanently on your FlashLoanReceiverBase contract as they could be
    exposed to a 'griefing' attack, where the stored funds are used by an attacker.
    !!!
 */
contract MyV2FlashLoan is FlashLoanReceiverBase {
    using SafeMath for uint256;

    constructor(ILendingPoolAddressesProvider _addressProvider) FlashLoanReceiverBase(_addressProvider) public {}

    /**
        This function is called after your contract has received the flash loaned amount
     */
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    )
        external
        override
        returns (bool)
    {

        //
        // This contract now has the funds requested.
        // Your logic goes here.
        //

        // At the end of your logic above, this contract owes
        // the flashloaned amounts + premiums.
        // Therefore ensure your contract has enough to repay
        // these amounts.

        // Approve the LendingPool contract allowance to *pull* the owed amount
        for (uint i = 0; i < assets.length; i++) {
            uint amountOwing = amounts[i].add(premiums[i]);
            IERC20(assets[i]).approve(address(LENDING_POOL), amountOwing);
        }

        return true;
    }

    function myFlashLoanCall() public {
        address receiverAddress = address(this);

        address[] memory assets = new address[](7);
        assets[0] = address(0xB597cd8D3217ea6477232F9217fa70837ff667Af); // Kovan AAVE
        assets[1] = address(0x2d12186Fbb9f9a8C28B3FfdD4c42920f8539D738); // Kovan BAT
        assets[2] = address(0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD); // Kovan DAI
        assets[3] = address(0x075A36BA8846C6B6F53644fDd3bf17E5151789DC); // Kovan UNI
        assets[4] = address(0xb7c325266ec274fEb1354021D27FA3E3379D840d); // Kovan YFI
        assets[5] = address(0xAD5ce863aE3E4E9394Ab43d4ba0D80f419F61789); // Kovan LINK
        assets[6] = address(0x7FDb81B0b8a010dd4FFc57C3fecbf145BA8Bd947); // Kovan SNX

        uint256[] memory amounts = new uint256[](7);
        amounts[0] = 1 ether;
        amounts[1] = 1 ether;
        amounts[2] = 1 ether;
        amounts[3] = 1 ether;
        amounts[4] = 1 ether;
        amounts[5] = 1 ether;
        amounts[6] = 1 ether;

        // 0 = no debt, 1 = stable, 2 = variable
        uint256[] memory modes = new uint256[](7);
        modes[0] = 0;
        modes[1] = 0;
        modes[2] = 0;
        modes[3] = 0;
        modes[4] = 0;
        modes[5] = 0;
        modes[6] = 0;

        address onBehalfOf = address(this);
        bytes memory params = "";
        uint16 referralCode = 0;

        LENDING_POOL.flashLoan(
            receiverAddress,
            assets,
            amounts,
            modes,
            onBehalfOf,
            params,
            referralCode
        );
    }
}
```

### rebalanceStableBorrowRate

将用户的稳定利率再平衡为储备中定义的当前稳定利率。满足条件的用户，被销毁所有固定利率债务，生成同等数量的浮动利率债务。

如果满足以下条件，可以再平衡用户：

1. 使用率 95% 以上 (Utillization > 0.95)
2. 当前存款 APY 低于 REBALANCE_UP_THRESHOLD \* maxVariableBorrowRate，这意味着已经过多以稳定利率借入而储户收入不足

```solidity
/**
* @dev Rebalances the stable interest rate of a user to the current stable rate defined on the reserve.
* - Users can be rebalanced if the following conditions are satisfied:
*     1. Usage ratio is above 95%
*     2. the current deposit APY is below REBALANCE_UP_THRESHOLD * maxVariableBorrowRate, which means that too much has been
*        borrowed at a stable rate and depositors are not earning enough
* @param asset The address of the underlying asset borrowed
* @param user The address of the user to be rebalanced
**/
function rebalanceStableBorrowRate(address asset, address user) external override whenNotPaused {
  DataTypes.ReserveData storage reserve = _reserves[asset];

  IERC20 stableDebtToken = IERC20(reserve.stableDebtTokenAddress);
  IERC20 variableDebtToken = IERC20(reserve.variableDebtTokenAddress);
  address aTokenAddress = reserve.aTokenAddress;

  uint256 stableDebt = IERC20(stableDebtToken).balanceOf(user);

  // 这里验证上述两个条件是否满足
  ValidationLogic.validateRebalanceStableBorrowRate(
    reserve,
    asset,
    stableDebtToken,
    variableDebtToken,
    aTokenAddress
  );

  reserve.updateState();

  IStableDebtToken(address(stableDebtToken)).burn(user, stableDebt);
  IStableDebtToken(address(stableDebtToken)).mint(
    user,
    user,
    stableDebt,
    reserve.currentStableBorrowRate
  );

  reserve.updateInterestRates(asset, aTokenAddress, 0, 0);

  emit RebalanceStableBorrowRate(asset, user);
}
```

## Struct

### DataTypes

LendingPool 中的主要数据类型。

- ReserveData 资产的主要数据变量
- ReserveConfigurationMap 资产的设置，以 bitmap 形式存储，即用一个 unit256 位数字存储，不同位数对应不同的配置。
- UserConfigurationMap 用户相关的配置，和上述形式相同。
- InterestRateMode 资产的计息类型
  - NONE
  - STABLE
  - VARIABLE

```solidity

library DataTypes {
  // refer to the whitepaper, section 1.1 basic concepts for a formal description of these properties.
  struct ReserveData {
    //stores the reserve configuration
    ReserveConfigurationMap configuration;
    //the liquidity index. Expressed in ray
    uint128 liquidityIndex;
    //variable borrow index. Expressed in ray
    uint128 variableBorrowIndex;
    //the current supply rate. Expressed in ray
    uint128 currentLiquidityRate;
    //the current variable borrow rate. Expressed in ray
    uint128 currentVariableBorrowRate;
    //the current stable borrow rate. Expressed in ray
    uint128 currentStableBorrowRate;
    uint40 lastUpdateTimestamp;
    //tokens addresses
    address aTokenAddress;
    address stableDebtTokenAddress;
    address variableDebtTokenAddress;
    //address of the interest rate strategy
    address interestRateStrategyAddress;
    //the id of the reserve. Represents the position in the list of the active reserves
    uint8 id; // 这个id如果放到lastUpdateTimestamp这个变量后面, 应该可以节省一些插槽位置
  }

  // 这里把多个变量合并成一个256bit的数字, 很节省空间
  struct ReserveConfigurationMap {
    //bit 0-15: LTV
    //bit 16-31: Liq. threshold
    //bit 32-47: Liq. bonus
    //bit 48-55: Decimals
    //bit 56: Reserve is active
    //bit 57: reserve is frozen
    //bit 58: borrowing is enabled
    //bit 59: stable rate borrowing enabled
    //bit 60-63: reserved
    //bit 64-79: reserve factor
    uint256 data;
  }

  struct UserConfigurationMap {
    uint256 data;
  }

  enum InterestRateMode {NONE, STABLE, VARIABLE}
}
```
