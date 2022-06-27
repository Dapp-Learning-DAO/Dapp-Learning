require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ganache");
require("dotenv").config();

const INFURA_ID = process.env.INFURA_ID;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.4.23",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.11",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  defaultNetwork: "development",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    development: {
      url: "http://127.0.0.1:8545",
      // accounts: [
      //   "0xd682db00b5435e7719528ff6dff2ac2a591a1a8b52734de3cb6357189068bd71",
      // ],
      //accounts: {
      // mnemonic:
      //   "goose innocent kid village cliff mechanic foster horn essence identify auction clarify",
      // path: "m/44'/60'/0'/0/1",
      // count: 1,
      // accountsBalance: "10000000000000000000000",
      // }
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${INFURA_ID}`,
      accounts: [PRIVATE_KEY],
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${INFURA_ID}`,
      accounts: [PRIVATE_KEY],
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${INFURA_ID}`,
      accounts: [PRIVATE_KEY],
    },
  },
};
