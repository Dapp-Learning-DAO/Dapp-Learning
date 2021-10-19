# LendingPoolCollateralManager

在协议中实施涉及抵押品管理的操作，主要是清算。

**注意**：此合约将始终由 LendingPool 合约通过 DELEGATECALL 运行，因此继承链与 LendingPool 相同，具有兼容的存储布局 (`LendingPoolStorage`)。

## methods

### liquidationCall

清算方法相关变量的缓存结构体

```solidity
struct LiquidationCallLocalVars {
  uint256 userCollateralBalance;  // 被清算人的抵押品价值
  uint256 userStableDebt; // 被清算人的固定利率债务
  uint256 userVariableDebt; // 被清算人的浮动利率债务
  uint256 maxLiquidatableDebt;  // 能够被清算的最大债务数量
  uint256 actualDebtToLiquidate;  // 实际清算的债务数量
  uint256 liquidationRatio; // 清算比例
  uint256 maxAmountCollateralToLiquidate; // 所选清算资产能被清算的最大数量
  uint256 userStableRate; // 用户的平均固定利率
  uint256 maxCollateralToLiquidate; //
  uint256 debtAmountNeeded;
  uint256 healthFactor;
  uint256 liquidatorPreviousATokenBalance;
  IAToken collateralAtoken;
  bool isCollateralEnabled;
  DataTypes.InterestRateMode borrowRateMode;
  uint256 errorCode;
  string errorMsg;
}
```

执行清算的具体方法

```solidity
/**
  * @dev Function to liquidate a position if its Health Factor drops below 1
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
) external override returns (uint256, string memory) {
  DataTypes.ReserveData storage collateralReserve = _reserves[collateralAsset]; // 待清算的抵押资产
  DataTypes.ReserveData storage debtReserve = _reserves[debtAsset]; // 待清算的债务资产
  DataTypes.UserConfigurationMap storage userConfig = _usersConfig[user]; // 待清算的贷款人设置

  LiquidationCallLocalVars memory vars;

  (, , , , vars.healthFactor) = GenericLogic.calculateUserAccountData(
    user,
    _reserves,
    userConfig,
    _reservesList,
    _reservesCount,
    _addressesProvider.getPriceOracle()
  );

  (vars.userStableDebt, vars.userVariableDebt) = Helpers.getUserCurrentDebt(user, debtReserve);

  (vars.errorCode, vars.errorMsg) = ValidationLogic.validateLiquidationCall(
    collateralReserve,
    debtReserve,
    userConfig,
    vars.healthFactor,
    vars.userStableDebt,
    vars.userVariableDebt
  );

  if (Errors.CollateralManagerErrors(vars.errorCode) != Errors.CollateralManagerErrors.NO_ERROR) {
    return (vars.errorCode, vars.errorMsg);
  }

  vars.collateralAtoken = IAToken(collateralReserve.aTokenAddress);

  vars.userCollateralBalance = vars.collateralAtoken.balanceOf(user);

  vars.maxLiquidatableDebt = vars.userStableDebt.add(vars.userVariableDebt).percentMul(
    LIQUIDATION_CLOSE_FACTOR_PERCENT
  );

  vars.actualDebtToLiquidate = debtToCover > vars.maxLiquidatableDebt
    ? vars.maxLiquidatableDebt
    : debtToCover;

  (
    vars.maxCollateralToLiquidate,
    vars.debtAmountNeeded
  ) = _calculateAvailableCollateralToLiquidate(
    collateralReserve,
    debtReserve,
    collateralAsset,
    debtAsset,
    vars.actualDebtToLiquidate,
    vars.userCollateralBalance
  );

  // If debtAmountNeeded < actualDebtToLiquidate, there isn't enough
  // collateral to cover the actual amount that is being liquidated, hence we liquidate
  // a smaller amount

  if (vars.debtAmountNeeded < vars.actualDebtToLiquidate) {
    vars.actualDebtToLiquidate = vars.debtAmountNeeded;
  }

  // If the liquidator reclaims the underlying asset, we make sure there is enough available liquidity in the
  // collateral reserve
  if (!receiveAToken) {
    uint256 currentAvailableCollateral =
      IERC20(collateralAsset).balanceOf(address(vars.collateralAtoken));
    if (currentAvailableCollateral < vars.maxCollateralToLiquidate) {
      return (
        uint256(Errors.CollateralManagerErrors.NOT_ENOUGH_LIQUIDITY),
        Errors.LPCM_NOT_ENOUGH_LIQUIDITY_TO_LIQUIDATE
      );
    }
  }

  debtReserve.updateState();

  if (vars.userVariableDebt >= vars.actualDebtToLiquidate) {
    IVariableDebtToken(debtReserve.variableDebtTokenAddress).burn(
      user,
      vars.actualDebtToLiquidate,
      debtReserve.variableBorrowIndex
    );
  } else {
    // If the user doesn't have variable debt, no need to try to burn variable debt tokens
    if (vars.userVariableDebt > 0) {
      IVariableDebtToken(debtReserve.variableDebtTokenAddress).burn(
        user,
        vars.userVariableDebt,
        debtReserve.variableBorrowIndex
      );
    }
    IStableDebtToken(debtReserve.stableDebtTokenAddress).burn(
      user,
      vars.actualDebtToLiquidate.sub(vars.userVariableDebt)
    );
  }

  debtReserve.updateInterestRates(
    debtAsset,
    debtReserve.aTokenAddress,
    vars.actualDebtToLiquidate,
    0
  );

  if (receiveAToken) {
    vars.liquidatorPreviousATokenBalance = IERC20(vars.collateralAtoken).balanceOf(msg.sender);
    vars.collateralAtoken.transferOnLiquidation(user, msg.sender, vars.maxCollateralToLiquidate);

    if (vars.liquidatorPreviousATokenBalance == 0) {
      DataTypes.UserConfigurationMap storage liquidatorConfig = _usersConfig[msg.sender];
      liquidatorConfig.setUsingAsCollateral(collateralReserve.id, true);
      emit ReserveUsedAsCollateralEnabled(collateralAsset, msg.sender);
    }
  } else {
    collateralReserve.updateState();
    collateralReserve.updateInterestRates(
      collateralAsset,
      address(vars.collateralAtoken),
      0,
      vars.maxCollateralToLiquidate
    );

    // Burn the equivalent amount of aToken, sending the underlying to the liquidator
    vars.collateralAtoken.burn(
      user,
      msg.sender,
      vars.maxCollateralToLiquidate,
      collateralReserve.liquidityIndex
    );
  }

  // If the collateral being liquidated is equal to the user balance,
  // we set the currency as not being used as collateral anymore
  if (vars.maxCollateralToLiquidate == vars.userCollateralBalance) {
    userConfig.setUsingAsCollateral(collateralReserve.id, false);
    emit ReserveUsedAsCollateralDisabled(collateralAsset, user);
  }

  // Transfers the debt asset being repaid to the aToken, where the liquidity is kept
  IERC20(debtAsset).safeTransferFrom(
    msg.sender,
    debtReserve.aTokenAddress,
    vars.actualDebtToLiquidate
  );

  emit LiquidationCall(
    collateralAsset,
    debtAsset,
    user,
    vars.actualDebtToLiquidate,
    vars.maxCollateralToLiquidate,
    msg.sender,
    receiveAToken
  );

  return (uint256(Errors.CollateralManagerErrors.NO_ERROR), Errors.LPCM_NO_ERRORS);
}
```

