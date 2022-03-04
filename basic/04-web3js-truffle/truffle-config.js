const fs = require('fs')
const HDWalletProvider = require('truffle-hdwallet-provider')

require('dotenv').config();

module.exports = {
  // Uncommenting the defaults below
  // provides for an easier quick-start with Ganache.
  // You can also follow this format for other networks;
  // see <http://truffleframework.com/docs/advanced/configuration>
  // for more details on how to specify configuration options!
  //
  compilers: {
    solc: {
      version: '0.8.0',
    },
  },
  networks: {
       //  development: {
    //    host: "127.0.0.1",
    //    port: 7545,
    //    network_id: "*"
    //  },
    //  test: {
    //    host: "127.0.0.1",
    //    port: 7545,
    //    network_id: "*"
    //  }
    //},
    ropsten: {
      provider: () =>
        new HDWalletProvider(
          process.env.PRIVATE_KEY,
          'https://ropsten.infura.io/v3/' + process.env.INFURA_ID
        ),
      network_id: '*',
      gas: 3000000,
      gasPrice: 10000000000,
    },
    kovan: {
      provider: () =>
        new HDWalletProvider(
          process.env.PRIVATE_KEY,
          'https://kovan.infura.io/v3/' + process.env.INFURA_ID
        ),
      network_id: '*',
    },
    rinkeby: {
      provider: () =>
        new HDWalletProvider(
          process.env.PRIVATE_KEY,
          'https://rinkeby.infura.io/v3/' + process.env.INFURA_ID
        ),
      network_id: '*',
      gas: 3000000,
      gasPrice: 10000000000,
    },
  },
}
