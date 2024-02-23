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

 return process.env.PRIVATE_KEY;

}

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    "compilers": [
      {
        "version": "0.6.11",
        "settings": {
          "optimizer": {
            "enabled": true,
            "runs": 100
          }
        }
      },
      {
        "version": "0.8.17",
        "settings": {
          "optimizer": {
            "enabled": true,
            "runs": 100
          }
        }
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
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_ID}`, //<---- YOUR INFURA ID! (or it won't work)
      accounts: [
        mnemonic()
      ],
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_ID}`, //<---- YOUR INFURA ID! (or it won't work)
      accounts: [
        mnemonic()
      ],
    },
    arbitrum: {
      url: 'https://arb1.arbitrum.io/rpc',
      accounts: [
        mnemonic()
      ],
    },
    arbitrum_rinkeby: {
      url: 'https://rinkeby.arbitrum.io/rpc',
      accounts: [
        mnemonic()
      ],
    },
    scrollSepolia: {
      url: "https://sepolia-rpc.scroll.io/",
      accounts: [
        mnemonic()
      ]
    },
    taiko: {
      url: "https://rpc.test.taiko.xyz",
      accounts:  [
        mnemonic()
      ],
   }
  },
  etherscan: {
    apiKey: {
        taiko: "42069",
    },
    customChains: [
        {
            network: "taiko",
            chainId: 167005,
            urls: {
                apiURL: "https://explorer.test.taiko.xyz/api",
                browserURL: "https://explorer.test.taiko.xyz",
            },
        },
    ],
}
};