## Truffle 介绍
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Truffle是基于Solidity语言的一套开发框架，它简化了去中心化应用（Dapp）的构建和管理流程。本身是采用Javascript编写，支持智能合约的编译、部署和测试。
- [Truffle 官网](https://www.trufflesuite.com/docs/truffle/quickstart)

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;truffle开发框架提供了很多功能，简化了我们的开发、编译、部署与调试过程：

 - 内置了智能合约编译、链接、部署和二进制文件的管理
 - 方便快速开发的合约自动化测试
 - 方便扩展的、脚本化的部署与发布框架
 - 方便的网络管理功能。不论是公有网络还是私有网络
 - 基于erc190标准，使用EthPM ＆ NPM进行依赖包管理
 - 内置控制台功能。项目构建后，可以直接在命令行调用输出结果，方便了开发调试
 - 可配的构建流程，支持持续集成。
 - 支持外部脚本的执行


## 文件说明
### 目录结构
 - contracts/: Solidity合约目录

 - migrations/: 部署脚本文件目录

 - test/: 测试脚本目录，参考 如何测试应用？

 - truffle-config.js: Truffle 配置文件

### 各文件作用
1. contracts/SimpleToken.sol： 这是一个用 Solidity 编写的 erc20 代币 智能合约.
2. migrations/1_initial_migration.js： 这是一个部署脚本，用来部署 Migrations 合约，对应 Migrations.sol 文件。
3. truffle-config.js （之前是 truffle.js）： Truffle 配置文件, 用来设置网络信息，和其他项目相关的设置。当我们使用内建的默认的Truffle命令时，这个文件留空也是可以的。

## 测试流程
1) 安装 truffle
```
npm install -g truffle
```

2) 测试合约
```
truffle test
```
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;这里，使用 "truffle test" 后，truffle 会启动内置的 test 网络，同时执行 测试 test 目录下的所有脚本，如果想单独测试某个脚本，可以
执行 "truffle test ./test/simpletoken.js"

3) 编译合约
```
truffle compile 
```

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;执行成功后，会输出类似如下信息。从输出信息可以看到， truffle 会把 contracts 目录下的所有合约进行编译
```
Compiling .\contracts\SimpleToken.sol...

Writing artifacts to .\build\contracts
```

4) 部署合约   

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;在 truffle-config.js 里面，可以配置 truffle 使用的以太网络，其中就包括 truffle test 使用的 "test" 网络。
这里，直接执行 truffle migrate 报没有找到 test 网络，因为 truffle 不会启动内置的 test 网络。所以这里我们使用 kovan 进行 truffle 合约部署
```
truffle migrate --network kovan
```

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;当多次执行 truffle migrate 的时候，会出 "Network update to date", 然后不执行合约部署的情况，这个时候需要执行如下的 truffle 命令
```
truffle migrate --network kovan --reset
```

## 在 infura 测试合约
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;在 test 目录下存在 sol 和 js 类型的文件，truffle 支持这两种类型的测试文件。但目前测试发现，如果连接的测试网络为 infura ，则执行
sol 的测试文件会报失败。所以，这里我们连接到 infura 进行测试时，只能使用 js 的测试文件。

- 修改 simpletoke.js 

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;修改 simpletoken.js 文件，把其中的 accounts[1] 修改为 "0x5DF22be367b95788Cd51C7dbdf7c7aB70fE856EE" ( 为例 ), 然后执行
如下命令。执行过程可能比较慢，需要耐心等待一下。
```
truffle test ./test/simpletoken.js --network kovan
```
