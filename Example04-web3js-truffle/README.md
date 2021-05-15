# Truffle 介绍
Truffle是基于Solidity语言的一套开发框架，它简化了去中心化应用（Dapp）的构建和管理流程。本身是采用Javascript编写，支持智能合约的编译、部署和测试。

truffle开发框架提供了很多功能，简化了我们的开发、编译、部署与调试过程：

 - 内置了智能合约编译、链接、部署和二进制文件的管理
 - 方便快速开发的合约自动化测试
 - 方便扩展的、脚本化的部署与发布框架
 - 方便的网络管理功能。不论是公有网络还是私有网络
 - 基于erc190标准，使用EthPM ＆ NPM进行依赖包管理
 - 内置控制台功能。项目构建后，可以直接在命令行调用输出结果，方便了开发调试
 - 可配的构建流程，支持持续集成。
 - 支持外部脚本的执行

[Truffle 官网](https://www.trufflesuite.com/docs/truffle/quickstart)

# 测试流程
## 安装 truffle
```
npm install -g truffle
```

## 测试合约
```
truffle test ./test/metacoin.js
```

这里，使用 "truffle test" 后，truffle 会启动内置的 test 网络，同时执行 metacoin.js 这个测试脚本。如果想测试 test 目录下的所有脚本，可直接执行 truffle test

## 编译合约
```
truffle compile 
```

执行成功后，会输出类似如下信息。从输出信息可以看到， truffle 会把 contracts 目录下的所有合约进行编译
```
Compiling .\contracts\ConvertLib.sol...
Compiling .\contracts\MetaCoin.sol...
Compiling .\contracts\Migrations.sol...

Writing artifacts to .\build\contracts
```

## 部署合约
在 truffle-config.js 里面，可以配置 truffle 使用的以太网络，其中就包括 truffle test 使用的 "test" 网络。
这里，直接执行 truffle migrate 报没有找到 test 网络，因为 truffle 不会启动内置的 test 网络。所以这里我们使用 kovan 进行 truffle 合约部署
```
truffle migrate --network kovan
```

当多次执行 truffle migrate 的时候，会出 "Network update to date", 然后不执行合约部署的情况，这个时候需要执行如下的 truffle 命令
```
truffle migrate --network kovan --reset
```


