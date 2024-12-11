[中文](./README-CN.md) / English
# Hardhat-Foundry
## Preface

1. **Question 1: Why use `hardhat`?**

   A few years ago, `remix` and `truffle` were popular. At that time, `remix` lacked tools like `console`, and `truffle` didn't have a `debug` feature. `tenderly` was nowhere to be found in the browser, and issues in the code could only be addressed through `code review` and `revert` tests. **Back then, we lacked a comprehensive engineering framework, and most projects had only a few contracts.**

   Later, `hardhat` became popular. It allowed debugging code using `console.log`, forked networks without the need for `Ganache` or `Geth`, and wrote tests without needing to review the function names and parameters inside contracts (`Typescript`)... So, **it's time to use `hardhat`; it has truly made significant advancements beyond `truffle`.**

2. **Question 2: I'm already using `hardhat`, why do I need `foundry`?**

   `hardhat` has **some minor pain points**, such as:

    - Tedious preparation for contract testing (deployment and initialization).
    - Cumbersome testing of `Library` contracts.
    - Data type conversions in certain scenarios.
    - Data encoding and decoding.
    - Frustration when reproducing utility functions in the JS layer, and more.

   To address these issues, **`foundry` appeared, innovatively suggesting using the `Solidity` language to test `Solidity`**!!! Now, you can write tests with minimal code!

3. **Question 3: Why not fully embrace `foundry`?**

   `foundry` has its shortcomings. You may struggle with its dependency management (you might need to copy links from GitHub), cross-platform compatibility, a variety of CMD commands, and perhaps the inability to reuse some mature testing scripts (js/ts), and more. **`foundry` is revolutionary but hasn't fully inherited the wealth of its predecessors—JS ecosystem/hardhat ecosystem**, which is somewhat regrettable.

4. **Question 4: How should I choose a development framework?**

   I won't go into a detailed discussion of the pros and cons of `remix`, `truffle`, `hardhat`, and `foundry`, and then throw the choice back to you. Here, I will give you a direct answer—**unless there is a major innovation, go ahead and choose `hardhat-foundry` without thinking twice**. This is the best combination I have come up with after experiencing numerous technical iterations and project practices, so feel free to use it. If you really like `foundry`, my friend, unless you have completely transformed into a professional contract tester, it is not recommended to use pure `foundry`. Developers will always need to write or deal with some `js/ts` scripts.

   Combining the strengths of many is always the best choice.

## Preparation

- Download the `forge` program: https://github.com/foundry-rs/foundry/releases
- Set up environment variables.
- Create a project (I personally recommend `solidity-framework`).

-----

Some useful links:

- `ChainList`: https://chainlist.org/

  Here you can find RPC links that you can copy and use with ease. You don't need to register on `Infura` (especially if you're a beginner).

- `Tenderly` https://dashboard.tenderly.co/explorer

  Here, you can search for transaction call stacks, examine the execution flow of transactions, etc. (if the contract is open-source).

- `foundry` https://github.com/Dapp-Learning-DAO/Dapp-Learning/tree/main/basic/41-foundry

  Excellent introductory points summarized by the predecessors at `Dapp-Learning`. I recommend browsing this.

## Core Operations

**Remember not to try to memorize all functions except the core operations**.

1. **Contract Compilation**

- `npx hardhat compile`

2. **Contract Testing**

- `npx hardhat test` | For more usage, `npx hardhat test --help`
- `forge test`  | `forge test --mc <filename match> -vv`

3. **Local Blockchain Network [Recommended `hardhat`]**

- `npx hardhat node`

4. **Run TS scripts on a specific blockchain network (e.g., deployment)**

- `npx hardhat --network <network name> run <script path>`

> Important Notes

- `forge --help` for a complete list of commands (some commands may have bugs).
- `forge debug <contract path> --sig <function signature> [parameter list]` Debugging functions is suitable for low-level assembly development, assisting in observing the stack and memory data.

## Configuration Instructions

