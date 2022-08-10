# 使用 Foundry 进行智能合约开发

[Foundry](https://github.com/gakonst/foundry) 是用 Rust 写成的以太坊智能合约开发工具，它包括三个核心工具：

- `forge`:  一套以太坊智能合约的测试框架
- `cast`:  一组与 EVM 生态相关的实用工具，包括编码、解码、与智能合约交互等功能
- `Anvil`: 本地以太坊节点

## 安装 forge、 cast 和 anvil

首先安装 foundryup， 它是 foundry 的辅助安装工具

```bash
curl -L https://foundry.paradigm.xyz | bash
```

再用 foundryup 安装 forge、 cast 和 anvil

```bash
brew install libusb
foundryup
```

## 用 forge 新建项目

```bash
forge init my_project
```

新建的项目结构如下：

```
my_project
├── foundry.toml
├── lib
│   └── ds-test
│       └── ...
└── src
    ├── Contract.sol
    └── test
        └── Contract.t.sol
```

其中：

- `foundry.toml` 是配置文件
    - `forge config --basic` 可查看当前的基础设置
    - `forge config` 可查看当前所有设置
- `src` 下面放你写的合约
- `src/test` 下放合约对应的测试文件
- `lib` 目录里放开发依赖的库
    - 新建项目安装了测试需要的 ds-test 库

## 编译合约

```bash
forge build
```

编译后的合约会在 `out` 目录里

## 测试合约

```solidity
// Contract.t.sol

// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

import "ds-test/test.sol";

contract ContractTest is DSTest {
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

forge 会搜索 src 下的所有合约，寻找含有以 test 开头函数的合约作为测试合约，对于每个测试合约：

- 其中的 `setUp()` 函数会用作基本设置，在每个测试用例前运行
- 以 `test` 开头的函数被用作测试用例
- 以 `testFail` 开头的函数同样被用作测试用例，但当其 revert 时才视为测试通过

通常我们会把测试文件放到 `src/test` 下面，然后以 `.t.sol` 作为文件名的结尾。

模板中引入的 ds-test 库提供了 assertTrue、assertEq 等测试需要的断言功能，具体能用到的函数可以查看其[源码](https://github.com/dapphub/ds-test/blob/master/src/test.sol)。

要测试具体某个合约或者某个用例，可以使用下面命令

```bash
// only run test methods in contracts matching regex
forge test --match-contract <CONTRACT_PATTERN>

// only run test methods matching regex
forge test --match-test <TEST_PATTERN>

// only run test methods in source files at path matching regex.
// Requires absolute path
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

```bash
forge test --fork-url <your_rpc_url>
```

还可以进一步设定 fork 的区块

```bash
forge test --fork-url <your_rpc_url> --fork-block-number <block-number>
```

除此之外，forge 还有 `CheatCodes` 功能，它可以用来模拟和操纵 EVM 的状态

```solidity
// Contract
pragma solidity ^0.8.0;

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
import "ds-test/test.sol";

interface CheatCodes {
  function prank(address) external;
}

contract OwnerUpOnlyTest is DSTest {
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
pragma solidity ^0.8.0;

contract Safe {
  receive() external payable {}

  function withdraw() external {
    payable(msg.sender).transfer(address(this).balance);
  }
}

// Test
import "ds-test/test.sol";

contract SafeTest is DSTest {
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

```bash
forge create --rpc-url <your_rpc_url> --private-key <your_private_key> src/MyContract.sol:MyContract --constructor-args <arg0> <arg1> ...
```

如果使用`-i 或 --interactive` flag，则不用将私钥写进命令里，按下回车之后会提示你输入私钥，这样可以避免私钥信息被 shell history 记录

就目前阶段而言，foundry 在合约部署方面不如 Hardhat 方便，若想要在 Hardhat 项目中使用 foundry 进行代码测试，可以参考这篇文档：

+  [在 Hardhat 项目中配置 Foundry](use-foundry-in-hardhat/README.md)


## 与合约交互

```bash
// perform a call
cast call <contract-address> <func-sig> [args] --rpc-url <your_rpc_url>

// perform a send
cast send <contract-address> <func-sig> <args> --rpc-url <your_rpc_url> --private-key <private_key>
```

## Anvil 使用方法

Anvil 是 Foundry 提供的本地测试网节点，你可以将其用于测试前端或通过 RPC 进行交互的合约。

启动测试节点：

```bash
anvil
```

这条命令启动一个本地节点，默认监听端口 `8545` RPC 连接，可以通过 `--port` 参数指定端口。使用 `--account <NUM>` 可以查看可使用的账户和私钥列表：

```bash
anvil --accounts 10
```

同时，还可以使用 anvil 分叉以太坊进行测试：

```bash
anvil --hardfork latest
```

更多 `anvil` 的功能可以查看 [Anvil 文档](https://book.getfoundry.sh/reference/anvil/)。

## 参考资料
- [paradigm foundry](https://www.paradigm.xyz/2021/12/introducing-the-foundry-ethereum-development-toolbox)
- [ds-test](https://github.com/dapphub/ds-test/blob/master/src/test.sol)
- [The Foundry Book](https://onbjerg.github.io/foundry-book/index.html)
- [rebase code day Reference PPT](https://learnblockchain.cn/article/3749)
- [rebase code day Reference code base](https://github.com/bixia/solidity-dev)
- [Video: Intro to Foundry](https://www.youtube.com/watch?v=fNMfMxGxeag)
- [ERC20 foundry](https://learnblockchain.cn/article/3972)

