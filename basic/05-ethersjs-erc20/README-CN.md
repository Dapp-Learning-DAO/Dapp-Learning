# ethersjs-erc20

## 前言

本样例演示了使用 `ethers.js` 调用 `ERC20` 合约的开发流程

`web3.js`与`ethers.js`的区别参见[这里](./web3-vs-ethers/README-cn.md)

## 代码逻辑

1. ERC20 合约部署  
   通过 `deploy.js` 进行部署，样例中链接的测试网为 Goerli, 对应需要使用有 Ether 的账户进行发送

2. 合约调用  
   调用 erc20 的 `transfer`, `balanceof` 接口, 验证合约部署结果

3. 事件监听  
   之后使用 `providerContract.once` 和 `providerContract.on` 对 Transfer 事件进行一次和多次的监听

## 测试流程

1. 安装依赖

   ```js
   npm install
   // 本教程使用的 node 版本为 v20.11.0
   ```

2. 配置 .env

   ```sh
   cp .env.example .env

   ## 修改 .env 中的 INFURA_ID 和 PRIVATE_KEY 为实际的值
   PRIVATE_KEY=xxxxxxxxxxxxxxxx
   INFURA_ID=yyyyyyyy
   ```

3. 执行测试

   ```sh
   node index.js
   ```

4. 查看 mempool 中 pending 的交易

   ```sh
   node mempool.js
   ```

## 参考文档

官方文档:

- <https://docs.ethers.io/v4/api-providers.html>
- <https://docs.ethers.io/v5/getting-started/#getting-started--contracts>

中文文档:

- <https://learnblockchain.cn/docs/ethers.js/api-providers.html>
- <http://zhaozhiming.github.io/2018/04/25/how-to-use-ethers-dot-js/>
