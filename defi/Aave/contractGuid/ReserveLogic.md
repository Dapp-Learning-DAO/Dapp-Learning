# ReserveLogic

资产相关的计算逻辑库

## preparation

运算理论的铺垫

### 时间间隔的计算

`delta_T_year` 是时间 间隔的秒数 / 一年的总秒数

<!-- $T_{year}=31536000$ -->
<img src="https://render.githubusercontent.com/render/math?math=T_{year}=31536000" style="display: block;margin: 24px auto;" />

<!-- $\Delta{T_{year}}=\Delta{T}/T_{year}$ -->
<img src="https://render.githubusercontent.com/render/math?math=\Delta{T_{year}}=\Delta{T}/T_{year}" style="display: block;margin: 24px auto;" />

### 固定利率借贷 StableBorrowRate

用户以固定利率借贷资产，将以当前固定利率来计息，不随市场波动。

> 固定利率也是跟随市场波动，之所以称之为固定利率，指的是贷款人在贷出资产后，会以贷款时的利率固定计息。而不同时间贷款的固定利率可能是不同的。

### 浮动利率借贷 VariableBorrowRate

用户以浮动利率借贷资产，将以浮动利率来计息，会实时的跟随市场波动。

因为跟随市场波动，所以在合约中需要记录时间加权的累计值，然后以类似价格预言机的模式使用，计算任意时间区间内的真实累计利息。

### 流动性收益利率 LiquidityRate

这是针对借出资产的用户的收益利率，即用户向协议注入流动性时，获得的收益率。

### 流动性收益累计值 LiquidityIndex

收益的来源是借款人归还的利息，由固定利率借贷和浮动利率借贷组成，由于两种利率都是随市场波动，所以和浮动借款利率一样，需要记录时间加权累计值。

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

parameters:

- reserve 需要更新的资产数据
- scaledVariableDebt 计息后的浮动利率债务数量
- liquidityIndex 每单位流动性的收益时间加权累计值
- variableBorrowIndex 每单位浮动利率类型债务的利率时间加权累计值

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
  // 缓存流动性收益率
  uint256 currentLiquidityRate = reserve.currentLiquidityRate;

  // 缓存流动性收益时间加权累计值
  uint256 newLiquidityIndex = liquidityIndex;
  // 缓存每单位浮动类型债务的利息加权累计值
  uint256 newVariableBorrowIndex = variableBorrowIndex;

  //only cumulating if there is any income being produced
  // 当有收益时，执行累计逻辑
  if (currentLiquidityRate > 0) {
    // 时间加权累计收益率（(1+收益率)*时间）线性累加
    uint256 cumulatedLiquidityInterest =
      MathUtils.calculateLinearInterest(currentLiquidityRate, timestamp);
    // 在之前的累计值基础上更新
    newLiquidityIndex = cumulatedLiquidityInterest.rayMul(liquidityIndex);
    require(newLiquidityIndex <= type(uint128).max, Errors.RL_LIQUIDITY_INDEX_OVERFLOW);

    reserve.liquidityIndex = uint128(newLiquidityIndex);

    //as the liquidity rate might come only from stable rate loans, we need to ensure
    //that there is actual variable debt before accumulating
    // 当有浮动类型债务时，更新浮动债务的单位累计利息
    if (scaledVariableDebt != 0) {
      // 时间加权累计每单位债务的累计利息
      // 根据每秒的利率和时间间隔秒数，计算复利
      uint256 cumulatedVariableBorrowInterest =
        MathUtils.calculateCompoundedInterest(reserve.currentVariableBorrowRate, timestamp);
      newVariableBorrowIndex = cumulatedVariableBorrowInterest.rayMul(variableBorrowIndex);
      require(
        newVariableBorrowIndex <= type(uint128).max,
        Errors.RL_VARIABLE_BORROW_INDEX_OVERFLOW
      );
      // 由于calculateLinearInterest返回的是uint256类型，这里要转换成uint128
      reserve.variableBorrowIndex = uint128(newVariableBorrowIndex);
    }
  }

  //solium-disable-next-line
  // 记录更新的时间戳
  reserve.lastUpdateTimestamp = uint40(block.timestamp);
  return (newLiquidityIndex, newVariableBorrowIndex);
}
```

### updateInterestRates

更新利率的方法，稳定利率，浮动利率，每单位流动性收益率

parameters:

- reserve 需要更新的目标资产数据
- reserveAddress 资产地址
- aTokenAddress aToken 地址
- liquidityAdded 增加的流动性数量
- liquidityTaken 减少的流动性数量

```solidity
struct UpdateInterestRatesLocalVars {
  address stableDebtTokenAddress;
  uint256 availableLiquidity;
  uint256 totalStableDebt;
  uint256 newLiquidityRate;
  uint256 newStableRate;
  uint256 newVariableRate;
  uint256 avgStableRate;
  uint256 totalVariableDebt;
}
```

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
  // 初始化相关变量到缓存
  UpdateInterestRatesLocalVars memory vars;

  // 缓存稳定债务的token地址
  vars.stableDebtTokenAddress = reserve.stableDebtTokenAddress;

  // 缓存债务数量（不包含利息）和平均利率
  (vars.totalStableDebt, vars.avgStableRate) = IStableDebtToken(vars.stableDebtTokenAddress)
    .getTotalSupplyAndAvgRate();

  //calculates the total variable debt locally using the scaled total supply instead
  //of totalSupply(), as it's noticeably cheaper. Also, the index has been
  //updated by the previous updateState() call
  // 债务总量（包含利息） = 债务总量（不含利息） * 利率累计值
  vars.totalVariableDebt = IVariableDebtToken(reserve.variableDebtTokenAddress)
    .scaledTotalSupply()
    .rayMul(reserve.variableBorrowIndex);

  // 更新利率，注意这里返回的是uint256类型
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

  // 检查利率数值是否溢出
  require(vars.newLiquidityRate <= type(uint128).max, Errors.RL_LIQUIDITY_RATE_OVERFLOW);
  require(vars.newStableRate <= type(uint128).max, Errors.RL_STABLE_BORROW_RATE_OVERFLOW);
  require(vars.newVariableRate <= type(uint128).max, Errors.RL_VARIABLE_BORROW_RATE_OVERFLOW);

  // 给变量赋值，由于变量是uin128类型，需要转换
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

相关代码

- 计算利率的方法 [IReserveInterestRateStrategy.calculateInterestRates()](./ReserveInterestRateStrategy.md#calculateInterestRates)
