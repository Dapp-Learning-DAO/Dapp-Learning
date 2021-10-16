# MathUtils

数学计算库，主要用于计算利率。

## SECONDS_PER_YEAR

一年的秒数，忽略闰年。

```solidity
/// @dev Ignoring leap years
uint256 internal constant SECONDS_PER_YEAR = 365 days;
```

## calculateLinearInterest

线性计算时间间隔内的累计利率。

parameters:

- rate 年化利率
- lastUpdateTimestamp 上次更新时的时间戳，

即时间区间的起点

```solidity
/**
  * @dev Function to calculate the interest accumulated using a linear interest rate formula
  * @param rate The interest rate, in ray
  * @param lastUpdateTimestamp The timestamp of the last update of the interest
  * @return The interest rate linearly accumulated during the timeDelta, in ray
  **/

function calculateLinearInterest(uint256 rate, uint40 lastUpdateTimestamp)
  internal
  view
  returns (uint256)
{
  //solium-disable-next-line
  // 计算距离当前区块的时间间隔
  uint256 timeDifference = block.timestamp.sub(uint256(lastUpdateTimestamp));

  // 时间间隔 / 一年的时间 * 年化收益率 + 1
  return (rate.mul(timeDifference) / SECONDS_PER_YEAR).add(WadRayMath.ray());
}
```

## calculateCompoundedInterest

指数性计算时间间隔内的累计利率（根据时间计算复利）。

实际需要计算的是 `(1 + ratePerSecond)^seconds` :

1. 年化利率 / 一年的秒数，得到 `ratePerSecond`
2. 计算 `1+ratePerSecond` 为底，时间秒数为幂的结果

但在 solidity 中不支持指数运算，如果用遍历实现，将非常消耗 gas，固这里使用 [Binomial approximation](https://en.wikipedia.org/wiki/Binomial_approximation) (二项式近似) 原理，求近似值。即：

<!-- $(1+x)^{n}=1+nx+\frac{1}{2}n(n-1)x^2+\frac{1}{6}n(n-1)(n-2)x^3+...$ -->
<img src="https://render.githubusercontent.com/render/math?math=(1%2Bx)^{n}=1%2Bnx%2B\frac{1}{2}n(n-1)x^2%2B\frac{1}{6}n(n-1)(n-2)x^3%2B..." style="display: block;margin: 24px auto;" />

我们只取前三项，即到 x 的三次方为止，后面的项由于已经很小，所以可以舍弃，对总体结果影响不大(实际结果略少于理论值)。这样就是兼具节省 gas 和准确性的计算方案。

parameters:

- rate 年化利率
- lastUpdateTimestamp 时间区间的起点
- currentTimestamp 时间区间的终点

```solidity
/**
  * @dev Function to calculate the interest using a compounded interest rate formula
  * To avoid expensive exponentiation, the calculation is performed using a binomial approximation:
  *
  *  (1+x)^n = 1+n*x+[n/2*(n-1)]*x^2+[n/6*(n-1)*(n-2)*x^3...
  *
  * The approximation slightly underpays liquidity providers and undercharges borrowers, with the advantage of great gas cost reductions
  * The whitepaper contains reference to the approximation and a table showing the margin of error per different time periods
  *
  * @param rate The interest rate, in ray
  * @param lastUpdateTimestamp The timestamp of the last update of the interest
  * @return The interest rate compounded during the timeDelta, in ray
  **/
function calculateCompoundedInterest(
  uint256 rate,
  uint40 lastUpdateTimestamp,
  uint256 currentTimestamp
) internal pure returns (uint256) {
  //solium-disable-next-line
  // 计算时间间隔
  uint256 exp = currentTimestamp.sub(uint256(lastUpdateTimestamp));

  // 若间隔为0直接返回1，因为没有累计利息
  if (exp == 0) {
    return WadRayMath.ray();
  }

  // 公式中的 n-1
  uint256 expMinusOne = exp - 1;

  // 公式中的 n-2
  uint256 expMinusTwo = exp > 2 ? exp - 2 : 0;

  // 秒化利率
  uint256 ratePerSecond = rate / SECONDS_PER_YEAR;

  // x的平方
  uint256 basePowerTwo = ratePerSecond.rayMul(ratePerSecond);
  // x的三次方
  uint256 basePowerThree = basePowerTwo.rayMul(ratePerSecond);

  // [n/2*(n-1)]*x^2
  uint256 secondTerm = exp.mul(expMinusOne).mul(basePowerTwo) / 2;
  // [n/6*(n-1)*(n-2)*x^3
  uint256 thirdTerm = exp.mul(expMinusOne).mul(expMinusTwo).mul(basePowerThree) / 6;

  // 计算复利结果
  return WadRayMath.ray().add(ratePerSecond.mul(exp)).add(secondTerm).add(thirdTerm);
}
```
