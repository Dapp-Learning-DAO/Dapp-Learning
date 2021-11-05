require('@nomiclabs/hardhat-waffle');
//todo import typechain
//require("hardhat-typechain");
const fs = require('fs');
require('dotenv').config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

function mnemonic() {
  return process.env.PRIVATE_KEY_MAIN;
}

function mnemonicAlice() {
  return process.env.PRIVATE_KEY_ALICE;
}

function mnemonicBob() {
  return process.env.PRIVATE_KEY_BOB;
}

function mnemonicTest() {
  return process.env.PRIVATE_KEY_TEST;
}
// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: '0.8.3',
      },
      {
        version: '0.6.6',
        settings: {},
      },
    ],
  },
  networks: {
    hardhat: {
      accounts: [
        { privateKey: mnemonic(), balance: '10000000000000000000000' },
        { privateKey: mnemonicAlice(), balance: '10000000000000000000000' },
        { privateKey: mnemonicBob(), balance: '10000000000000000000000' },
        { privateKey: mnemonicTest(), balance: '10000000000000000000000' },
      ],
    },
    localhost: {
      url: 'http://localhost:8545',
      accounts: [mnemonic(), mnemonicAlice(), mnemonicBob(), mnemonicTest()],
    },
    rinkeby: {
      url: 'https://rinkeby.infura.io/v3/' + process.env.INFURA_ID, //<---- YOUR INFURA ID! (or it won't work)
      accounts: [mnemonic()],
    },
    kovan: {
      url: 'https://kovan.infura.io/v3/' + process.env.INFURA_ID, //<---- YOUR INFURA ID! (or it won't work)
      accounts: [mnemonic(), mnemonicAlice(), mnemonicBob(), mnemonicTest()],
    },
    mainnet: {
      url: 'https://mainnet.infura.io/v3/' + process.env.INFURA_ID, //<---- YOUR INFURA ID! (or it won't work)
      accounts: [mnemonic()],
    },
    ropsten: {
      url: 'https://ropsten.infura.io/v3/' + process.env.INFURA_ID, //<---- YOUR INFURA ID! (or it won't work)
      accounts: [mnemonic()],
    },
  },
};
