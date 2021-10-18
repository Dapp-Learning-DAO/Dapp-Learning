# DefaultReserveInterestRateStrategy

默认的利率更新策略模块，负责浮动和固定利率的更新

## Formal Definitions

利率相关公式定义：

- `U` 流动性利用率，债务总额 和 抵押总额 的比例
- `U_optimal` 调节利率的界限，低于此会鼓励借贷，高于此会鼓励抵押
- `R_slope1` 低于界限时，利率增长的斜率
- `R_slope2` 高于界限时，利率增长的斜率
- `R_base` 基准利率，浮动基准利率提前设定（aave 社区决定），固定利率由预言机提供多个市场的利率进行加权平均得到

当 `U < U_optimal` 时：

<!-- $R_{t}=R_{base}+\frac{U_t}{U_{optimal}}R_{slope1}$ -->
<img src="https://render.githubusercontent.com/render/math?math=R_{t}=R_{base}%2B\frac{U_t}{U_{optimal}}R_{slope1}" style="display: block;margin: 24px auto;" />

当 `U >= U_optimal` 时：

<!-- $R_{t}=R_{base}+R_{slope1}+\frac{U_t-U_{optimal}}{1-U_{optimal}}R_{slope2}$ -->
<img src="https://render.githubusercontent.com/render/math?math=R_{t}=R_{base}%2BR_{slope1}%2B\frac{U_t-U_{optimal}}{1-U_{optimal}}R_{slope2}" style="display: block;margin: 24px auto;" />

## 公式相关变量

所有全局变量都是 `immutable` 类型，即初始化赋值后不可更改。

`ray` 是 aave 中规定的计数方法，精度为 27 的数值类型, 即 `1ray = 1e27`

| variable name            | 公式对应        | 变量类型 |
| ------------------------ | --------------- | -------- |
| OPTIMAL_UTILIZATION_RATE | U_optimal       | ray      |
| EXCESS_UTILIZATION_RATE  | 1 - U_optimal   | ray      |
| \_baseVariableBorrowRate | R_base (浮动)   | ray      |
| \_variableRateSlope1     | R_slope1 (浮动) | ray      |
| \_variableRateSlope2     | R_slope2 (浮动) | ray      |
| \_stableRateSlope1       | R_slope1 (浮动) | ray      |
| \_stableRateSlope2       | R_slope2 (浮动) | ray      |

## methods

### constructor

利率更新策略模块初始化，会将公式相关变量初始化

```solidity
constructor(
  ILendingPoolAddressesProvider provider,
  uint256 optimalUtilizationRate,
  uint256 baseVariableBorrowRate,
  uint256 variableRateSlope1,
  uint256 variableRateSlope2,
  uint256 stableRateSlope1,
  uint256 stableRateSlope2
) public {
  OPTIMAL_UTILIZATION_RATE = optimalUtilizationRate;
  // 1 - U_optimal 提前缓存该值避免每次调用计算
  EXCESS_UTILIZATION_RATE = WadRayMath.ray().sub(optimalUtilizationRate);
  addressesProvider = provider;
  _baseVariableBorrowRate = baseVariableBorrowRate;
  _variableRateSlope1 = variableRateSlope1;
  _variableRateSlope2 = variableRateSlope2;
  _stableRateSlope1 = stableRateSlope1;
  _stableRateSlope2 = stableRateSlope2;
}
```

### calculateInterestRates

计算利率的具体方法。

```solidity
// 缓存计算结果的struct
struct CalcInterestRatesLocalVars {
  uint256 totalDebt;  // 债务总额
  uint256 currentVariableBorrowRate;  // 当前浮动借贷利率
  uint256 currentStableBorrowRate;  // 当前固定借贷利率
  uint256 currentLiquidityRate;   // 当前流动性回报率
  uint256 utilizationRate;  // 流动性利用率 U
}
```

根据准备金的状态和配置计算利率。函数返回 流动性回报率，固定利率，浮动利率

