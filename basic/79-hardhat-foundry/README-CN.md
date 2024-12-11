中文 / [English](./README.md)
# Hardhat-Foundry

## 前言

1. **问题一: 为什么需要用`hardhat`?**

   早些年流行`remix`和`truffle`，那时候的`remix`没有`console`等工具，`truffle`没有`debug`功能，`tenderly`在浏览器看不到身影，代码问题只能`code review`和`revert`测试。**彼时，我们缺乏完善的工程化框架，大多数项目只有寥寥数份合约。**

   后来，`hardhat`开始流行，它能以`console.log`的方式调试代码，它`fork`网络不需要`Ganache`或`Geth`，它写测试不用回看合约里面的函数名和参数是什么(`Typescript`)......所以，**是时候使用`hardhat`了，它真的在`truffle`的肩膀上，向前走了很远。**

2. **问题二: 我已经在用`hardhat`了，为什么还需要`foundry`?**

   `hardhat`有**一些小痛点**，比如: 合约测试的准备程序很枯燥(部署和初始化)、`Library`合约的测试很繁琐，某些场景下的数据类型转换、数据编码解码、在JS层重现工具函数很烦恼等等。

   为了解决以上问题，**`foundry`出现了，它创新式地提出用`Solidity`语言来测试`Solidity`**!!! 现在，你可以用最少的代码写测试!

3. **问题三: 为什么不全力奔向`foundry`?**

   `foundry`有不完善的地方，你会苦恼它的依赖管理(你或许需要去github上复制链接)，你会苦恼它的跨平台兼容性，你会苦恼它五花八门的CMD命令，你也或许会苦恼某些成熟的测试脚本(js/ts)不能复用，等等。**`foundry`是革命性的，但却没能完整的继承前辈们的财富——JS生态/hardhat生态**，这一点颇为遗憾。
   
4. **问题四: 我该如何选择开发框架?**

   我不打算论述一番`remix`、`truffle`、`hardhat`和`foundry`的优缺点，然后把选择题抛给你。在这里，我会直接给你答案——**除非有了更大的革新，否则请无脑选择`hardhat-foundry`。**这是我经历N轮技术迭代和项目实践后的最佳搭配，请放心食用。如果你真的很喜欢`foundry`，朋友，除非你已经彻底转为专业的合约测试人员，否则不建议使用纯`foundry`。开发人员总是免不了会需要写或者接触一些`js/ts`的脚本的。

   集百家之长永远是最佳选择。

## 准备工作

- 下载`forge`程序: https://github.com/foundry-rs/foundry/releases
- 添加环境变量
- 搭建项目(个人推荐`solidity-framework`)

-----

一些有用的网址

- `ChainList`: https://chainlist.org/

  这里有一键复制即用的RPC链接，你不需要注册`Infura`(尤其新手)。

- `Tenderly` https://dashboard.tenderly.co/explorer

  这里可以搜索交易的调用栈，查看交易的执行流等(如果合约已经开源的话)。
  
- `foundry` https://github.com/Dapp-Learning-DAO/Dapp-Learning/tree/main/basic/41-foundry

  `Dapp-Learning`前辈总结的优秀入门要点，建议浏览。

## 核心操作

**除了核心操作外，不要试图去记住所有的功能，谨记**。

1. **合约编译**

  - `npx hardhat compile`

2. **合约测试**

  - `npx hardhat test` | 更多用法: `npx hardhat test --help`
  - `forge test`  | `forge test --mc <文件名匹配> -vv`

3. **本地区块链网络[推荐`hardhat`]**

  - `npx hardhat node`

4. **在指定的区块链网络上运行TS脚本(比如部署)**

  - `npx hardhat --network <网络名> run <脚本路径>`

> 说明事项

- `forge --help` 完整命令列表(有些命令有`Bug`)
- `forge debug <合约路径> --sig <函数头> [参数列表]`调试函数适合底层汇编开发，辅助堆栈和内存的数据观察。

## 配置说明

- 项目依赖

