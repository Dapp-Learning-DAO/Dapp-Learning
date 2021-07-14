## 前言
通过本样例代码，使开发者了解合约编译，部署的基本流程，并掌握基本的 web3js 接口使用方法

本样例发送交易到 Infura , 需要创建相应的 Infura Project, 可以参考如下资料进行创建    
https://ithelp.ithome.com.tw/articles/10202794


## 代码逻辑
1)  私钥获取  
新建 .env 文件， 并填入私钥（metamask自行导出），格式为 "PRIVATE_KEY=xxxx" 然后代码自动从中读取

2)  编译合约  
使用 solc.compile 对合约进行编译

3) 部署合约  
调用 deployContract.deploy 方法构造 deploy 交易, 然后调用 signTransaction 方法进行签名, 之后发送交易。 
合约调用分两种，一种不改变区块链状态call, 一种改变区块链状态 transaction. 


## 测试流程:
1)  安装依赖
```
npm install
```

2) 执行 index.js
```
node index.js
```

## 参考文档
- Web3js官方文档：
  https://web3js.readthedocs.io/en/v1.2.11/getting-started.html  
- 样例代码参考如下链接 
  https://docs.moonbeam.network/getting-started/local-node/deploy-contract/  
- Web3js使用参考文档:  
  https://www.dappuniversity.com/articles/web3-js-intro
- 代码参考文档：
  https://docs.moonbeam.network/getting-started/local-node/deploy-contract/
