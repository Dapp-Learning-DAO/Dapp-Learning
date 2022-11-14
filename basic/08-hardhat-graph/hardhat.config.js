require('@nomiclabs/hardhat-waffle');
const fs = require('fs');
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
    goerli: {
      url: 'https://goerli.infura.io/v3/' + process.env.INFURA_ID, //<---- YOUR INFURA ID! (or it won't work)
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
};

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});