- Project Dependencies

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
    "@chainlink/contracts": "^0.8.0", // Oracle contract provider, you might need its interface
    "@nomicfoundation/hardhat-foundry": "^1.1.1", // Foundry environment file generator
    "@nomicfoundation/hardhat-toolbox": "^3.0.0", // Hardhat environment suite for testing, development, and open source
    "@openzeppelin/contracts": "^5.0.0", // OpenZeppelin contract library
    "@openzeppelin/contracts-upgradeable": "^5.0.0", // OpenZeppelin upgradeable contract library
    "@openzeppelin/hardhat-upgrades": "^2.3.3", // JavaScript/TypeScript script package for OpenZeppelin upgrades library
    "dotenv": "^16.3.1", // Runtime environment variable injection to access custom configurations like private keys directly in code
    "hardhat": "^2.19.0", // Hardhat framework
    "hardhat-abi-exporter": "^2.10.1", // (Optional) pure ABI generator, used in combination with abigen for generating contract operation files for Go/Java backend developers
    "hardhat-diamond-abi": "^3.0.1", // (Optional) Diamond contract interface synthesis, aggregates the interfaces of multiple contracts into one interface file
    "hardhat-exposed": "^0.3.13", // (Optional) Contract internal interface exposure for testing convenience
    "hardhat-ignore-warnings": "^0.2.9", // (Optional) Ignore warning messages, useful for legacy project development
    "uniswap-v2-deploy-plugin": "^0.0.4" // (Optional) One-click setup of Uniswap V2 test environment
  }
}
```

- Project Configuration (some features are not enabled)

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

- .gitignore for Team Collaboration (Recommended to be edited flexibly based on the project)

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
# Note: Here, all JavaScript files are ignored
/**/*.js
```

## Testing Techniques

### hardhat

#### Contract Layer Testing

Contracts can be debugged, and debugging output will be displayed on the Hardhat local network using the following syntax:

```solidity
import "hardhat/console.log";

// TODO Add log statements at critical points in the contract
console.log(parameter1, parameter2...);

```

#### Unit Testing/Functional Testing

The `describe` function's callback functions include four testing-related functions: `it`, `before`, `beforeEach`, and `afterEach`, as follows:

- `it`: Tests a unit, simulating a testing behavior. Units are independent, and they do not share state with each other.
- `before`: Executes before all unit tests, only running once. It is typically used for initialization, such as reading deployment accounts.
- `beforeEach`: Executes before each unit test, running once for every test. It is often used to execute the `loadFixture` function.
- `afterEach`: Executes after each unit test, running once for every test. It is rarely used.

The `loadFixture(func)` function is a blockchain network snapshot function that records the blockchain state when `func` is first executed. In subsequent uses, it directly restores the state instead of re-executing the setup.

```typescript
describe("Diamond Contract", () => {
    let user: HardhatEthersSigner;

    afterEach(() => {
        console.log("afterEach------------------------------------");
    });

    beforeEach(() => {
        console.log("beforeEach------------------------------------");
    });

    before("user", async () => {
        console.log("before------------------------------------");
        const accounts = await ethers.getSigners();
        user = accounts[0];
    });

    async function deployFixture() {
        return await Diamonds.deploy(false);
    }

    it("Proxy Test Example", async () => {
        const diamond = await loadFixture(deployFixture);
        const [example] = await deploy(false, "Example");
        await diamond.proxy(example);
        await (await (example.attach(diamond.address) as Example).setNumber(1024n)).wait();
        expect(await (example.attach(diamond.address) as Example).getNumber()).eq(1024n);
    });

    it("Upgrade Test Example", async () => {
        const diamond = await loadFixture(deployFixture);
        const [oldExample] = await deploy(false, "Example");
        await diamond.proxy(oldExample);
        const [newExample] = await deploy(false, "Example");
        await diamond.upgrade(oldExample.address, newExample);
        // assert
        const selector = (newExample as any as Example).interface.getFunction("setNumber").selector;
        expect(await diamond.facetAddress(selector)).eq(newExample.address);
    });
});
```

