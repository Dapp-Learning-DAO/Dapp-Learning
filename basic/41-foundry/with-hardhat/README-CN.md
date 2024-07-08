## 在 Hardhat 项目中配置 Foundry

Foundry 框架在代码测试方面相比 Hardhat 有诸多优势，例如

- 能使用 solidity 写测试
- 能进行 fuzz testing
- 运行速度快

但在代码部署方面，Foundry 在现阶段还是没有 Hardhat 方便，而作为开发者，我们当然是优势都想要

本文就将介绍如何在 Hardhat 项目中配置 Foundry

## 初始化一个 Hardhat 项目

```bash
mkdir with-hardhat
cd with-hardhat
# 使用 pnpm 初始化项目
pnpm init
# 安装 hardhat
pnpm add -D hardhat
# 初始化项目
pnpm hardhat init
```

## 安装 hardhat-foundry 插件

```bash
pnpm add -D @nomicfoundation/hardhat-foundry
# hardhat 工具包插件
pnpm add -D @nomicfoundation/hardhat-toolbox
# chai 断言库插件
pnpm add -D @nomicfoundation/hardhat-chai-matchers
```

## 在 hardhat.config.ts 配置文件中添加 hardhat-foundry 插件

```typescript
import '@nomicfoundation/hardhat-toolbox';
import '@nomicfoundation/hardhat-foundry';
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
  solidity: '0.8.24',
};

export default config;
```

## 初始化 foundry.toml 文件并安装 forge-std 库

```bash
pnpm hardhat init-foundry
```

## 编写测试用例

```bash
mkdir contracts/test
```

以 Hardhat 默认项目的 `Greeter.sol` 合约为例，编写一个测试文件 `contracts/test/Greeter.t.sol` ，测试文件通常以 t.sol 结尾

```solidity
//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../Greeter.sol";
import {Test} from "forge-std/Test.sol";

contract GreeterTest is Test {
    Greeter private greeter;

    function setUp() public {
        greeter = new Greeter("Hello wplai!");
    }

    function test_Greet() public view {
        assertEq(greeter.greet(), "Hello wplai!");
    }

    function testFuzz_SetGreeting(string memory _greeting) public {
        greeter.setGreeting(_greeting);
        assertEq(greeter.greet(), _greeting);
    }
}
```

注：[the Foundry Book](https://book.getfoundry.sh/forge/writing-tests) 文档里介绍使用 forge-std 库的方法是先在 foundry.toml 或 remappings.txt 里设置好 forge-std 的路径，然后在测试文件中用 `import {Test} from "forge-std/Test.sol";` 来导入。

值得注意的是，上述的 testFuzz_SetGreeting 测试项是个 fuzz 测试，测试文件里并没有写定测试的输入，而是由 forge 喂入随机信息作为输入。

## 运行测试

```bash
forge test --root .
# 打印详细信息
forge test -vvvv
```

```
[⠔] Compiling...
[⠔] Compiling 3 files with 0.8.13
Compiler run successful

Running 2 tests for GreeterTest.json:GreeterTest
[PASS] test_Greet() (gas: 9778)
[PASS] testFuzz_SetGreeting(string) (runs: 256, μ: 46948, ~: 67196)
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

之后用 `pnpm test` 进行测试

同时，Hardhat 原本的测试文件可以用 `pnpm hardhat test` 进行测试。

## 参考文献

- [the Foundry Book](https://book.getfoundry.sh/forge/writing-tests)
