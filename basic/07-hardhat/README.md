[中文](./README-CN.md) / English

# Hardhat

Hardhat is a development environment for ethereum application to compile, deploy, test and debug.

It could help developer to manage , automate build smart contracts and some inherently repetitive tasks in dApps.The
core of hardhat is compiling, running and testing smart contracts. It has a build-in Hardhat test network, which is
designed for local ethereum network.Its main functions includes Solidity debugging, tracking invoked stack,
console.log() and explicit error tips in failed transaction.

Hardhat Runner is a CLI interacted with Hardhat and a extensible task runner. It was designed by the concept of tasks
and plugins. When you run Hardhat by CLI, you will run a task, such as `npx hardhat compile`. It will run the build-in
compiling task. The task will trigger other tasks, which can give the complicated work flow. Users and plugins could
cover all tasks now to customize and extend the work flow.

## Preparation

Before learning hardhat, you need to understand some Knowledge points as follows:

- dotenv place private key in `.env` files, which could prevent exposure on cloud server, formatted with "
  PRIVATE_KEY=xxxx". It will be read by code automaticily. Refer to [dotenv](https://www.npmjs.com/package/dotenv)
- The main problem npx want to resolve is to invoke modules installed internally in the project. Refer
  to [npx Tutorials](https://www.ruanyifeng.com/blog/2019/02/npx.html)
- Compared to web3.js, the interfaces of ethers.js and ethereum network library is easily used(note the interface
  difference between v5 and v4) [ethers.js v5 document](https://docs.ethers.io/v5/)
- mocha.js test framework is used to write the solution for contracts
  Interaction. [mochajs document](https://mochajs.org/#getting-started)
- chai.js assert framework is used to help to write testing scripts, refer
  to [ethereum-waffle chai document](https://ethereum-waffle.readthedocs.io/en/latest/matchers.html)
- infura is a node internet service provider to connect to block chain, which allow some free use amounts. It is enough
  to develop and debug. [infura offical site](https://infura.io/)

## Project structure and configuration hardhat

```sh
mkdir 07-hardhat                // create folder
cd    07-hardhat                // move to folder
npm install --save-dev hardhat  // install hardhat
npx hardhat                     // initialize hardhat
```

Finished in inputing `npx hardhat`, it will show in the terminal:

```sh
888    888                      888 888               888
888    888                      888 888               888
888    888                      888 888               888
8888888888  8888b.  888d888 .d88888 88888b.   8888b.  888888
888    888     "88b 888P"  d88" 888 888 "88b     "88b 888
888    888 .d888888 888    888  888 888  888 .d888888 888
888    888 888  888 888    Y88b 888 888  888 888  888 Y88b.
888    888 "Y888888 888     "Y88888 888  888 "Y888888  "Y888

Welcome to Hardhat v2.9.0

? What do you want to do? ...
> Create a basic sample project
  Create an advanced sample project
  Create an advanced sample project that uses TypeScript
  Create an empty hardhat.config.js
  Quit
```

We select 'Create a basic sample project' options to initialize a basic project, click enter directly in the next 2
steps.

### Project stucture

A standard project build in hardhat is as follow:

```sh
contracts/
scripts/
test/
hardhat.config.js
```

- palce fileds write in solidity in contracts
- palce scripts files such as deploying contracts in scripts
- palce testing scripts named with `contractName.test.js` in test
- `hardhat.config.js` is config file of hardhat

### Configuration of hardhat

`hardhat.config.js` config file example

```js
require('@nomiclabs/hardhat-waffle');
require('dotenv').config();

module.exports = {
    networks: {
        // hardhat build-in testing network (optional)
        hardhat: {
            // a fixed gasPrice could be set, it will be useful when testing gas consumption
            gasPrice: 1000000000,
        },
        // you could config arbitrary network
        // goerli testing network
        goerli: {
            // place INFURA_ID to yours
            // url: 'https://goerli.infura.io/v3/{INFURA_ID}',
            url: 'https://goerli.infura.io/v3/' + process.env.INFURA_ID, //<---- 在.env文件中配置自己的INFURA_ID

            //  place multiple privateKeyX to yours
            accounts: [process.env.PRIVATE_KEY, ...]
        }
    },
    solidity: {
        version: "0.8.0", // version of compiling contract, required
        settings: { // setting of compile, optional
            optimizer: {  // setting of optimizing
                enabled: true,
                runs: 200
            }
        }
    },

    // config project paths, any path could be specified, The following is a common template
    // files in sources, test, scripts will be executed one by one
    paths: {
        sources: "./contracts", // directory of contracts
        tests: "./test",  // directory of test files
        cache: "./cache", // cache directory, generated by hardhat
        artifacts: "./artifacts" // directory of compiling result, generated by hardhat
    },
    // setting of testing framework
    mocha: {
        timeout: 20000  // max waiting time of running unit test
    }
}
```

### Build-in hardhat network

hardhat has a special, secure and build-in testing network, named `hardhat`, you don't need a special configuration for
it. The network will follow the mechanism in real block chain network, and it will generate 10 test accounts for you (
just like truffle).

### Using plugins

Plugins have many functions in Hardhat, you could choose arbitrary plugins as a developer

Waffle plugins could make hardhat Integrated with waffle framework

```js
// hardhat.config.js
require('@nomiclabs/hardhat-waffle'); // hardhat waffle plugin
...
```

### Install dependencies

1. install nodejs (ignore)

2. install project dependencies:

   ```sh
   npm install --save-dev @nomiclabs/hardhat-waffle ethereum-waffle chai @nomiclabs/hardhat-ethers ethers dotenv
   ```

   or use yarn to intall (yarn installed firstly)

   ```sh
   yarn add -D hardhat-deploy-ethers ethers chai chai-ethers mocha @types/chai @types/mocha dotenv
   ```

3. config private key and network:

   create `.env` file in the directory of project, add private key and infura node to the file

   ```js
   PRIVATE_KEY = xxxxxxxxxxxxxxxx; // place your private key
   INFURA_ID = yyyyyyyy; // place infura node
   ```

## Usage

useage of hardhat

### Compile

Run the command, hardhat will compile all contracts file in directory of `sources`, the default path is `./contracts`

```sh
npx hardhat compile
```

### Test

Run the command, hardhat will compile all test files in directory of `tests`, the default path is `./test`

```sh
npx hardhat test
```

you could also specify some test files to run it

```sh
npx hardhat test ./test/Greeter.test.js
```

### Run

Run the specified script. If you are not, it will run on hardhat's build-in network by default(Hardhat Network).

```sh
npx hardhat run ./scripts/deploy.js
```

Run the specified network, such as the contract deployed on goerli test network(make sure that the wallet could pay the
gas)

```sh
npx hardhat run ./scripts/deploy.js --network goerli
```

### Verify

Verify the smart contract, here is an example of `goerli`.

Add the following configuration to `hardhat.config.js`:

```js
etherscan: {
    apiKey: "<etherscan的api key>",
}
```

Run script:

```shell
npx hardhat verify --network goerli <your contract address>
```

### Task

hardhat preset some task itself, such as compiling contract, running testing scripts. Those are build-in hardhat tasks.

Actually you could also customize some tasks, such as printing status of the current network's account

```js
// hardhat.config.js
...

task('accounts', 'Prints the list of accounts', async () => {
    const accounts = await ethers.getSigners();

    for (const account of accounts) {
        console.log(account.address);
    }
});

...
```

run task

```sh
npx hardhat accounts
```

terminal will print 10 addresses of testing account

```sh
0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
...
```

### Console

The console mode of hardhat could interact with chain in real-time, where the hardhat build-in network is started by
default.

```sh
npx hardhat console
```

we can directly use build-in ethers and web3 library, no need to import.

```js
// hardhat console mode:
// directly use async/await
>
await ethers.provider.getBlockNumber()  // 0
```

### console.log debug

hardhat provide the `console.log()` method to print logs, debug and test when running the contract . **Only valid in
hardhat build-int network**

you can use is by importing `hardhat/console.sol` in your contract

```solidity
import "hardhat/console.sol";

contract Greeter {
...

function setGreeting(string memory _greeting) public {
console.log("Changing greeting from '%s' to '%s'", greeting, _greeting);
greeting = _greeting;
}

}
```

When running test scripts, you can check logs:

```sh
Changing greeting from 'Hello, world!' to 'hello Dapp-Learning!'
```

## Steps

### Compile and test

1. compile the contract

   ```bash
   npx hardhat compile
   ```

2. batch run test scripts

   ```bash
   npx hardhat test
   ```

3. deploy to test network

   ```bash
   npx hardhat run scripts/deploy.js --network <network-name>
   ```

   `network-name` should be replaced with your networks, `goerli` is a choice which exists in the config file.

4. Verify smart contract

   ```bash
   npx hardhat verify --network goerli <network-name> <contract-address>
   ```

   `network-name` : the name of the network you specify, here you can replace it with `goerli`, which corresponds to the
   network name in the configuration file.

   `contract-address` : The address of the contract deployed in the previous step.

## Reference

- hardhat offical document: <https://hardhat.org/guides/project-setup.html>
- hardhat chinese document: <https://learnblockchain.cn/docs/hardhat/getting-started/>
- the usage of ethers.js and hardhat : <https://www.bilibili.com/video/BV1Pv411s7Nb>
- <https://rahulsethuram.medium.com/the-new-solidity-dev-stack-buidler-ethers-waffle-typescript-tutorial-f07917de48ae>
- erc20 openzepplin introduction: <https://segmentfault.com/a/1190000015400380>
