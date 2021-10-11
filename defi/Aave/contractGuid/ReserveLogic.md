# ReserveLogic

资产相关的计算逻辑库

## preparation

理论知识的铺垫。

### 时间间隔的计算

`delta_T_year` 是时间 间隔的秒数 / 一年的总秒数

<!-- $T_{year}=31536000$ -->
<img src="https://render.githubusercontent.com/render/math?math=T_{year}=31536000" style="display: block;margin: 24px auto;" />

<!-- $\Delta{T_{year}}=\Delta{T}/T_{year}$ -->
<img src="https://render.githubusercontent.com/render/math?math=\Delta{T_{year}}=\Delta{T}/T_{year}" style="display: block;margin: 24px auto;" />

### 固定利率借贷StableBorrowRate

用户以固定利率借贷资产，将以当前固定利率来计息，不随市场波动。

### 浮动利率借贷VariableBorrowRate

用户以浮动利率借贷资产，将以浮动利率来计息，会实时的跟随市场波动。

因为跟随市场波动，所以在合约中需要记录时间加权的累计值，然后以类似价格预言机的模式使用，计算任意时间区间内的真实累计利息。

### 流动性收益利率LiquidityRate

这是针对借出资产的用户的收益利率，即用户向协议注入流动性时，获得的收益率。收益的来源是借款人归还的利息，由固定利率借贷和浮动利率借贷组成，由于两种利率都是随市场波动，所以和浮动借款利率一样，需要记录时间加权累计值。

> 固定利率也是跟随市场波动，之所以称之为固定利率，指的是贷款人在贷出资产后，会以贷款时的利率固定计息。而不同时间贷款的固定利率可能是不同的。

## variables

Reserve 的主要变量

### liquidityIndex

`liquidity cumulative index` 每单位 liquidity(协议持有的资产，可以理解为向借贷者提供的流动性)，累计收取的利息的时间加权数值。 `R_t` 是总的利率，即固定利率和浮动利率的加权平均。

<!-- ${LI}_t=(1+\Delta{T_{year}}*R_t)*{LI}_{t-1}$ -->
<img src="https://render.githubusercontent.com/render/math?math={LI}_t=(1%2B\Delta{T_{year}}*R_t)*{LI}_{t-1}" style="display: block;margin: 24px auto;" />

### variableBorrowIndex

`variable borrow index` 累计每单位浮动利率类型债务的，浮动利率的时间加权数值。`VR_t` 代表当前的浮动利率.

<!-- ${VI}_t=(1+\frac{{VR}_t}{T_{year}})^{\Delta{T}}{VI}_{t-1}$ -->
<img src="https://render.githubusercontent.com/render/math?math={VI}_t=(1%2B\frac{{VR}_t}{T_{year}})^{\Delta{T}}{VI}_{t-1}" style="display: block;margin: 24px auto;" />

## methods

### updateState

更新 `liquidity cumulative index` 和 `variable borrow index` 两个变量，若有新增资产，将其中一部分存入准备金库。

```solidity
/**
  * @dev Updates the liquidity cumulative index and the variable borrow index.
  * @param reserve the reserve object
  **/
function updateState(DataTypes.ReserveData storage reserve) internal {
  // 获取浮动利率债务数量（包含利息的）
  uint256 scaledVariableDebt =
    IVariableDebtToken(reserve.variableDebtTokenAddress).scaledTotalSupply();
  // 缓存更新之前的值
  uint256 previousVariableBorrowIndex = reserve.variableBorrowIndex;
  uint256 previousLiquidityIndex = reserve.liquidityIndex;
  uint40 lastUpdatedTimestamp = reserve.lastUpdateTimestamp;

  // 更新变量
  (uint256 newLiquidityIndex, uint256 newVariableBorrowIndex) =
    _updateIndexes(
      reserve,
      scaledVariableDebt,
      previousLiquidityIndex,
      previousVariableBorrowIndex,
      lastUpdatedTimestamp
    );

  // 若有新增资产将其中一部分存入准备金库
  _mintToTreasury(
    reserve,
    scaledVariableDebt,
    previousVariableBorrowIndex,
    newLiquidityIndex,
    newVariableBorrowIndex,
    lastUpdatedTimestamp
  );
}
```

### \_updateIndexes

更新指数变量的具体逻辑。

