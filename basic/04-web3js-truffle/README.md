## Truffle 介绍

Truffle 是基于 Solidity 语言的一套开发框架，它简化了去中心化应用（Dapp）的构建和管理流程。本身是采用 Javascript 编写，支持智能合约的编译、部署和测试。

- [Truffle 官网](https://www.trufflesuite.com/docs/truffle/quickstart)

truffle 开发框架提供了很多功能，简化了我们的开发、编译、部署与调试过程：

- 内置了智能合约编译、链接、部署和二进制文件的管理
- 方便快速开发的合约自动化测试
- 方便扩展的、脚本化的部署与发布框架
- 方便的网络管理功能。不论是公有网络还是私有网络
- 基于 erc190 标准，使用 EthPM ＆ NPM 进行依赖包管理
- 内置控制台功能。项目构建后，可以直接在命令行调用输出结果，方便了开发调试
- 可配的构建流程，支持持续集成。
- 支持外部脚本的执行

## 文件说明

### 目录结构

- contracts/: Solidity 合约目录

- migrations/: 部署脚本文件目录

- test/: 测试脚本目录，参考 如何测试应用？

- truffle-config.js: Truffle 配置文件

### 各文件作用

1. contracts/SimpleToken.sol： 这是一个用 Solidity 编写的 erc20 代币 智能合约.
2. migrations/1_initial_migration.js： 这是一个部署脚本，用来部署 Migrations 合约，对应 Migrations.sol 文件。
3. truffle-config.js （之前是 truffle.js）： Truffle 配置文件, 用来设置网络信息，和其他项目相关的设置。当我们使用内建的默认的 Truffle 命令时，这个文件留空也是可以的。

## 测试流程

1. 安装 truffle

```bash
npm install -g truffle
```

2. 测试合约

```bash
truffle test
```

这里，使用 "truffle test" 后，truffle 会启动内置的 test 网络，同时执行 测试 test 目录下的所有脚本，如果想单独测试某个脚本，可以
执行 "truffle test ./test/simpletoken.js"。如果truffle test执行过程中出现：Could not find a compiler version matching 0.8.2等信息，但是查看truffle compile --list，发现truffle在此范内，尝试使用sudo truffle test，可能是由于权限的原因导致，具体是哪个文件的权限，暂时不可知。

3. 编译合约

```bash
truffle compile
```

执行成功后，会输出类似如下信息。从输出信息可以看到， truffle 会把 contracts 目录下的所有合约进行编译

```bash
Compiling .\contracts\SimpleToken.sol...

Writing artifacts to .\build\contracts
```

4. 部署合约

在 truffle-config.js 里面，可以配置 truffle 使用的以太网络，其中就包括 truffle test 使用的 "test" 网络。
这里，直接执行 truffle migrate 报没有找到 test 网络，因为 truffle 不会启动内置的 test 网络。所以这里我们使用 kovan 进行 truffle 合约部署

```bash
truffle migrate --network kovan
```

当多次执行 truffle migrate 的时候，可能会出 "Network update to date", 然后不执行合约部署的情况，这个时候需要执行如下的 truffle 命令

```bash
truffle migrate --network kovan --reset
```

## 在 infura 测试合约

在 test 目录下存在 sol 和 js 类型的文件，truffle 支持这两种类型的测试文件。但目前测试发现，如果连接的测试网络为 infura ，则执行
sol 的测试文件会报失败。所以，这里我们连接到 infura 进行测试时，只能使用 js 的测试文件。

- 修改 simpletoke.js

修改 simpletoken.js 文件，把其中的 accounts[1] 修改为 "0x5DF22be367b95788Cd51C7dbdf7c7aB70fE856EE" ( 为例 ), 然后执行
如下命令。执行过程可能比较慢，需要耐心等待一下。

```bash
truffle test ./test/simpletoken.js --network kovan
```

## 在本地测试合约

运行 truffle develop，系统会给出 10 个测试账号，包括钱包地址和私钥。

```bash
$ truffle develop
Truffle Develop started at http://127.0.0.1:9545/

Accounts:
(0) 0x9a3f188e2c161ff4482aeb045546644b8d67120b
(1) 0x5cbbdd0348822e3e1714364d2181685adc0e6d8a
(2) 0x4b584bc2696c12684ec3368baff27a882b7b2a5e
(3) 0xa14784c20cbfd1a11bf29275c2f645c504def5ad
(4) 0x5dce815d7cc51366467537b483e9c67681cb1cb7
(5) 0x1765e4c4e3f0ddb10f1f99cfaea746ea7917a736
(6) 0xd885baef12d93f0d8f67c4dbd6150b0841009098
(7) 0x9de5081329d2795990d701a0baae889322786647
(8) 0x5e829e607a498a2d9df206f02e9ee8ae9ad4c67c
(9) 0x29b3614d41ff6a3c8c16871a82d0e407e8a5b225

Private Keys:
(0) 0a8d9e2a470aedfabe279f16f629c5054a47d69b7d66d17ba65cdd7ca99876e1
(1) 1920e755c5a37c78e8926559b20df9631f88153a5b1335d2d53bf2dde0da796f
(2) 394d687218146c92adc5bd46600360bcc42f0a261859b2c79501dea5eb264ffe
(3) 30f3d558a203da5a9b6d9d194836c2c2b08799e92eb2d9f18ef445878be98c34
(4) 97bd6ec766613a0235ffb7b4c69bab601702e75b68403842ba21bb5a2bc3786a
(5) 9372baed783bb62ad3639f10e24fda0580490845735da62666e87353a8625ed0
(6) 0a8e8fa6e04b3bfb06cb12cc86f3beb168fa4f9e658fd7fb794096af8fa6559e
(7) 872707416f98cb7d8b3db925e4b4273b77e382753893ee9cf2e19ce89842d12a
(8) 82daa8ffc47246bbf0cb1bdc574658a98c1571a47bd647b18f7986c63ca47cff
(9) 040cdda01e0b34c00c39877078af2015bd16125fb4fabf1d7153b679e209409f

```

选择任意一个私钥，将其放置在 truffle-config.js 中 mnemonic 变量中。

例如，原代码是

- const mnemonic = fs.readFileSync('./sk.txt').toString().trim()

修改后的代码是

- const mnemonic = "0a8d9e2a470aedfabe279f16f629c5054a47d69b7d66d17ba65cdd7ca99876e1"

接下来配置本地网络参数，将下面 network 属性中 development 注释打开，host 配置成本地，port 配置成 truffle develop 给出的端口地址，如本例中端口是 9545。network_id 保留原状。

```js
     development: {
       host: "127.0.0.1",
       port: 9545,
       network_id: "*"
     },
```

配置好以后即可运行 truffle compile 进行编译，truffle migrate 进行部署，truffle test 进行测试。
测试成功后可以看到

```bash
> Artifacts written to C:\Users\Highland\AppData\Local\Temp\test--33840-ApHyOzehxOdp
> Compiled successfully using:
   - solc: 0.8.0+commit.c7dfd78e.Emscripten.clang



  TestSimpleToken
    √ testInitialBalanceUsingDeployedContract (1802ms)
    √ testTransfer (1723ms)

  Contract: SimpleToken
    √ Should put 100000 to the 0x9A3f188e2C161ff4482AEB045546644B8d67120B (1773ms)
    √ Transfer 100 to other account (2342ms)


  4 passing (32s)

```

## 参考资料

- <https://learnblockchain.cn/docs/solidity/contracts.html>

- <https://solidity-cn.readthedocs.io/zh/develop/>
