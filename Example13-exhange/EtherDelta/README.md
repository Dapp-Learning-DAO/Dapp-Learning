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

## 参考链接

EtherDelta github仓库: https://github.com/etherdelta/smart_contract