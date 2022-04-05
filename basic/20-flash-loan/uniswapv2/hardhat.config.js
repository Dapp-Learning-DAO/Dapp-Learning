require("@nomiclabs/hardhat-waffle");
require('dotenv').config()

const INFURA_ID = process.env.INFURA_ID;
const privateKey = process.env.PRIVATE_KEY;
const infuraUrl = "https://kovan.infura.io/v3/" + INFURA_ID;

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: "localhost",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    kovan: {
      url: infuraUrl,
      accounts: [privateKey]
    },
    hardhat: {}
  },
  solidity: {
    version: "0.8.0",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};