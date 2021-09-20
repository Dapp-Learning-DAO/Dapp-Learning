## 前言
本样例演示了使用 ethers.js 调用 ERC20 合约的开发流程

## 代码逻辑
1) 私钥获取  
为方便获取，在 .env 中放入的私钥，格式为 "PRIVATE_KEY=xxxx", 然后代码自动从中读取

2) ERC20 合约部署  
通过 deploy.js 进行部署，样例中链接的测试网为 Kovan, 对应需要使用有 Ether 的账户进行发送

3) 合约调用  
调用 erc20 的 transfer, balanceof 接口, 验证合约部署结果

4) 事件监听   
之后使用 providerContract.once 和 providerContract.on 对 Transfer 事件进行一次和多次的监听


## 测试流程
1) 安装依赖
```
npm install
```

2) 执行测试
```
node index.js
```

## 参考文档   
官方文档: 
https://docs.ethers.io/v4/api-providers.html  
https://docs.ethers.io/v5/getting-started/#getting-started--contracts    
中文文档: 
https://learnblockchain.cn/docs/ethers.js/api-providers.html  
http://zhaozhiming.github.io/blog/2018/04/25/how-to-use-ethers-dot-js/   
