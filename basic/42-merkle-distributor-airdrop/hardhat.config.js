require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-ethers');
require('hardhat-gas-reporter');

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
      { version: '0.8.4',  settings },
      { version: '0.7.6',  settings },
      { version: '0.6.12', settings },
      { version: '0.5.16', settings },
    ],
  },
  gasReporter: {
    currency: 'USD',
    coinmarketcap: process.env.COINMARKETCAP,
    gasPrice: 200,
  },
};
