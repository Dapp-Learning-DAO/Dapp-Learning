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

  (, , , , vars.healthFactor) = GenericLogic.calculateUserAccountData( // 获取被清算人的健康系数
    user,
    _reserves,
    userConfig,
    _reservesList,
    _reservesCount,
    _addressesProvider.getPriceOracle()
  );

  (vars.userStableDebt, vars.userVariableDebt) = Helpers.getUserCurrentDebt(user, debtReserve); // 获取被清算人的债务数量

  // 验证清算操作的合法性
  // 1. 健康系数 < 1
  // 2. 用户在该资产上有抵押且有清算阈值
  // 3. 用户负债数量不为0
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

  vars.collateralAtoken = IAToken(collateralReserve.aTokenAddress); // 获取抵押资产的aToken

  vars.userCollateralBalance = vars.collateralAtoken.balanceOf(user); // 获取抵押资产的atoken数量

  vars.maxLiquidatableDebt = vars.userStableDebt.add(vars.userVariableDebt).percentMul( // 计算清算的最大数量：总债务 * close_factor
    LIQUIDATION_CLOSE_FACTOR_PERCENT
  );

  vars.actualDebtToLiquidate = debtToCover > vars.maxLiquidatableDebt  // 清算人期望执行的数量不能大于最大清算数量
    ? vars.maxLiquidatableDebt
    : debtToCover;

  (
    vars.maxCollateralToLiquidate,  // 计算可获得的最大奖励数量
    vars.debtAmountNeeded // 可清偿的债务数量
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

  if (vars.debtAmountNeeded < vars.actualDebtToLiquidate) { // 实际执行清算数量不能大于需要被清算的数量
    vars.actualDebtToLiquidate = vars.debtAmountNeeded;
  }

  // If the liquidator reclaims the underlying asset, we make sure there is enough available liquidity in the
  // collateral reserve
  // 如果清算人希望收取原始token资产而非 atoken, 需要保证池子有足够的流动性支付(例如token被借贷走，没有足够数量)
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

  debtReserve.updateState();  // 触发债务资产更新状态，全局指数等

  // 优先清算浮动利率债务，不足部分以固定利率债务补足
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

  debtReserve.updateInterestRates(  // 债务资产更新利率数据
    debtAsset,
    debtReserve.aTokenAddress,
    vars.actualDebtToLiquidate,
    0
  );

  if (receiveAToken) {  // 清算人接受aToken
    vars.liquidatorPreviousATokenBalance = IERC20(vars.collateralAtoken).balanceOf(msg.sender);
    vars.collateralAtoken.transferOnLiquidation(user, msg.sender, vars.maxCollateralToLiquidate); // 转账aToken

    if (vars.liquidatorPreviousATokenBalance == 0) {  // 如果清算人的该资产没有抵押余额，需要将其用户配置更改
      DataTypes.UserConfigurationMap storage liquidatorConfig = _usersConfig[msg.sender];
      liquidatorConfig.setUsingAsCollateral(collateralReserve.id, true);
      emit ReserveUsedAsCollateralEnabled(collateralAsset, msg.sender);
    }
  } else {  // 清算人接受原始token，调用aToken.burn()将原始token转给清算人
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
  if (vars.maxCollateralToLiquidate == vars.userCollateralBalance) {  // 被清算人的该资产如果余额为0，则修改其用户配置
    userConfig.setUsingAsCollateral(collateralReserve.id, false);
    emit ReserveUsedAsCollateralDisabled(collateralAsset, user);
  }

  // Transfers the debt asset being repaid to the aToken, where the liquidity is kept
  // 从清算人那转入借贷资产的原始token，到借贷资产的 aToken 地址
  
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

计算可清算特定抵押品的具体数量，返回可清算的最大债务数量和可获取的最大奖励数量

**注意：** 该方法需要在检查完清算入参后调用。

计算过程中的相关变量缓存结构体

```solidity
struct AvailableCollateralToLiquidateLocalVars {
  uint256 userCompoundedBorrowBalance;  // 被清算人的债务本息总数
  uint256 liquidationBonus; // 清算奖励比例 （1+清算奖励百分比）
  uint256 collateralPrice;  // 抵押品资产价格
  uint256 debtAssetPrice; // 借贷资产价格
  uint256 maxAmountCollateralToLiquidate; // 最大清算数量（包括获得的奖励）
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
  // 该资产可被清算的最大数量，由用户抵押品数量和 close factor 决定 (0.5，即一次最多清算一半)
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

  // 计算清算该资产的最大可清算数量，包括能获得的奖励数量
  // debtPrice * debtToCover * liquidationBonus / collateralPrice
  vars.maxAmountCollateralToLiquidate = vars
    .debtAssetPrice
    .mul(debtToCover)
    .mul(10**vars.collateralDecimals)
    .percentMul(vars.liquidationBonus)  //  这里是 (1 + liquidation bonus)%
    .div(vars.collateralPrice.mul(10**vars.debtAssetDecimals));

  // 如果最大清算数量 > 用户的抵押品余额
  if (vars.maxAmountCollateralToLiquidate > userCollateralBalance) {
    collateralAmount = userCollateralBalance; // 最大清算数量 = 用户该资产余额
    // 最大清算额度通过用户余额反推 (collateralAmount / liquidationBonus) * (colleralPrice / debtPrice)
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

### calculateUserAccountData

通过资产数据计算用户数据，包括流动性，抵押资产数量，借贷资产数量 （以ETH计价），平均 LTV, 平均清算阈值，健康系数

```solidity
/**
  * @dev Calculates the user data across the reserves.
  * this includes the total liquidity/collateral/borrow balances in ETH,
  * the average Loan To Value, the average Liquidation Ratio, and the Health factor.
  * @param user The address of the user
  * @param reservesData Data of all the reserves
  * @param userConfig The configuration of the user
  * @param reserves The list of the available reserves
  * @param oracle The price oracle address
  * @return The total collateral and total debt of the user in ETH, the avg ltv, liquidation threshold and the HF
  **/
function calculateUserAccountData(
  address user, // 用户地址
  mapping(address => DataTypes.ReserveData) storage reservesData, // 资产数据mapping
  DataTypes.UserConfigurationMap memory userConfig, // 用户配置
  mapping(uint256 => address) storage reserves, // 资产地址mapping
  uint256 reservesCount,  // 资产种类总数
  address oracle  // 预言机地址
)
  internal
  view
  returns (
    uint256,
    uint256,
    uint256,
    uint256,
    uint256
  )
{
  CalculateUserAccountDataVars memory vars;

  if (userConfig.isEmpty()) { // 当用户没有抵押也没有借贷 直接返回0
    return (0, 0, 0, 0, uint256(-1)); // HF 健康系数 -1
  }
  // 遍历所有资产数据 累计计算用户的平均清算阈值和 抵押，借贷资产
  for (vars.i = 0; vars.i < reservesCount; vars.i++) {
    if (!userConfig.isUsingAsCollateralOrBorrowing(vars.i)) { // 用户在该资产上没有抵押也没有借贷，跳过
      continue;
    }

    vars.currentReserveAddress = reserves[vars.i];  // 缓存当前资产的地址
    DataTypes.ReserveData storage currentReserve = reservesData[vars.currentReserveAddress];  // 缓存资产数据

    (vars.ltv, vars.liquidationThreshold, , vars.decimals, ) = currentReserve // 获取资产的配置
      .configuration
      .getParams();

    vars.tokenUnit = 10**vars.decimals; // 缓存资产的精度换算单位
    vars.reserveUnitPrice = IPriceOracleGetter(oracle).getAssetPrice(vars.currentReserveAddress); // 获取资产每单位价格

    if (vars.liquidationThreshold != 0 && userConfig.isUsingAsCollateral(vars.i)) { // 如果该资产用作抵押
      vars.compoundedLiquidityBalance = IERC20(currentReserve.aTokenAddress).balanceOf(user); // 获取对应 aToken 数量

      uint256 liquidityBalanceETH =
        vars.reserveUnitPrice.mul(vars.compoundedLiquidityBalance).div(vars.tokenUnit); // 计算资产以eth计价的数量

      vars.totalCollateralInETH = vars.totalCollateralInETH.add(liquidityBalanceETH);  // 累计资产价值

      vars.avgLtv = vars.avgLtv.add(liquidityBalanceETH.mul(vars.ltv));  // 累计加权平均 LTV
      vars.avgLiquidationThreshold = vars.avgLiquidationThreshold.add(  // 累计加权平均清算阈值
        liquidityBalanceETH.mul(vars.liquidationThreshold)
      );
    }

    if (userConfig.isBorrowing(vars.i)) { // 如果该资产作为借贷资产
      vars.compoundedBorrowBalance = IERC20(currentReserve.stableDebtTokenAddress).balanceOf( // 获取 StableDebtToken 数量
        user
      );
      vars.compoundedBorrowBalance = vars.compoundedBorrowBalance.add(  // 获取 VariableDebtToken 数量
        IERC20(currentReserve.variableDebtTokenAddress).balanceOf(user)
      );

      vars.totalDebtInETH = vars.totalDebtInETH.add(  // 计算两种债务的价值总和
        vars.reserveUnitPrice.mul(vars.compoundedBorrowBalance).div(vars.tokenUnit)
      );
    }
  }

  vars.avgLtv = vars.totalCollateralInETH > 0 ? vars.avgLtv.div(vars.totalCollateralInETH) : 0; // 将累计的 LTV / 总价值 得出平均的 LTV
  vars.avgLiquidationThreshold = vars.totalCollateralInETH > 0  // 将累计的清算阈值除以总价值
    ? vars.avgLiquidationThreshold.div(vars.totalCollateralInETH)
    : 0;

  // 计算 HF 健康系数
  // totalCollateralInETH * avgLiquidationThreshold / totalDebtInETH
  vars.healthFactor = calculateHealthFactorFromBalances(
    vars.totalCollateralInETH,
    vars.totalDebtInETH,
    vars.avgLiquidationThreshold
  );
  return (
    vars.totalCollateralInETH,
    vars.totalDebtInETH,
    vars.avgLtv,
    vars.avgLiquidationThreshold,
    vars.healthFactor
  );
}
```