```solidity
/**
  * @dev Updates the reserve indexes and the timestamp of the update
  * @param reserve The reserve reserve to be updated
  * @param scaledVariableDebt The scaled variable debt
  * @param liquidityIndex The last stored liquidity index
  * @param variableBorrowIndex The last stored variable borrow index
  **/
function _updateIndexes(
  DataTypes.ReserveData storage reserve,
  uint256 scaledVariableDebt,
  uint256 liquidityIndex,
  uint256 variableBorrowIndex,
  uint40 timestamp
) internal returns (uint256, uint256) {
  uint256 currentLiquidityRate = reserve.currentLiquidityRate;

  uint256 newLiquidityIndex = liquidityIndex;
  uint256 newVariableBorrowIndex = variableBorrowIndex;

  //only cumulating if there is any income being produced
  if (currentLiquidityRate > 0) {
    uint256 cumulatedLiquidityInterest =
      MathUtils.calculateLinearInterest(currentLiquidityRate, timestamp);
    newLiquidityIndex = cumulatedLiquidityInterest.rayMul(liquidityIndex);
    require(newLiquidityIndex <= type(uint128).max, Errors.RL_LIQUIDITY_INDEX_OVERFLOW);

    reserve.liquidityIndex = uint128(newLiquidityIndex);

    //as the liquidity rate might come only from stable rate loans, we need to ensure
    //that there is actual variable debt before accumulating
    if (scaledVariableDebt != 0) {
      uint256 cumulatedVariableBorrowInterest =
        MathUtils.calculateCompoundedInterest(reserve.currentVariableBorrowRate, timestamp);
      newVariableBorrowIndex = cumulatedVariableBorrowInterest.rayMul(variableBorrowIndex);
      require(
        newVariableBorrowIndex <= type(uint128).max,
        Errors.RL_VARIABLE_BORROW_INDEX_OVERFLOW
      );
      reserve.variableBorrowIndex = uint128(newVariableBorrowIndex);
    }
  }

  //solium-disable-next-line
  reserve.lastUpdateTimestamp = uint40(block.timestamp);
  return (newLiquidityIndex, newVariableBorrowIndex);
}
```

### updateRates

```solidity
/**
  * @dev Updates the reserve current stable borrow rate, the current variable borrow rate and the current liquidity rate
  * @param reserve The address of the reserve to be updated
  * @param liquidityAdded The amount of liquidity added to the protocol (deposit or repay) in the previous action
  * @param liquidityTaken The amount of liquidity taken from the protocol (redeem or borrow)
  **/
function updateInterestRates(
  DataTypes.ReserveData storage reserve,
  address reserveAddress,
  address aTokenAddress,
  uint256 liquidityAdded,
  uint256 liquidityTaken
) internal {
  UpdateInterestRatesLocalVars memory vars;

  vars.stableDebtTokenAddress = reserve.stableDebtTokenAddress;

  (vars.totalStableDebt, vars.avgStableRate) = IStableDebtToken(vars.stableDebtTokenAddress)
    .getTotalSupplyAndAvgRate();

  //calculates the total variable debt locally using the scaled total supply instead
  //of totalSupply(), as it's noticeably cheaper. Also, the index has been
  //updated by the previous updateState() call
  vars.totalVariableDebt = IVariableDebtToken(reserve.variableDebtTokenAddress)
    .scaledTotalSupply()
    .rayMul(reserve.variableBorrowIndex);

  (
    vars.newLiquidityRate,
    vars.newStableRate,
    vars.newVariableRate
  ) = IReserveInterestRateStrategy(reserve.interestRateStrategyAddress).calculateInterestRates(
    reserveAddress,
    aTokenAddress,
    liquidityAdded,
    liquidityTaken,
    vars.totalStableDebt,
    vars.totalVariableDebt,
    vars.avgStableRate,
    reserve.configuration.getReserveFactor()
  );
  require(vars.newLiquidityRate <= type(uint128).max, Errors.RL_LIQUIDITY_RATE_OVERFLOW);
  require(vars.newStableRate <= type(uint128).max, Errors.RL_STABLE_BORROW_RATE_OVERFLOW);
  require(vars.newVariableRate <= type(uint128).max, Errors.RL_VARIABLE_BORROW_RATE_OVERFLOW);

  reserve.currentLiquidityRate = uint128(vars.newLiquidityRate);
  reserve.currentStableBorrowRate = uint128(vars.newStableRate);
  reserve.currentVariableBorrowRate = uint128(vars.newVariableRate);

  emit ReserveDataUpdated(
    reserveAddress,
    vars.newLiquidityRate,
    vars.newStableRate,
    vars.newVariableRate,
    reserve.liquidityIndex,
    reserve.variableBorrowIndex
  );
}
```
