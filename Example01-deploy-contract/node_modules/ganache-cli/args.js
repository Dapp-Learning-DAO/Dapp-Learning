module.exports = exports = function(yargs, version, isDocker) {
  return yargs
    .strict()
    .option('p', {
      group: 'Network:',
      alias: 'port',
      type: 'number',
      default: 8545,
      describe: 'Port number to listen on'
    })
    .option('h', {
      group: 'Network:',
      alias: ['host', 'hostname'],
      type: 'string',
      default: isDocker ? '0.0.0.0' : '127.0.0.1',
      describe: 'Hostname to listen on'
    })
    .option('keepAliveTimeout', {
      group: 'Network:',
      type: 'number',
      default: 5000,
      describe: 'The number of milliseconds of inactivity a server needs to wait for additional incoming data, after it has finished writing the last response, before a socket will be destroyed.'
    })
    .option('a', {
      group: 'Accounts:',
      alias: 'accounts',
      describe: 'Number of accounts to generate at startup',
      type: 'number',
      default: 10
    })
    .option('e', {
      group: 'Accounts:',
      alias: 'defaultBalanceEther',
      describe: 'Amount of ether to assign each test account',
      type: 'number',
      default: 100.0
    })
    .option('account', {
      group: 'Accounts:',
      describe: "Account data in the form '<private_key>,<initial_balance>', can be specified multiple times. Note that private keys are 64 characters long and must be entered as an 0x-prefixed hex string. Balance can either be input as an integer, or as a 0x-prefixed hex string with either form specifying the initial balance in wei.",
      type: 'array',
      string: true,
      demandOption: false
    })
    .option('account_keys_path', {
      group: 'Accounts:',
      alias: 'acctKeys',
      type: 'string',
      describe: 'saves generated accounts and private keys as JSON object in specified file',
      normalize: true,
      demandOption: false,
      default: null
    })
    .option('n', {
      group: 'Accounts:',
      alias: 'secure',
      describe: 'Lock available accounts by default (good for third party transaction signing)',
      type: 'boolean',
      default: false
    })
    .option('u', {
      group: 'Accounts:',
      alias: 'unlock',
      type: 'array',
      string: true,
      describe: 'Comma-separated list of accounts or indices to unlock',
      demandOption: false
    })
    .option('k', {
      group: 'Chain:',
      alias: 'hardfork',
      type: 'string',
      describe: "Allows users to specify which hardfork should be used. Supported hardforks are `byzantium`, `constantinople`, `petersburg`, `istanbul` and `muirGlacier` (default).",
      default: "muirGlacier"
    })
    .option('f', {
      group: 'Chain:',
      alias: 'fork',
      type: 'string',
      describe: "Fork from another currently running Ethereum client at a given block. Input should be the HTTP location and port of the other client, e.g. 'http://localhost:8545' or optionally provide a block number 'http://localhost:8545@1599200'",
      default: false
    })
    .option('forkCacheSize', {
      group: 'Chain:',
      type: 'number',
      describe: "The maximum size, in bytes, of the in-memory cache for queries on a chain fork. Defaults to `1_073_741_824` bytes (1 gigabyte). You can set this to `0` to disable caching (not recommended), or to `-1` for unlimited (will be limited by your node process).",
      default: 1073741824
    })
    .option('db', {
      group: 'Chain:',
      describe: 'Directory of chain database; creates one if it doesn\'t exist',
      type: 'string',
      normalize: true,
      default: null
    })
    .option('s', {
      group: 'Chain:',
      alias: 'seed',
      type: 'string',
      describe: 'Arbitrary data to generate the HD wallet mnemonic to be used',
      defaultDescription: "Random value, unless -d is specified",
      conflicts: 'd',
      demandOption: false
    })
    .option('hdPath', {
        group: 'Accounts:',
        alias: 'hd_path',
        describe: `The hierarchical deterministic path to use when generating accounts. Default: "m/44'/60'/0'/0/"`,
        type: 'string',
        demandOption: false
    })
    .option('d', {
      group: 'Chain:',
      alias: 'deterministic',
      describe: 'Generate deterministic addresses based on a pre-defined mnemonic.',
      conflicts: 's',
      type: 'boolean',
      default: undefined,
      demandOption: false
    })
    .option('m', {
      group: 'Chain:',
      alias: 'mnemonic',
      type: 'string',
      describe: 'bip39 mnemonic phrase for generating a PRNG seed, which is in turn used for hierarchical deterministic (HD) account generation',
      demandOption: false
    })
    .option('noVMErrorsOnRPCResponse', {
      group: 'Chain:',
      describe: 'Do not transmit transaction failures as RPC errors. Enable this flag for error reporting behaviour which is compatible with other clients such as geth and Parity.',
      type: 'boolean',
      default: false
    })
    .option('b', {
      group: 'Chain:',
      alias: 'blockTime',
      type: 'number',
      describe: 'Block time in seconds for automatic mining. Will instantly mine a new block for every transaction if option omitted. Avoid using unless your test cases require a specific mining interval.',
      demandOption: false
    })
    .option('i', {
      group: 'Chain:',
      alias: 'networkId',
      type: 'number',
      describe: "The Network ID ganache-cli will use to identify itself.",
      defaultDescription: "System time at process start or Network ID of forked blockchain if configured.",
      demandOption: false
    })
    .option('chainId', {
      group: 'Chain:',
      type: 'number',
      describe: "The Chain ID ganache-cli will use for `eth_chainId` RPC and the `CHAINID` opcode.",
      defaultDescription: "For legacy reasons, the default is currently `1337` for `eth_chainId` RPC and `1` for the `CHAINID` opcode. This will be fixed in the next major version of ganache-cli and ganache-core!",
      demandOption: false
    })
    .option('g', {
      group: 'Chain:',
      alias: 'gasPrice',
      describe: 'The price of gas in wei',
      type: 'number',
      default: 20000000000
    })
    .option('l', {
      group: 'Chain:',
      alias: 'gasLimit',
      describe: 'The block gas limit in wei',
      type: 'number',
      default: 0x6691b7
    })
    .option('callGasLimit', {
      group: 'Chain:',
      describe: 'Sets the transaction gas limit for `eth_call` and `eth_estimateGas` calls. Must be specified as a hex string. Defaults to "0x1fffffffffffff" (Number.MAX_SAFE_INTEGER)',
      type: 'number',
      default: 0x1fffffffffffff
    })
    .option('allowUnlimitedContractSize', {
      group: 'Chain:',
      describe: 'Allows unlimited contract sizes while debugging. By enabling this flag, the check within the EVM for contract size limit of 24KB (see EIP-170) is bypassed. Enabling this flag *will* cause ganache-cli to behave differently than production environments.',
      type: 'boolean',
      default: false
    })
    .option('t', {
      group: 'Chain:',
      alias: 'time',
      describe: 'Date (ISO 8601) that the first block should start. Use this feature, along with the evm_increaseTime method to test time-dependent code.',
      type: 'string',
      coerce: (arg) => {
        let timestamp = Date.parse(arg);
        if (isNaN(timestamp)) {
          throw new Error('Invalid \'time\' format');
        }
        return new Date(timestamp);
      }
    })
    .option('debug', {
      group: 'Other:',
      describe: 'Output VM opcodes for debugging',
      type: 'boolean',
      default: false
    })
    .option('v', {
      group: 'Other:',
      alias: 'verbose',
      describe: 'Log all requests and responses to stdout',
      type: 'boolean',
      default: false
    })
    .option('mem', {
      group: 'Other:',
      describe: 'Only show memory output, not tx history',
      type: 'boolean',
      default: false
    })
    .option('q', {
      group: 'Other:',
      alias: 'quiet',
      describe: 'Run ganache quietly (no logs)',
      type: 'boolean',
      default: false
    })
    .showHelpOnFail(false, 'Specify -? or --help for available options')
    .help('help')
    .alias('help', '?')
    .wrap(Math.min(120, yargs.terminalWidth()))
    .version(version)
    .check((argv) => {
      if (argv.p < 1 || argv.p > 65535) {
        throw new Error(`Invalid port number '${argv.p}'`);
      }

      if (argv.h.trim() == '') {
        throw new Error('Cannot leave hostname blank; please provide a hostname');
      }

      return true;
    })
}
