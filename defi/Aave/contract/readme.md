# AAVE contract guide

![Protocol Overview](https://files.gitbook.com/v0/b/gitbook-28427.appspot.com/o/assets%2F-M3C77KySce4HXyLqkEq%2F-MNbklkK7vNPshPbrCZ-%2F-MNbxHseq3eFT7u8gEo3%2Fimage.png?alt=media&token=61a006eb-8d2b-4de6-8498-05fc889feed3)

## contract constructure

### Main contracts

主要合约

#### LendingPool

AAve 协议最主要的入口合约，大部分情况下，用户与此合约交互。

- deposit()
- borrow()
- repay()
- swapBorrowRateMode()
- setUserUseReserveAsCollateral()
- withdraw()
- flashloan()
- liquidationCall()

#### LendingPoolAddressesProvider

主要的地址存储合约，针对特定的不同市场（不同公链的aave）都有不同的该合约。外部合约调用该合约能得到最新的合约地址（aave其他模块的合约地址）。

#### LendingPoolAddressesProviderRegistry

存储一个列表，罗列出不同市场的 `LendingPoolAddressesProvider` 合约地址。

#### aToken

aave中的计息代币，当用户存入抵押资产时获得1：1对应的atoken（比如存入100DAI抵押，获得100aDai）。aToken基本参照ERC20标准，增加了以下接口：

- scaledBalanceOf()
- getScaledUserBalanceAndSupply()
- scaledTotalSupply()

aToken 也通过 `permit()` 实现了EIP-2612提案。

#### Stable and Variable Debt Tokens

当用户从协议中贷出资产，获得 1:1 数量的debt tokens。债务代币的大部分 ERC20 方法都被禁用，因为债务是不可转让。

### Supporting contracts

辅助合约

#### LendingPoolCollateralManager

抵押品管理合约，执行具体的清算逻辑。LendingPool合约会通过 `delegatecall` 调用该合约进行清算。

#### Lending Pool Configurator

为 LedingPool 合约提供配置功能。每项配置的改变都会发送事件到链上，任何人可见。

#### Interest Rate Strategy

保存计算和更新特定准备金利率所需的信息。

对于不同的借贷资产，需要使用不同的利率相关参数，以组建不同的利率模型。

- baseVariableBorrowRate
- variableRateSlope1
- variableRateSlope2
- stableRateSlope1
- stableRateSlope2

#### Price Oracle Provider

价格预言机提供合约。

#### Library contracts

库合约。
