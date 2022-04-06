require('@nomiclabs/hardhat-waffle');
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

// 加载本地privateKeys到harhat本地测试网络
function loadTestAccounts() {
  const privateKyes = JSON.parse(fs.readFileSync('./testAccounts.json'));
  return privateKyes.map((_privateKey, index) => ({
    mnemonic: _privateKey,
    privateKey: _privateKey,
    initialIndex: index,
    // path: 'm/44'/60'/0'/0'
    count: 20,
    accountsBalance: '100000000000000000000000000',
    balance: '100000000000000000000000000',
  }));
}

function mnemonic() {
  return process.env.PRIVATE_KEY;
}

function mnemonicAlice() {
  return process.env.PRIVATE_KEY_ALICE;
}

const settings = {
  optimizer: {
    enabled: true,
    runs: 200,
  },
};

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      { version: '0.8.1', settings },
      { version: '0.8.0', settings },
      { version: '0.6.2', settings },
      { version: '0.5.16', settings },
      { version: '0.4.25', settings },
    ],
  },
  networks: {
    hardhat: {
      accounts: loadTestAccounts(),
    },
    localhost: {
      url: 'http://localhost:8545',
      //gasPrice: 125000000000,//you can adjust gasPrice locally to see how much it will cost on production
      /*
        notice no mnemonic here? it will just use account 0 of the hardhat node to deploy
        (you can put in a mnemonic here to set the deployer locally)
      */
    },
    rinkeby: {
      url: 'https://rinkeby.infura.io/v3/' + process.env.INFURA_ID, //<---- YOUR INFURA ID! (or it won't work)
      accounts: [mnemonic(), mnemonicAlice()],
      gas: 2100000,
      gasPrice: 8000000000,
    },
    kovan: {
      url: 'https://kovan.infura.io/v3/' + +process.env.INFURA_ID, //<---- YOUR INFURA ID! (or it won't work)
      accounts: [mnemonic()],
    },
    mainnet: {
      url: 'https://mainnet.infura.io/v3/' + +process.env.INFURA_ID, //<---- YOUR INFURA ID! (or it won't work)
      accounts: [mnemonic()],
    },
    ropsten: {
      url: 'https://ropsten.infura.io/v3/' + +process.env.INFURA_ID, //<---- YOUR INFURA ID! (or it won't work)
      accounts: [mnemonic()],
    },
  },
  mocha: {
    timeout: 60000,
  },
};
