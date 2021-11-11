## GenericLogic 合约功能介绍  
GenericLogic 用于计算和验证用户的状态, 保证用户在质押/借贷的过程中保持用户级状态的一致.  

## 主要合约接口  
- balanceDecreaseAllowed 
此接口用于计算用户质押金是否可以减少. 
```solidity
/**
   * @dev Checks if a specific balance decrease is allowed
   * (i.e. doesn't bring the user borrow position health factor under HEALTH_FACTOR_LIQUIDATION_THRESHOLD)
   * @param asset The address of the underlying asset of the reserve
   * @param user The address of the user
   * @param amount The amount to decrease
   * @param reservesData The data of all the reserves
   * @param userConfig The user configuration
   * @param reserves The list of all the active reserves
   * @param oracle The address of the oracle contract
   * @return true if the decrease of the balance is allowed
   **/
  function balanceDecreaseAllowed(
    address asset,  // 资产地址, 比如 Dai, USDT
    address user,   // 用户地址
    uint256 amount, // 减少的存款金额数量 
    mapping(address => DataTypes.ReserveData) storage reservesData,  //质押资产配置信息
    DataTypes.UserConfigurationMap calldata userConfig,  // 用户配置信息
    mapping(uint256 => address) storage reserves,  // 所有质押资产的配置信息
    uint256 reservesCount,  // 所有质押资产的配置信息总个数 
    address oracle   // oracle 地址
  ) external view returns (bool) {
    // 用户没有借款记录, 或没有使用此资产进行质押时, 允许用户减少存款金额
    if (!userConfig.isBorrowingAny() || !userConfig.isUsingAsCollateral(reservesData[asset].id)) {
      return true;
    }

    balanceDecreaseAllowedLocalVars memory vars;

    (, vars.liquidationThreshold, , vars.decimals, ) = reservesData[asset]
      .configuration
      .getParams();

    // 当清算阀值为0 , 表示永不清算时, 即使用户有使用此资产进行借贷, 也返回 true
    if (vars.liquidationThreshold == 0) {
      return true;
    }

    (
      vars.totalCollateralInETH,
      vars.totalDebtInETH,
      ,
      vars.avgLiquidationThreshold,

    ) = calculateUserAccountData(user, reservesData, userConfig, reserves, reservesCount, oracle);

    if (vars.totalDebtInETH == 0) {
      return true;
    }

    vars.amountToDecreaseInETH = IPriceOracleGetter(oracle).getAssetPrice(asset).mul(amount).div(
      10**vars.decimals
    );

    vars.collateralBalanceAfterDecrease = vars.totalCollateralInETH.sub(vars.amountToDecreaseInETH);

    //if there is a borrow, there can't be 0 collateral
    if (vars.collateralBalanceAfterDecrease == 0) {
      return false;
    }

    /* 计算用户资金减少后的清算阀值 %
     * totalCollateralInETH: 用户所有的质押资产总价值 ( 以 ETH 计算)
     * avgLiquidationThreshold: 用户所有质押资产所对应的清算阀值
     * totalCollateralInETH * avgLiquidationThreshold :  达到清算阀值时,用户所有资产的价值, 这里假设为 M 
     * amountToDecreaseInETH * liquidationThreshold : 减少的资金所对应的清算阀值, 这里假设为 N 
     * ( M - N ) /  collateralBalanceAfterDecrease : 用户剩余资产所对应的清算阀值
     */
    vars.liquidationThresholdAfterDecrease = vars
      .totalCollateralInETH
      .mul(vars.avgLiquidationThreshold)
      .sub(vars.amountToDecreaseInETH.mul(vars.liquidationThreshold))
      .div(vars.collateralBalanceAfterDecrease);

    // 计算用户的健康因子
    uint256 healthFactorAfterDecrease =
      calculateHealthFactorFromBalances(
        vars.collateralBalanceAfterDecrease,
        vars.totalDebtInETH,
        vars.liquidationThresholdAfterDecrease
      );

    return healthFactorAfterDecrease >= GenericLogic.HEALTH_FACTOR_LIQUIDATION_THRESHOLD;
  }
```

- calculateHealthFactorFromBalances  
计算用户的健康因子, 计算公式为:  
( 总质押资产 * 清算阀值 ) / 当前债务总值 
```solidity
function calculateHealthFactorFromBalances(
    uint256 totalCollateralInETH,
    uint256 totalDebtInETH,
    uint256 liquidationThreshold
  ) internal pure returns (uint256) {
    if (totalDebtInETH == 0) return uint256(-1);

    return (totalCollateralInETH.percentMul(liquidationThreshold)).wadDiv(totalDebtInETH);
  }
```

-  calculateAvailableBorrowsETH  
计算用户可借贷的资产总值 ( 以 ETH 计算 ). 
计算公式为: ( 用户总质押资产 * 借贷系数 ) - 已借贷资产总值
```solidity
function calculateAvailableBorrowsETH(
    uint256 totalCollateralInETH,
    uint256 totalDebtInETH,
    uint256 ltv
  ) internal pure returns (uint256) {
    uint256 availableBorrowsETH = totalCollateralInETH.percentMul(ltv);

    if (availableBorrowsETH < totalDebtInETH) {
      return 0;
    }

    availableBorrowsETH = availableBorrowsETH.sub(totalDebtInETH);
    return availableBorrowsETH;
  }
```