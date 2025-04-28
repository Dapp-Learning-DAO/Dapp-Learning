# 简介

- 示例AA账户见contracts目录
- js调用见scripts目录

# 克隆bundler

```
git clone https://github.com/eth-infinitism/bundler
cd bundler
yarn
```

# 启动本地链

```
hardhat-node
```

# 启动bundler
再开一个窗口，进入bundler目录，执行
```
yarn preprocess
yarn hardhat-deploy --network localhost
yarn run bundler --unsafe
```

# 运行测试

进入本目录，如果想查看基本的全流程，执行
```
yarn
yarn hardhat run scripts/basic.js 
```

如果想查看paymaster的使用，执行
```
yarn
yarn hardhat run scripts/paymaster.js 
```

## TODO
 4337 
 7702
 https://github.com/quiknode-labs/qn-guide-examples/blob/main/ethereum/eip-7702/src/BatchCallAndSponsor.sol
 7579

## 文档
- eip-4337文档：4337的规范。https://eips.ethereum.org/EIPS/eip-4337
- sdk：提供了构建UserOperation，推送UserOperation的能力。源码位于https://github.com/eth-infinitism/bundler/tree/main/packages/sdk。 
npm包位于
https://www.npmjs.com/package/@account-abstraction/sdk。

- bundler：收集UserOperation，验证并推送到EntryPoint合约。git地址https://github.com/eth-infinitism/bundler
- contracts： 主要是EntryPoint，验证UserOperation，并调用AA账户的业务逻辑。git地址https://github.com/eth-infinitism/account-abstraction

# 参考资料

- [EIP-4337](https://eips.ethereum.org/EIPS/eip-4337)
- [EIP-4337 Implementation](https://github.com/eth-infinitism/account-abstraction)
- [Resources](https://eip4337.com/en/latest/resources.html)
- [开发指导1](https://www.notion.so/dapplearning/1-9d99463f25ca4c32a5776f6f2cb57edf)
- [用trampoline开发AA钱包](https://docs.qq.com/doc/DVHBBU0lxR0V4dEV4)

