# 参考文章
代码参考文章如下
https://docs.moonbeam.network/getting-started/local-node/deploy-contract/

# 代码逻辑
## 私钥获取
为方便获取，在 sk.txt 中放入 ganache-cli 的私钥，然后代码自动从中读取

## 编译合约  
编译合约的主逻辑在 compile.js 中。需要注意的是，这里使用的 solc 版本为 0.8.0 ，如果使用其他的 solc 版本，需要修改对应的代码

## 部署合约  
调用 deployContract.deploy 方法构造 deploy 交易, 然后调用 signTransaction 方法进行签名, 之后发送交易。 
合约调用分两种，一种不改变区块链状态call, 一种改变世界状态 transaction. 

## 调用合约查询接口  
调用 incrementer.methods.getNumber() 接口查询合约的 number 变量值

## 调用合约的修改接口
调用 incrementer.methods.increment 接口增加合约的 number 变量值

# 测试流程
## 安装依赖
```
npm install
```

## 执行测试
```
node index.js
```