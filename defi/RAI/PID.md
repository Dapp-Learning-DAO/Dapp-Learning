# RAI PID

relative repo:

- <https://github.com/reflexer-labs/geb-rrfm-calculators>
- <https://github.com/reflexer-labs/geb-rrfm-rate-setter>

## compute redemption price rate by PID

目前 RAI 使用了 P 和 I，没有使用 D

$$
\begin{align*}
accumulatedLeak &= {perSecondCumulativeLeak}^{\Delta t} \\
P &= redemptionPrice - marketPrice \\
I &= accumulatedLeak \cdot I_{old} + \frac{P + P_{old}}{2} \cdot \Delta t
\end{align*}
$$

Multiply P by Kp and I by Ki and then sum P & I in order to return the result

$$
P = P_{old} \cdot Kp \\
I = I_{old} \cdot Ki \\
PI = P + I
$$

If the `P * Kp + I * Ki` output breaks the noise barrier, you can recompute a non null rate. Also make sure the sum is not null

如果计算出的负反馈参数绝对值需要足够大，即忽略太小的反馈参数

目前线上 [PIRawPerSecondCalculator](https://etherscan.io/address/0xdda334de7a9c57a641616492175ca203ba8cf981) `noiseBarrier` 为 1， 即 `|PI| >= 0`, 不会忽略

$$
|PI| >= (2 - noiseBarrier) \cdot redemptionPrice - redemptionPrice
$$

Return a redemption rate bounded by feedbackOutputLowerBound and feedbackOutputUpperBound as well as the timeline over which that rate will take effect

`getBoundedRedemptionRate()` 对 rate 做一些限制处理

- `feedbackOutputLowerBound <= PI <= feedbackOutputUpperBound`
- 目前线上 `feedbackOutputLowerBound = -999999.999999999999999999999` `feedbackOutputUpperBound = 1000000000000000000000000` 所以这个限制可以忽略
- 如果 `PI < 0 && PI <= defaultRedemptionRate` , 则设置 `PI = NEGATIVE_RATE_LIMIT`
  - (`defaultRedemptionRate = -1000000`, `NEGATIVE_RATE_LIMIT` 近似 1)
- 如果 `defaultRedemptionRate < PI < 1` 则 `PI = defaultRedemptionRate - NEGATIVE_RATE_LIMIT`
- 如果 `1 <= PI` 则 `PI = defaultRedemptionRate + PI`

### 调用流程

1. `PIRateSetter.updateRate()` 每隔一段时间，触发 redemption price rate 更新
   - 该函数任何人都可以触发，并拿一点奖励补偿 gas 费用，目前设置的间隔是 12 个小时
   - `orcl.getResultWithValidity()` 从 oracle 拿到 `MarketPrice`
   - `oracleRelayer.redemptionPrice()` 获取之前的 `redemptionPrice`
2. `PIRawPerSecondCalculator.computeRate()` PID 模块计算新的反馈参数
   - `updateDeviationHistory(proportionalTerm, accumulatedLeak)`
   - `PI = getGainAdjustedPIOutput(P, I)` 计算 PI 反馈参数
   - `breaksNoiseBarrier()` 过滤太小的反馈参数
   - `getBoundedRedemptionRate()` 对 PI 做一些限制

```solidity
// geb-rrfm-rate-setter/src/PIRateSetter.sol
contract PIRateSetter {
    function updateRate(address feeReceiver) external {
        ...
        // accumulatedLeak
        uint256 iapcr      = (defaultLeak == 1) ? RAY : rpower(pidCalculator.pscl(), pidCalculator.tlv(), RAY);
        uint256 calculated = pidCalculator.computeRate(
            marketPrice,
            redemptionPrice,
            iapcr
        );
        // set rate
        try setterRelayer.relayRate(calculated, feeReceiver) {
          ...
        }
    }
}

// geb-rrfm-calculators/src/calculator/PIRawPerSecondCalculator.sol
contract PIRawPerSecondCalculator is SafeMath, SignedSafeMath {
    /*
    * @notice Compute a new redemption rate
    * @param marketPrice The system coin market price
    * @param redemptionPrice The system coin redemption price
    * @param accumulatedLeak The total leak that will be applied to priceDeviationCumulative (the integral) before the latest
    *        proportional term is added
    */
    function computeRate(
      uint marketPrice,
      uint redemptionPrice,
      uint accumulatedLeak
    ) external returns (uint256) {
        ...
        // The proportional term is just redemption - market. Market is read as having 18 decimals so we multiply by 10**9
        int256 proportionalTerm = subtract(int(redemptionPrice), multiply(int(marketPrice), int(10**9)));
        // Update the integral term by passing the proportional (current deviation) and the total leak that will be applied to the integral
        updateDeviationHistory(proportionalTerm, accumulatedLeak);
        // Set the last update time to now
        lastUpdateTime = now;
        // Multiply P by Kp and I by Ki and then sum P & I in order to return the result
        int256 piOutput = getGainAdjustedPIOutput(proportionalTerm, priceDeviationCumulative);
        // If the P * Kp + I * Ki output breaks the noise barrier, you can recompute a non null rate. Also make sure the sum is not null
        if (
          breaksNoiseBarrier(absolute(piOutput), redemptionPrice) &&
          piOutput != 0
        ) {
          // Get the new redemption rate by taking into account the feedbackOutputUpperBound and feedbackOutputLowerBound
          (uint newRedemptionRate, ) = getBoundedRedemptionRate(piOutput);
          return newRedemptionRate;
        } else {
          return TWENTY_SEVEN_DECIMAL_NUMBER;
        }
    }

    /*
    * @notice Push new observations in deviationObservations & historicalCumulativeDeviations while also updating priceDeviationCumulative
    * @param proportionalTerm The proportionalTerm
    * @param accumulatedLeak The total leak (similar to a negative interest rate) applied to priceDeviationCumulative before proportionalTerm is added to it
    */
    function updateDeviationHistory(int proportionalTerm, uint accumulatedLeak) internal {
        (int256 virtualDeviationCumulative, ) =
          getNextPriceDeviationCumulative(proportionalTerm, accumulatedLeak);
        priceDeviationCumulative = virtualDeviationCumulative;
        historicalCumulativeDeviations.push(priceDeviationCumulative);
        deviationObservations.push(DeviationObservation(now, proportionalTerm, priceDeviationCumulative));
    }

    /*
    * @notice Compute a new priceDeviationCumulative (integral term)
    * @param proportionalTerm The proportional term (redemptionPrice - marketPrice)
    * @param accumulatedLeak The total leak applied to priceDeviationCumulative before it is summed with the new time adjusted deviation
    */
    function getNextPriceDeviationCumulative(int proportionalTerm, uint accumulatedLeak) public isReader view returns (int256, int256) {
        int256 lastProportionalTerm      = getLastProportionalTerm();
        uint256 timeElapsed              = (lastUpdateTime == 0) ? 0 : subtract(now, lastUpdateTime);
        int256 newTimeAdjustedDeviation  = multiply(riemannSum(proportionalTerm, lastProportionalTerm), int(timeElapsed));
        int256 leakedPriceCumulative     = divide(multiply(int(accumulatedLeak), priceDeviationCumulative), int(TWENTY_SEVEN_DECIMAL_NUMBER));

        return (
          addition(leakedPriceCumulative, newTimeAdjustedDeviation),
          newTimeAdjustedDeviation
        );
    }

    /*
    * @notice Return a redemption rate bounded by feedbackOutputLowerBound and feedbackOutputUpperBound as well as the
              timeline over which that rate will take effect
    * @param piOutput The raw redemption rate computed from the proportional and integral terms
    */
    function getBoundedRedemptionRate(int piOutput) public isReader view returns (uint256, uint256) {
        int  boundedPIOutput = piOutput;
        uint newRedemptionRate;

        if (piOutput < feedbackOutputLowerBound) {
          boundedPIOutput = feedbackOutputLowerBound;
        } else if (piOutput > int(feedbackOutputUpperBound)) {
          boundedPIOutput = int(feedbackOutputUpperBound);
        }

        // newRedemptionRate cannot be lower than 10^0 (1) because of the way rpower is designed
        bool negativeOutputExceedsHundred = (boundedPIOutput < 0 && -boundedPIOutput >= int(defaultRedemptionRate));

        // If it is smaller than 1, set it to the nagative rate limit
        if (negativeOutputExceedsHundred) {
          newRedemptionRate = NEGATIVE_RATE_LIMIT;
        } else {
          // If boundedPIOutput is lower than -int(NEGATIVE_RATE_LIMIT) set newRedemptionRate to 1
          if (boundedPIOutput < 0 && boundedPIOutput <= -int(NEGATIVE_RATE_LIMIT)) {
            newRedemptionRate = uint(addition(int(defaultRedemptionRate), -int(NEGATIVE_RATE_LIMIT)));
          } else {
            // Otherwise add defaultRedemptionRate and boundedPIOutput together
            newRedemptionRate = uint(addition(int(defaultRedemptionRate), boundedPIOutput));
          }
        }

        return (newRedemptionRate, defaultGlobalTimeline);
    }
}
```
