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

详细内容请戳这里 :point_right: [LendingPool](./LendingPool.md)

#### LendingPoolAddressesProvider

主要的地址存储合约，针对特定的不同市场（不同公链的 aave）都有不同的该合约。外部合约调用该合约能得到最新的合约地址（aave 其他模块的合约地址）。

#### LendingPoolAddressesProviderRegistry

存储一个列表，罗列出不同市场的 `LendingPoolAddressesProvider` 合约地址。

#### AToken

aave 中的计息代币，当用户存入抵押资产时获得 1：1 对应的 atoken（比如存入 100DAI 抵押，获得 100aDai）。aToken 基本参照 ERC20 标准，增加了以下接口：

- scaledBalanceOf()
- getScaledUserBalanceAndSupply()
- scaledTotalSupply()

aToken 也通过 `permit()` 实现了 EIP-2612 提案。

详细内容请戳这里 :point_right: [AToken](./AToken.md)

#### Stable and Variable Debt Tokens

当用户从协议中贷出资产，获得 1:1 数量的 debt tokens。债务代币的大部分 ERC20 方法都被禁用，因为债务是不可转让。

详细内容请戳这里 :point_right: [DebtToken](./DebtToken.md)

### Supporting contracts

辅助合约

#### LendingPoolCollateralManager

抵押品管理合约，执行具体的清算逻辑。LendingPool 合约会通过 `delegatecall` 调用该合约进行清算。

详细内容请戳这里 :point_right: [LendingPoolCollateralManager](./LendingPoolCollateralManager.md)

#### LendingPoolConfigurator

为 LedingPool 合约提供配置功能。每项配置的改变都会发送事件到链上，任何人可见。

详细内容请戳这里 :point_right: [Configuration](./Configuration.md)

#### ReserveInterestRateStrategy

利率更新策略合约。

详细内容请戳这里 :point_right: [ReserveInterestRateStrategy](./ReserveInterestRateStrategy.md)

#### Price Oracle Provider

价格预言机提供合约。

#### Library contracts

依赖库合约。

#### DeployHelper

辅助部署的合约

- StableAndVariableTokensHelper 用于链上部署 StableDebtToken, VariableDebtToken 合约
- ATokensAndRatesHelper 用于链上部署 Atoken, ReserveInterestRateStrategy 合约

#### WETHGateway

用户使用 ETH 作为资产不能直接和 LendingPool 进行交互，需要使用该合约转换成 WETH，代理操作。

#### Treasury

协议金库，AToken 中每存入抵押品都会分出一定比例的资产作为准备金，并且提供了提取准备金到金库的方法，暂时不明具体的使用规则。

## Deploy flow

合约部署流程简述。了解部署流程，以便更好理解 AAVE 项目的结构。具体的部署脚本在 `aave-protocol-v2/tasks/full`

0. 检查当前网络上是否有 `LendingPoolAddressesProviderRegistry` 合约，该合约用于注册并储存各个市场(`market`)的 provider 合约地址
   - 如果没有需要部署，保证当前网络上有且只有一个
   - 同一个网络上可能存在多个市场(`market`)，例如以太坊主网上就有 [MAIN Market](https://docs.aave.com/developers/deployed-contracts/deployed-contracts) 和 [AMM Market](https://docs.aave.com/developers/deployed-contracts/amm-market)，他们分别都有一个 provier 合约，所以需要 `ProviderRegistry` 合约
1. 部署当前市场的 `LendingPoolAddressesProvider` 合约
   - 以指定的 `MarketId` 初始化
   - 调用 `ProviderRegistry.registerAddressesProvider()` 方法，将部署好的 provider 合约地址注册入 ProviderRegistry
   - 设置 provider 合约的池子管理员和紧急管理员 `setPoolAdmin`, `setEmergencyAdmin`。池子管理员设置池子相关参数，紧急管理员可以暂定池子的对外接口（抵押赎回借贷等）。
2. 部署 `LendingPool`, `LendingPoolConfigurator`, `StableAndVariableTokensHelper`, `ATokensAndRatesHelper`
   - 部署相关 libraries 依赖合约
   - 部署 `LendingPool` 池子合约，并以 `Provider` 合约地址初始化，将其地址注册到 `Provider` 合约
   - 部署 `LendingPoolConfigurator` 合约，将其地址注册到 `Provider` 合约
   - 部署 `StableAndVariableTokensHelper` 合约，将其地址注册到 `Provider` 合约
   - 部署 `ATokensAndRatesHelper` 合约，将其地址注册到 `Provider` 合约
3. 部署 `Oracle` 预言机相关合约（价格和利率）
   - 部署 `AaveOracle` 合约，该合约主要是连接外部预言机（ChainLink）的聚合器，为协议提供一个查询不同资产价格的入口，将其地址注册到 `Provider` 合约
   - 部署 `LendingRateOracle` 合约，该合约主要为协议提供一个设定和查询不同资产借贷利率的入口，将其地址注册到 `Provider` 合约
4. 部署 `AaveProtocolDataProvider` 合约，以 `Provider` 地址初始化，主要向外部提供协议内的资产数据，将其地址注册到 `Provider`
5. 部署 `WETHGateway` 合约
6. 批量部署资产列表中每一个资产对应的 `AToken`, `StableDebtToken`, `VariableDebtToken`, 并初始化配置
   - 组装各个资产对应的初始化参数，并提前部署对应的 `DefaultReserveInterestRateStrategy` 默认的利率更新策略合约
   - 通过 `LendingPoolConfigurator` 合约批量部署每种资产对应的三种 token 的合约（proxy）
   - 调用所有 token 的 initialize 方法进行初始化
   - 部署 `LendingPoolCollateralManager` 合约，将其地址注册到 `Provider`