```solidity
/**
  * @dev Calculates the interest rates depending on the reserve's state and configurations.
  * NOTE This function is kept for compatibility with the previous DefaultInterestRateStrategy interface.
  * New protocol implementation uses the new calculateInterestRates() interface
  * @param reserve The address of the reserve
  * @param availableLiquidity The liquidity available in the corresponding aToken
  * @param totalStableDebt The total borrowed from the reserve a stable rate
  * @param totalVariableDebt The total borrowed from the reserve at a variable rate
  * @param averageStableBorrowRate The weighted average of all the stable rate loans
  * @param reserveFactor The reserve portion of the interest that goes to the treasury of the market
  * @return The liquidity rate, the stable borrow rate and the variable borrow rate
  **/
function calculateInterestRates(
  address reserve,  // 池子地址
  uint256 availableLiquidity, // 可用的流动性（可借贷资产）
  uint256 totalStableDebt,  // 当前固定利率借贷债务总额
  uint256 totalVariableDebt, // 当前浮动利率借贷债务总额
  uint256 averageStableBorrowRate, // 平均固定利率
  uint256 reserveFactor // 划入准备金池中的数量
)
  public
  view
  override
  returns (
    uint256,
    uint256,
    uint256
  )
{
  // 初始化缓存变量，用于缓存计算结果
  CalcInterestRatesLocalVars memory vars;

  // 总债务 = 固定债务 + 浮动债务
  vars.totalDebt = totalStableDebt.add(totalVariableDebt);
  // 初始化利率结果缓存
  vars.currentVariableBorrowRate = 0;
  vars.currentStableBorrowRate = 0;
  vars.currentLiquidityRate = 0;

  // 获取流动性利用率 U = totalDebt / totalLiquidity
  // totalLiquidity = 可用流动性 + 总债务（已借出的流动性）
  vars.utilizationRate = vars.totalDebt == 0
    ? 0
    : vars.totalDebt.rayDiv(availableLiquidity.add(vars.totalDebt));

  // 获取预言机提供的多个市场的加权平均利率，作为固定利率的基准利率 即 R_base
  vars.currentStableBorrowRate = ILendingRateOracle(addressesProvider.getLendingRateOracle())
    .getMarketBorrowRate(reserve);

  // 当 U > U_optimal
  if (vars.utilizationRate > OPTIMAL_UTILIZATION_RATE) {
    // excessUtilizationRateRatio = (U - U_optimal) / (1 - U_optimal)
    uint256 excessUtilizationRateRatio =
      vars.utilizationRate.sub(OPTIMAL_UTILIZATION_RATE).rayDiv(EXCESS_UTILIZATION_RATE);

    // R_base (stable) + R_slope1 + excessUtilizationRateRatio * R_slope2
    vars.currentStableBorrowRate = vars.currentStableBorrowRate.add(_stableRateSlope1).add(
      _stableRateSlope2.rayMul(excessUtilizationRateRatio)
    );

    // R_base (variable) + R_slope1 + excessUtilizationRateRatio * R_slope2
    vars.currentVariableBorrowRate = _baseVariableBorrowRate.add(_variableRateSlope1).add(
      _variableRateSlope2.rayMul(excessUtilizationRateRatio)
    );
  } else {
    // 当 U <= U_optimal
    // R_base (stable) + U / U_optimal * R_slope1
    vars.currentStableBorrowRate = vars.currentStableBorrowRate.add(
      _stableRateSlope1.rayMul(vars.utilizationRate.rayDiv(OPTIMAL_UTILIZATION_RATE))
    );
    // R_base (variable) + U / U_optimal * R_slope1
    vars.currentVariableBorrowRate = _baseVariableBorrowRate.add(
      vars.utilizationRate.rayMul(_variableRateSlope1).rayDiv(OPTIMAL_UTILIZATION_RATE)
    );
  }

  // 计算流动性收益率（每单位流动性获取的利息）
  // liquidityRate = overallBorrowRate * U * (100 - reserveFactor)%
  // overallBorrowRate 是浮动和固定利率的加权平均利率
  // reserveFactor 是设定的划入池子准备金的百分比份额
  vars.currentLiquidityRate = _getOverallBorrowRate(
    totalStableDebt,
    totalVariableDebt,
    vars
      .currentVariableBorrowRate,
    averageStableBorrowRate
  )
    .rayMul(vars.utilizationRate)
    .percentMul(PercentageMath.PERCENTAGE_FACTOR.sub(reserveFactor));

  return (
    vars.currentLiquidityRate,
    vars.currentStableBorrowRate,
    vars.currentVariableBorrowRate
  );
}
```
