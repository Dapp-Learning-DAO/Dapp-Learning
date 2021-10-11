# LendingPool

AAve 协议最主要的入口合约，大部分情况下，用户与此合约交互。

> deposit, borrow, withdraw 和 repay 方法仅针对 ERC20 类型代币，如果要操作 ETH（原生代币），需要使用 `WETHGateway`

## methods

主要的交互接口。

### deposit

存入资产，mint 出相同数量的 aToken 转给调用者（`msg.sender`）。

**注意：** 

1. 存入资产之前需要确保其有足够数量的 `allowance()` ，若不足需要先调用它的 `approve()` 授权给 `LendingPool`
2. `onBehalfOf` 如果该存入资产是第一次被存入（之前没有人存入过相同的资产），则将用户（onBehalfOf）的配置中该资产自动转换为抵押类型

| Parameter Name | Type    | Description                                        |
| -------------- | ------- | -------------------------------------------------- |
| asset          | address | 抵押资产的 token 地址                              |
| amount         | uint256 | 抵押资产的数量                                     |
| onBehalfOf     | address | aToken 转账的目标地址，默认填写 `msg.sender`         |
| referralCode   | uint16  | 用于广播的自定义事件代码，当用户直接调用时推荐写 0 |

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

  // 将对应的 aToken 转给调用者
  IERC20(asset).safeTransferFrom(msg.sender, aToken, amount);

  // 将 aToken mint给 onBehalfOf 地址（一般是 msg.sender）
  // isFirstDeposit 代表该资产是否在协议中第一次被存入
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

- [DataTypes](###DataTypes)
- [reserve.updateState()](./ReserveLogic.md###updateState)
- [reserve.updateInterestRates()](./ReserveLogic.md###updateInterestRates)
- [AToken.mint()](./AToken.md###mint)

### borrow

### repay

### swapBorrowRateMode

### setUserUseReserveAsCollateral

### withdraw

### flashloan

### liquidationCall

## Struct

### DataTypes

LendingPool中的主要数据类型。

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
    uint8 id;
  }

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
