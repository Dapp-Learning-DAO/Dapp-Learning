<p align="center">
  <em>NOTICE</em>: <code>testrpc</code> is now <code>ganache-cli</code>. Use it just as you would <code>testrpc</code>.
</p>
<hr/>

[![npm](https://img.shields.io/npm/v/ganache-cli.svg)]()
[![npm](https://img.shields.io/npm/dm/ganache-cli.svg)]()
[![Build Status](https://travis-ci.org/trufflesuite/ganache-cli.svg?branch=master)](https://travis-ci.org/trufflesuite/ganache-cli)  

<p align="center">
  <img src="https://github.com/trufflesuite/ganache-cli/raw/develop/resources/icons/ganache-cli-128x128.png">
</p>

## Welcome to Ganache CLI
Ganache CLI, part of the Truffle suite of Ethereum development tools, is the command line version of [Ganache](https://github.com/trufflesuite/ganache), your personal blockchain for Ethereum development.

Ganache CLI uses ethereumjs to simulate full client behavior and make developing Ethereum applications faster, easier, and safer. It also includes all popular RPC functions and features (like events) and can be run deterministically to make development a breeze.

### Looking for TestRPC?

If you came here expecting to find the TestRPC, you're in the right place! Truffle has taken the TestRPC under its wing and made it part of the Truffle suite of tools. From now on you can expect better support along with tons of new features that help make Ethereum development safer, easier, and more enjoyable. Use `ganache-cli` just as you would `testrpc`.

## Installation

`ganache-cli` is written in JavaScript and distributed as a Node.js package via `npm`. Make sure you have Node.js (>= v8) installed.

Using npm:

```Bash
npm install -g ganache-cli
```

or, if you are using [Yarn](https://yarnpkg.com/):

```Bash
yarn global add ganache-cli
```

`ganache-cli` utilizes [`ganache-core`](https://github.com/trufflesuite/ganache-core) internally, which is distributed with optional native dependencies for increased performance. If these native dependencies fail to install on your system `ganache-cli` will automatically fallback to `ganache-core`’s pre-bundled JavaScript build.

Having problems? Be sure to check out the [FAQ](https://github.com/trufflesuite/ganache-cli/wiki/FAQ) and if you're still having issues and you're sure its a problem with `ganache-cli` please open an issue.

### Using Ganache CLI

#### Command Line

```Bash
$ ganache-cli <options>
```

## Options:

* `-a` or `--accounts`: Specify the number of accounts to generate at startup.
* `-e` or `--defaultBalanceEther`: Amount of ether to assign each test account. Default is 100.
* `-b` or `--blockTime`: Specify blockTime in seconds for automatic mining. If you don't specify this flag, ganache will instantly mine a new block for every transaction. Using the --blockTime flag is discouraged unless you have tests which require a specific mining interval.
* `-d` or `--deterministic`: Generate deterministic addresses based on a pre-defined mnemonic.
* `-n` or `--secure`: Lock available accounts by default (good for third party transaction signing)
* `-m` or `--mnemonic`: Use a bip39 mnemonic phrase for generating a PRNG seed, which is in turn used for hierarchical deterministic (HD) account generation.
* `-p` or `--port`: Port number to listen on. Defaults to 8545.
* `-h` or `--host` or `--hostname`: Hostname to listen on. Defaults to 127.0.0.1 (defaults to 0.0.0.0 for Docker instances of ganache-cli).
* `-s` or `--seed`: Use arbitrary data to generate the HD wallet mnemonic to be used.
* `-g` or `--gasPrice`: The price of gas in wei (defaults to 20000000000)
* `-l` or `--gasLimit`: The block gas limit (defaults to 0x6691b7)
* `--callGasLimit`: Sets the transaction gas limit for `eth_call` and `eth_estimateGas` calls. Must be specified as a `hex` string. Defaults to `"0x1fffffffffffff"` (`Number.MAX_SAFE_INTEGER`)
* `-k` or `--hardfork`: Allows users to specify which hardfork should be used. Supported hardforks are `byzantium`, `constantinople`, `petersburg`, `istanbul`, and `muirGlacier` (default).
* `-f` or `--fork`: Fork from another currently running Ethereum client at a given block. Input should be the HTTP location and port of the other client, e.g. `http://localhost:8545`. You can optionally specify the block to fork from using an `@` sign: `http://localhost:8545@1599200`.
* `forkCacheSize`: `number` - The maximum size, in bytes, of the in-memory cache for queries on a chain fork. Defaults to `1_073_741_824` bytes (1 gigabyte). You can set this to `0` to disable caching (not recommended), or to `-1` for unlimited (will be limited by your node process).
* `-i` or `--networkId`: Specify the network id ganache-cli will use to identify itself (defaults to the current time or the network id of the forked blockchain if configured)
* `--chainId`: Specify the Chain ID ganache-cli will use for `eth_chainId` RPC and the `CHAINID` opcode. For legacy reasons, the default is currently `1337` for `eth_chainId` RPC and `1` for the `CHAINID` opcode. Setting this flag will align the chainId values. This will be fixed in the next major version of ganache-cli and ganache-core!
* `--db`: Specify a path to a directory to save the chain database. If a database already exists, ganache-cli will initialize that chain instead of creating a new one.
* `--debug`: Output VM opcodes for debugging
* `--mem`: Output ganache-cli memory usage statistics. This replaces normal output.
* `-q` or `--quiet`: Run ganache-cli without any logs.
* `-v` or `--verbose`: Log all requests and responses to stdout
* `-?` or `--help`: Display help information
* `--version`: Display the version of ganache-cli
* `--account_keys_path` or `--acctKeys`: Specifies a file to save accounts and private keys to, for testing.
* `--noVMErrorsOnRPCResponse`: Do not transmit transaction failures as RPC errors. Enable this flag for error reporting behaviour which is compatible with other clients such as geth and Parity.
* `--allowUnlimitedContractSize`: Allows unlimited contract sizes while debugging. By enabling this flag, the check within the EVM for contract size limit of 24KB (see EIP-170) is bypassed. Enabling this flag **will** cause ganache-cli to behave differently than production environments.
* `--keepAliveTimeout`: Sets the HTTP server's `keepAliveTimeout` in milliseconds. See the [NodeJS HTTP docs](https://nodejs.org/api/http.html#http_server_keepalivetimeout) for details. `5000` by default.
* `-t` or `--time`: Date (ISO 8601) that the first block should start. Use this feature, along with the evm_increaseTime method to test time-dependent code.

Special Options:

* `--account`: Specify `--account=...` (no 's') any number of times passing arbitrary private keys and their associated balances to generate initial addresses:

  ```
  $ ganache-cli --account="<privatekey>,balance" [--account="<privatekey>,balance"]
  ```

  Note that private keys are 64 characters long, and must be input as a 0x-prefixed hex string. Balance can either be input as an integer or 0x-prefixed hex value specifying the amount of wei in that account.

  An HD wallet will not be created for you when using `--account`.

* `-u` or `--unlock`: Specify `--unlock ...` any number of times passing either an address or an account index to unlock specific accounts. When used in conjunction with `--secure`, `--unlock` will override the locked state of specified accounts.

  ```
  $ ganache-cli --secure --unlock "0x1234..." --unlock "0xabcd..."
  ```

  You can also specify a number, unlocking accounts by their index:

  ```
  $ ganache-cli --secure -u 0 -u 1
  ```

  This feature can also be used to impersonate accounts and unlock addresses you wouldn't otherwise have access to. When used with the `--fork` feature, you can use ganache-cli to make transactions as any address on the blockchain, which is very useful for testing and dynamic analysis.

## Usage

As a [Web3](https://github.com/ethereum/web3.js/) provider:

```javascript
const ganache = require("ganache-core");
const web3 = new Web3(ganache.provider());
```
If web3 is already initialized:
```javascript
const ganache = require("ganache-core");
web3.setProvider(ganache.provider());
```
NOTE: depending on your web3 version, you may need to set a number of confirmation blocks
```javascript
const web3 = new Web3(provider, null, { transactionConfirmationBlocks: 1 });
```

As an [ethers.js](https://github.com/ethers-io/ethers.js/) provider:

```javascript
const ganache = require("ganache-cli");
const provider = new ethers.providers.Web3Provider(ganache.provider());
```

As a general HTTP and WebSocket server:

```javascript
const ganache = require("ganache-cli");
const server = ganache.server();
server.listen(port, function(err, blockchain) {...});
```

## Options

Both `.provider()` and `.server()` take a single object which allows you to specify behavior of ganache-cli. This parameter is optional. Available options are:

* `"accounts"`: `Array` of `Object`'s. Each object should have a `balance` key with a hexadecimal value. The key `secretKey` can also be specified, which represents the account's private key. If no `secretKey`, the address is auto-generated with the given balance. If specified, the key is used to determine the account's address.
* `"debug"`: `boolean` - Output VM opcodes for debugging
* `"blockTime"`: `number` - Specify blockTime in seconds for automatic mining. If you don't specify this flag, ganache will instantly mine a new block for every transaction. Using the `blockTime` option is discouraged unless you have tests which require a specific mining interval.
* `"logger"`: `Object` - Object, like `console`, that implements a `log()` function.
* `"mnemonic"`: Use a specific HD wallet mnemonic to generate initial addresses.
* `"port"`: `number` Port number to listen on when running as a server.
* `"seed"`: Use arbitrary data to generate the HD wallet mnemonic to be used.
* `"default_balance_ether"`: `number` - The default account balance, specified in ether.
* `"total_accounts"`: `number` - Number of accounts to generate at startup.
* `"fork"`: `string` or `object` - Fork from another currently running Ethereum client at a given block.  When a `string`, input should be the HTTP location and port of the other client, e.g. `http://localhost:8545`. You can optionally specify the block to fork from using an `@` sign: `http://localhost:8545@1599200`. Can also be a `Web3 Provider` object, optionally used in conjunction with the `fork_block_number` option below.
* `"fork_block_number"`: `string` or `number` - Block number the provider should fork from, when the `fork` option is specified. If the `fork` option is specified as a string including the `@` sign and a block number, the block number in the `fork` parameter takes precedence.
`forkCacheSize`: `number` - The maximum size, in bytes, of the in-memory cache for queries on a chain fork. Defaults to `1_073_741_824` bytes (1 gigabyte). You can set this to `0` to disable caching (not recommended), or to `-1` for unlimited (will be limited by your node/browser process).
* `"network_id"`: Specify the network id ganache-core will use to identify itself (defaults to the current time or the network id of the forked blockchain if configured)
* `"time"`: `Date` - Date that the first block should start. Use this feature, along with the `evm_increaseTime` method to test time-dependent code.
* `"locked"`: `boolean` - whether or not accounts are locked by default.
* `"unlocked_accounts"`: `Array` - array of addresses or address indexes specifying which accounts should be unlocked.
* `"db_path"`: `String` - Specify a path to a directory to save the chain database. If a database already exists, `ganache-cli` will initialize that chain instead of creating a new one.  Note: You will not be able to modify state (accounts, balances, etc) on startup when you initialize ganache-core with a pre-existing database.
* `"db"`: `Object` - Specify an alternative database instance, for instance [MemDOWN](https://github.com/level/memdown).
* `"ws"`: `boolean` Enable a websocket server. This is `true` by default.
* `"account_keys_path"`: `String` - Specifies a file to save accounts and private keys to, for testing.
* `"vmErrorsOnRPCResponse"`: `boolean` - Whether or not to transmit transaction failures as RPC errors. Set to `false` for error reporting behaviour which is compatible with other clients such as geth and Parity. This is `true` by default to replicate the error reporting behavior of previous versions of ganache.
* `"hdPath"`: The hierarchical deterministic path to use when generating accounts. Default: "m/44'/60'/0'/0/"
* `"hardfork"`: `String` Allows users to specify which hardfork should be used. Supported hardforks are `byzantium`, `constantinople`, `petersburg`, `istanbul`, and `muirGlacier` (default).
* `"allowUnlimitedContractSize"`: `boolean` - Allows unlimited contract sizes while debugging (NOTE: this setting is often used in conjuction with an increased `gasLimit`). By setting this to `true`, the check within the EVM for contract size limit of 24KB (see [EIP-170](https://git.io/vxZkK)) is bypassed. Setting this to `true` **will** cause `ganache-cli` to behave differently than production environments. (default: `false`; **ONLY** set to `true` during debugging).
* `"gasPrice"`: `String::hex` Sets the default gas price for transactions if not otherwise specified. Must be specified as a `hex` encoded string in `wei`. Defaults to `"0x77359400"` (2 `gwei`).
* `"gasLimit"`: `String::hex | number` Sets the block gas limit. Must be specified as a `hex` string or `number`. Defaults to `"0x6691b7"`.
* `"callGasLimit"`: `number` Sets the transaction gas limit for `eth_call` and `eth_estimateGas` calls. Must be specified as a `hex` string. Defaults to `"0x1fffffffffffff"` (`Number.MAX_SAFE_INTEGER`).
* `"keepAliveTimeout"`:  `number` If using `.server()` - Sets the HTTP server's `keepAliveTimeout` in milliseconds. See the [NodeJS HTTP docs](https://nodejs.org/api/http.html#http_server_keepalivetimeout) for details. `5000` by default.

## Implemented Methods

The RPC methods currently implemented are:

* [eth_accounts](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_accounts)
* [eth_blockNumber](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_blockNumber)
* [eth_call](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_call)
* [eth_coinbase](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_coinbase)
* [eth_estimateGas](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_estimateGas)
* [eth_gasPrice](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_gasPrice)
* [eth_getBalance](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_getBalance)
* [eth_getBlockByNumber](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_getBlockByNumber)
* [eth_getBlockByHash](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_getBlockByHash)
* [eth_getBlockTransactionCountByHash](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_getBlockTransactionCountByHash)
* [eth_getBlockTransactionCountByNumber](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_getBlockTransactionCountByNumber)
* [eth_getCode](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_getCode) (only supports block number “latest”)
* [eth_getCompilers](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_getCompilers)
* [eth_getFilterChanges](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_getFilterChanges)
* [eth_getFilterLogs](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_getFilterLogs)
* [eth_getLogs](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_getLogs)
* [eth_getStorageAt](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_getStorageAt)
* [eth_getTransactionByHash](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_getTransactionByHash)
* [eth_getTransactionByBlockHashAndIndex](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_getTransactionByBlockHashAndIndex)
* [eth_getTransactionByBlockNumberAndIndex](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_getTransactionByBlockNumberAndIndex)
* [eth_getTransactionCount](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_getTransactionCount)
* [eth_getTransactionReceipt](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_getTransactionReceipt)
* [eth_hashrate](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_hashrate)
* [eth_mining](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_mining)
* [eth_newBlockFilter](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_newBlockFilter)
* [eth_newFilter](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_newFilter) (includes log/event filters)
* [eth_protocolVersion](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_protocolVersion)
* [eth_sendTransaction](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sendTransaction)
* [eth_sendRawTransaction](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sendRawTransaction)
* [eth_sign](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign)
* `eth_signTypedData`
* [eth_subscribe](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_subscribe) (only for websocket connections. "syncing" subscriptions are not yet supported)
* [eth_unsubscribe](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_unsubscribe) (only for websocket connections. "syncing" subscriptions are not yet supported)
* [shh_version](https://github.com/ethereum/wiki/wiki/JSON-RPC#shh_version)
* [net_version](https://github.com/ethereum/wiki/wiki/JSON-RPC#net_version)
* [net_peerCount](https://github.com/ethereum/wiki/wiki/JSON-RPC#net_peerCount)
* [net_listening](https://github.com/ethereum/wiki/wiki/JSON-RPC#net_listening)
* [eth_uninstallFilter](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_uninstallFilter)
* [eth_syncing](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_syncing)
* [web3_clientVersion](https://github.com/ethereum/wiki/wiki/JSON-RPC#web3_clientVersion)
* [web3_sha3](https://github.com/ethereum/wiki/wiki/JSON-RPC#web3_sha3)
* `bzz_hive`
* `bzz_info`

#### Management API Methods

* [debug_traceTransaction](https://github.com/ethereum/go-ethereum/wiki/Management-APIs#debug_tracetransaction)
* [miner_start](https://github.com/ethereum/go-ethereum/wiki/Management-APIs#miner_start)
* [miner_stop](https://github.com/ethereum/go-ethereum/wiki/Management-APIs#miner_stop)
* [personal_sendTransaction](https://github.com/ethereum/go-ethereum/wiki/Management-APIs#personal_sendTransaction)
* [personal_unlockAccount](https://github.com/ethereum/go-ethereum/wiki/Management-APIs#personal_unlockAccount)
* [personal_importRawKey](https://github.com/ethereum/go-ethereum/wiki/Management-APIs#personal_importRawKey)
* [personal_newAccount](https://github.com/ethereum/go-ethereum/wiki/Management-APIs#personal_newAccount)
* [personal_lockAccount](https://github.com/ethereum/go-ethereum/wiki/Management-APIs#personal_lockAccount)
* [personal_listAccounts](https://github.com/ethereum/go-ethereum/wiki/Management-APIs#personal_listaccounts)

## Custom Methods

Special non-standard methods that aren’t included within the original RPC specification:
* `evm_snapshot` : Snapshot the state of the blockchain at the current block. Takes no parameters. Returns the integer id of the snapshot created. A snapshot can only be used once. After a successful `evm_revert`, the same snapshot id cannot be used again. Consider creating a new snapshot after each `evm_revert` *if you need to revert to the same point multiple times*.
  ```bash
  curl -H "Content-Type: application/json" -X POST --data \
          '{"id":1337,"jsonrpc":"2.0","method":"evm_snapshot","params":[]}' \
          http://localhost:8545
  ```
  ```json
  { "id": 1337, "jsonrpc": "2.0", "result": "0x1" }
  ```
* `evm_revert` : Revert the state of the blockchain to a previous snapshot. Takes a single parameter, which is the snapshot id to revert to. This deletes the given snapshot, as well as any snapshots taken after (Ex: reverting to id `0x1` will delete snapshots with ids `0x1`, `0x2`, `etc`...  If no snapshot id is passed it will revert to the latest snapshot. Returns `true`.
  ```bash
  # Ex: ID "1" (hex encoded string)
  curl -H "Content-Type: application/json" -X POST --data \
          '{"id":1337,"jsonrpc":"2.0","method":"evm_revert","params":["0x1"]}' \
          http://localhost:8545
  ```
  ```json
  { "id": 1337, "jsonrpc": "2.0", "result": true }
  ```
* `evm_increaseTime` : Jump forward in time. Takes one parameter, which is the amount of time to increase in seconds. Returns the total time adjustment, in seconds.
  ```bash
  # Ex: 1 minute (number)
  curl -H "Content-Type: application/json" -X POST --data \
          '{"id":1337,"jsonrpc":"2.0","method":"evm_increaseTime","params":[60]}' \
          http://localhost:8545
  ```
  ```json
  { "id": 1337, "jsonrpc": "2.0", "result": "060" }
  ```
* `evm_mine` : Force a block to be mined. Takes one optional parameter, which is the timestamp a block should setup as the mining time. Mines a block independent of whether or not mining is started or stopped.
  ```bash
  # Ex: new Date("2009-01-03T18:15:05+00:00").getTime()
  curl -H "Content-Type: application/json" -X POST --data \
          '{"id":1337,"jsonrpc":"2.0","method":"evm_mine","params":[1231006505000]}' \
          http://localhost:8545
  ```

  ```json
  { "id": 1337, "jsonrpc": "2.0", "result": "0x0" }
  ```
* `evm_unlockUnknownAccount` : Unlocks any unknown account. Accounts known to the `personal` namespace and accounts
returned by `eth_accounts` cannot be unlocked using this method; use `personal_unlockAccount` instead.
  ```bash
  # Ex: account: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  curl -H "Content-Type: application/json" -X POST --data \
          '{"id":1337,"jsonrpc":"2.0","method":"evm_unlockUnknownAccount","params":["0x742d35Cc6634C0532925a3b844Bc454e4438f44e"]}' \
          http://localhost:8545
  ```

  ```json
  { "id": 1337, "jsonrpc": "2.0", "result": true }
  ```
* `evm_lockUnknownAccount` : Locks any unknown account. Accounts known to the `personal` namespace and accounts
returned by `eth_accounts` cannot be locked using this method; use `personal_lockAccount` instead.
  ```bash
  # Ex: account: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  curl -H "Content-Type: application/json" -X POST --data \
          '{"id":1337,"jsonrpc":"2.0","method":"evm_lockUnknownAccount","params":["0x742d35Cc6634C0532925a3b844Bc454e4438f44e"]}' \
          http://localhost:8545
  ```

  ```json
  { "id": 1337, "jsonrpc": "2.0", "result": true }
  ```
  
## Unsupported Methods

* `eth_compileSolidity`: If you'd like Solidity compilation in Javascript, please see the [solc-js project](https://github.com/ethereum/solc-js).

## Docker

The Simplest way to get started with the Docker image:

```Bash
docker run --detach --publish 8545:8545 trufflesuite/ganache-cli:latest
```

To pass options to ganache-cli through Docker simply add the arguments to
the run command:

```Bash
docker run --detach --publish 8545:8545 trufflesuite/ganache-cli:latest --accounts 10 --debug
                                                                        ^^^^^^^^^^^^^^^^^^^^^
```

The Docker container adds an environment variable `DOCKER=true`; when this variable is set to `true` (case insensitive), `ganache-cli` use a default hostname IP of `0.0.0.0` instead of the normal default `127.0.0.1`. You can still specify a custom hostname however:

```Bash
docker run --detach --publish 8545:8545 trufflesuite/ganache-cli:latest --host XXX.XXX.XXX.XXX
                                                                        ^^^^^^^^^^^^^^^^^^^^^^
```

To build and run the Docker container from source:

```Bash
git clone https://github.com/trufflesuite/ganache-cli.git && cd ganache-cli
```
then:
```Bash
docker build --tag trufflesuite/ganache-cli .
docker run --publish 8545:8545 trufflesuite/ganache-cli
```
or
```Bash
npm run docker
```


## Contributing to Ganache CLI

The Ganache CLI repository contains the cli logic and Docker config/build only. It utilizes [ganache-core](https://github.com/trufflesuite/ganache-core), the core logic powering [Ganache](https://github.com/trufflesuite/ganache), internally.

You can contribute to the core code at [ganache-core](https://github.com/trufflesuite/ganache-core).

To contribue to ganache-cli, run:

```Bash
git clone https://github.com/trufflesuite/ganache-cli.git && cd ganache-cli
npm install
```

You'll need Python 2.7 installed, and on Windows, you'll likely need to install [windows-build-tools](https://github.com/felixrieseberg/windows-build-tools) from an Administrator PowerShell Prompt via `npm install --global windows-build-tools`.

### PR Message format:

`<type>(<scope>): <subject>`

Where `type` must be one of the following:

* **feat**: A new feature
* **fix**: A bug fix
* **docs**: Documentation only changes
* **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing
  semi-colons, etc)
* **refactor**: A code change that neither fixes a bug nor adds a feature
* **perf**: A code change that improves performance
* **test**: Adding missing or correcting existing tests
* **chore**: Changes to the build process or auxiliary tools and libraries such as documentation
  generation

see: https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines

# License
[MIT](https://tldrlegal.com/license/mit-license)
