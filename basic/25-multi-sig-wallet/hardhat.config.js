require("@nomiclabs/hardhat-waffle");
const fs = require("fs");
require('dotenv').config()

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

function mnemonic() {

  return process.env.PRIVATE_KEY
 
 }

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.6.12"
      },
      {
        version: "0.8.0",
        settings: {}
      },
      {
        version: "0.7.6",
        settings: {}
      }
    ]
  },
  networks: {
    localhost: {
      url: "http://localhost:8545",
      //gasPrice: 125000000000,//you can adjust gasPrice locally to see how much it will cost on production
      /*
        notice no mnemonic here? it will just use account 0 of the hardhat node to deploy
        (you can put in a mnemonic here to set the deployer locally)
      */
    },
    goerli: {
      url: "https://goerli.infura.io/v3/" + process.env.INFURA_ID, //<---- YOUR INFURA ID! (or it won't work)
      accounts: [
        mnemonic()
      ],
    },
    mainnet: {
      url: "https://mainnet.infura.io/v3/" + process.env.INFURA_ID, //<---- YOUR INFURA ID! (or it won't work)
      accounts: [
        mnemonic()
      ],
    },
    ropsten: {
      url: "https://ropsten.infura.io/v3/" + process.env.INFURA_ID, //<---- YOUR INFURA ID! (or it won't work)
      accounts: [
        mnemonic()
      ],
    },
  }
};
