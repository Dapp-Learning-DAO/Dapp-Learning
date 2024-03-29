require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

function mnemonic() {
  //can config 3 PRIVATE_KEY
  //return process.env.PRIVATE_KEY,process.env.PRIVATE_KEY1,process.env.PRIVATE_KEY2;
  return process.env.PRIVATE_KEY;
}

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: '0.8.20',
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
      url: 'https://sepolia.infura.io/v3/' + process.env.INFURA_ID, //<---- CONFIG YOUR INFURA ID IN .ENV! (or it won't work)
      accounts: [mnemonic()],
    },
    mainnet: {
      url: 'https://mainnet.infura.io/v3/' + process.env.INFURA_ID, //<---- CONFIG YOUR INFURA ID IN .ENV! (or it won't work)
      accounts: [mnemonic()],
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
