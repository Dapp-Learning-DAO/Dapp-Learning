中文 / [English](./README.md)


# Hardhat

Hardhat 是一个编译、部署、测试和调试以太坊应用的开发环境。

它可以帮助开发人员管理和自动化构建智能合约和 dApps 过程中固有的重复性任务，并围绕这一工作流程轻松引入更多功能。这意味着 hardhat 在最核心的地方是编译、运行和测试智能合约。
Hardhat 内置了 Hardhat 网络，这是一个专为开发设计的本地以太坊网络。主要功能有 Solidity 调试，跟踪调用堆栈、console.log()和交易失败时的明确错误信息提示等。

Hardhat Runner 是与 Hardhat 交互的 CLI 命令，是一个可扩展的任务运行器。它是围绕任务和插件的概念设计的。每次你从 CLI 运行 Hardhat 时，你都在运行一个任务。例如，`npx hardhat compile` 运行的是内置的 compile 任务。任务可以调用其他任务，允许定义复杂的工作流程。用户和插件可以覆盖现有的任务，从而定制和扩展工作流程。

## 准备工作 - Preparatory Work

在开始学习 hardhat 之前，你需要提前了解以下知识点：

- dotenv 将私钥存放在 `.env` 文件中可以避免将私钥暴露在服务器上，格式为 "PRIVATE_KEY=xxxx", 然后代码自动从中读取，详情参考 [dotenv](https://www.npmjs.com/package/dotenv)
- npx 想要解决的主要问题，就是调用项目内部安装的模块。详情参考 [npx 使用教程](https://www.ruanyifeng.com/blog/2019/02/npx.html)
- ethers.js 与以太坊网络交互的工具库，相比 web3.js 接口设计更加易于使用（注意 v5 和 v4 接口差别较大） [ethers.js v5 文档](https://docs.ethers.io/v5/)
- mocha.js 测试框架，用于编写合约交互的测试案例 [mochajs 文档](https://mochajs.org/#getting-started)
- chai.js 断言库，辅助测试脚本编写，使用方法参考 [ethereum-waffle chai 使用文档](https://ethereum-waffle.readthedocs.io/en/latest/matchers.html)
- infura 连接区块链的节点服务商，有免费的使用额度，足够开发调试使用 [infura 官网](https://infura.io/)

## 项目结构和配置 hardhat

```sh
mkdir 07-hardhat                // 创建项目文件夹
cd    07-hardhat                // 移动到项目文件夹下
npm install --save-dev hardhat  // 安装hardhat
npx hardhat                     // 创建hardhat项目
```

输入`npx hardhat`后，命令行中会出现如下的界面:

```sh
888    888                      888 888               888
888    888                      888 888               888
888    888                      888 888               888
8888888888  8888b.  888d888 .d88888 88888b.   8888b.  888888
888    888     "88b 888P"  d88" 888 888 "88b     "88b 888
888    888 .d888888 888    888  888 888  888 .d888888 888
888    888 888  888 888    Y88b 888 888  888 888  888 Y88b.
888    888 "Y888888 888     "Y88888 888  888 "Y888888  "Y888

Welcome to Hardhat v2.9.0

? What do you want to do? ...
> Create a basic sample project
  Create an advanced sample project
  Create an advanced sample project that uses TypeScript
  Create an empty hardhat.config.js
  Quit
```

我们使用'Create a basic sample project'选项，创建一个基础项目，后面的两个选项直接敲回车选择默认值。

### 项目结构

一个标准的使用 hardhat 构建的项目通常是这样的：

```sh
contracts/
scripts/
test/
hardhat.config.js
```

- contracts 用于存放 solidity 合约文件
- scripts 用于存放脚本文件，如部署合约的脚本
- test 用于存放测试脚本，通常以 `contractName.test.js` 的形式命名
- `hardhat.config.js` 是 hardhat 的配置文件

### 配置 hardhat

`hardhat.config.js` 配置文件示例

```js
require('@nomiclabs/hardhat-waffle');
require('dotenv').config();

module.exports = {
  networks: {
    // hardhat 内置测试网络（选填）
    hardhat: {
      // 可以设置一个固定的gasPrice，在测试gas消耗的时候会很有用
      gasPrice: 1000000000,
    },
    // 你可以在这里配置任意网络
    // goerli 测试网络
    goerli: {
      // 请将 INFURA_ID 替换成你自己的
      // url: 'https://goerli.infura.io/v3/{INFURA_ID}',
      url: 'https://goerli.infura.io/v3/' + process.env.INFURA_ID, //<---- 在.env文件中配置自己的INFURA_ID

      // 填写测试账户的私钥，可填写多个
      accounts: [process.env.PRIVATE_KEY, ...]
    }
  },
  solidity: {
    version: "0.8.0", // 合约编译的版本，必填
    settings: { // 编译设置，选填
      optimizer: {  // 优化设置
        enabled: true,
        runs: 200
      }
    }
  },
  // 项目路径配置，可指定任意路径，但下列是常用的一种结构
  // sources, tests, scripts 下的目录文件会被自动逐一执行
  paths: {
    sources: "./contracts", // 合约目录
    tests: "./test",  // 测试文件目录
    cache: "./cache", // 缓存目录，由hardhat自动生成
    artifacts: "./artifacts" // 编译结果目录，由hardhat自动生成
  },
  // 测试框架设置
  mocha: {
    timeout: 20000  // 运行单元测试的最大等待时间
  }
}
```

### 内置 hardhat 网络

hardhat 内置了一个特殊的安全测试网络，其名称也叫 `hardhat`, 通常你不需要对他进行特殊配置。该网络会模拟真实区块链网络的运行机制，并为你生成好 10 个测试账户（和 truffle 类似）。

### 使用插件

Hardhat 的很多功能都来自于插件，而作为开发者，你可以自由选择想使用的插件。

例如常用的 waffle 插件，使得 hardhat 可以集成 waffle 框架，进行开发，测试，部署。

```js
// hardhat.config.js
require('@nomiclabs/hardhat-waffle'); // hardhat waffle 插件
...
```

### 安装依赖

1. 安装 nodejs （略）

2. 安装项目依赖：

   ```sh
   npm install --save-dev @nomiclabs/hardhat-waffle ethereum-waffle chai @nomiclabs/hardhat-ethers ethers dotenv
   ```

   或使用 yarn 安装（需要先安装 yarn 依赖）

   ```sh
   yarn add -D hardhat-deploy-ethers ethers chai chai-ethers mocha @types/chai @types/mocha dotenv
   ```

3. 配置私钥和网络：

   在项目文件夹下新建`.env`文件，并且在 `.env` 文件中填写私钥和 infura 节点

   ```js
   PRIVATE_KEY = xxxxxxxxxxxxxxxx; // 替换为你的私钥
   INFURA_ID = yyyyyyyy; // 替换为infura节点
   ```

## usage

hardhat 的用法

### compile

运行如下命令，hardhat 会自动编译配置中 `sources` 路径下的所有合约文件，默认是 `./contracts` 路径。

```sh
npx hardhat compile
```

### test

运行如下命令，hardhat 会自动运行配置中 `tests` 路径下的所有测试文件，默认是 `./test` 路径。

```sh
npx hardhat test
```

也可以指定运行某个特定测试文件

```sh
npx hardhat test ./test/Greeter.test.js
```

### run
运行指定脚本。如果不指定运行网络，会默认在 hardhat 内置网络内运行 (Hardhat Network)。

```sh
npx hardhat run ./scripts/deploy.js
```

指定运行的网络，例如在 goerli 测试网部署合约(请确保钱包地址在 goerli 测试网有足够的 gas 才能成功部署)

```sh
npx hardhat run ./scripts/deploy.js --network goerli
```

### task

hardhat 本身预设了一些程序任务，例如编译合约，运行测试文件，这些其实在 hardhat 中是预先配置好的任务。

实际上你也可以自定义一些 task，比如打印一下当前网络中的账户状态：

```js
// hardhat.config.js
...

task('accounts', 'Prints the list of accounts', async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

...
```

运行 task

```sh
npx hardhat accounts
```

命令行会打印出 10 个测试账户地址

```sh
0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
...
```

### console

hardhat 的控制台模式，实时与链上交互。默认会启动 hardhat 内置网络。

```sh
npx hardhat console
```

控制内置 ethers 和 web3 库，可以直接使用，无须引入。

```js
// hardhat console mode:
// 可以直接使用 async/await 语法
> await ethers.provider.getBlockNumber()  // 0
```

### console.log debug

hardhat 提供了一个 `console.log()` 方法，可以在合约运行时打印日志，方便调试和测试。**此方法仅在 hardhat 内置网络中运行有效。**

在合约中引入 `hardhat/console.sol` 即可使用：

```solidity
import "hardhat/console.sol";

contract Greeter {
  ...

  function setGreeting(string memory _greeting) public {
    console.log("Changing greeting from '%s' to '%s'", greeting, _greeting);
    greeting = _greeting;
  }

}
```

在运行测试文件时，可以看到打印出的日志：

```sh
Changing greeting from 'Hello, world!' to 'hello Dapp-Learning!'
```

## 实操流程

### 编译和测试

1. 编译合约

   ```bash
   npx hardhat compile
   ```

2. 批量运行测试脚本

   ```bash
   npx hardhat test
   ```

3. 部署到测试网：

   ```bash
   npx hardhat run scripts/deploy.js --network <network-name>
   ```

   这里的 `network-name` 替换成你指定的网络名称，这里可以换成 `goerli`，对应配置文件中的网络名称。

## 参考文档

- hardhat 官方文档: <https://hardhat.org/guides/project-setup.html>
- hardhat 中文文档: <https://learnblockchain.cn/docs/hardhat/getting-started/>
- ethers.js 和 hardhat 基础使用讲解: <https://www.bilibili.com/video/BV1Pv411s7Nb>
- <https://rahulsethuram.medium.com/the-new-solidity-dev-stack-buidler-ethers-waffle-typescript-tutorial-f07917de48ae>
- erc20 openzepplin介绍: <https://segmentfault.com/a/1190000015400380>