#### Project Testing

Project testing often involves multi-platform integration, such as `hardhat + Golang`. Therefore, it's important to maintain the blockchain network state persistently. In general, you will write these tests in the `scripts/` folder. Here are the relevant commands:

- Scenario 1: Local Network Testing (including `fork`)
    - `npx hardhat node`
    - `npx hardhat --network hardhat run <script-path>`

- Scenario 2: Online Blockchain Testing (Testnet)
    - `npx hardhat --network <network-name> run <script-path>`

### foundry

#### Contract Layer Testing

```solidity
import {console} from "forge-std/Test.sol";

// TODO: Place log messages at key locations in your contract
console.log(parameter1, parameter2, ...);
```

#### Unit Testing

**It is not recommended to use foundry for writing functional tests. Front-end developers may need contract usage examples, so functional tests written in JavaScript/TypeScript are more reusable.**

> foundry Contract Testing with new

The new method is usually used in conjunction with a setUp function. It cannot be used to test internal contract functions. Here's an example:

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {Example} from "../contracts/Example.sol";

contract ExampleTest is Test {
    Example public example;

    // Set up the test environment for each unit test (this function is executed automatically)
    function setUp() public {
        example = new Example();
        example.setNumber(0);
    }

    // Regular unit test
    function test_setNumber() public {
        example.setNumber(1024);
        assertEq(example.getNumber(), 1024);
    }

    // Fuzz testing
    function testFuzz_SetNumber(uint256 x) public {
        example.setNumber(x);
        assertEq(example.getNumber(), x);
    }
}
```

> foundry Contract Testing with library

It's important to note that foundry doesn't support generating test coverage reports for libraries. Any library functions called within contracts are identified as having 100% test coverage, and there's no workaround.

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {LibExample} from "../contracts/LibExample.sol";

contract LibExampleTest is Test {

    // Fuzz testing: Verify that values smaller than type(uint160).max can be converted successfully
    function testFuzz_toUint160(uint256 n) public {
        // Skip if n > type(uint160).max
        vm.assume(n <= type(uint160).max);
        LibExample.toUint160(n);
    }

    // Fuzz testing: Verify that values greater than type(uint160).max throw an exception
    function testFailFuzz_toUint160_overflow(uint256 n) public {
        // Skip if n < type(uint160).max
        vm.assume(n > type(uint160).max);
        LibExample.toUint160(n);
    }
}
```

> foundry Contract Testing with override

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

> foundry Contract Testing with JSON

Using JSON for contract testing is not recommended unless your company has specialized tools for generating JSON test data.

```solidity
// 0- foundry.toml project configuration (./ indicates the project root)
fs_permissions = [{ access = "read-write", path = "./"}]
// 1- Contract inheritance
contract Xxx is Test
// 2- Interface integration
using stdJson for string;
// 3- Usage syntax (.XxxDatas represents accessing the XxxDatas property in the JSON)
string memory json = vm.readFile("./test/testdata/Xxx.t.json");
bytes memory bytesData = json.parseRaw(".XxxDatas");
XxxData[] memory t = abi.decode(bytesData, (XxxData[]));

// Note:
// 1- The order of struct fields must be sorted strictly in alphabetical order, e.g., XxxData
// 2- Numeric values in JSON must not be enclosed in double quotes. You can use scientific notation, e.g., 200e18.
// 3- The argument for json.parseRaw can be an empty string ("") to load the entire JSON file.
```

## Conclusion

My friend, I started my journey in traditional development and later ventured into blockchain development, but unfortunately, I've forgotten at least 90% of what I've learned over time. Therefore, I strongly dislike listing detailed knowledge points, as it's a waste of everyone's time.

In my opinion, explaining the minimum knowledge subset is the most important. This is also the principle behind my current sharing – providing the least amount of information to help you get started quickly. It might take you just 1 hour or maybe 10 minutes to say, "Oh, I've got it, I can start developing."

`Less is more.`

