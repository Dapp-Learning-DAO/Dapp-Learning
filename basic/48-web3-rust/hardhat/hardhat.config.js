require("@nomiclabs/hardhat-waffle");
require('dotenv').config();
require('hardhat-abi-exporter');


// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

function mnemonic() {
  return process.env.PRIVATE_KEY;
}

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  abiExporter: {
    path: './data/abi',
    runOnCompile: true,
    clear: true,
    flat: true,
    // only: [':ERC20$'],
    spacing: 2,
    // pretty: true,
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
    rinkeby: {
      url: 'https://rinkeby.infura.io/v3/' + process.env.INFURA_ID, //<---- CONFIG YOUR INFURA ID IN .ENV! (or it won't work)
      accounts: [mnemonic()],
    },
    kovan: {
      url: 'https://kovan.infura.io/v3/' + process.env.INFURA_ID, //<---- CONFIG YOUR INFURA ID IN .ENV! (or it won't work)
      accounts: [mnemonic()],
    },
    mainnet: {
      url: 'https://mainnet.infura.io/v3/' + process.env.INFURA_ID, //<---- CONFIG YOUR INFURA ID IN .ENV! (or it won't work)
      accounts: [mnemonic()],
    },
    ropsten: {
      url: 'https://ropsten.infura.io/v3/' + process.env.INFURA_ID, //<---- CONFIG YOUR INFURA ID IN .ENV! (or it won't work)
      accounts: [mnemonic()],
    },
    matic: {
      url: 'https://polygon-mainnet.infura.io/v3/' + process.env.PROJECT_ID, //<---- CONFIG YOUR INFURA ID IN .ENV! (or it won't work)
      accounts: [mnemonic()]
    },
  }
};
