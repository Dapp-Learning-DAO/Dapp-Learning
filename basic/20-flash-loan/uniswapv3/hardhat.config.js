require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-truffle5");
require('hardhat-abi-exporter');
require('dotenv').config();

const INFURA_PROJECT_ID = process.env.infuraKey;
const privateKey = process.env.privateKey;

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      gasLimit: 19500000,
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`${privateKey}`],
      gasPrice: 'auto',
    }
  },
  solidity: {
    compilers: [
      {
        version: "0.4.18",
        settings: {
          optimizer: { enabled: true, runs: 200 }
        }
      },
      {
        version: "0.7.6",
        settings: {
          optimizer: { enabled: true, runs: 200 }
        }
      }
    ]
  },
  abiExporter: {
    path: './abi',
    clear: true,
    flat: true,
    spacing: 2
  }
};

