/* global describe, before, after, it */
/* eslint no-console: ["error", { allow: ["log"] }] */
/* eslint max-len: ["error", 300] */

const config = {};
const utility = require('./utility.js')(config);
const Web3 = require('web3');
const assert = require('assert');
const TestRPC = require('ethereumjs-testrpc');
const sha256 = require('js-sha256').sha256;
const async = require('async');
const BigNumber = require('bignumber.js');
const solc = require('solc');

const logger = {
  log: (message) => {
    if (false) console.log(message);
  } };

config.contractEtherDelta = 'etherdelta.sol';

const compiledSources = {};
function deploy(web3, sourceFile, contractName, constructorParams, address, callback) {
  utility.readFile(sourceFile, (errRead, source) => {
    const solcVersion = 'v0.4.9+commit.364da425';
    solc.loadRemoteVersion(solcVersion, (errRemote, solcV) => {
      if (!compiledSources[sourceFile]) compiledSources[sourceFile] = solcV.compile(source, 1);
      const compiled = compiledSources[sourceFile];
      const compiledContract = compiled.contracts[`:${contractName}`];
      const abi = JSON.parse(compiledContract.interface);
      const bytecode = compiledContract.bytecode;
      let contract = web3.eth.contract(abi);
      utility.testSend(web3, contract, undefined, 'constructor', constructorParams.concat([{ from: address, data: bytecode }]), address, undefined, 0, (err, result) => {
        const initialTransaction = result;
        assert.deepEqual(initialTransaction.length, 66);
        web3.eth.getTransactionReceipt(initialTransaction, (errReceipt, receipt) => {
          assert.equal(errReceipt, undefined);
          const addr = receipt.contractAddress;
          contract = contract.at(addr);
          assert.notEqual(receipt, null, 'Transaction receipt should not be null');
          assert.notEqual(addr, null, 'Transaction did not create a contract');
          web3.eth.getCode(addr, (errCode, resultCode) => {
            assert.equal(errCode, undefined);
            assert.notEqual(resultCode, null);
            assert.notEqual(resultCode, '0x0');
            callback(undefined, { contract, addr });
          });
        });
      });
    });
  });
}

