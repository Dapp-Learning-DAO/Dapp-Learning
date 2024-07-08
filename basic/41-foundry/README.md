# Smart contract development using Foundry

[Foundry](https://github.com/gakonst/foundry) is a Ethereum smart contract development tool written in Rust, and it includes three core tools:

- `forge`:  -Testing framework for Ethereum smart contracts
-  `cast`:  -Tools related to the EVM ecosystem, including encoding, decoding, and interacting with smart contracts.
-  `Anvil`: -Local Ethereum node
-  `Chisel`:  -Solidity REPL integrated with Foundry.

## Installing forge, cast, anvil, and chisel.

First, install foundryup, which is a helper tool for installing Foundry.

```sh
# macos
brew install libusb
curl -L https://foundry.paradigm.xyz | sh
# zsh shell
source ~/.zshenv
```

Install forge, cast, anvil, and chisel using foundryup.

When run separately, foundryup will install the latest (nightly) precompiled binaries: forge, cast, anvil, and chisel.

```sh
foundryup
```

## Create a new project using Forge.

```sh
forge init my_project
```

The structure of the newly created project is as follows:

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

Here it is:

- `foundry.toml` is a configuration file.
    - `forge config --basic`  View current basic settings
    - `forge config`  View all current settings.
- `src` Below is the source code directory.
- `test` Below is the test file corresponding to the `src` contracts.
- `script` Deployment scripts for the contracts
- `lib` The development dependencies libraries directory
    - Create a project and install the forge-std library needed for testing (a superset of DSTest), integrate ds-test into it (this dependency has been removed in the new version)
    
### VSCode Integration 

You can get Solidity support for Visual Studio Code by installing the [VSCode Solidity](https://github.com/juanfranblanco/vscode-solidity) extension.

Foundry supports integration with VSCode for development. Just go into the project directory and run:

```sh
cd my_project
forge remappings > remappings.txt
```

## Calling third-parties libraries 

Foundry can directly install and call the GitHub API to download open-source third-party libraries.

Install a third-party library - OpenZeppelin:

```sh
forge install openzeppelin/openzeppelin-contracts
```

The account name on GitHub is `openzeppelin`, followed by a slash / and the user's repo.

To import the library after installation, you need to add it at the beginning of the contract file, such as adding openzeppelin's ERC20:

```sh
import "openzeppelin/contracts/token/ERC20/ERC20.sol"
```

Install third-party library - solmate:

```sh
forge install transmissions11/solmate
# Dependent on a specific version, default is master
forge install transmissions11/solmate@master
forge install transmissions11/solmate@v7
forge install transmissions11/solmate@c892309
```

**NOTE**: If you use VSCode, you need to re-execute `forge remappings > remappings.txt` after installing the new third-party library. 

## Updating third-party libraries

1. Update a dependency:
```sh
forge update lib/solmate
```

2. Update all dependencies:
```sh
forge update
```

## Compiling contract

```sh
forge build
```
The compiled contract will be in the `out` directory 

## Test contract

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

The above code is the test file template given for the new project. 

Test with `forge test`

```
[⠔] Compiling...
[⠘] Compiling 3 files with 0.8.10
Compiler run successful

Running 1 test for ContractTest.json:ContractTest
[PASS] testExample() (gas: 120)
```

forge will search all contracts under src and look for contracts containing functions starting with test as test contracts. For each test contract:

- The `setUp()` function will be used as basic settings and run before each test case.
- Functions starting with `test` are used as test cases
- Functions starting with `testFail` are also used as test cases, but the test is considered passed when it is revert

Usually we will put the test file under `src/test`, and then end with `.t.sol` as the file name. 

The `ds-test` library introduced in the template provides assertion functions required for tests such as assertTrue and assertEq. You can view the [source code](https://github.com/dapphub/ds-test/blob/master/src/test.sol) for the specific functions that can be used. 

To test a specific contract or a use case, you can use the following command

```sh
# only run test methods in contracts matching regex
forge test --match-contract <CONTRACT_PATTERN>

# only run test methods matching regex
forge test --match-test <TEST_PATTERN>

# only run test methods in source files at path matching regex.
# Requires absolute path
forge test --match-path <PATH_PATTERN>
```

In addition, you can also set the verbosity of the test output through the -v flag

- `-vv` output logs of all tests
- `-vvv` output stack trace of failed tests
- `-vvvv` output stack trace, and output the setup of the failed use case
- `-vvvvv` output stack trace and setup of all use cases

Among them, stack trace can see the call stack of the function and the event of emit.

```
[<Gas Usage>] <Contract>::<Function>(<Parameters>)
    ├─ [<Gas Usage>] <Contract>::<Function>(<Parameters>)
    │   ├─ ← emit <event>
    │   └─ ← <Return Value>
    └─ ← <Return Value>
```

If you use `forge test --gas-report`, you can also output the gas data of each function of the contract under test. The sample output is as follows:

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

In addition, forge supports testing on forked Ethereum environments

```sh
forge test --fork-url <your_rpc_url>
```

You can also further set the forked block

```sh
forge test --fork-url <your_rpc_url> --fork-block-number <block-number>
```

In addition, forge also has the `CheatCodes` function, which can be used to simulate and manipulate the state of the EVM

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
  CheatCodes cheats = CheatCodes(VM_ADDRESS);
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

For example, in the above code, `cheats.prank(address(0))` sets the msg.sender of the next call to adderss(0) and lets `upOnly.increment()` revert to test whether the requests from non-owners are correctly rejected. call.

For more information about cheatcodes, please refer to [Cheatcodes Reference](https://onbjerg.github.io/foundry-book/reference/cheatcodes.html) 

forge also supports fuzz testing

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

For example, in the `testWithdraw` function of the above code, forge will feed random input multiple times for testing. The number of runs can be set through fuzz_runs in the configuration file. The default is 256 times.

## Deploying contracts

```sh
forge create --rpc-url <your_rpc_url> --private-key <your_private_key> src/MyContract.sol:MyContract --constructor-args <arg0> <arg1> ...
```
If you use the `-i or --interactive` flag, you do not need to write the private key into the command. After pressing Enter, you will be prompted to enter the private key. This can prevent the private key information from being recorded by shell history.


At the current stage, foundry is not as convenient as Hardhat in terms of contract deployment. If you want to use foundry for code testing in the Hardhat project, you can refer to this document:

+ [Configuring Foundry in the Hardhat project](use-foundry-in-hardhat/README.md)

**UPDATE**: Currently foundry supports contract deployment using scripts. Just set some variables and add a new script file to deploy by executing the script.

- Create an `.env` file in the project directory and set the corresponding variables:

```sh
PRIVATE_KEY=
MAINNET_RPC_URL=
RINKEBY_RPC_URL=
ANVIL_RPC_URL="http://localhost:8545"
ETHERSCAN_KEY=
```

Add configuration in `foundry.toml`

```yaml
[rpc_endpoints]
mainnet = "${MAINNET_RPC_URL}"
rinkeby = "${RINKEBY_RPC_URL}"
anvil = "${ANVIL_RPC_URL}"

[etherscan]
mainnet = { key = "${ETHERSCAN_KEY}" }
rinkeby = { key = "${ETHERSCAN_KEY}" }
```

Create a `script/MyNFT.s.sol` in the project directory (take deploying an NFT contract as an example):

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

Last executed:

```sh
# load the configs
source .env
# deploy
forge script DeployMyNFT --rpc--url <RCP_URL> --broadcast --verify
```

The --verify parameter is to open source the contract code. 

For complete sample code, see :[my_nft](https://github.com/oneforalone/my_nft)

## Debugging contract

Foundry also supports debug contracts, which can debug local contracts or tx on the chain. The only difference with Remix is ​​that there is no storage in foundry. 

- Debugging local contract

```sh
forge test --debug <FunctionName>
```

like :

```sh
forge test --debug --testSetter
```

or :

```sh
forge debug --debug <contract-file> --sig <FunctionSignature>
```

like :

```sh
forge debug --debug src/Hello.sol --sig "setter(string)" "hello"
```

- Debugging on-chain tx

```sh
cast run --debug --rpc-url $ETH_RPC_URL <tx-hash>
```

Among them, `$ETH_RPC_URL` is the RPC of the calling node. You can write it directly or set the RPC to the `ETH_RPC_URL` variable. `<tx-hash> `is the hash value of tx that needs to be debugged. 

like :

```sh
cast run --debug $ETH_RPC_URL 0x1126aa5e5b648eebad1c88141e5142cf0a4082e6ccf9fed77d69a190c21724a3
```

- Shortcut key reference for debug window: [Foundry Debugger](https://book.getfoundry.sh/forge/debugger#navigating)

## Interacting with contracts

```sh
# perform a call
cast call <contract-address> <func-sig> [args] --rpc-url <your_rpc_url>

# perform a send
cast send <contract-address> <func-sig> <args> --rpc-url <your_rpc_url> --private-key <private_key>
```

## How to use Anvil

Anvil is a local testnet node provided by Foundry that you can use to test the front end or contracts that interact via RPC. 

Start the test node:

```sh
anvil
```

This command starts a local node that listens for RPC connections on port `8545` by default. The port can be specified with the `--port` parameter. Use `--account <NUM> `to view a list of available accounts and private keys:

```sh
anvil --accounts 10
```

At the same time, you can also use anvil to fork Ethereum for testing:

```sh
anvil --hardfork latest
```

For more anvil functions, please view the [Anvil documentation](https://book.getfoundry.sh/reference/anvil/).

## How to use Chisel

Chisel is an advanced Solidity REPL provided by Foundry. It can be used to quickly test Solidity snippets locally or on a forked network. 

REPL (Read-Eval-Print Loop) is an interactive command line tool that allows users to enter commands and see the results immediately. Also a programming environment, often used for interpreted languages ​​such as Python, Ruby, and JavaScript.

In a REPL environment, the user can enter a line of code or a command, and then the code or command will be immediately executed by the interpreter or compiler, and the result will be returned to the user. The user can perform further operations or enter new codes based on the returned results. This ability for instant feedback makes the REPL a useful tool for learning and debugging code.

To use Chisel, just type chisel. Then start writing Solidity code! Chisel provides detailed feedback on every entry.

Chisel can be used inside and outside Foundry projects. If the binary is executed in the Foundry project root, Chisel will inherit the project's configuration options.

```sh
# Enter REPL
chisel
# Welcome to Chisel! Type `!help` to show available commands.
# Writing Solidity code
uint val = 8
# Print variables
val
# keccak256 operation
keccak256(abi.encodePacked(val))
# Quit Chisel !quit or !q
!q
```

## References

- [paradigm foundry](https://www.paradigm.xyz/2021/12/introducing-the-foundry-ethereum-development-toolbox)
- [ds-test](https://github.com/dapphub/ds-test/blob/master/src/test.sol)
- [The Foundry Book](https://onbjerg.github.io/foundry-book/index.html)
- [rebase code day Reference PPT](https://learnblockchain.cn/article/3749)
- [rebase code day Reference code base](https://github.com/bixia/solidity-dev)
- [Video: Intro to Foundry](https://www.youtube.com/watch?v=fNMfMxGxeag)
- [ERC20 foundry](https://learnblockchain.cn/article/3972)
- [The Foundry EVM Development Environment](https://medium.com/@jtriley15/the-foundry-evm-development-environment-f198f2e4c372)
