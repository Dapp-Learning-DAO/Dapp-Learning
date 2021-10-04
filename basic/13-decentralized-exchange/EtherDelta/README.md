# EtherDelta

使用合约实现了传统中心化交易所，订单簿模式交易所

由于原来的代码版本比较老 `solidity 0.4.9`，`hardhat` 不支持，所以将合约及测试文件升级到了 `solidity 0.8.0` (老版本升级真的太多坑了……)。

原来的代码在 `./backup`

## 代码使用方法

### 安装

```sh
yarn install
```

### 编译合约

```sh
yarn build
```

或

```sh
npx hardhat compile
```

### 运行测试

```sh
yarn test
```

或

```sh
npx hardhat test
```

## 合约功能简述

### ReserveToken

EtherDelta 实现了简单的 token 合约，类似 ERC20 标准合约，用于交易所内的 token 交易（非 eth）

### AccountLevelsTest

内部维护一张用户 vip 等级列表，管理员可以设置用户的 vip 等级。

### EtherDelta

交易所核心合约

用户交易用的资产必须先存入 (`deposit()`) 交易所合约，交易完成后，可以提现 (`withdraw()`) 到自己的钱包，基本和中心化交易所流程相同。

#### 交易流程

1. 卖家挂单 `order()`，以挂单信息转换为 hash，作为键，存入 `orders` 合约变量
2. 买家吃单 `trade()`，传入指定的挂单 hash

#### constructor

```solidity
constructor(
    address admin_,     //  创建者
    address feeAccount_,  // 手续费受益人
    address accountLevelsAddr_, // AccountLevelsTest 合约地址
    uint256 feeMake_,   //  买入手续费率
    uint256 feeTake_,   //  卖出手续费率
    uint256 feeRebate_  //  vip佣金回扣费率
)
```

#### 合约 public 变量

```solidity
...
mapping(address => mapping(address => uint256)) public tokens; // token 用户持有每种token数量的列表 (0地址 代表 Ether)
mapping(address => mapping(bytes32 => bool)) public orders; // 挂单列表 (true = 用户提交的挂单, 需要验证离线签名)
mapping(address => mapping(bytes32 => uint256)) public orderFills; // 每一笔挂单完成的数量 (amount of order that has been filled)
```

## todo list

### 测试流程补全

目前只实现了核心功能的测试，还有部分测试流程未升级，老测试文件参见 `./backup/test.old.js`

尚未实现的测试事件

- [ ] Should change the fee account and fail
- [ ] Should change the fee account and succeed
- [ ] Should change the make fee and fail
- [ ] Should change the make fee and fail because the make fee can only decrease
- [ ] Should change the make fee and succeed
- [ ] Should change the take fee and fail
- [ ] Should change the take fee and fail because the take fee can only decrease
- [ ] Should change the take fee and fail because the take fee must exceed the rebate fee
- [ ] Should change the take fee and succeed
- [ ] Should change the rebate fee and fail
- [ ] Should change the rebate fee and fail because the rebate fee can only increase
- [ ] Should change the rebate fee and fail because the rebate fee must not exceed the take fee
- [ ] Should change the rebate fee and succeed
- [ ] Should change the admin account and fail
- [ ] Should change the admin account and succeed

## 参考链接

EtherDelta github 仓库: https://github.com/etherdelta/smart_contract
