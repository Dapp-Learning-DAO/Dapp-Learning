# 多签钱包调研

## 一、相关地址
* [合约源码](https://github.com/gnosis/MultiSigWallet/tree/master/contracts)


## 二、合约解读
> 合约地址：https://github.com/gnosis/MultiSigWallet/tree/master/contracts

* MultiSigWallet.sol
* MultiSigWalletFactory.sol
* MultiSigWalletWithDailyLimit.sol
* MultiSigWalletWithDailyLimitFactory.sol
* TestCalls.sol
* TestToken.sol



## 合约接口

* 构造函数

  初始化签名者列表，及每次交易至少需要签名数。

* addOwner 
  
  追加签名者

* replaceOwner

  替换一个现有的签名者
  
* changeRequirement

  变更最低签名数
  
* submitTransaction

  提交一笔交易申请，参数为：合约地址、转账金额、交易data
  
* confirmTransaction

  传入之前提交的交易的id，确认这笔交易可执行，如果确认的人数已达到最低要求，则自动执行该交易
  
* revokeConfirmation

  取消确认一笔自己之前确认过的交易

* executeTransaction

  根据id执行对应的交易，前提是交易已得到足够的确认数
  
* isConfirmed

  判断一笔交易是否已得到足够的确认数
  
* getConfirmationCount

  获取一笔交易当前得到的确认数
  
* getTransactionCount

  查询交易数，两个入参分别是：是否包含处理中的交易、是否包含已处理的交易
  
* getOwners

  获取当前所有可确认交易者
  
* getConfirmations

  查看一笔交易已经得到哪些确认者的确认
  
* getTransactionIds
* 
  查询交易id列表，参数为：from、to、pending（是否包含处理中）、executed（是否包含已处理）


## 操作流程
- 安装依赖
```
yarn
```

- 编译合约
```
npx hardhat compile
```

- 测试合约
```
npx hardhat test
```

- 部署合约
```
npx hardhat run scripts/deploy.js  --network kovan
```


## 参考链接
https://zhuanlan.zhihu.com/p/337823524  
https://github.com/gnosis/MultiSigWallet/tree/master/contracts  
https://medium.com/dsys/now-open-source-friendly-multi-signatures-for-ethereum-d75ca5a0dc5c  
gnosis使用：https://gnosis-safe.io/app/#/welcome  
gnosis合约：https://polygonscan.com/address/0xa6b71e26c5e0845f74c812102ca7114b6a896ab2#code 