require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();


const PRIVATE_KEY = process.env.PRIVATE_KEY;
const defaultNetwork = 'localhost';

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more
module.exports = {
  defaultNetwork,
  solidity: '0.8.0',
  networks: {
    localhost: {
      url: 'http://localhost:8545',
      //gasPrice: 125000000000,  // you can adjust gasPrice locally to see how much it will cost on production
      /*
        notice no mnemonic here? it will just use account 0 of the hardhat node to deploy
        (you can put in a mnemonic here to set the deployer locally)
      */
    },
    sepolia: {
      url: 'https://sepolia.infura.io/v3/' + process.env.INFURA_ID, //<---- YOUR INFURA ID! (or it won't work)
      accounts: [PRIVATE_KEY],
    },
    mainnet: {
      url: 'https://mainnet.infura.io/v3/' + process.env.INFURA_ID, //<---- YOUR INFURA ID! (or it won't work)
      accounts: [PRIVATE_KEY],
    },
    ropsten: {
      url: 'https://ropsten.infura.io/v3/' + process.env.INFURA_ID, //<---- YOUR INFURA ID! (or it won't work)
      accounts: [PRIVATE_KEY],
    },
  },  
  etherscan: {
    apiKey: {
      sepolia: process.env.APIKEY
    } ,
  },
  sourcify: {
    // Disabled by default
    // Doesn't need an API key
    enabled: true
  }
};