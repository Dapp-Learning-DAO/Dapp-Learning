const fs = require('fs')
const HDWalletProvider = require('truffle-hdwallet-provider')
const mnemonic = "35b08a65b9269c23c470963bc3203778e1c20d49f91e4b98b48fc6cf02575a33"

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
      development: {
        host: "127.0.0.1",
        port: 9545,
        network_id: "*"
     },
    //  test: {
    //    host: "127.0.0.1",
    //    port: 7545,
    //    network_id: "*"
    //  }
    //},

    sepolia: {
      networkCheckTimeout: 10000,
      provider: () =>
      new HDWalletProvider(
        process.env.PRIVATE_KEY,
        'https://sepolia.infura.io/v3/' + process.env.INFURA_ID
      ),
      network_id: '*',
      gas: 30000000,
      gasPrice: 10000000000,
    },          
  },
}