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

# 参考资料

[EIP-4337](https://eips.ethereum.org/EIPS/eip-4337)
[EIP-4337 Implementation](https://github.com/eth-infinitism/account-abstraction)
[Resources](https://eip4337.com/en/latest/resources.html)
[开发指导](https://www.notion.so/dapplearning/1-9d99463f25ca4c32a5776f6f2cb57edf)

