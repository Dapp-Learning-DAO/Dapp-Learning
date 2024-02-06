/* eslint-env browser */
/* eslint no-console: ["error", { allow: ["log"] }] */

const fs = require('fs');
const request = require('request');
const async = typeof window === 'undefined' ? require('async') : require('async/dist/async.min.js');
const Web3 = require('web3');
const SolidityFunction = require('web3/lib/web3/function.js');
const SolidityEvent = require('web3/lib/web3/event.js');
const coder = require('web3/lib/solidity/coder.js');
const utils = require('web3/lib/utils/utils.js');
const sha3 = require('web3/lib/utils/sha3.js');
const Tx = require('ethereumjs-tx');
const keythereum = require('keythereum');
const ethUtil = require('ethereumjs-util');
const BigNumber = require('bignumber.js');

module.exports = (config) => {
  const utility = {};

  utility.weiToEth = function weiToEth(wei, divisorIn) {
    const divisor = !divisorIn ? 1000000000000000000 : divisorIn;
    return (wei / divisor).toFixed(3);
  };

  utility.ethToWei = function ethToWei(eth, divisorIn) {
    const divisor = !divisorIn ? 1000000000000000000 : divisorIn;
    return parseFloat((eth * divisor).toPrecision(10));
  };

  utility.roundToNearest = function roundToNearest(numToRound, numToRoundToIn) {
    const numToRoundTo = 1 / numToRoundToIn;
    return Math.round(numToRound * numToRoundTo) / numToRoundTo;
  };

  utility.getURL = function getURL(url, callback, options) {
    request.get(url, options, (err, httpResponse, body) => {
      if (err) {
        callback(err, undefined);
      } else {
        callback(undefined, body);
      }
    });
  };

  utility.postURL = function postURL(url, formData, callback) {
    request.post({ url, form: formData }, (err, httpResponse, body) => {
      if (err) {
        callback(err, undefined);
      } else {
        callback(undefined, body);
      }
    });
  };

  utility.readFile = function readFile( // eslint-disable-line consistent-return
    filename, callback) {
    if (callback) {
      try {
        if (typeof window === 'undefined') {
          fs.readFile(filename, { encoding: 'utf8' }, (err, data) => {
            if (err) {
              callback(err, undefined);
            } else {
              callback(undefined, data);
            }
          });
        } else {
          utility.getURL(`${window.location.origin}/${filename}`, (err, body) => {
            if (err) {
              callback(err, undefined);
            } else {
              callback(undefined, body);
            }
          });
        }
      } catch (err) {
        callback(err, undefined);
      }
    } else {
      try {
        return fs.readFileSync(filename, { encoding: 'utf8' });
      } catch (err) {
        return undefined;
      }
    }
  };

  utility.writeFile = function writeFile(filename, data, callback) {
    fs.writeFile(filename, data, (err) => {
      if (err) {
        callback(err, false);
      } else {
        callback(undefined, true);
      }
    });
  };

  utility.createCookie = function createCookie(name, value, days) {
    if (localStorage) {
      localStorage.setItem(name, value);
    } else {
      let expires;
      if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = `; expires=${date.toGMTString()}`;
      } else {
        expires = '';
      }
      document.cookie = `${name}=${value}${expires}; path=/`;
    }
  };

  utility.readCookie = function readCookie(name) {
    if (localStorage) {
      return localStorage.getItem(name);
    }
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i += 1) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  utility.eraseCookie = function eraseCookie(name) {
    if (localStorage) {
      localStorage.removeItem(name);
    } else {
      utility.createCookie(name, '', -1);
    }
  };

  utility.getNextNonce = function getNextNonce(web3, address, callback) {
    function proxy() {
      let url =
        `https://${
        config.ethTestnet ? config.ethTestnet : 'api'
        }.etherscan.io/api?module=proxy&action=eth_GetTransactionCount&address=${
        address
        }&tag=latest`;
      if (config.etherscanAPIKey) url += `&apikey=${config.etherscanAPIKey}`;
      utility.getURL(url, (err, body) => {
        if (!err) {
          const result = JSON.parse(body);
          const nextNonce = Number(result.result);
          callback(undefined, nextNonce);
        } else {
          callback(err, undefined);
        }
      });
    }
    try {
      if (web3.currentProvider) {
        web3.eth.getTransactionCount(address, (err, result) => {
          if (!err) {
            const nextNonce = Number(result);
            // Note. initial nonce is 2^20 on testnet,
            // but getTransactionCount already starts at 2^20.
            callback(undefined, nextNonce);
          } else {
            proxy();
          }
        });
      } else {
        proxy();
      }
    } catch (err) {
      proxy();
    }
  };

  utility.testCall = function testCall(web3, contract, address, functionName, args, callback) {
    const options = {};
    options.data = contract[functionName].getData.apply(null, args);
    options.to = address;
    web3.eth.call(options, (err, result) => {
      if (!err) {
        const functionAbi = contract.abi.find(element =>
          element.name === functionName);
        const solidityFunction = new SolidityFunction(web3.Eth, functionAbi, address);
        callback(err, solidityFunction.unpackOutput(result));
      } else {
        callback(err, result);
      }
    });
  };

  utility.call = function call(web3In, contract, address, functionName, args, callback) {
    function proxy(retries) {
      const web3 = new Web3();
      const data = contract[functionName].getData.apply(null, args);
      let url =
        `https://${
        config.ethTestnet ? config.ethTestnet : 'api'
        }.etherscan.io/api?module=proxy&action=eth_Call&to=${
        address
        }&data=${
        data}`;
      if (config.etherscanAPIKey) url += `&apikey=${config.etherscanAPIKey}`;
      utility.getURL(url, (err, body) => {
        if (!err) {
          try {
            const result = JSON.parse(body);
            const functionAbi = contract.abi.find(element => element.name === functionName);
            const solidityFunction = new SolidityFunction(web3.Eth, functionAbi, address);
            const resultUnpacked = solidityFunction.unpackOutput(result.result);
            callback(undefined, resultUnpacked);
          } catch (errJson) {
            if (retries > 0) {
              setTimeout(() => {
                proxy(retries - 1);
              }, 1000);
            } else {
              callback(err, undefined);
            }
          }
        } else {
          callback(err, undefined);
        }
      });
    }
    try {
      if (web3In.currentProvider) {
        const data = contract[functionName].getData.apply(null, args);
        web3In.eth.call({ to: address, data }, (err, result) => {
          if (!err) {
            const functionAbi = contract.abi.find(element => element.name === functionName);
            const solidityFunction = new SolidityFunction(web3In.Eth, functionAbi, address);
            try {
              const resultUnpacked = solidityFunction.unpackOutput(result);
              callback(undefined, resultUnpacked);
            } catch (errJson) {
              proxy(1);
            }
          } else {
            proxy(1);
          }
        });
      } else {
        proxy(1);
      }
    } catch (err) {
      proxy(1);
    }
  };

  utility.testSend = function testSend(
    web3, contract, address, functionName, argsIn, fromAddress, privateKey, nonce, callback) {
    function encodeConstructorParams(abi, params) {
      return abi.filter(json =>
        json.type === 'constructor' && json.inputs.length === params.length)
      .map(json =>
        json.inputs.map(input => input.type))
      .map(types => coder.encodeParams(types, params))[0] || '';
    }
    const args = Array.prototype.slice.call(argsIn).filter(a => a !== undefined);
    let options = {};
    if (typeof (args[args.length - 1]) === 'object' && args[args.length - 1].gas) {
      args[args.length - 1].gasPrice = config.ethGasPrice;
      args[args.length - 1].gasLimit = args[args.length - 1].gas;
      delete args[args.length - 1].gas;
    }
    if (utils.isObject(args[args.length - 1])) {
      options = args.pop();
    }
    if (functionName === 'constructor') {
      if (options.data.slice(0, 2) !== '0x') {
        options.data = `0x${options.data}`;
      }
      options.data += encodeConstructorParams(contract.abi, args);
    } else {
      options.to = address;
      const functionAbi = contract.abi.find(element => element.name === functionName);
      const inputTypes = functionAbi.inputs.map(x => x.type);
      const typeName = inputTypes.join();
      const data = sha3(`${functionName}(${typeName})`).slice(0, 8) + coder.encodeParams(inputTypes, args);
      options.data = `0x${data}`;
    }
    if (!options.from) options.from = fromAddress;
    web3.eth.sendTransaction(options, (err, result) => {
      callback(err, result);
    });
  };

  utility.send = function send(
    web3,
    contract,
    address,
    functionName,
    argsIn,
    fromAddress,
    privateKeyIn,
    nonceIn,
    callback) {
    let privateKey = privateKeyIn;
    if (privateKeyIn && privateKeyIn.substring(0, 2) === '0x') {
      privateKey = privateKeyIn.substring(2, privateKeyIn.length);
    }
    function encodeConstructorParams(abi, params) {
      return (
        abi
          .filter(json => json.type === 'constructor' && json.inputs.length === params.length)
          .map(json => json.inputs.map(input => input.type))
          .map(types => coder.encodeParams(types, params))[0] || ''
      );
    }
    const args = Array.prototype.slice.call(argsIn).filter(a => a !== undefined);
    let options = {};
    if (typeof args[args.length - 1] === 'object' && args[args.length - 1].gas) {
      args[args.length - 1].gasPrice = config.ethGasPrice;
      args[args.length - 1].gasLimit = args[args.length - 1].gas;
      delete args[args.length - 1].gas;
    }
    if (utils.isObject(args[args.length - 1])) {
      options = args.pop();
    }
    utility.getNextNonce(web3, fromAddress, (err, nextNonce) => {
      let nonce = nonceIn;
      if (nonceIn === undefined || nonceIn < nextNonce) {
        nonce = nextNonce;
      }
      // console.log("Nonce:", nonce);
      options.nonce = nonce;
      if (functionName === 'constructor') {
        if (options.data.slice(0, 2) !== '0x') {
          options.data = `0x${options.data}`;
        }
        const encodedParams = encodeConstructorParams(contract.abi, args);
        console.log(encodedParams);
        options.data += encodedParams;
      } else if (!contract || !functionName) {
        options.to = address;
      } else {
        options.to = address;
        const functionAbi = contract.abi.find(element => element.name === functionName);
        const inputTypes = functionAbi.inputs.map(x => x.type);
        const typeName = inputTypes.join();
        options.data =
          `0x${
          sha3(`${functionName}(${typeName})`).slice(0, 8)
          }${coder.encodeParams(inputTypes, args)}`;
      }
      let tx;
      try {
        tx = new Tx(options);
        function proxy() { // eslint-disable-line no-inner-declarations
          if (privateKey) {
            utility.signTx(web3, fromAddress, tx, privateKey, (errSignTx, txSigned) => {
              if (!errSignTx) {
                const serializedTx = txSigned.serialize().toString('hex');
                const url = `https://${config.ethTestnet ? config.ethTestnet : 'api'}.etherscan.io/api`;
                const formData = { module: 'proxy', action: 'eth_sendRawTransaction', hex: serializedTx };
                if (config.etherscanAPIKey) formData.apikey = config.etherscanAPIKey;
                utility.postURL(url, formData, (errPostURL, body) => {
                  if (!errPostURL) {
                    try {
                      const result = JSON.parse(body);
                      if (result.result) {
                        callback(undefined, { txHash: result.result, nonce: nonce + 1 });
                      } else if (result.error) {
                        callback(result.error.message, { txHash: undefined, nonce });
                      }
                    } catch (errTry) {
                      callback(errTry, { txHash: undefined, nonce });
                    }
                  } else {
                    callback(err, { txHash: undefined, nonce });
                  }
                });
              } else {
                console.log(err);
                callback('Failed to sign transaction', { txHash: undefined, nonce });
              }
            });
          } else {
            callback('Failed to sign transaction', { txHash: undefined, nonce });
          }
        }
        try {
          if (web3.currentProvider) {
            options.from = fromAddress;
            options.gas = options.gasLimit;
            delete options.gasLimit;
            web3.eth.sendTransaction(options, (errSend, hash) => {
              if (!errSend) {
                callback(undefined, { txHash: hash, nonce: nonce + 1 });
              } else {
                console.log(err);
                proxy();
              }
            });
          } else {
            proxy();
          }
        } catch (errSend) {
          proxy();
        }
      } catch (errCatch) {
        callback(errCatch, { txHash: undefined, nonce });
      }
    });
  };

  utility.estimateGas = function estimateGas(
    web3,
    contract,
    address,
    functionName,
    argsIn,
    fromAddress,
    privateKeyIn,
    nonceIn,
    callback) {
    let privateKey = privateKeyIn;
    if (privateKeyIn && privateKeyIn.substring(0, 2) === '0x') {
      privateKey = privateKeyIn.substring(2, privateKeyIn.length);
    }
    const args = Array.prototype.slice.call(argsIn).filter(a => a !== undefined);
    let options = {};
    const functionAbi = contract.abi.find(element => element.name === functionName);
    const inputTypes = functionAbi.inputs.map(x => x.type);
    if (typeof args[args.length - 1] === 'object' && args[args.length - 1].gas) {
      args[args.length - 1].gasPrice = config.ethGasPrice;
      args[args.length - 1].gasLimit = args[args.length - 1].gas;
      delete args[args.length - 1].gas;
    }
    if (args.length > inputTypes.length && utils.isObject(args[args.length - 1])) {
      options = args[args.length - 1];
    }
    utility.getNextNonce(web3, fromAddress, (err, nextNonce) => {
      let nonce = nonceIn;
      if (nonceIn === undefined) {
        nonce = nextNonce;
      }
      options.nonce = nonce;
      options.to = address;
      const typeName = inputTypes.join();
      options.data =
        `0x${
        sha3(`${functionName}(${typeName})`).slice(0, 8)
        }${coder.encodeParams(inputTypes, args)}`;
      const tx = new Tx(options);
      utility.signTx(web3, fromAddress, tx, privateKey, (errSignTx, txSigned) => {
        if (!errSignTx && txSigned) {
          if (web3.currentProvider) {
            try {
              web3.eth.estimateGas(options, (errEstimateGas, result) => {
                if (errEstimateGas) {
                  callback(err, undefined);
                } else {
                  callback(undefined, result);
                }
              });
            } catch (errTry) {
              callback(errTry, undefined);
            }
          } else {
            callback('No provider set for web3', undefined);
          }
        } else {
          callback('Failed to sign transaction', undefined);
        }
      });
    });
  };

  utility.txReceipt = function txReceipt(web3, txHash, callback) {
    function proxy() {
      let url =
        `https://${
        config.ethTestnet ? config.ethTestnet : 'api'
        }.etherscan.io/api?module=proxy&action=eth_GetTransactionReceipt&txhash=${
        txHash}`;
      if (config.etherscanAPIKey) url += `&apikey=${config.etherscanAPIKey}`;
      utility.getURL(url, (err, body) => {
        if (!err) {
          const result = JSON.parse(body);
          callback(undefined, result.result);
        } else {
          callback(err, undefined);
        }
      });
    }
    try {
      if (web3.currentProvider) {
        try {
          web3.eth.getTransactionReceipt(txHash, (err, result) => {
            if (err) {
              proxy();
            } else {
              callback(undefined, result);
            }
          });
        } catch (err) {
          proxy();
        }
      } else {
        proxy();
      }
    } catch (err) {
      proxy();
    }
  };

  utility.logsOnce = function logsOnce(web3, contract, address, fromBlock, toBlock, callback) {
    function decodeEvent(item) {
      const eventAbis = contract.abi.filter(eventAbi => (
          eventAbi.type === 'event' &&
          item.topics[0] ===
            `0x${
              sha3(
                `${eventAbi.name
                  }(${
                  eventAbi.inputs
                    .map(x => x.type)
                    .join()
                  })`)}`
        ));
      if (eventAbis.length > 0) {
        const eventAbi = eventAbis[0];
        const event = new SolidityEvent(web3, eventAbi, address);
        const result = event.decode(item);
        return result;
      }
      return undefined;
    }
    function proxy(retries) {
      let url =
        `https://${
        config.ethTestnet ? config.ethTestnet : 'api'
        }.etherscan.io/api?module=logs&action=getLogs&address=${
        address
        }&fromBlock=${
        fromBlock
        }&toBlock=${
        toBlock}`;
      if (config.etherscanAPIKey) url += `&apikey=${config.etherscanAPIKey}`;
      utility.getURL(
        url,
        (err, body) => {
          if (!err) {
            try {
              const result = JSON.parse(body);
              const items = result.result;
              async.map(
                items,
                (item, callbackMap) => {
                  Object.assign(item, {
                    blockNumber: utility.hexToDec(item.blockNumber),
                    logIndex: utility.hexToDec(item.logIndex),
                    transactionIndex: utility.hexToDec(item.transactionIndex),
                  });
                  const event = decodeEvent(item);
                  callbackMap(null, event);
                },
                (errMap, events) => {
                  callback(null, events);
                });
            } catch (errTry) {
              if (retries > 0) {
                proxy(retries - 1);
              } else {
                callback(null, []);
              }
            }
          } else {
            callback(null, []);
          }
        // },
        // { timeout: 1500 });
        });
    }
    proxy(1);
  };

  utility.getBalance = function getBalance(web3, address, callback) {
    function proxy() {
      let url =
        `https://${
        config.ethTestnet ? config.ethTestnet : 'api'
        }.etherscan.io/api?module=account&action=balance&address=${
        address
        }&tag=latest`;
      if (config.etherscanAPIKey) url += `&apikey=${config.etherscanAPIKey}`;
      utility.getURL(url, (err, body) => {
        if (!err) {
          const result = JSON.parse(body);
          const balance = new BigNumber(result.result);
          callback(undefined, balance);
        } else {
          callback(err, undefined);
        }
      });
    }
    try {
      if (web3.currentProvider) {
        web3.eth.getBalance(address, (err, balance) => {
          if (!err) {
            callback(undefined, balance);
          } else {
            proxy();
          }
        });
      } else {
        proxy();
      }
    } catch (err) {
      proxy();
    }
  };

  utility.getCode = function getCode(web3, address, callback) {
    function proxy() {
      let url =
        `https://${
        config.ethTestnet ? config.ethTestnet : 'api'
        }.etherscan.io/api?module=proxy&action=eth_getCode&address=${
        address
        }&tag=latest`;
      if (config.etherscanAPIKey) url += `&apikey=${config.etherscanAPIKey}`;
      utility.getURL(url, (err, body) => {
        if (!err) {
          const result = JSON.parse(body);
          callback(undefined, result.result);
        } else {
          callback(err, undefined);
        }
      });
    }
    try {
      if (web3.currentProvider) {
        web3.eth.getCode(address, (err, code) => {
          if (!err) {
            callback(undefined, code);
          } else {
            proxy();
          }
        });
      } else {
        proxy();
      }
    } catch (err) {
      proxy();
    }
  };

  utility.blockNumber = function blockNumber(web3, callback) {
    function proxy() {
      let url =
        `https://${
        config.ethTestnet ? config.ethTestnet : 'api'
        }.etherscan.io/api?module=proxy&action=eth_BlockNumber`;
      if (config.etherscanAPIKey) url += `&apikey=${config.etherscanAPIKey}`;
      utility.getURL(url, (err, body) => {
        if (!err) {
          const result = JSON.parse(body);
          callback(undefined, Number(utility.hexToDec(result.result)));
        } else {
          callback(err, undefined);
        }
      });
    }
    if (web3.currentProvider) {
      web3.eth.getBlockNumber((err, result) => {
        if (!err) {
          callback(undefined, Number(result));
        } else {
          proxy();
        }
      });
    } else {
      proxy();
    }
  };

  utility.signTx = function signTx(web3, address, txIn, privateKey, callback) {
    const tx = txIn;
    if (privateKey) {
      tx.sign(new Buffer(privateKey, 'hex'));
      callback(undefined, tx);
    } else {
      const msgHash = `0x${tx.hash(false).toString('hex')}`;
      web3.eth.sign(address, msgHash, (err, sigResult) => {
        if (!err) {
          try {
            const r = sigResult.slice(0, 66);
            const s = `0x${sigResult.slice(66, 130)}`;
            let v = web3.toDecimal(`0x${sigResult.slice(130, 132)}`);
            if (v !== 27 && v !== 28) v += 27;
            tx.r = r;
            tx.s = s;
            tx.v = v;
            callback(undefined, tx);
          } catch (errTry) {
            callback(errTry, undefined);
          }
        } else {
          callback(err, undefined);
        }
      });
    }
  };

  utility.sign = function sign(web3, address, msgToSignIn, privateKeyIn, callback) {
    let msgToSign = msgToSignIn;
    if (msgToSign.substring(0, 2) !== '0x') msgToSign = `0x${msgToSign}`;
    function prefixMessage(msgIn) {
      let msg = msgIn;
      msg = new Buffer(msg.slice(2), 'hex');
      msg = Buffer.concat([
        new Buffer(`\x19Ethereum Signed Message:\n${msg.length.toString()}`),
        msg]);
      msg = web3.sha3(`0x${msg.toString('hex')}`, { encoding: 'hex' });
      msg = new Buffer(msg.slice(2), 'hex');
      return `0x${msg.toString('hex')}`;
    }
    function testSig(msg, sig) {
      const recoveredAddress =
        `0x${ethUtil.pubToAddress(ethUtil.ecrecover(msg, sig.v, sig.r, sig.s)).toString('hex')}`;
      return recoveredAddress === address;
    }
    if (privateKeyIn) {
      let privateKey = privateKeyIn;
      if (privateKey.substring(0, 2) === '0x') privateKey = privateKey.substring(2, privateKey.length);
      msgToSign = prefixMessage(msgToSign);
      try {
        const sig = ethUtil.ecsign(
          new Buffer(msgToSign.slice(2), 'hex'),
          new Buffer(privateKey, 'hex'));
        const r = `0x${sig.r.toString('hex')}`;
        const s = `0x${sig.s.toString('hex')}`;
        const v = sig.v;
        const result = { r, s, v };
        callback(undefined, result);
      } catch (err) {
        callback(err, undefined);
      }
    } else {
      web3.version.getNode((error, node) => {
        // these nodes still use old-style eth_sign
        if (
          node &&
          (node.match('TestRPC') ||
            node.match('MetaMask'))
        ) {
          msgToSign = prefixMessage(msgToSign);
        }
        web3.eth.sign(address, msgToSign, (err, sigResult) => {
          if (err) {
            callback('Failed to sign message', undefined);
          } else {
            const sigHash = sigResult;
            const sig = ethUtil.fromRpcSig(sigHash);
            let msg;
            if (
              node &&
              (node.match('TestRPC') ||
                node.match('MetaMask'))
            ) {
              msg = new Buffer(msgToSign.slice(2), 'hex');
            } else {
              msg = new Buffer(prefixMessage(msgToSign).slice(2), 'hex');
            }
            if (testSig(msg, sig, address)) {
              const r = `0x${sig.r.toString('hex')}`;
              const s = `0x${sig.s.toString('hex')}`;
              const v = sig.v;
              const result = { r, s, v };
              callback(undefined, result);
            } else {
              callback('Failed to sign message', undefined);
            }
          }
        });
      });
    }
  };

  utility.verify = function verify(web3, addressIn, // eslint-disable-line consistent-return
    v, rIn, sIn, valueIn, callback) {
    const address = addressIn.toLowerCase();
    let r = rIn;
    let s = sIn;
    let value = valueIn;
    if (r.substring(0, 2) === '0x') r = r.substring(2, r.length);
    if (s.substring(0, 2) === '0x') s = s.substring(2, s.length);
    if (value.substring(0, 2) === '0x') value = value.substring(2, value.length);
    const pubKey = ethUtil.ecrecover(
      new Buffer(value, 'hex'),
      Number(v),
      new Buffer(r, 'hex'),
      new Buffer(s, 'hex'));
    const result = address === `0x${ethUtil.pubToAddress(new Buffer(pubKey, 'hex')).toString('hex')}`;
    if (callback) {
      callback(undefined, result);
    } else {
      return result;
    }
  };

  utility.createAccount = function createAccount() {
    const dk = keythereum.create();
    let privateKey = dk.privateKey;
    let address = ethUtil.privateToAddress(privateKey);
    address = ethUtil.toChecksumAddress(address.toString('hex'));
    privateKey = privateKey.toString('hex');
    return { address, privateKey };
  };

  utility.verifyPrivateKey = function verifyPrivateKey(addr, privateKeyIn) {
    let privateKey = privateKeyIn;
    if (privateKey && privateKey.substring(0, 2) !== '0x') {
      privateKey = `0x${privateKey}`;
    }
    return (
      addr === ethUtil.toChecksumAddress(`0x${ethUtil.privateToAddress(privateKey).toString('hex')}`)
    );
  };

  utility.toChecksumAddress = function toChecksumAddress(addrIn) {
    let addr = addrIn;
    if (addr && addr.substring(0, 2) !== '0x') {
      addr = `0x${addr}`;
    }
    return ethUtil.toChecksumAddress(addr);
  };

  utility.loadContract = function loadContract(web3, sourceCode, address, callback) {
    utility.readFile(`${sourceCode}.interface`, (errAbi, resultAbi) => {
      const abi = JSON.parse(resultAbi);
      let contract = web3.eth.contract(abi);
      contract = contract.at(address);
      callback(undefined, contract);
    });
  };

  utility.deployContract = function deployContract(web3, sourceFile,
    contractName, constructorParams, address, callback) {
    utility.readFile(`${sourceFile}.bytecode`, (errBytecode, resultBytecode) => {
      utility.readFile(`${sourceFile}.interface`, (errAbi, resultAbi) => {
        if (resultAbi && resultBytecode) {
          const abi = JSON.parse(resultAbi);
          const bytecode = JSON.parse(resultBytecode);
          const contract = web3.eth.contract(abi);
          utility.send(
            web3,
            contract,
            undefined,
            'constructor',
            constructorParams.concat([
              { from: address, data: bytecode, gas: 4700000, gasPrice: config.ethGasPrice },
            ]),
            address,
            undefined,
            0,
            (errSend, result) => {
              const txHash = result.txHash;
              let contractAddr;
              async.whilst(
                () => contractAddr === undefined,
                (callbackWhilst) => {
                  setTimeout(() => {
                    utility.txReceipt(web3, txHash, (err, receipt) => {
                      if (receipt) {
                        contractAddr = receipt.contractAddress;
                      }
                      callbackWhilst(null);
                    });
                  }, 1 * 1000);
                },
                () => {
                  callback(undefined, address);
                });
            });
        } else {
          callback('Could not load bytecode and ABI', undefined);
        }
      });
    });
  };

  utility.zeroPad = function zeroPad(num, places) {
    const zero = (places - num.toString().length) + 1;
    return Array(+(zero > 0 && zero)).join('0') + num;
  };

  utility.decToHex = function decToHex(dec, lengthIn) {
    let length = lengthIn;
    if (!length) length = 32;
    if (dec < 0) {
      // return convertBase((Math.pow(2, length) + decStr).toString(), 10, 16);
      return (new BigNumber(2)).pow(length).add(new BigNumber(dec)).toString(16);
    }
    let result = null;
    try {
      result = utility.convertBase(dec.toString(), 10, 16);
    } catch (err) {
      result = null;
    }
    if (result) {
      return result;
    }
    return (new BigNumber(dec)).toString(16);
  };

  utility.hexToDec = function hexToDec(hexStrIn, length) {
    // length implies this is a two's complement number
    let hexStr = hexStrIn;
    if (hexStr.substring(0, 2) === '0x') hexStr = hexStr.substring(2);
    hexStr = hexStr.toLowerCase();
    if (!length) {
      return utility.convertBase(hexStr, 16, 10);
    }
    const max = Math.pow(2, length); // eslint-disable-line no-restricted-properties
    const answer = utility.convertBase(hexStr, 16, 10);
    return answer > max / 2 ? max : answer;
  };

  utility.pack = function pack(dataIn, lengths) {
    let packed = '';
    const data = dataIn.map(x => x);
    for (let i = 0; i < lengths.length; i += 1) {
      if (typeof (data[i]) === 'string' && data[i].substring(0, 2) === '0x') {
        if (data[i].substring(0, 2) === '0x') data[i] = data[i].substring(2);
        packed += utility.zeroPad(data[i], lengths[i] / 4);
      } else if (typeof (data[i]) !== 'number' && /[a-f]/.test(data[i])) {
        if (data[i].substring(0, 2) === '0x') data[i] = data[i].substring(2);
        packed += utility.zeroPad(data[i], lengths[i] / 4);
      } else {
        // packed += zeroPad(new BigNumber(data[i]).toString(16), lengths[i]/4);
        packed += utility.zeroPad(utility.decToHex(data[i], lengths[i]), lengths[i] / 4);
      }
    }
    return packed;
  };

  utility.unpack = function unpack(str, lengths) {
    const data = [];
    let length = 0;
    for (let i = 0; i < lengths.length; i += 1) {
      data[i] = parseInt(utility.hexToDec(str.substr(length, lengths[i] / 4), lengths[i]), 10);
      length += lengths[i] / 4;
    }
    return data;
  };

  utility.convertBase = function convertBase(str, fromBase, toBase) {
    const digits = utility.parseToDigitsArray(str, fromBase);
    if (digits === null) return null;
    let outArray = [];
    let power = [1];
    for (let i = 0; i < digits.length; i += 1) {
      if (digits[i]) {
        outArray = utility.add(outArray,
          utility.multiplyByNumber(digits[i], power, toBase), toBase);
      }
      power = utility.multiplyByNumber(fromBase, power, toBase);
    }
    let out = '';
    for (let i = outArray.length - 1; i >= 0; i -= 1) {
      out += outArray[i].toString(toBase);
    }
    if (out === '') out = 0;
    return out;
  };

  utility.parseToDigitsArray = function parseToDigitsArray(str, base) {
    const digits = str.split('');
    const ary = [];
    for (let i = digits.length - 1; i >= 0; i -= 1) {
      const n = parseInt(digits[i], base);
      if (isNaN(n)) return null;
      ary.push(n);
    }
    return ary;
  };

  utility.add = function add(x, y, base) {
    const z = [];
    const n = Math.max(x.length, y.length);
    let carry = 0;
    let i = 0;
    while (i < n || carry) {
      const xi = i < x.length ? x[i] : 0;
      const yi = i < y.length ? y[i] : 0;
      const zi = carry + xi + yi;
      z.push(zi % base);
      carry = Math.floor(zi / base);
      i += 1;
    }
    return z;
  };

  utility.multiplyByNumber = function multiplyByNumber(numIn, x, base) {
    let num = numIn;
    if (num < 0) return null;
    if (num === 0) return [];
    let result = [];
    let power = x;
    while (true) { // eslint-disable-line no-constant-condition
      if (num & 1) { // eslint-disable-line no-bitwise
        result = utility.add(result, power, base);
      }
      num = num >> 1; // eslint-disable-line operator-assignment, no-bitwise
      if (num === 0) break;
      power = utility.add(power, power, base);
    }
    return result;
  };

  utility.getRandomInt = function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  };

  /* eslint-disable */
  if (!Object.prototype.find) {
    Object.values = function (obj) {
      return Object.keys(obj).map(key => obj[key]);
    };
  }

  if (!Array.prototype.find) {
    Array.prototype.find = function (predicate) {
      if (this === null) {
        throw new TypeError('Array.prototype.find called on null or undefined');
      }
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }
      const list = Object(this);
      const length = list.length >>> 0;
      const thisArg = arguments[1];
      let value;

      for (const i = 0; i < length; i++) {
        value = list[i];
        if (predicate.call(thisArg, value, i, list)) {
          return value;
        }
      }
      return undefined;
    };
  }

  if (typeof Object.assign !== 'function') {
    (function () {
      Object.assign = function (target) {
        if (target === undefined || target === null) {
          throw new TypeError('Cannot convert undefined or null to object');
        }

        const output = Object(target);
        for (const index = 1; index < arguments.length; index++) {
          const source = arguments[index];
          if (source !== undefined && source !== null) {
            for (const nextKey in source) {
              if (source.hasOwnProperty(nextKey)) {
                output[nextKey] = source[nextKey];
              }
            }
          }
        }
        return output;
      };
    }());
  }

  Array.prototype.getUnique = function () {
    const u = {},
      a = [];
    for (const i = 0, l = this.length; i < l; ++i) {
      if (u.hasOwnProperty(this[i])) {
        continue;
      }
      a.push(this[i]);
      u[this[i]] = 1;
    }
    return a;
  };

  Array.prototype.max = function () {
    return Math.max.apply(null, this);
  };

  Array.prototype.min = function () {
    return Math.min.apply(null, this);
  };

  Array.prototype.equals = function (b) {
    if (this === b) return true;
    if (this == null || b == null) return false;
    if (this.length != b.length) return false;

    // If you don't care about the order of the elements inside
    // the array, you should sort both arrays here.

    for (const i = 0; i < this.length; ++i) {
      if (this[i] !== b[i]) return false;
    }
    return true;
  };

  Math.sign =
    Math.sign ||
    function (x) {
      x = +x; // convert to a number
      if (x === 0 || isNaN(x)) {
        return x;
      }
      return x > 0 ? 1 : -1;
    };

  /* eslint-enable */
  return utility;
};
