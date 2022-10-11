中文 / [English](./README.md)
# Multi-Sig-Wallet

> 旧版多签钱包合约使用 0.4.x 版本 solidity，原仓库已经锁定不再更新，Gnosis 的新版多签名叫 Gnosis-Safe-Contracts 集成了多个安全合约模块。由于新版代码量较大不便于理解，我们仍使用旧版合来学习理解其使用流程和工作原理。

- 旧版 multi-sig-wallet: gnosis MultiSigWallet: <https://github.com/gnosis/MultiSigWallet>
- 新版 Gnosis Safe Contracts: <https://github.com/safe-global/safe-contracts>

## 合约解读

> 合约地址：https://github.com/gnosis/MultiSigWallet/tree/master/contracts

- MultiSigWallet.sol
- MultiSigWalletFactory.sol
- MultiSigWalletWithDailyLimit.sol
- MultiSigWalletWithDailyLimitFactory.sol
- TestCalls.sol
- TestToken.sol

## 合约接口

- 构造函数

  初始化签名者列表，及每次交易至少需要签名数。

- addOwner

  追加签名者

- replaceOwner

  替换一个现有的签名者

- changeRequirement

  变更最低签名数

- submitTransaction

  提交一笔交易申请，参数为：合约地址、转账金额、交易 data

- confirmTransaction

  传入之前提交的交易的 id，确认这笔交易可执行，如果确认的人数已达到最低要求，则自动执行该交易

- revokeConfirmation

  取消确认一笔自己之前确认过的交易

- executeTransaction

  根据 id 执行对应的交易，前提是交易已得到足够的确认数

- isConfirmed

  判断一笔交易是否已得到足够的确认数

- getConfirmationCount

  获取一笔交易当前得到的确认数

- getTransactionCount

  查询交易数，两个入参分别是：是否包含处理中的交易、是否包含已处理的交易

- getOwners

  获取当前所有可确认交易者

- getConfirmations

  查看一笔交易已经得到哪些确认者的确认

- getTransactionIds
- 查询交易 id 列表，参数为：from、to、pending（是否包含处理中）、executed（是否包含已处理）

## 操作流程

- 安装依赖

  ```sh
  yarn
  ```

- 配置私钥和网络：

在项目文件夹下新建`.env`文件，并且在 `.env` 文件中填写私钥和 infura 节点

```js
PRIVATE_KEY = xxxxxxxxxxxxxxxx; // 替换为你的私钥
INFURA_ID = yyyyyyyy; // 替换为infura节点
```

- 编译合约

  ```sh
  npx hardhat compile
  ```

- 测试合约

  ```sh
  npx hardhat test
  ```

- 部署合约

  ```sh
  npx hardhat run scripts/deploy.js  --network goerli
  ```

## TODO

- New Version Gnosis Safe Contracts: <https://github.com/safe-global/safe-contracts>

## 参考链接

- [Now open source: friendly multi-signatures for Ethereum 🔑](https://medium.com/dsys/now-open-source-friendly-multi-signatures-for-ethereum-d75ca5a0dc5c)
- gnosis 使用：<https://gnosis-safe.io/app/#/welcome>
- gnosis 合约(Polygon)： <https://polygonscan.com/address/0xa6b71e26c5e0845f74c812102ca7114b6a896ab2#code>
- 自己构造 gnosis 多签交易： <https://mp.weixin.qq.com/s/qgbTnchCHup24ANprGXH5Q>