### \_calculateAvailableCollateralToLiquidate

计算可清算特定抵押品的具体数量。

**注意：** 该方法需要在检查完清算入参后调用。

计算过程中的相关变量缓存结构体

```solidity
struct AvailableCollateralToLiquidateLocalVars {
  uint256 userCompoundedBorrowBalance;  // 被清算人的债务本息总数
  uint256 liquidationBonus; // 清算奖励
  uint256 collateralPrice;  // 抵押品资产价格
  uint256 debtAssetPrice; // 借贷资产价格
  uint256 maxAmountCollateralToLiquidate; // 
  uint256 debtAssetDecimals;  // 借贷资产的精度
  uint256 collateralDecimals; // 抵押资产的精度
}
```

计算方法

```solidity
/**
  * @dev Calculates how much of a specific collateral can be liquidated, given
  * a certain amount of debt asset.
  * - This function needs to be called after all the checks to validate the liquidation have been performed,
  *   otherwise it might fail.
  * @param collateralReserve The data of the collateral reserve
  * @param debtReserve The data of the debt reserve
  * @param collateralAsset The address of the underlying asset used as collateral, to receive as result of the liquidation
  * @param debtAsset The address of the underlying borrowed asset to be repaid with the liquidation
  * @param debtToCover The debt amount of borrowed `asset` the liquidator wants to cover
  * @param userCollateralBalance The collateral balance for the specific `collateralAsset` of the user being liquidated
  * @return collateralAmount: The maximum amount that is possible to liquidate given all the liquidation constraints
  *                           (user balance, close factor)
  *         debtAmountNeeded: The amount to repay with the liquidation
  **/
function _calculateAvailableCollateralToLiquidate(
  DataTypes.ReserveData storage collateralReserve,
  DataTypes.ReserveData storage debtReserve,
  address collateralAsset,
  address debtAsset,
  uint256 debtToCover,
  uint256 userCollateralBalance
) internal view returns (uint256, uint256) {
  // 该资产可被清算的最大数量，由用户抵押品数量和 close factor 决定 (一般为 0.5，即一次最多清算一半)
  uint256 collateralAmount = 0;
  // 该笔债务需要被清算的最少数量
  uint256 debtAmountNeeded = 0;
  // 价格预言机地址
  IPriceOracleGetter oracle = IPriceOracleGetter(_addressesProvider.getPriceOracle());

  AvailableCollateralToLiquidateLocalVars memory vars;  // 计算相关的变量缓存

  vars.collateralPrice = oracle.getAssetPrice(collateralAsset); // 抵押资产价格
  vars.debtAssetPrice = oracle.getAssetPrice(debtAsset);  // 借贷资产价格

  // 从抵押资产的全局配置中获取清算奖励比例和资产的精度
  (, , vars.liquidationBonus, vars.collateralDecimals, ) = collateralReserve
    .configuration
    .getParams();
  vars.debtAssetDecimals = debtReserve.configuration.getDecimals(); // 借贷资产的精度

  // 下面计算借贷资产能够被清算的最大数量

  // 计算清算人希望清算的数量
  // debtToCover * debtPrice / collateralPrice
  vars.maxAmountCollateralToLiquidate = vars
    .debtAssetPrice
    .mul(debtToCover)
    .mul(10**vars.collateralDecimals)
    .percentMul(vars.liquidationBonus)
    .div(vars.collateralPrice.mul(10**vars.debtAssetDecimals));

  if (vars.maxAmountCollateralToLiquidate > userCollateralBalance) {
    collateralAmount = userCollateralBalance;
    debtAmountNeeded = vars
      .collateralPrice
      .mul(collateralAmount)
      .mul(10**vars.debtAssetDecimals)
      .div(vars.debtAssetPrice.mul(10**vars.collateralDecimals))
      .percentDiv(vars.liquidationBonus);
  } else {
    collateralAmount = vars.maxAmountCollateralToLiquidate;
    debtAmountNeeded = debtToCover;
  }
  return (collateralAmount, debtAmountNeeded);
}
```

