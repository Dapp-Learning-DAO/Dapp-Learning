require("@nomicfoundation/hardhat-ethers");
require('dotenv').config({'path': './.env'});

function mnemonic() {
  return process.env.PRIVATE_KEY;
}

module.exports = {
  defaultNetwork: "sepolia",
  networks: {
    hardhat: {
      // // If you want to do some forking, uncomment this
      // forking: {
      //   url: mainnetRpcUrl
      // }
    },
    sepolia: {
      url: 'https://eth-sepolia.g.alchemy.com/v2/' + process.env.API_KEY, //<---- YOUR alchemy ID! (or it won't work)
      accounts: [mnemonic()],
      ignition: {
        maxFeePerGasLimit: 10_000_000_000_000n,
        maxPriorityFeePerGas: 20_000_000_000n,
      }
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.7"
      }
    ]
  },
  etherscan: {
    apiKey: "1234"
  },
  mocha: {
    timeout: 6000000000000000
  }
}
