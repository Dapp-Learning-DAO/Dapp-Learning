require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

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
  defaultNetwork: "matic",
  networks: {
    hardhat: {
      forking: {
        // url: "https://mainnet.infura.io/v3/" + process.env.INFURA_ID,
        url: "https://eth-mainnet.g.alchemy.com/v2/" + process.env.ALCHEMY_ID,
      }
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    ropsten: {
      url: "https://ropsten.infura.io/v3/" + process.env.INFURA_ID,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    kovan: {
      url: "https://kovan.infura.io/v3/" + process.env.INFURA_ID,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    main: {
      url: "https://mainnet.infura.io/v3/" + process.env.INFURA_ID,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    matic: {
      url: "https://polygon-mainnet.g.alchemy.com/v2/" + process.env.ALCHEMY_ID,
      accounts:
      process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    matic_mumbai: {
      url: "https://polygon-mumbai.infura.io/v3/" + process.env.INFURA_ID,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    optimism: {
      url: "https://optimism-mainnet.infura.io/v3/" + process.env.INFURA_ID,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          },
          viaIR: true, // 启用通过IR编译
        },
      },
      {
        version: "0.6.8"
      },
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    ]
  },
  mocha: {
    timeout: 80000
  },

  ignition: {
    strategyConfig: {
      create2: {
        // To learn more about salts, see the CreateX documentation
        // generate via ethers.keccak256(ethers.toUtf8Bytes("dapp-learning"))
        salt: "0x262a460790f6b524b7fa041acd8d42a64d405de6fcf470a86d8b706fc6d18dd7", 
      },
    },
  },

  networkAddressMapping: {
    matic: {
      daiAddress: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
      wmaticAddress: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
      wethAddress: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
      
      lendingPoolAddressesProviderAddress: '0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb',
      uniswapRouterAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      wethGatewayAddress: '0xC1E320966c485ebF2A0A2A6d3c0Dc860A156eB1B',
      aaveApeAddress: '0x4699f609F4FD97A3cf74CB63EFf5cd1200Dfe3dA',
    },
    optimism: {
      daiAddress: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      wmaticAddress: '',
      wethAddress: '0x4200000000000000000000000000000000000006',
      
      lendingPoolAddressesProviderAddress: '0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb',
      uniswapRouterAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      wethGatewayAddress: '0xe9E52021f4e11DEAD8661812A0A6c8627abA2a54',
      aaveApeAddress: '0x4699f609F4FD97A3cf74CB63EFf5cd1200Dfe3dA',
    },
    main: {
      daiAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      wmaticAddress: '',
      wethAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      
      lendingPoolAddressesProviderAddress: '0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e',
      uniswapRouterAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      wethGatewayAddress: '0x893411580e590D62dDBca8a703d61Cc4A8c7b2b9',
      aaveApeAddress: '0x4699f609F4FD97A3cf74CB63EFf5cd1200Dfe3dA',
    },
    localhost: {
      daiAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      wmaticAddress: '',
      wethAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      
      lendingPoolAddressesProviderAddress: '0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e',
      uniswapRouterAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      wethGatewayAddress: '0x893411580e590D62dDBca8a703d61Cc4A8c7b2b9',
      aaveApeAddress: '0x4699f609F4FD97A3cf74CB63EFf5cd1200Dfe3dA',
    }
  }
};
