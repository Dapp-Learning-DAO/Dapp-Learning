require("@nomiclabs/hardhat-waffle");
//todo import typechain
//require("hardhat-typechain");
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

function PRIVATEKEY() {

  return process.env.PRIVATE_KEY_MAIN

}

function PRIVATEKEYAlice() {

  return process.env.PRIVATE_KEY_ALICE

}

function PRIVATEKEYBob() {

  return process.env.PRIVATE_KEY_BOB

}

function PRIVATEKEYTest() {

  return process.env.PRIVATE_KEY_TEST

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
        version: "0.8.3"
      },
      {
        version: "0.6.6",
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
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/" + process.env.INFURA_ID, //<---- YOUR INFURA ID! (or it won't work)
      accounts: [
        PRIVATEKEY()
      ],
    },
    kovan: {
      url: "https://kovan.infura.io/v3/" + process.env.INFURA_ID, //<---- YOUR INFURA ID! (or it won't work)
      accounts: [
        PRIVATEKEY(),
        PRIVATEKEYAlice(),
        PRIVATEKEYBob(),
        PRIVATEKEYTest()
      ],
    },
    mainnet: {
      url: "https://mainnet.infura.io/v3/" + process.env.INFURA_ID, //<---- YOUR INFURA ID! (or it won't work)
      accounts: [
        PRIVATEKEY()
      ],
    },
    ropsten: {
      url: "https://ropsten.infura.io/v3/" + process.env.INFURA_ID, //<---- YOUR INFURA ID! (or it won't work)
      accounts: [
        PRIVATEKEY()
      ],
    },
  }
};

