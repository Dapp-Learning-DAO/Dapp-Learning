# hardhat-react

## 前言

Dapp 开发中很重要的部分便是前端展示，本样例代码使用 hardhat 结合 react 和 MetaMask，演示如何开发 Dapp 前端页面，以及开发的基本流程及接口调用。开发者需要具备 react 框架开发能力才能很好的理解样例代码.

为方便获取，在 .env 中放入的私钥，格式为 "PRIVATE_KEY=xxxx", 然后代码自动从中读取

## 操作步骤

1. 安装依赖

   ```sh
   npm install
   ```

2. 部署合约

   ```sh
   npx hardhat run scripts/deploy.js --network kovan
   ```

3. 启动 react

   ```sh
   cd frontend
   npm install
   npm start
   ```

4. 尝试在前端页面进行 ERC20 token 转账，观察账户 token 余额变化

## 参考文档

- <https://github.com/Fankouzu/smart-contract/tree/master/Solidity%20Lesson%2005>
- <https://create-react-app.dev/docs/getting-started/>
- <https://github.com/nomiclabs/hardhat-hackathon-boilerplate>
- <https://www.nextjs.cn>