```json
{
  "name": "11-hardhat-foundry",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "@chainlink/contracts": "^0.8.0", // 合约预言机提供商，你或许会用到它的接口
    "@nomicfoundation/hardhat-foundry": "^1.1.1", // foundry运行环境的文件生成器
    "@nomicfoundation/hardhat-toolbox": "^3.0.0",// hardhat环境套件，你需要的测试，开发，开源都有
    "@openzeppelin/contracts": "^5.0.0",// openzeppelin合约库
    "@openzeppelin/contracts-upgradeable": "^5.0.0", // openzeppelin升级适配的合约库
    "@openzeppelin/hardhat-upgrades": "^2.3.3",// openzeppelin升级库的js/ts脚本包
    "dotenv": "^16.3.1",// 运行时环境变量注入，让我们能在代码中直接访问某些自定义的特殊配置，比如私钥
    "hardhat": "^2.19.0",// hardhat框架
    "hardhat-abi-exporter": "^2.10.1",// (了解)纯abi生成器，配合 abigen 为go/java等后端人员生成合约操作文件
    "hardhat-diamond-abi": "^3.0.1", // (了解) 钻石合约接口合成，让多个合约的接口聚合到一个接口文件中
    "hardhat-exposed": "^0.3.13", // (了解)合约内部接口暴露，方便测试
    "hardhat-ignore-warnings": "^0.2.9", // (了解) 警告信息忽略，老项目兼容开发或许会用到
    "uniswap-v2-deploy-plugin": "^0.0.4" // (了解) 一键搭建uniswapv2测试环境
  }
}
```

- 项目配置(一些功能并未启用)

```ts
import {HardhatUserConfig} from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-foundry";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-abi-exporter";
import "dotenv/config";
import "hardhat-ignore-warnings";
import "hardhat-diamond-abi";
import {Fragment, FunctionFragment} from "ethers";

const funcNameSet = new Set<string>()
const funcSelectorMap = new Map<string, string>()
const eventErrorSet = new Set<string>()
const config: HardhatUserConfig = {
    // warnings: {
    //     'contracts/legacy/**/*': {
    //         default: 'error',
    //     },
    // },
    diamondAbi: {
        name: "DiamondCombined",
        include: ["Facet"],
        strict: true,
        filter: function (abiElement, index, fullAbi, fullyQualifiedName) {
            if (fullyQualifiedName.endsWith("Test1Facet") || fullyQualifiedName.endsWith("Test2Facet")) {
                return false
            }
            // distinct event and error
            if (abiElement.type === "event" || abiElement.type === "error") {
                const minimalAbi = Fragment.from(abiElement).format("minimal")
                if (eventErrorSet.has(minimalAbi)) {
                    return false
                }
                eventErrorSet.add(minimalAbi)
                return true;
            }
            const selector = FunctionFragment.from(abiElement).selector
            if (funcSelectorMap.has(selector)) {
                throw new Error(`${FunctionFragment.from(abiElement).selector}, see:\n\t${Fragment.from(abiElement).format("minimal")}::${fullyQualifiedName}\n\t${funcSelectorMap.get(selector)}\n`)
            }
            funcSelectorMap.set(selector, `${Fragment.from(abiElement).format("minimal")}::${fullyQualifiedName}`)
            if (!funcNameSet.has(fullyQualifiedName)) {
                funcNameSet.add(fullyQualifiedName)
                console.log(` >>> [hardhat-diamond-abi] ${fullyQualifiedName}`)
            }
            return true;
        },
    },
    abiExporter: [{
        runOnCompile: true,
        clear: true,
        path: './abi-pure/general',
        format: "json"
    }, {
        runOnCompile: true,
        clear: true,
        path: './abi-pure/ethers',
        pretty: true
    }],
    networks: {
        hardhat: {
            mining: {
                interval: 50
            }
            // forking: {
            //   url: "https://arbitrum.public-rpc.com",
            //   // blockNumber: 132401260
            // }
        },
        bsc: {
            url: "https://bsc.rpc.blxrbdn.com",
            accounts: [process.env.PRIVATE_KEY as string],
        },
        bsc_testnet: {
            url: "https://bsc-testnet.publicnode.com",
            accounts: [process.env.PRIVATE_KEY as string],
        },
        bsc_op_testnet: {
            url: "https://opbnb-testnet-rpc.bnbchain.org",
            accounts: [process.env.PRIVATE_KEY as string],
        },
        eth: {
            url: "https://eth.public-rpc.com",
            accounts: [process.env.PRIVATE_KEY as string],
        },
        arbitrum: {
            url: "https://endpoints.omniatech.io/v1/arbitrum/one/public",
            accounts: [process.env.PRIVATE_KEY as string],
        },
        arbitrum_goerli: {
            url: "https://arbitrum-goerli.publicnode.com",
            accounts: [process.env.PRIVATE_KEY as string],
        }
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_BSC as string
    },
    solidity: {
        compilers: [
            standardSettings("0.8.21"),
        ]
    },
};

function standardSettings(version: string) {
    return {
        version: version,
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
            // viaIR: true
        },
    }
}

export default config;
```