describe('Test', function test() {
  this.timeout(240 * 1000);
  const web3 = new Web3();
  const port = 12345;
  let server;
  let accounts;
  let contractEtherDelta;
  let contractToken1;
  let contractToken2;
  let contractAccountLevels;
  let contractEtherDeltaAddr;
  let contractToken1Addr;
  let contractToken2Addr;
  let contractAccountLevelsAddr;
  let feeAccount;
  let admin;
  let feeMake;
  let feeTake;
  let feeRebate;
  const unit = new BigNumber(utility.ethToWei(1.0));

  before('Initialize TestRPC server', (done) => {
    server = TestRPC.server(logger);
    server.listen(port, () => {
      config.ethProvider = `http://localhost:${port}`;
      config.ethGasCost = 20000000000;
      web3.setProvider(new Web3.providers.HttpProvider(config.ethProvider));
      done();
    });
  });

  before('Initialize accounts', (done) => {
    web3.eth.getAccounts((err, accs) => {
      assert.equal(err, undefined);
      accounts = accs;
      config.ethAddr = accounts[0];
      done();
    });
  });

  after('Shutdown server', (done) => {
    server.close(done);
  });

  describe('Contract scenario', () => {
    it('Should add a token1 contract to the network', (done) => {
      deploy(web3, config.contractEtherDelta, 'ReserveToken', [], accounts[0], (err, contract) => {
        contractToken1 = contract.contract;
        contractToken1Addr = contract.addr;
        done();
      });
    });
    it('Should add a token2 contract to the network', (done) => {
      deploy(web3, config.contractEtherDelta, 'ReserveToken', [], accounts[0], (err, contract) => {
        contractToken2 = contract.contract;
        contractToken2Addr = contract.addr;
        done();
      });
    });
    it('Should add an AccountLevels contract to the network', (done) => {
      deploy(web3, config.contractEtherDelta, 'AccountLevelsTest', [], accounts[0], (err, contract) => {
        contractAccountLevels = contract.contract;
        contractAccountLevelsAddr = contract.addr;
        done();
      });
    });
    it('Should add the EtherDelta contract to the network', (done) => {
      feeMake = new BigNumber(utility.ethToWei(0.0005));
      feeTake = new BigNumber(utility.ethToWei(0.003));
      feeRebate = new BigNumber(utility.ethToWei(0.002));
      admin = accounts[0];
      feeAccount = accounts[0];
      deploy(web3, config.contractEtherDelta, 'EtherDelta', [admin, feeAccount, contractAccountLevelsAddr, feeMake, feeTake, feeRebate], accounts[0], (err, contract) => {
        contractEtherDelta = contract.contract;
        contractEtherDeltaAddr = contract.addr;
        done();
      });
    });
    it('Should mint some tokens', (done) => {
      const amount = utility.ethToWei(10000);
      async.each([1, 2, 3, 4, 5],
        (i, callback) => {
          utility.testSend(web3, contractToken1, contractToken1Addr, 'create', [accounts[i], amount, { gas: 1000000, value: 0 }], accounts[0], undefined, 0, (err) => {
            assert.equal(err, undefined);
            utility.testSend(web3, contractToken2, contractToken2Addr, 'create', [accounts[i], amount, { gas: 1000000, value: 0 }], accounts[0], undefined, 0, (err2) => {
              assert.equal(err2, undefined);
              callback(null);
            });
          });
        },
        () => {
          done();
        });
    });
    it('Should add funds to etherdelta', (done) => {
      function addEtherFunds(amount, account, callback) {
        utility.testSend(web3, contractEtherDelta, contractEtherDeltaAddr, 'deposit', [{ gas: 1000000, value: amount }], account, undefined, 0, (err) => {
          assert.equal(err, undefined);
          utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [0, account], (err2, result) => {
            assert.equal(result.equals(amount), true);
            callback();
          });
        });
      }
      function addFunds(amount, contractToken, contractTokenAddr, account, callback) {
        utility.testSend(web3, contractToken, contractTokenAddr, 'approve', [contractEtherDeltaAddr, amount, { gas: 1000000, value: 0 }], account, undefined, 0, (err) => {
          assert.equal(err, undefined);
          utility.testSend(web3, contractEtherDelta, contractEtherDeltaAddr, 'depositToken', [contractTokenAddr, amount, { gas: 1000000, value: 0 }], account, undefined, 0, (err2) => {
            assert.equal(err2, undefined);
            utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [contractTokenAddr, account], (err3, result) => {
              assert.equal(result.equals(amount), true);
              callback();
            });
          });
        });
      }
      const amount = new BigNumber(utility.ethToWei(1000));
      addFunds(amount, contractToken1, contractToken1Addr, accounts[1], () => {
        addFunds(amount, contractToken1, contractToken1Addr, accounts[2], () => {
          addFunds(amount, contractToken2, contractToken2Addr, accounts[1], () => {
            addFunds(amount, contractToken2, contractToken2Addr, accounts[2], () => {
              addEtherFunds(amount, accounts[1], () => {
                addEtherFunds(amount, accounts[2], () => {
                  done();
                });
              });
            });
          });
        });
      });
    });
    it('Should do some trades initiated onchain', (done) => {
      function testTrade(expiresIn, orderNonce, tokenGet, tokenGive, amountGet, amountGive, amount, account1, account2, accountLevel, callback) {
        let expires = expiresIn;
        web3.eth.getBlockNumber((err, blockNumber) => {
          if (err) callback(err);
          expires += blockNumber;
          utility.testSend(web3, contractAccountLevels, contractAccountLevelsAddr, 'setAccountLevel', [account1, accountLevel, { gas: 1000000, value: 0 }], account1, undefined, 0, (err2) => {
            assert.equal(err2, undefined);
            utility.testCall(web3, contractAccountLevels, contractAccountLevelsAddr, 'accountLevel', [account1], (err3, level) => {
              assert.equal(err3, undefined);
              utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [contractToken1Addr, feeAccount], (err4, initialFeeBalance1) => {
                utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [contractToken2Addr, feeAccount], (err5, initialFeeBalance2) => {
                  utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [contractToken1Addr, account1], (err6, initialBalance11) => {
                    utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [contractToken1Addr, account2], (err7, initialBalance12) => {
                      utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [contractToken2Addr, account1], (err8, initialBalance21) => {
                        utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [contractToken2Addr, account2], (err9, initialBalance22) => {
                          utility.testSend(web3, contractEtherDelta, contractEtherDeltaAddr, 'order', [tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce, { gas: 1000000, value: 0 }], account1, undefined, 0, (err10) => {
                            assert.equal(err10, undefined);
                            utility.testSend(web3, contractEtherDelta, contractEtherDeltaAddr, 'trade', [tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce, account1, 0, '0x0', '0x0', amount, { gas: 1000000, value: 0 }], account2, undefined, 0, (err11) => {
                              assert.equal(err11, undefined);
                              utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [contractToken1Addr, feeAccount], (err12, feeBalance1) => {
                                utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [contractToken2Addr, feeAccount], (err13, feeBalance2) => {
                                  utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [contractToken1Addr, account1], (err14, balance11) => {
                                    utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [contractToken1Addr, account2], (err15, balance12) => {
                                      utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [contractToken2Addr, account1], (err16, balance21) => {
                                        utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [contractToken2Addr, account2], (err17, balance22) => {
                                          utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'availableVolume', [tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce, account1, 0, '0x0', '0x0'], (err18, availableVolume) => {
                                            utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'amountFilled', [tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce, account1, 0, '0x0', '0x0'], (err19, amountFilled) => {
                                              const feeMakeXfer = amount.times(feeMake).divToInt(unit);
                                              const feeTakeXfer = amount.times(feeTake).divToInt(unit);
                                              let feeRebateXfer = 0;
                                              if (Number(level) === 1) feeRebateXfer = amount.times(feeRebate).divToInt(unit);
                                              if (Number(level) === 2) feeRebateXfer = feeTakeXfer;
                                              assert.equal(availableVolume.equals(amountGet.minus(amount)), true);
                                              assert.equal(amountFilled.equals(amount), true);
                                              assert.equal(initialFeeBalance1.plus(initialBalance11).plus(initialBalance12).equals(feeBalance1.plus(balance11).plus(balance12)), true);
                                              assert.equal(initialFeeBalance2.plus(initialBalance21).plus(initialBalance22).equals(feeBalance2.plus(balance21).plus(balance22)), true);
                                              assert.equal(feeBalance1.minus(initialFeeBalance1).equals(feeMakeXfer.plus(feeTakeXfer).minus(feeRebateXfer)), true);
                                              assert.equal(balance11.equals(initialBalance11.plus(amount).minus(feeMakeXfer).plus(feeRebateXfer)), true);
                                              assert.equal(balance12.equals(initialBalance12.minus(amount.plus(feeTakeXfer))), true);
                                              assert.equal(balance21.equals(initialBalance21.minus(amount.times(amountGive).divToInt(amountGet))), true);
                                              assert.equal(balance22.equals(initialBalance22.plus(amount.times(amountGive).divToInt(amountGet))), true);
                                              callback();
                                            });
                                          });
                                        });
                                      });
                                    });
                                  });
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      }
      const trades = [
        {
          expires: 10,
          orderNonce: 1,
          tokenGet: contractToken1Addr,
          tokenGive: contractToken2Addr,
          amountGet: new BigNumber(utility.ethToWei(50)),
          amountGive: new BigNumber(utility.ethToWei(25)),
          amount: new BigNumber(utility.ethToWei(25)),
          account1: accounts[1],
          account2: accounts[2],
          accountLevel: 0,
        },
        {
          expires: 10,
          orderNonce: 2,
          tokenGet: contractToken1Addr,
          tokenGive: contractToken2Addr,
          amountGet: new BigNumber(utility.ethToWei(50)),
          amountGive: new BigNumber(utility.ethToWei(25)),
          amount: new BigNumber(utility.ethToWei(25)),
          account1: accounts[1],
          account2: accounts[2],
          accountLevel: 1,
        },
        {
          expires: 10,
          orderNonce: 3,
          tokenGet: contractToken1Addr,
          tokenGive: contractToken2Addr,
          amountGet: new BigNumber(50),
          amountGive: new BigNumber(25),
          amount: new BigNumber(25),
          account1: accounts[1],
          account2: accounts[2],
          accountLevel: 2,
        },
      ];
      async.eachSeries(trades,
        (trade, callbackEach) => {
          testTrade(trade.expires, trade.orderNonce, trade.tokenGet, trade.tokenGive, trade.amountGet, trade.amountGive, trade.amount, trade.account1, trade.account2, trade.accountLevel, () => {
            callbackEach(null);
          });
        },
        () => {
          done();
        });
    });
    it('Should do some trades initiated offchain', (done) => {
      function testTrade(expiresIn, orderNonce, tokenGet, tokenGive, amountGet, amountGive, amount, account1, account2, accountLevel, callback) {
        let expires = expiresIn;
        web3.eth.getBlockNumber((err, blockNumber) => {
          if (err) callback(err);
          expires += blockNumber;
          const condensed = utility.pack([contractEtherDeltaAddr, tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce], [160, 160, 256, 160, 256, 256, 256]);
          const hash = sha256(new Buffer(condensed, 'hex'));
          utility.testSend(web3, contractAccountLevels, contractAccountLevelsAddr, 'setAccountLevel', [account1, accountLevel, { gas: 1000000, value: 0 }], account1, undefined, 0, (err2) => {
            assert.equal(err2, undefined);
            utility.testCall(web3, contractAccountLevels, contractAccountLevelsAddr, 'accountLevel', [account1], (err3, level) => {
              assert.equal(err3, undefined);
              utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [contractToken1Addr, feeAccount], (err4, initialFeeBalance1) => {
                utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [contractToken2Addr, feeAccount], (err5, initialFeeBalance2) => {
                  utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [contractToken1Addr, account1], (err6, initialBalance11) => {
                    utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [contractToken1Addr, account2], (err7, initialBalance12) => {
                      utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [contractToken2Addr, account1], (err8, initialBalance21) => {
                        utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [contractToken2Addr, account2], (err9, initialBalance22) => {
                          utility.sign(web3, account1, hash, undefined, (err10, sig) => {
                            utility.testSend(web3, contractEtherDelta, contractEtherDeltaAddr, 'trade', [tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce, account1, sig.v, sig.r, sig.s, amount, { gas: 1000000, value: 0 }], account2, undefined, 0, (err11) => {
                              assert.equal(err11, undefined);
                              utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [contractToken1Addr, feeAccount], (err12, feeBalance1) => {
                                utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [contractToken2Addr, feeAccount], (err13, feeBalance2) => {
                                  utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [contractToken1Addr, account1], (err14, balance11) => {
                                    utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [contractToken1Addr, account2], (err15, balance12) => {
                                      utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [contractToken2Addr, account1], (err16, balance21) => {
                                        utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [contractToken2Addr, account2], (err17, balance22) => {
                                          utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'availableVolume', [tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce, account1, sig.v, sig.r, sig.s], (err18, availableVolume) => {
                                            utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'amountFilled', [tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce, account1, sig.v, sig.r, sig.s], (err19, amountFilled) => {
                                              const feeMakeXfer = amount.times(feeMake).divToInt(unit);
                                              const feeTakeXfer = amount.times(feeTake).divToInt(unit);
                                              let feeRebateXfer = 0;
                                              if (Number(level) === 1) feeRebateXfer = amount.times(feeRebate).divToInt(unit);
                                              if (Number(level) === 2) feeRebateXfer = feeTakeXfer;
                                              assert.equal(availableVolume.equals(amountGet.minus(amount)), true);
                                              assert.equal(amountFilled.equals(amount), true);
                                              assert.equal(initialFeeBalance1.plus(initialBalance11).plus(initialBalance12).equals(feeBalance1.plus(balance11).plus(balance12)), true);
                                              assert.equal(initialFeeBalance2.plus(initialBalance21).plus(initialBalance22).equals(feeBalance2.plus(balance21).plus(balance22)), true);
                                              assert.equal(feeBalance1.minus(initialFeeBalance1).equals(feeMakeXfer.plus(feeTakeXfer).minus(feeRebateXfer)), true);
                                              assert.equal(balance11.equals(initialBalance11.plus(amount).minus(feeMakeXfer).plus(feeRebateXfer)), true);
                                              assert.equal(balance12.equals(initialBalance12.minus(amount.plus(feeTakeXfer))), true);
                                              assert.equal(balance21.equals(initialBalance21.minus(amount.times(amountGive).divToInt(amountGet))), true);
                                              assert.equal(balance22.equals(initialBalance22.plus(amount.times(amountGive).divToInt(amountGet))), true);
                                              callback();
                                            });
                                          });
                                        });
                                      });
                                    });
                                  });
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      }
      const trades = [
        {
          expires: 10,
          orderNonce: 4,
          tokenGet: contractToken1Addr,
          tokenGive: contractToken2Addr,
          amountGet: new BigNumber(utility.ethToWei(50)),
          amountGive: new BigNumber(utility.ethToWei(25)),
          amount: new BigNumber(utility.ethToWei(25)),
          account1: accounts[1],
          account2: accounts[2],
          accountLevel: 0,
        },
        {
          expires: 10,
          orderNonce: 5,
          tokenGet: contractToken1Addr,
          tokenGive: contractToken2Addr,
          amountGet: new BigNumber(utility.ethToWei(50)),
          amountGive: new BigNumber(utility.ethToWei(25)),
          amount: new BigNumber(utility.ethToWei(25)),
          account1: accounts[1],
          account2: accounts[2],
          accountLevel: 1,
        },
        {
          expires: 10,
          orderNonce: 6,
          tokenGet: contractToken1Addr,
          tokenGive: contractToken2Addr,
          amountGet: new BigNumber(50),
          amountGive: new BigNumber(25),
          amount: new BigNumber(25),
          account1: accounts[1],
          account2: accounts[2],
          accountLevel: 2,
        },
      ];
      async.eachSeries(trades,
        (trade, callbackEach) => {
          testTrade(trade.expires, trade.orderNonce, trade.tokenGet, trade.tokenGive, trade.amountGet, trade.amountGive, trade.amount, trade.account1, trade.account2, trade.accountLevel, () => {
            callbackEach(null);
          });
        },
        () => {
          done();
        });
    });
    it('Should place an order onchain, check availableVolume and amountFilled, then cancel', (done) => {
      function testCancel(expiresIn, orderNonce, tokenGet, tokenGive, amountGet, amountGive, amount, account1, callback) {
        let expires = expiresIn;
        web3.eth.getBlockNumber((err, blockNumber) => {
          if (err) callback(err);
          expires += blockNumber;
          utility.testSend(web3, contractEtherDelta, contractEtherDeltaAddr, 'order', [tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce, { gas: 1000000, value: 0 }], account1, undefined, 0, (err2) => {
            assert.equal(err2, undefined);
            utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'availableVolume', [tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce, account1, 0, '0x0', '0x0'], (err3, result3) => {
              assert.equal(result3.equals(amountGet), true);
              utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'amountFilled', [tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce, account1, 0, '0x0', '0x0'], (err4, result4) => {
                assert.equal(result4.equals(new BigNumber(0)), true);
                utility.testSend(web3, contractEtherDelta, contractEtherDeltaAddr, 'cancelOrder', [tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce, 0, '0x0', '0x0', { gas: 1000000, value: 0 }], account1, undefined, 0, (err5) => {
                  assert.equal(err5, undefined);
                  utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'availableVolume', [tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce, account1, 0, '0x0', '0x0'], (err6, result6) => {
                    assert.equal(result6.equals(new BigNumber(0)), true);
                    utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'amountFilled', [tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce, account1, 0, '0x0', '0x0'], (err7, result7) => {
                      assert.equal(result7.equals(amountGet), true);
                      callback();
                    });
                  });
                });
              });
            });
          });
        });
      }
      const trades = [
        {
          expires: 10,
          orderNonce: 7,
          tokenGet: contractToken1Addr,
          tokenGive: contractToken2Addr,
          amountGet: new BigNumber(utility.ethToWei(50)),
          amountGive: new BigNumber(utility.ethToWei(25)),
          amount: new BigNumber(utility.ethToWei(25)),
          account1: accounts[1],
        },
        {
          expires: 10,
          orderNonce: 8,
          tokenGet: contractToken1Addr,
          tokenGive: contractToken2Addr,
          amountGet: new BigNumber(50),
          amountGive: new BigNumber(25),
          amount: new BigNumber(25),
          account1: accounts[1],
        },
      ];
      async.eachSeries(trades,
        (trade, callbackEach) => {
          testCancel(trade.expires, trade.orderNonce, trade.tokenGet, trade.tokenGive, trade.amountGet, trade.amountGive, trade.amount, trade.account1, () => {
            callbackEach(null);
          });
        },
        () => {
          done();
        });
    });
    it('Should place an order offchain, check availableVolume and amountFilled, then cancel', (done) => {
      function testCancel(expiresIn, orderNonce, tokenGet, tokenGive, amountGet, amountGive, amount, account1, callback) {
        let expires = expiresIn;
        web3.eth.getBlockNumber((err, blockNumber) => {
          if (err) callback(err);
          expires += blockNumber;
          const condensed = utility.pack([contractEtherDeltaAddr, tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce], [160, 160, 256, 160, 256, 256, 256]);
          const hash = sha256(new Buffer(condensed, 'hex'));
          utility.sign(web3, account1, hash, undefined, (err2, sig) => {
            utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'availableVolume', [tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce, account1, sig.v, sig.r, sig.s], (err3, result3) => {
              assert.equal(result3.equals(amountGet), true);
              utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'amountFilled', [tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce, account1, sig.v, sig.r, sig.s], (err4, result4) => {
                assert.equal(result4.equals(new BigNumber(0)), true);
                utility.testSend(web3, contractEtherDelta, contractEtherDeltaAddr, 'cancelOrder', [tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce, sig.v, sig.r, sig.s, { gas: 1000000, value: 0 }], account1, undefined, 0, (err5) => {
                  assert.equal(err5, undefined);
                  utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'availableVolume', [tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce, account1, sig.v, sig.r, sig.s], (err6, result6) => {
                    assert.equal(result6.equals(new BigNumber(0)), true);
                    utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'amountFilled', [tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce, account1, sig.v, sig.r, sig.s], (err7, result7) => {
                      assert.equal(result7.equals(amountGet), true);
                      callback();
                    });
                  });
                });
              });
            });
          });
        });
      }
      const trades = [
        {
          expires: 10,
          orderNonce: 9,
          tokenGet: contractToken1Addr,
          tokenGive: contractToken2Addr,
          amountGet: new BigNumber(utility.ethToWei(50)),
          amountGive: new BigNumber(utility.ethToWei(25)),
          amount: new BigNumber(utility.ethToWei(25)),
          account1: accounts[1],
        },
        {
          expires: 10,
          orderNonce: 10,
          tokenGet: contractToken1Addr,
          tokenGive: contractToken2Addr,
          amountGet: new BigNumber(50),
          amountGive: new BigNumber(25),
          amount: new BigNumber(25),
          account1: accounts[1],
        },
      ];
      async.eachSeries(trades,
        (trade, callbackEach) => {
          testCancel(trade.expires, trade.orderNonce, trade.tokenGet, trade.tokenGive, trade.amountGet, trade.amountGive, trade.amount, trade.account1, () => {
            callbackEach(null);
          });
        },
        () => {
          done();
        });
    });
    it('Should do a trade and check available volume depletion', (done) => {
      web3.eth.getBlockNumber((err, blockNumber) => {
        if (err) done(err);
        const tokenGet = contractToken1Addr;
        const amountGet = new BigNumber(utility.ethToWei(50));
        const tokenGive = contractToken2Addr;
        const amountGive = new BigNumber(utility.ethToWei(25));
        const expires = blockNumber + 1000;
        const orderNonce = 11;
        const user = accounts[1];
        const condensed = utility.pack([contractEtherDeltaAddr, tokenGet, amountGet.toNumber(), tokenGive, amountGive.toNumber(), expires, orderNonce], [160, 160, 256, 160, 256, 256, 256]);
        const hash = sha256(new Buffer(condensed, 'hex'));
        const amount = amountGet.div(new BigNumber(2));
        utility.sign(web3, user, hash, undefined, (err2, sig) => {
          utility.testSend(web3, contractEtherDelta, contractEtherDeltaAddr, 'trade', [tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce, user, sig.v, sig.r, sig.s, amount, { gas: 1000000, value: 0 }], accounts[2], undefined, 0, (err3) => {
            assert.equal(err3, undefined);
            utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'availableVolume', [tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce, user, sig.v, sig.r, sig.s], (err4, result4) => {
              assert.equal(result4.equals(amountGet.minus(amount)), true);
              done();
            });
          });
        });
      });
    });
    it('Should do a self trade and check available volume depletion', (done) => {
      web3.eth.getBlockNumber((err, blockNumber) => {
        if (err) done(err);
        const tokenGet = contractToken1Addr;
        const amountGet = new BigNumber(utility.ethToWei(50));
        const tokenGive = contractToken2Addr;
        const amountGive = new BigNumber(utility.ethToWei(25));
        const expires = blockNumber + 1000;
        const orderNonce = 12;
        const user = accounts[1];
        const condensed = utility.pack([contractEtherDeltaAddr, tokenGet, amountGet.toNumber(), tokenGive, amountGive.toNumber(), expires, orderNonce], [160, 160, 256, 160, 256, 256, 256]);
        const hash = sha256(new Buffer(condensed, 'hex'));
        const amount = amountGet.div(new BigNumber(2));
        utility.sign(web3, user, hash, undefined, (err2, sig) => {
          utility.testSend(web3, contractEtherDelta, contractEtherDeltaAddr, 'trade', [tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce, user, sig.v, sig.r, sig.s, amount, { gas: 1000000, value: 0 }], accounts[1], undefined, 0, (err3) => {
            assert.equal(err3, undefined);
            utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'availableVolume', [tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce, user, sig.v, sig.r, sig.s], (err4, result4) => {
              assert.equal(result4.equals(amountGet.minus(amount)), true);
              done();
            });
          });
        });
      });
    });
    it('Should attempt some trades initiated onchain that should fail', (done) => {
      function testTrade(expiresIn, orderNonce, tokenGet, tokenGive, amountGet, amountGive, amount, account1, account2, accountLevel, callback) {
        let expires = expiresIn;
        web3.eth.getBlockNumber((err, blockNumber) => {
          if (err) callback(err);
          expires += blockNumber;
          utility.testSend(web3, contractAccountLevels, contractAccountLevelsAddr, 'setAccountLevel', [account1, accountLevel, { gas: 1000000, value: 0 }], account1, undefined, 0, (err2) => {
            assert.equal(err2, undefined);
            utility.testCall(web3, contractAccountLevels, contractAccountLevelsAddr, 'accountLevel', [account1], (err3) => {
              assert.equal(err3, undefined);
              utility.testSend(web3, contractEtherDelta, contractEtherDeltaAddr, 'order', [tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce, { gas: 1000000, value: 0 }], account1, undefined, 0, (err4) => {
                assert.equal(err4, undefined);
                utility.testSend(web3, contractEtherDelta, contractEtherDeltaAddr, 'trade', [tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce, account1, 0, '0x0', '0x0', amount, { gas: 1000000, value: 0 }], account2, undefined, 0, (err5) => {
                  assert.equal(!err5, false);
                  callback();
                });
              });
            });
          });
        });
      }
      const account1 = accounts[1];
      const account2 = accounts[2];
      utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [contractToken1Addr, account1], () => {
        utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [contractToken1Addr, account2], (err2, initialBalance12) => {
          utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [contractToken2Addr, account1], (err3, initialBalance21) => {
            utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [contractToken2Addr, account2], () => {
              const trades = [
                // try to trade more than available size
                {
                  expires: 13,
                  orderNonce: 1,
                  tokenGet: contractToken1Addr,
                  tokenGive: contractToken2Addr,
                  amountGet: new BigNumber(utility.ethToWei(50)),
                  amountGive: new BigNumber(utility.ethToWei(25)),
                  amount: new BigNumber(utility.ethToWei(51)),
                  account1,
                  account2,
                  accountLevel: 0,
                },
                // try to trade against resting order when the maker doesn't have enough funds
                {
                  expires: 14,
                  orderNonce: 2,
                  tokenGet: contractToken1Addr,
                  tokenGive: contractToken2Addr,
                  amountGet: new BigNumber(utility.ethToWei(50)),
                  amountGive: initialBalance21.plus(new BigNumber(1)),
                  amount: new BigNumber(utility.ethToWei(50)),
                  account1,
                  account2,
                  accountLevel: 1,
                },
                // try to trade against resting order when the taker doesn't have enough funds
                {
                  expires: 15,
                  orderNonce: 3,
                  tokenGet: contractToken1Addr,
                  tokenGive: contractToken2Addr,
                  amountGet: initialBalance12,
                  amountGive: new BigNumber(25),
                  amount: initialBalance12.plus(new BigNumber(1)),
                  account1,
                  account2,
                  accountLevel: 2,
                },
              ];
              async.eachSeries(trades,
                (trade, callbackEach) => {
                  testTrade(trade.expires, trade.orderNonce, trade.tokenGet, trade.tokenGive, trade.amountGet, trade.amountGive, trade.amount, trade.account1, trade.account2, trade.accountLevel, () => {
                    callbackEach(null);
                  });
                },
                () => {
                  done();
                });
            });
          });
        });
      });
    });
    it('Should do a token withdrawal', (done) => {
      const amount = new BigNumber(utility.ethToWei(100));
      utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [contractToken1Addr, accounts[1]], (err, initialBalance) => {
        utility.testCall(web3, contractToken1, contractToken1Addr, 'balanceOf', [accounts[1]], (err2, initialTokenBalance) => {
          utility.testSend(web3, contractEtherDelta, contractEtherDeltaAddr, 'withdrawToken', [contractToken1Addr, amount, { gas: 1000000, value: 0 }], accounts[1], undefined, 0, (err3) => {
            assert.equal(err3, undefined);
            utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [contractToken1Addr, accounts[1]], (err4, finalBalance) => {
              utility.testCall(web3, contractToken1, contractToken1Addr, 'balanceOf', [accounts[1]], (err5, finalTokenBalance) => {
                utility.testCall(web3, contractToken1, contractToken1Addr, 'balanceOf', [accounts[1]], () => {
                  assert.equal(finalBalance.equals(initialBalance.sub(amount)), true);
                  assert.equal(finalTokenBalance.equals(initialTokenBalance.add(amount)), true);
                  done();
                });
              });
            });
          });
        });
      });
    });
    it('Should do an Ether withdrawal', (done) => {
      const amount = new BigNumber(utility.ethToWei(100));
      utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [0, accounts[1]], (err, initialBalance) => {
        web3.eth.getBalance(contractEtherDeltaAddr, (err2, initialEtherBalance) => {
          utility.testSend(web3, contractEtherDelta, contractEtherDeltaAddr, 'withdraw', [amount, { gas: 1000000, value: 0 }], accounts[1], undefined, 0, (err3) => {
            assert.equal(err3, undefined);
            utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'balanceOf', [0, accounts[1]], (err4, finalBalance) => {
              web3.eth.getBalance(contractEtherDeltaAddr, (err5, finalEtherBalance) => {
                assert.equal(finalBalance.equals(initialBalance.sub(amount)), true);
                assert.equal(finalEtherBalance.equals(initialEtherBalance.sub(amount)), true);
                done();
              });
            });
          });
        });
      });
    });
    it('Should change the account levels address and fail', (done) => {
      utility.testSend(web3, contractEtherDelta, contractEtherDeltaAddr, 'changeAccountLevelsAddr', ['0x0', { gas: 1000000, value: 0 }], accounts[1], undefined, 0, (err) => {
        assert.equal(!err, false);
        done();
      });
    });
    it('Should change the account levels address and succeed', (done) => {
      utility.testSend(web3, contractEtherDelta, contractEtherDeltaAddr, 'changeAccountLevelsAddr', ['0x0', { gas: 1000000, value: 0 }], admin, undefined, 0, (err) => {
        assert.equal(err, undefined);
        utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'accountLevelsAddr', [], (err2, result2) => {
          assert.equal(result2 === '0x0000000000000000000000000000000000000000', true);
          done();
        });
      });
    });
    it('Should change the fee account and fail', (done) => {
      utility.testSend(web3, contractEtherDelta, contractEtherDeltaAddr, 'changeFeeAccount', ['0x0', { gas: 1000000, value: 0 }], accounts[1], undefined, 0, (err) => {
        assert.equal(!err, false);
        done();
      });
    });
    it('Should change the fee account and succeed', (done) => {
      utility.testSend(web3, contractEtherDelta, contractEtherDeltaAddr, 'changeFeeAccount', [accounts[1], { gas: 1000000, value: 0 }], admin, undefined, 0, (err) => {
        assert.equal(err, undefined);
        utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'feeAccount', [], (err2, result2) => {
          assert.equal(result2 === accounts[1], true);
          done();
        });
      });
    });
    it('Should change the make fee and fail', (done) => {
      utility.testSend(web3, contractEtherDelta, contractEtherDeltaAddr, 'changeFeeMake', [feeMake, { gas: 1000000, value: 0 }], accounts[1], undefined, 0, (err) => {
        assert.equal(!err, false);
        done();
      });
    });
    it('Should change the make fee and fail because the make fee can only decrease', (done) => {
      utility.testSend(web3, contractEtherDelta, contractEtherDeltaAddr, 'changeFeeMake', [feeMake.mul(2), { gas: 1000000, value: 0 }], accounts[1], undefined, 0, (err) => {
        assert.equal(!err, false);
        done();
      });
    });
    it('Should change the make fee and succeed', (done) => {
      utility.testSend(web3, contractEtherDelta, contractEtherDeltaAddr, 'changeFeeMake', [feeMake.div(2), { gas: 1000000, value: 0 }], admin, undefined, 0, (err) => {
        assert.equal(err, undefined);
        utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'feeMake', [], (err2, result2) => {
          assert.equal(result2.equals(feeMake.div(2)), true);
          feeMake = result2;
          done();
        });
      });
    });
    it('Should change the take fee and fail', (done) => {
      utility.testSend(web3, contractEtherDelta, contractEtherDeltaAddr, 'changeFeeTake', [feeTake, { gas: 1000000, value: 0 }], accounts[1], undefined, 0, (err) => {
        assert.equal(!err, false);
        done();
      });
    });
    it('Should change the take fee and fail because the take fee can only decrease', (done) => {
      utility.testSend(web3, contractEtherDelta, contractEtherDeltaAddr, 'changeFeeTake', [feeTake.mul(2), { gas: 1000000, value: 0 }], accounts[1], undefined, 0, (err) => {
        assert.equal(!err, false);
        done();
      });
    });
    it('Should change the take fee and fail because the take fee must exceed the rebate fee', (done) => {
      utility.testSend(web3, contractEtherDelta, contractEtherDeltaAddr, 'changeFeeTake', [feeTake.minus(new BigNumber(1)), { gas: 1000000, value: 0 }], accounts[1], undefined, 0, (err) => {
        assert.equal(!err, false);
        done();
      });
    });
    it('Should change the take fee and succeed', (done) => {
      utility.testSend(web3, contractEtherDelta, contractEtherDeltaAddr, 'changeFeeTake', [feeRebate.plus(new BigNumber(2)), { gas: 1000000, value: 0 }], admin, undefined, 0, (err) => {
        assert.equal(err, undefined);
        utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'feeTake', [], (err2, result2) => {
          assert.equal(result2.equals(feeRebate.plus(new BigNumber(2))), true);
          feeTake = result2;
          done();
        });
      });
    });
    it('Should change the rebate fee and fail', (done) => {
      utility.testSend(web3, contractEtherDelta, contractEtherDeltaAddr, 'changeFeeRebate', [feeRebate, { gas: 1000000, value: 0 }], accounts[1], undefined, 0, (err) => {
        assert.equal(!err, false);
        done();
      });
    });
    it('Should change the rebate fee and fail because the rebate fee can only increase', (done) => {
      utility.testSend(web3, contractEtherDelta, contractEtherDeltaAddr, 'changeFeeRebate', [feeRebate.div(2), { gas: 1000000, value: 0 }], accounts[1], undefined, 0, (err) => {
        assert.equal(!err, false);
        done();
      });
    });
    it('Should change the rebate fee and fail because the rebate fee must not exceed the take fee', (done) => {
      utility.testSend(web3, contractEtherDelta, contractEtherDeltaAddr, 'changeFeeRebate', [feeTake.plus(new BigNumber(1)), { gas: 1000000, value: 0 }], accounts[1], undefined, 0, (err) => {
        assert.equal(!err, false);
        done();
      });
    });
    it('Should change the rebate fee and succeed', (done) => {
      utility.testSend(web3, contractEtherDelta, contractEtherDeltaAddr, 'changeFeeRebate', [feeTake.minus(new BigNumber(1)), { gas: 1000000, value: 0 }], admin, undefined, 0, (err) => {
        assert.equal(err, undefined);
        utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'feeRebate', [], (err2, result2) => {
          assert.equal(result2.equals(feeTake.minus(new BigNumber(1))), true);
          feeRebate = result2;
          done();
        });
      });
    });
    it('Should change the admin account and fail', (done) => {
      utility.testSend(web3, contractEtherDelta, contractEtherDeltaAddr, 'changeAdmin', [accounts[1], { gas: 1000000, value: 0 }], accounts[1], undefined, 0, (err) => {
        assert.equal(!err, false);
        done();
      });
    });
    it('Should change the admin account and succeed', (done) => {
      utility.testSend(web3, contractEtherDelta, contractEtherDeltaAddr, 'changeAdmin', [accounts[1], { gas: 1000000, value: 0 }], admin, undefined, 0, (err) => {
        assert.equal(err, undefined);
        utility.testCall(web3, contractEtherDelta, contractEtherDeltaAddr, 'admin', [], (err2, result2) => {
          assert.equal(result2 === accounts[1], true);
          admin = result2;
          done();
        });
      });
    });
  });
});
