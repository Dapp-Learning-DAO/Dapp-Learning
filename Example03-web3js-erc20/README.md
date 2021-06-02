## 前言
本样例演示了 ERC20 合约的基本调用, 让开发者了解 ERC20 合约的基本接口

## 参考文档
 mocha测试框架：
  http://www.ruanyifeng.com/blog/2015/12/a-mocha-tutorial-of-examples.html
  https://pcaaron.github.io/pages/fe/block/improve4.html#%E8%B7%91%E6%B5%8B%E8%AF%95

infura不支持sendTransaciton,只支持sendRawTransaction:
  
Infura has not activated the method eth_sendTransaction because this method needs unlocked accounts on the ethereum node. With the example I've provided above will it also work with infura :)
  
https://ethereum.stackexchange.com/questions/70853/the-method-eth-sendtransaction-does-not-exist-is-not-available-on-infura 

## 代码逻辑
1) 私钥获取
为方便获取，在 sk.txt 中放入的私钥，然后代码自动从中读取

2) 编译合约  
编译合约的主逻辑在 compile.js 中。需要注意的是，这里使用的 solc 版本为 0.5.4 ，如果使用其他的 solc 版本，需要修改对应的代码

3) 部署合约  
调用 deployContract.deploy 方法构造 deploy 交易, 然后调用 signTransaction 方法进行签名, 之后发送交易。 
合约调用分两种，一种不改变区块链状态call, 一种改变世界状态 transaction. 

4) 调用合约
调用 erc20Contract.methods.transfer 接口执行 erc20 合约的转账

## 测试流程
1) 安装依赖
```
npm install
```

2) 执行测试
```
node index.js
```