require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();
const fs = require('fs');
require('./tasks');

const settings = {
  optimizer: {
    enabled: true,
    runs: 200,
  },
};

function mnemonic() {
  return [process.env.PRIVATE_KEY];
}

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      { version: '0.8.8', settings },
      { version: '0.7.6', settings },
      { version: '0.6.11', settings },
      { version: '0.5.16', settings },
      { version: '0.8.20', settings },
      { version: '0.8.24', settings },
      { version: '0.8.19', settings },
    ],
  },
  etherscan: {
    apiKey: {
      optimisticEthereum: 'xxx',
    },
  },
  networks: {
    localhost: {
      url: 'http://localhost:8545',
      //gasPrice: 125000000000,  // you can adjust gasPrice locally to see how much it will cost on production
      /*
        notice no mnemonic here? it will just use account 0 of the hardhat node to deploy
        (you can put in a mnemonic here to set the deployer locally)
      */
    },
    mainnet: {
      url: 'https://mainnet.infura.io/v3/' + process.env.INFURA_ID, //<---- YOUR INFURA ID! (or it won't work)
      accounts: mnemonic(),
    },
    matic: {
      url: 'https://polygon-mainnet.infura.io/v3/' + process.env.INFURA_ID,
      accounts: mnemonic(),
    },
    optim: {
      url: 'https://optimism-mainnet.infura.io/v3/' + process.env.INFURA_ID,
      accounts: mnemonic(),
    },
    sepolia: {
      url: 'https://sepolia.infura.io/v3/' + process.env.INFURA_ID,
      accounts: mnemonic(),
    },
    arbitrum: {
      url: 'https://arbitrum-mainnet.infura.io/v3/' + process.env.INFURA_ID,
      accounts: mnemonic(),
    },
    mumbai: {
      url: 'https://polygon-mumbai.infura.io/v3/' + process.env.INFURA_ID,
      accounts: mnemonic(),
    },
    arbitrumSepolia: {
      url: 'https://arbitrum-sepolia.infura.io/v3/' + process.env.INFURA_ID,
      accounts: mnemonic(),
      chainId: 421614,
    },
  },
  mocha: {
    timeout: 20000,
  },
};
