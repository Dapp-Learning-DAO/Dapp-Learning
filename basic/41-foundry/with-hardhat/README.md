## Configuring Foundry in a Hardhat project

The Foundry framework has many advantages over Hardhat in terms of code testing, for example.

- Can write tests using Solidity 
- Can perform fuzz testing 
- And it Runs fast

But in terms of code deployment, Foundry is not as convenient as Hardhat at the current stage. As developers, we naturally want all the advantages.

This article will introduce how to configure Foundry in a Hardhat project.

## Initializing a Hardhat project

```bash
mkdir with-hardhat
cd with-hardhat
# Initialize a project using pnpm
pnpm init
# Install hardhat
pnpm add -D hardhat
# Initialize project
pnpm hardhat init
```

## Install the hardhat-foundry plugin

```bash
pnpm add -D @nomicfoundation/hardhat-foundry
# hardhat Toolbox plugin
pnpm add -D @nomicfoundation/hardhat-toolbox
# chai Assertion library plugin
pnpm add -D @nomicfoundation/hardhat-chai-matchers
```

## Add the hardhat-foundry plugin to the hardhat.config.ts configuration file.

```typescript
import '@nomicfoundation/hardhat-toolbox';
import '@nomicfoundation/hardhat-foundry';
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
  solidity: '0.8.24',
};

export default config;
```

## Initialize the foundry.toml file and install the forge-std library.

```bash
pnpm hardhat init-foundry
```

## Write test cases

```bash
mkdir contracts/test
```

For example, using the `Greeter.sol `contract from the default Hardhat project as an example, write a test file called `contracts/test/Greeter.t.sol`. Test files usually end with t.sol.

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

Note: In the [Foundry Book](https://book.getfoundry.sh/forge/writing-tests) documentation, the method described for using the forge-std library is to first set the path for forge-std in foundry.toml or remappings.txt, and then `import {Test} from "forge-std/Test.sol";` in the test file.

It is worth noting that the test item testFuzz_SetGreeting above is a fuzz test, and the test file does not specify the input of the test, but randomly feeds information into the forge as input.

## Run test.

```bash
forge test --root .
# Print detailed information
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

If you want to make it easier, you can write this command in the `package.json`.

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

Afterwards, use `'pnpm test'` for testing.

At the same time, the original test files of Hardhat can be tested using `pnpm hardhat test`.

## References

- [the Foundry Book](https://book.getfoundry.sh/forge/writing-tests)