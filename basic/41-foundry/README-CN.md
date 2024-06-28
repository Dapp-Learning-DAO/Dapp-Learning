# 使用 Foundry 进行智能合约开发

[Foundry](https://github.com/gakonst/foundry) 是用 Rust 写成的以太坊智能合约开发工具，它包括三个核心工具 :

- `forge`:  一套以太坊智能合约的测试框架
- `cast`:  一组与 EVM 生态相关的实用工具，包括编码、解码、与智能合约交互等功能
- `Anvil`: 本地以太坊节点
- `Chisel`: Foundry 集成的 Solidity REPL。

## 安装 forge、 cast、 anvil 和 chisel

首先安装 foundryup， 它是 foundry 的辅助安装工具

```sh
# macos
brew install libusb
curl -L https://foundry.paradigm.xyz | sh
# zsh shell
source ~/.zshenv
```

再用 foundryup 安装 forge、 cast、 anvil 和 chisel

foundryup 单独运行将安装最新的（每晚）预编译的二进制文件 :forge、 cast、 anvil 和 chisel

```sh
foundryup
```

## 用 forge 新建项目

```sh
forge init my_project
```

新建的项目结构如下 :

```
my_project
├── foundry.toml
├── lib
│   └── forge-std
|   |  └── scripts
|   |  |  └── vm.py
|   |  └── test
|   |  |  └── ...
|   |  └── src
|   |  |  └── ...
|   |  └── ...
│   └── ...
├── README.md
└── script
|   └── Counter.s.sol
├── src
│   └── Counter.sol
└── test
    └── Counter.t.sol
```

其中 :

- `foundry.toml` 是配置文件
    - `forge config --basic` 可查看当前的基础设置
    - `forge config` 可查看当前所有设置
- `src` 下面放你写的合约
- `test` 下面放合约对应的测试文件
- `script` 下面放自定义测试通用文件
- `lib` 目录里放开发依赖的库
    - 新建项目安装了测试需要的 forge-std 库(DSTest的超集) ~~将 ds-test 集成到其中(新版已移除此依赖)~~

### VSCode 集成

可以通过安装 [VSCode Solidity](https://github.com/juanfranblanco/vscode-solidity) 扩展来获得对 Visual Studio Code 的 Solidity 支持。

Foundry 支持 VSCode 的集成开发，配置只需要进入项目目录然后执行 :

```sh
cd my_project
forge remappings > remappings.txt
```

## 调用三方库

foundry 可以直接安装调用 GitHub API 下载上面开源的三方库。

安装第三方库 - OpenZeppelin :

```sh
forge install openzeppelin/openzeppelin-contracts
```

其中 `openzeppelin` 为 GitHub 上的账号名，斜杠 `/` 后面
接用户的 repo。

安装后导入库需要在合约文件前面添加，如添加 openzeppelin 的 ERC20 :

```sh
import "openzeppelin/contracts/token/ERC20/ERC20.sol"
```

安装第三方库 - solmate :

```sh
forge install transmissions11/solmate
# 依赖的特定版本, 默认为 master
forge install transmissions11/solmate@master
forge install transmissions11/solmate@v7
forge install transmissions11/solmate@c892309
```

**NOTE** : 如果使用 VSCode 的话，安装新的第三方库之后需要重新执行
`forge remappings > remappings.txt`

## 更新第三方库

1. Update a dependency:
```sh
forge update lib/solmate
```

2. Update all dependencies:
```sh
forge update
```

## 编译合约

```sh
forge build
```

编译后的合约会在 `out` 目录里

## 测试合约

```solidity
// Contract.t.sol

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";

contract ContractTest is Test {
    function setUp() public {}

    function testExample() public {
        assertTrue(true);
    }
}
```

上面是新建项目给出的测试文件模板。

用 `forge test` 进行测试

```
[⠔] Compiling...
[⠘] Compiling 3 files with 0.8.10
Compiler run successful

Running 1 test for ContractTest.json:ContractTest
[PASS] testExample() (gas: 120)
```

forge 会搜索 src 下的所有合约，寻找含有以 test 开头函数的合约作为测试合约，对于每个测试合约 :

- 其中的 `setUp()` 函数会用作基本设置，在每个测试用例前运行
- 以 `test` 开头的函数被用作测试用例
- 以 `testFail` 开头的函数同样被用作测试用例，但当其 revert 时才视为测试通过

通常我们会把测试文件放到 `src/test` 下面，然后以 `.t.sol` 作为文件名的结尾。

模板中引入的 ds-test 库提供了 assertTrue、assertEq 等测试需要的断言功能，具体能用到的函数可以查看其[源码](https://github.com/dapphub/ds-test/blob/master/src/test.sol)。

要测试具体某个合约或者某个用例，可以使用下面命令

```sh
# only run test methods in contracts matching regex
forge test --match-contract <CONTRACT_PATTERN>

# only run test methods matching regex
forge test --match-test <TEST_PATTERN>

# only run test methods in source files at path matching regex.
# Requires absolute path
forge test --match-path <PATH_PATTERN>
```

此外，还可以通过 -v flag 来设置测试输出的详尽程度

- `-vv` 输出所有测试的 logs
- `-vvv` 输出失败测试的 stack trace
- `-vvvv` 输出 stack trace， 并输出失败用例的 setup
- `-vvvvv` 输出 stack trace 和 setup

其中 stack trace 可以看到函数的调用栈和 emit 的 event

```
[<Gas Usage>] <Contract>::<Function>(<Parameters>)
    ├─ [<Gas Usage>] <Contract>::<Function>(<Parameters>)
    │   ├─ ← emit <event>
    │   └─ ← <Return Value>
    └─ ← <Return Value>
```

如果使用 `forge test --gas-report` ，还能输出测试中合约每个函数的 gas 数据，样例输出如下:

```
╭───────────────────────┬─────────────────┬────────┬────────┬────────┬─────────╮
│ MockERC1155 contract  ┆                 ┆        ┆        ┆        ┆         │
╞═══════════════════════╪═════════════════╪════════╪════════╪════════╪═════════╡
│ Deployment Cost       ┆ Deployment Size ┆        ┆        ┆        ┆         │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌┤
│ 1082720               ┆ 5440            ┆        ┆        ┆        ┆         │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌┤
│ Function Name         ┆ min             ┆ avg    ┆ median ┆ max    ┆ # calls │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌┤
│ balanceOf             ┆ 596             ┆ 596    ┆ 596    ┆ 596    ┆ 44      │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌┤
│ balanceOfBatch        ┆ 2363            ┆ 4005   ┆ 4005   ┆ 5647   ┆ 2       │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌┤
│ batchBurn             ┆ 2126            ┆ 5560   ┆ 2584   ┆ 11970  ┆ 3       │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌┤
│ batchMint             ┆ 2444            ┆ 135299 ┆ 125081 ┆ 438531 ┆ 18      │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌┤
│ burn                  ┆ 814             ┆ 2117   ┆ 2117   ┆ 3421   ┆ 2       │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌┤
│ isApprovedForAll      ┆ 749             ┆ 749    ┆ 749    ┆ 749    ┆ 1       │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌┤
│ mint                  ┆ 26039           ┆ 31943  ┆ 27685  ┆ 118859 ┆ 22      │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌┤
│ safeBatchTransferFrom ┆ 2561            ┆ 137750 ┆ 126910 ┆ 461304 ┆ 8       │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌┤
│ safeTransferFrom      ┆ 1335            ┆ 34505  ┆ 28103  ┆ 139557 ┆ 9       │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌┤
│ setApprovalForAll     ┆ 24485           ┆ 24485  ┆ 24485  ┆ 24485  ┆ 12      │
╰───────────────────────┴─────────────────┴────────┴────────┴────────┴─────────╯
```

另外，forge 支持在 forked 以太环境上进行测试

```sh
forge test --fork-url <your_rpc_url>
```

还可以进一步设定 fork 的区块

```sh
forge test --fork-url <your_rpc_url> --fork-block-number <block-number>
```

除此之外，forge 还有 `CheatCodes` 功能，它可以用来模拟和操纵 EVM 的状态

```solidity
// Contract
pragma solidity ^0.8.13;

contract OwnerUpOnly {
  address public immutable owner;
  uint256 public count;

  constructor() {
    owner = msg.sender;
  }

  function increment() external {
    require(
      msg.sender == owner,
      "only the owner can increment the count"
    );
    count++;
  }
}

// ContactTest
import {Test} from "forge-std/Test.sol";

interface CheatCodes {
  function prank(address) external;
}

contract OwnerUpOnlyTest is Test {
  CheatCodes cheats = CheatCodes(HEVM_ADDRESS);
  OwnerUpOnly upOnly;

  function setUp() public {
    upOnly = new OwnerUpOnly();
  }

  function testIncrementAsOwner() public {
    assertEq(upOnly.count(), 0);
    upOnly.increment();
    assertEq(upOnly.count(), 1);
  }

  function testFailIncrementAsNotOwner() public {
    cheats.prank(address(0));
    upOnly.increment();
  }
}
```

例如在上述代码中，`cheats.prank(address(0))` 将下一次 call 的 msg.sender 设置成了 adderss(0)，让 `upOnly.increment()` revert，从而来测试是否正确地拒绝了来自非 owner 的调用。

关于 cheatcodes 更多的功能可以查阅 [Cheatcodes Reference](https://onbjerg.github.io/foundry-book/reference/cheatcodes.html)

forge 还支持 fuzz testing

```solidity
// Contract
pragma solidity ^0.8.13;

contract Safe {
  receive() external payable {}

  function withdraw() external {
    payable(msg.sender).transfer(address(this).balance);
  }
}

// Test
import {Test} from "forge-std/Test.sol";

contract SafeTest is Test {
  Safe safe;

  // Needed so the test contract itself can receive ether
  receive() external payable {}

  function setUp() public {
    safe = new Safe();
  }

  function testWithdraw(uint256 amount) public {
    payable(address(safe)).transfer(amount);
    uint256 preBalance = address(this).balance;
    safe.withdraw();
    uint256 postBalance = address(this).balance;
    assertEq(preBalance + amount, postBalance);
  }
}
```

例如上述代码的 `testWithdraw` 函数，forge 会多次喂入随机输入来进行测试。运行的次数可以通过配置文件里的 fuzz_runs 设置，默认是 256 次。

## 部署合约

```sh
forge create --rpc-url <your_rpc_url> --private-key <your_private_key> src/MyContract.sol:MyContract --constructor-args <arg0> <arg1> ...
```

如果使用`-i 或 --interactive` flag，则不用将私钥写进命令里，按下回车之后会提示你输入私钥，这样可以避免私钥信息被 shell history 记录

就目前阶段而言，foundry 在合约部署方面不如 Hardhat 方便，若想要在 Hardhat 项目中使用 foundry 进行代码测试，可以参考这篇文档 :

+  [在 Hardhat 项目中配置 Foundry](use-foundry-in-hardhat/README.md)

**UPDATE**: 目前 foundry 已经支持使用脚本部署合约了。只需要将一些变量设置好，然后
添加一个新的 script 文件，就可以通过执行脚本部署。

- 在项目目录中创建 `.env` 文件并设置对应的变量 :

```sh
PRIVATE_KEY=
MAINNET_RPC_URL=
RINKEBY_RPC_URL=
ANVIL_RPC_URL="http://localhost:8545"
ETHERSCAN_KEY=
```

- 在 `foundry.toml` 中添加配置 :

```yaml
[rpc_endpoints]
mainnet = "${MAINNET_RPC_URL}"
rinkeby = "${RINKEBY_RPC_URL}"
anvil = "${ANVIL_RPC_URL}"

[etherscan]
mainnet = { key = "${ETHERSCAN_KEY}" }
rinkeby = { key = "${ETHERSCAN_KEY}" }
```

- 在项目目录中创建一个 `script/MyNFT.s.sol`（以部署一个 NFT 合约为例） :

```solidity
//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.10;

import "@forge-std/Script.sol";
import "../src/MyNFT.sol";

contract DeployMyNFT is Script {
    function run() external {
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));

        console.log("The Deployer address:", deployer);
        console.log("Balance is:", deployer.balance);

        vm.startBroadcast(deployer);

        MyNFT nft = new MyNFT("MyNFT", "MYT", "https://www.example.com");
        vm.stopBroadcast();

        console.log("MyNFT deployed at:", address(nft));
    }
}
```

最后执行 :

```sh
# load the configs
source .env
# deploy
forge script DeployMyNFT --rpc--url <RCP_URL> --broadcast --verify
```

其中 `--verify` 参数是将合约代码开源。

完整的示例代码见 :[my_nft](https://github.com/oneforalone/my_nft)

## Debug 合约

foundry 也支持 debug 合约，可 debug 本地的合约或链上的 tx，
与 Remix 唯一的差别是 foundry 中没有 storage。

- Debug 本地合约

```sh
forge test --debug <FunctionName>
```

如 :

```sh
forge test --debug --testSetter
```

或 :

```sh
forge debug --debug <contract-file> --sig <FunctionSignature>
```

如 :

```sh
forge debug --debug src/Hello.sol --sig "setter(string)" "hello"
```

- Debug 链上 tx

```sh
cast run --debug --rpc-url $ETH_RPC_URL <tx-hash>
```

其中 `$ETH_RPC_URL` 就是调用的节点的 RPC，可以直接写或者将 RPC 设置为
`ETH_RPC_URL` 变量。`<tx-hash>` 为需要 debug 的 tx 的哈希值.

如 :

```sh
cast run --debug $ETH_RPC_URL 0x1126aa5e5b648eebad1c88141e5142cf0a4082e6ccf9fed77d69a190c21724a3
```

- debug 窗口的快捷键参考 :[Foundry Debugger](https://book.getfoundry.sh/forge/debugger#navigating)

## 与合约交互

```sh
# perform a call
cast call <contract-address> <func-sig> [args] --rpc-url <your_rpc_url>

# perform a send
cast send <contract-address> <func-sig> <args> --rpc-url <your_rpc_url> --private-key <private_key>
```

## Anvil 使用方法

Anvil 是 Foundry 提供的本地测试网节点，你可以将其用于测试前端或通过 RPC 进行交互的合约。

启动测试节点 :

```sh
anvil
```

这条命令启动一个本地节点，默认监听端口 `8545` RPC 连接，可以通过 `--port` 参数指定端口。使用 `--account <NUM>` 可以查看可使用的账户和私钥列表 :

```sh
anvil --accounts 10
```

同时，还可以使用 anvil 分叉以太坊进行测试 :

```sh
anvil --hardfork latest
```

更多 `anvil` 的功能可以查看 [Anvil 文档](https://book.getfoundry.sh/reference/anvil/)。


## Chisel 使用方法

Chisel 是 Foundry 提供的高级 Solidity REPL。它可用于在本地或分叉网络上快速测试 Solidity 片段。

REPL（Read-Eval-Print Loop）是一种交互式命令行工具，它允许用户输入命令并立即查看结果。也是一种编程环境，通常用于解释性语言，如Python，Ruby和JavaScript。

在一个REPL环境中，用户可以输入一行代码或一条命令，然后该代码或命令会被解释器或编译器立即执行，并将结果返回给用户。用户可以根据返回的结果进行进一步的操作或输入新的代码。这种即时反馈的能力使得REPL成为学习和调试代码的有用工具。

要使用 Chisel，只需键入 chisel。然后开始编写 Solidity 代码！Chisel 会对每次输入提供详细反馈。

Chisel 可在 Foundry 项目内外使用。如果二进制文件在 Foundry 项目根目录下执行，Chisel 将继承项目的配置选项。

```sh
# 进入 REPL
chisel
# Welcome to Chisel! Type `!help` to show available commands.
# 编写 Solidity 代码
uint val = 8
# 打印变量
val
# keccak256 运算
keccak256(abi.encodePacked(val))
# 退出 Chisel !quit 或 !q
!q
```

## 参考资料

- [paradigm foundry](https://www.paradigm.xyz/2021/12/introducing-the-foundry-ethereum-development-toolbox)
- [ds-test](https://github.com/dapphub/ds-test/blob/master/src/test.sol)
- [The Foundry Book](https://onbjerg.github.io/foundry-book/index.html)
- [rebase code day Reference PPT](https://learnblockchain.cn/article/3749)
- [rebase code day Reference code base](https://github.com/bixia/solidity-dev)
- [Video: Intro to Foundry](https://www.youtube.com/watch?v=fNMfMxGxeag)
- [ERC20 foundry](https://learnblockchain.cn/article/3972)
- [The Foundry EVM Development Environment](https://medium.com/@jtriley15/the-foundry-evm-development-environment-f198f2e4c372)
