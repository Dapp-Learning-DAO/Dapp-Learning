# Hardhat

Hardhat 是一个编译、部署、测试和调试以太坊应用的开发环境。它可以帮助开发人员管理和自动化构建智能合约和 dApps 过程中固有的重复性任务，并围绕这一工作流程轻松引入更多功能。这意味着 hardhat 在最核心的地方是编译、运行和测试智能合约。
Hardhat 内置了 Hardhat 网络，这是一个专为开发设计的本地以太坊网络。主要功能有 Solidity 调试，跟踪调用堆栈、console.log()和交易失败时的明确错误信息提示等。   
Hardhat Runner 是与 Hardhat 交互的 CLI 命令，是一个可扩展的任务运行器。它是围绕任务和插件的概念设计的。每次你从 CLI 运行 Hardhat 时，你都在运行一个任务。例如，`npx hardhat compile` 运行的是内置的 compile 任务。任务可以调用其他任务，允许定义复杂的工作流程。用户和插件可以覆盖现有的任务，从而定制和扩展工作流程。

Hardhat 的很多功能都来自于插件，而作为开发者，你可以自由选择想使用的插件。

## preparation

准备知识

- dotenv 将私钥存放在 `.env` 文件中可以避免将私钥暴露在服务器上，格式为 "PRIVATE_KEY=xxxx", 然后代码自动从中读取，详情参考 [dotenv](https://www.npmjs.com/package/dotenv)
- npx 想要解决的主要问题，就是调用项目内部安装的模块。详情参考 [npx 使用教程](https://www.ruanyifeng.com/blog/2019/02/npx.html)
- [ethers.js 和 hardhat 基础使用讲解](https://www.bilibili.com/video/BV1Pv411s7Nb)
- infura 连接区块链的节点服务商，有免费的使用额度，足够开发调试使用 [infura官网](https://infura.io/)

## 实操流程

### 安装依赖

1. 安装 nodejs （略）

2. 安装项目依赖：

  ```
  npm install
  ```

- 3 配置私钥和网络：

  windows:

  ```
  copy .env.example .env
  ```

  / linux:

  ```
  cp  .env.example .env
  ```

	在 `.env` 文件中填写私钥和infura节点

	```js
	PRIVATE_KEY=xxxxxxxxxxxxxxxx // 替换为你的私钥
	INFURA_ID=yyyyyyyy	// 替换为infura节点
	```

- 4 编译合约

  ```
  npx hardhat compile
  ```

- 5 跑测试：(内置节点为 Hardhat Network)

  ```
  npx hardhat test
  ```

- 6 console.log 调试合约:

  合约引入：

  ```
  import "hardhat/console.sol";
  ```

- 7 部署到测试网：

  hardhat.config.js 文件中添加一个 network 条目

  ```
  npx hardhat run scripts/deploy.js --network <network-name>
  ```

## 参考文档

hardhat 官方文档: https://hardhat.org/guides/project-setup.html  
hardhat 中文文档: https://learnblockchain.cn/docs/hardhat/getting-started/
https://rahulsethuram.medium.com/the-new-solidity-dev-stack-buidler-ethers-waffle-typescript-tutorial-f07917de48ae
