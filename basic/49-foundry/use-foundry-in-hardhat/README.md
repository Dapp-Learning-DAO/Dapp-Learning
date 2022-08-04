## 在 Hardhat 项目中配置 Foundry

Foundry 框架在代码测试方面相比 Hardhat 有诸多优势，例如

- 能使用 solidity 写测试
- 能进行 fuzz testing
- 运行速度快

但在代码部署方面，Foundry 在现阶段还是没有 Hardhat 方便，而作为开发者，我们当然是优势都想要

本文就将介绍如何在 Hardhat 项目中配置 Foundry

## 初始一个 Hardhat 项目

```bash
> yarn add -D hardhat
> yarn hardhat
```

## 配置 foundry.toml 文件

```yaml
# foundry.toml
[default]
src = 'contracts'
out = 'artifacts/contracts'
libs = ['node_modules']
```

## 搭建测试框架

首先在 contracts 目录下新建一个 test 目录，之后对应的测试文件都放在这个 test 目录里

```bash
> mkdir contracts/test
```

Foundry 框架下的测试依赖 [ds-test](https://github.com/dapphub/ds-test) 库，因此我们需要先安装该库

```bash
> forge install --no-git --no-commit --root contracts dapphub/ds-test
```

注：

- 由于 forge install 的默认行为会提交 git commit，因此需要使用 —no-git —no-commit flag
- 用 —root contracts，库会安装在 contracts/lib 目录下

之后删掉 ds-test 目录下面多余的文件

```bash
> rm -rf contracts/lib/ds-test/demo
> rm contracts/lib/ds-test/{LICENSE,.gitignore,Makefile,default.nix}
```

## 写测试用例

以 Hardhat 默认项目的 `Greeter.sol` 合约为例，写一个测试文件 `contracts/test/Greeter.t.sol` ，测试文件通常以 t.sol 结尾

```solidity
# contracts/lib/Greeter.t.sol
//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../Greeter.sol";
import "../lib/ds-test/src/test.sol";

contract GreeterTest is DSTest {
    Greeter private greeter;

    function setUp() public {
        greeter = new Greeter("Hello wplai!");
    }

    function testGreet() public {
        assertEq(
            greeter.greet(),
            "Hello wplai!"
        );
    }

    function testSetGreeting(string memory _greeting) public {
        greeter.setGreeting(_greeting);
        assertEq(
            greeter.greet(),
            _greeting
        );
    }
}
```

注：[the Foundry Book](https://onbjerg.github.io/foundry-book/) 文档里介绍使用 DSTest 库的方法是先在 foundry.toml 或 remappings.txt 里设置好 ds-test 的路径，然后在测试文件中用 `import "ds-test/test.sol";` 来导入。但在 Hardhat 项目中这样设置的话，`hardhat compile` 时会因为找不到 ds-test 而报错。因此我们这里使用 `import "../lib/ds-test/src/test.sol";` 来给测试文件导入 ds-test 库。

值得注意的是，上述的 testSetGreeting 测试项是个 fuzz 测试，测试文件里并没有写定测试的输入，而是由 forge 喂入随机信息作为输入。

## 运行测试

```bash
> forge test --root .
```

```
[⠔] Compiling...
[⠔] Compiling 3 files with 0.8.13
Compiler run successful

Running 2 tests for GreeterTest.json:GreeterTest
[PASS] testGreet() (gas: 9778)
[PASS] testSetGreeting(string) (runs: 256, μ: 49910, ~: 52812)
```

想更省事的话，可以将该命令写入 `package.json` 里

```bash
# package.json
{
...
  "scripts": {
    "test": "forge test --root ."
  },
...
}
```

之后用 `yarn test` 进行测试

同时，Hardhat 原本的测试文件可以用 `yarn hardhat test` 进行测试。

## 参考文献

+ [the Foundry Book](https://onbjerg.github.io/foundry-book/) 