- `.gitignore` 团队协作(建议根据项目灵活编辑)

```git
*.swp
*.swo

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
allFiredEvents
scTopics

# Coverage directory used by tools like istanbul
coverage
coverage.json
coverageEnv

# node-waf configuration
.lock-wscript

# Dependency directory
node_modules

# Debug log from npm
npm-debug.log

# local env variables
.env

# truffle build directory
build/

# macOS
.DS_Store

# truffle
.node-xmlhttprequest-*

# IntelliJ IDE
.idea

# vscode IDE
.vscode

# docs artifacts
docs/modules/api

# only used to package @openzeppelin/contracts
contracts/build/
contracts/README.md

# temporary artifact from solidity-coverage
.coverage_artifacts
.coverage_cache
.coverage_contracts

# hardat-exposed
contracts-exposed

# Hardhat
cache
artifacts

# Foundry
out
cache_forge

# Certora
.certora*
.last_confs
certora_*
.zip-output-url.txt

# extends
/abi
/abi-pure

/typechain-types
# 注意: 这里忽略了所有js
/**/*.js
```

## 测试技巧

### hardhat

#### 合约层测试

合约也是可以调试的，调试输出信息将展示在hardhat本地网络，使用语法如下:

```solidity
import "hardhat/console.log";


// TODO 在合约的关键位置进行日志打印
console.log(参数1，参数2...);
```

#### 单元测试/功能测试

`describe`函数的回调函数有`it`|`before`|`beforeeach/aftereeach`|`describe`四类测试相关的函数，如下: 

- `it` 测试单元，用来模拟一次测试行为，测试单元之间相互独立，状态不传递
- `before` 在所有测试单元执行之前执行，仅会执行一次，一般用来初始化，比如: 读取部署账号
- `beforeeach` 在每个单元测试执行前执行，每个单元测试都会执行一次，一般用来执行loadFixture函数
- `aftereeach` 在每个单元测试执行后执行，每个单元测试都会执行一次，很少使用

`loadFixture(func)`函数是区块链网络闪存函数，它会记录下`func`首次被执行时的区块链状态，后续每次使用直接进行状态恢复而不是重复执行。

```typescript
describe("钻石合约", () => {
    let user: HardhatEthersSigner
    afterEach(()=>{
        console.log("afterEach------------------------------------")
    })
    beforeEach(()=>{
        console.log("beforeEach------------------------------------")
    })
    before("user", async () => {
        console.log("before------------------------------------")
        const accounts = await ethers.getSigners()
        user = accounts[0]
    })

    async function deployFixture() {
        return await Diamonds.deploy(false)
    }

    it("代理测试样例", async () => {
        const diamond = await loadFixture(deployFixture);
        const [example] = await deploy(false, "Example")
        await diamond.proxy(example);
        await (await (example.attach(diamond.address) as Example).setNumber(1024n)).wait()
        expect(await (example.attach(diamond.address) as Example).getNumber()).eq(1024n)
    });
    it("升级测试样例", async () => {
        const diamond = await loadFixture(deployFixture);
        const [oldExample] = await deploy(false, "Example")
        await diamond.proxy(oldExample)
        const [newExample] = await deploy(false, "Example")
        await diamond.upgrade(oldExample.address, newExample)
        // assert
        const selector = (newExample as any as Example).interface.getFunction("setNumber").selector
        expect(await diamond.facetAddress(selector)).eq(newExample.address)
    });
});
```

#### 项目测试

项目测试一般涉及多端联调，比如: `hardhat+Golang`，因此需要保证区块链网络状态时维持的，持久的，一般我们会在`scripts/`文件夹编写，相关命令如下:

