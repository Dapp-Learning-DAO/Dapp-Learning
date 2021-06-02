## 前言
通过本样例代码，开发者了解到如何对交易进行签名，发送，接收交易回执，验证交易执行结果。同时，样例也提供了事件监听的逻辑代码，开发者可以了解如何对一个事件进行一次或多次监听

## 参考文章
代码参考文章如下   
https://docs.moonbeam.network/getting-started/local-node/deploy-contract/

Kovan 测试网无法使用 http 进行 event 监听，需要使用 web3socket, 可参考如下文章  
https://medium.com/blockcentric/listening-for-smart-contract-events-on-public-blockchains-fdb5a8ac8b9a

## 代码逻辑
1) 私钥获取
新建sk.txt文件， 并填入私钥（metamask自行导出），然后代码自动从中读取

2) 编译合约  
编译合约的主逻辑在 compile.js 中。需要注意的是，这里使用的 solc 版本为 0.8.0 ，如果使用其他的 solc 版本，需要修改对应的代码

3) 部署合约  
调用 deployContract.deploy 方法构造 deploy 交易, 然后调用 signTransaction 方法进行签名, 之后发送交易。 
合约调用分两种，一种不改变区块链状态call, 一种改变世界状态 transaction. 

4) 调用合约查询接口  
调用 incrementer.methods.getNumber() 接口查询合约的 number 变量值

5) 调用合约的修改接口
调用 incrementer.methods.increment 接口增加合约的 number 变量值

## 测试流程
1) 安装依赖
```
npm install
```

2) 执行 index.js 脚本
```
node index.js
```