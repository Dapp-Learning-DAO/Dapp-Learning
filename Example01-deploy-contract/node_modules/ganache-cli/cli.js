#!/usr/bin/env node

// make sourcemaps work!
require('source-map-support').install();

var yargs = require("yargs");
var pkg = require("./package.json");
var {toChecksumAddress, BN} = require("ethereumjs-util");
var ganache;
try {
  ganache = require("./lib");
} catch(e) {
  ganache = require("./build/ganache-core.node.cli.js");
}
var to = ganache.to;
var initArgs = require("./args")

var detailedVersion = "Ganache CLI v" + pkg.version + " (ganache-core: " + ganache.version + ")";

var isDocker = "DOCKER" in process.env && process.env.DOCKER.toLowerCase() === "true";
var argv = initArgs(yargs, detailedVersion, isDocker).argv;

function parseAccounts(accounts) {
  function splitAccount(account) {
    account = account.split(',')
    return {
      secretKey: account[0],
      balance: account[1]
    };
  }

  if (typeof accounts === 'string')
    return [ splitAccount(accounts) ];
  else if (!Array.isArray(accounts))
    return;

  var ret = []
  for (var i = 0; i < accounts.length; i++) {
    ret.push(splitAccount(accounts[i]));
  }
  return ret;
}

if (argv.d) {
  argv.s = "TestRPC is awesome!"; // Seed phrase; don't change to Ganache, maintain original determinism
}

if (typeof argv.unlock == "string") {
  argv.unlock = [argv.unlock];
}

var logger = console;

// If quiet argument passed, no output
if (argv.q === true){
  logger = {
    log: function() {}
  };
}

// If the mem argument is passed, only show memory output,
// not transaction history.
if (argv.mem === true) {
  logger = {
    log: function() {}
  };

  setInterval(function() {
    console.log(process.memoryUsage());
  }, 1000);
}

var options = {
  port: argv.p,
  hostname: argv.h,
  debug: argv.debug,
  seed: argv.s,
  mnemonic: argv.m,
  total_accounts: argv.a,
  default_balance_ether: argv.e,
  blockTime: argv.b,
  gasPrice: argv.g,
  gasLimit: argv.l,
  callGasLimit: argv.callGasLimit,
  accounts: parseAccounts(argv.account),
  unlocked_accounts: argv.unlock,
  fork: argv.f,
  forkCacheSize: argv.forkCacheSize,
  hardfork: argv.k,
  network_id: argv.i,
  verbose: argv.v,
  secure: argv.n,
  db_path: argv.db,
  hd_path: argv.hdPath,
  account_keys_path: argv.account_keys_path,
  vmErrorsOnRPCResponse: !argv.noVMErrorsOnRPCResponse,
  logger: logger,
  allowUnlimitedContractSize: argv.allowUnlimitedContractSize,
  time: argv.t,
  keepAliveTimeout: argv.keepAliveTimeout,
  _chainId: argv.chainId,
  // gross!
  _chainIdRpc: argv.chainId
}

var server = ganache.server(options);

console.log(detailedVersion);

let started = false;
process.on("uncaughtException", function(e) {
  if (started) {
    console.log(e);
  } else {
    console.log(e.stack);
  }
  process.exit(1);
})

// See http://stackoverflow.com/questions/10021373/what-is-the-windows-equivalent-of-process-onsigint-in-node-js
if (process.platform === "win32") {
  require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
  })
  .on("SIGINT", function () {
    process.emit("SIGINT");
  });
}

const closeHandler = function () {
  // graceful shutdown
  server.close(function(err) {
    if (err) {
      // https://nodejs.org/api/process.html#process_process_exit_code
      // writes to process.stdout in Node.js are sometimes asynchronous and may occur over
      // multiple ticks of the Node.js event loop. Calling process.exit(), however, forces
      // the process to exit before those additional writes to stdout can be performed.
      if(process.stdout._handle) process.stdout._handle.setBlocking(true);
      console.log(err.stack || err);
      process.exit();
    } else {
      process.exit(0);
    }
  });
}

process.on("SIGINT", closeHandler);
process.on("SIGTERM", closeHandler);
process.on("SIGHUP", closeHandler);

function startGanache(err, result) {
  if (err) {
    console.log(err);
    return;
  }
  started = true;
  var state = result ? result : server.provider.manager.state;

  console.log("");
  console.log("Available Accounts");
  console.log("==================");

  var accounts = state.accounts;
  var addresses = Object.keys(accounts);
  var ethInWei = new BN("1000000000000000000");

  addresses.forEach(function(address, index) {
    var balance = new BN(accounts[address].account.balance);
    var strBalance = balance.divRound(ethInWei).toString();
    var about = balance.mod(ethInWei).isZero() ? "" : "~";
    var line = `(${index}) ${toChecksumAddress(address)} (${about}${strBalance} ETH)`;

    if (state.isUnlocked(address) == false) {
      line += " 🔒";
    }

    console.log(line);
  });

  console.log("");
  console.log("Private Keys");
  console.log("==================");

  addresses.forEach(function(address, index) {
    console.log("(" + index + ") " + "0x" + accounts[address].secretKey.toString("hex"));
  });


  if (options.account_keys_path != null) {
    console.log("");
    console.log("Accounts and keys saved to " + options.account_keys_path);
  }

  if (options.accounts == null) {
    console.log("");
    console.log("HD Wallet");
    console.log("==================");
    console.log("Mnemonic:      " + state.mnemonic);
    console.log("Base HD Path:  " + state.wallet_hdpath + "{account_index}")
  }

  if (options.gasPrice) {
    console.log("");
    console.log("Gas Price");
    console.log("==================");
    console.log(options.gasPrice);
  }

  if (options.gasLimit) {
    console.log("");
    console.log("Gas Limit");
    console.log("==================");
    console.log(options.gasLimit);
  }

  if (options.callGasLimit) {
    console.log("");
    console.log("Call Gas Limit");
    console.log("==================");
    console.log(options.callGasLimit);
  }

  if (options.fork) {
    console.log("");
    console.log("Forked Chain");
    console.log("==================");
    console.log("Location:       " + state.blockchain.options.fork);
    console.log("Block:          " + to.number(state.blockchain.forkBlockNumber));
    console.log("Network ID:     " + state.net_version);
    console.log("Time:           " + (state.blockchain.startTime || new Date()).toString());
    let maxCacheSize;
    if (options.forkCacheSize === -1) {
      maxCacheSize = "∞";
    } else {
      maxCacheSize = options.forkCacheSize + " bytes";
    }
    console.log("Max Cache Size: " + maxCacheSize);
  }

  console.log("");
  console.log("Listening on " + options.hostname + ":" + options.port);
}

server.listen(options.port, options.hostname, startGanache);