- 情况一: 本地网络测试(含`fork`)
  - `npx hardhat node`
  - `npx hardhat --network hardhat run <脚本路径>`
- 情况二: 线上区块链测试(测试网)
  - `npx hardhat --network <网络名> run <脚本路径>`

### foundry

#### 合约层测试

```solidity
import {console} from "forge-std/Test.sol";

// TODO 在合约的关键位置进行日志打印
console.log(参数1，参数2...);
```

#### 单元测试

**不建议用`foundry`写功能测试，前端可能需要合约使用样例，所以你用`js/ts`写的功能测试是可以复用的。**

> `foundry`的合约测试之 `new`

`new`方式一般会配合`setUp`函数，它不能测试合约的内部函数，如下:

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {Example} from "../contracts/Example.sol";

contract ExampleTest is Test {
    Example public example;

	// 每个单元测试的测试前环境(该函数会被自动执行)
    function setUp() public {
        example = new Example();
        example.setNumber(0);
    }

	// 普通单元测试
    function test_setNumber() public {
        example.setNumber(1024);
        assertEq(example.getNumber(), 1024);
    }

    // 模糊测试
    function testFuzz_SetNumber(uint256 x) public {
        example.setNumber(x);
        assertEq(example.getNumber(), x);
    }
}
```

> `foundry`的合约测试之 `library`

说明一点，`foundry`不支持`library`的测试覆盖报告生成，凡是被调用，皆会被识别为100%，没有解决方案。

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {LibExample} from "../contracts/LibExample.sol";

contract LibExampleTest is Test {

    // 模糊测试: 测试小于type(uint160).max的参数值能正常转换
    function testFuzz_toUint160(uint256 n) public {
        // if n > type(uint160).max, skip
        vm.assume(n <= type(uint160).max);
        LibExample.toUint160(n);
    }

    // 模糊测试: 测试大于type(uint160).max的参数值抛出异常
    function testFailFuzz_toUint160_overflow(uint256 n) public {
        // if n < type(uint160).max, skip
        vm.assume(n > type(uint160).max);
        LibExample.toUint160(n);
    }
}
```

> `foundry`的合约测试之 `override`

```cmd
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {OverrideExample} from "../contracts/OverrideExample.sol";

contract OverrideExampleTest1 is Test, OverrideExample {

    function setUp() public {
        // init
        until = 10 days;
    }

    // override
    function _blockTimestamp() internal view override returns (uint256) {
        return 10 days;
    }

    function test_transfer() public {
        transfer();
    }
}
```

```cmd
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {OverrideExample} from "../contracts/OverrideExample.sol";

contract OverrideExampleTest2 is Test, OverrideExample {

    function setUp() public {
        // init
        until = 10 days;
    }

    function testFail_transfer(uint256 x) public {
        transfer();
    }
}
```

> `foundry`的合约测试之 `json`

除非公司有专业测试生成JSON，否则不太建议使用。

```solidity
// 0- foundry.toml项目配置 (./代表项目根目录)
fs_permissions = [{ access = "read-write", path = "./"}]
// 1- 合约继承
contract Xxx is Test
// 2- 接口集成
using stdJson for string;
// 3- 使用语法 (.XxxDatas代表取JSON的XxxDatas属性)
string memory json = vm.readFile("./test/testdata/Xxx.t.json");
bytes memory bytesData = json.parseRaw(".XxxDatas");
XxxData[] memory t = abi.decode(bytesData, (XxxData[]));

// 注意事项: 
// 1- 结构体的字段顺序必须严格安装字母排序进行排序!!!!! 比如: XxxData
// 2- JSON中的数字绝对不能使用"括起来!!!! 另外，可以使用科学计数法，如200e18!!
// 3- json.parseRaw的参数可以为 ""，表示加载整个json文件
```

## 结语

朋友，我是一个人走上的传统开发，也是一个人走上的区块链开发，很不幸，我期间学过的至少90%的知识都已经荒废了。所以我很反感知识点的罗列和详尽的讲解，这完全是在浪费大家的生命。

我认为，最小知识子集的讲解才是最重要的，这也是我本次分享的原则——以最少的东西让大家最快地入门，或许1个小时或许10分钟，你就可以说，"哦，我会了，我能开发了"。

`Less is more.`

