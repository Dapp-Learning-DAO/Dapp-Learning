const HDWalletProvider = require("@truffle/hdwallet-provider")
require("dotenv").config()

const ACCOUNT_KEY = process.env.PRIVATE_KEY
const INFURA_API_KEY = process.env.INFURA_API_KEY

module.exports = {
  	networks: {
	  development: {
		host: "127.0.0.1",
		port: 8545,
		// gas: 20000000,
		network_id: "*",
		skipDryRun: true
	  },
	  ropsten: {
		provider: new HDWalletProvider(ACCOUNT_KEY, "https://ropsten.infura.io/v3/" + INFURA_API_KEY),
		network_id: 3,
		gas: 5000000,
		gasPrice: 5000000000, // 5 Gwei
		skipDryRun: true
	  },
	  kovan: {
		provider: new HDWalletProvider(ACCOUNT_KEY, "https://kovan.infura.io/v3/" + INFURA_API_KEY),
		network_id: 42,
		gas: 5000000,
		gasPrice: 5000000000, // 5 Gwei
		skipDryRun: true
	  },
	  mainnet: {
		provider: new HDWalletProvider(ACCOUNT_KEY, "https://mainnet.infura.io/v3/" + INFURA_API_KEY),
		network_id: 1,
		gas: 5000000,
		gasPrice: 5000000000 // 5 Gwei
	  }
	},
	compilers: {
	  solc: {
		version: "0.6.12",
		optimizer: {
		  enabled: true,
		  runs: 200
		},
	  },
	},
}
