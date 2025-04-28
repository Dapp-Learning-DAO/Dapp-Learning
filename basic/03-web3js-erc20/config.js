// Network Configurations
const networks = {
    development: {
        provider: `https://sepolia.infura.io/v3/${process.env.INFURA_ID}`,
        networkId: 11155111, // Sepolia network ID
        confirmations: 2,
        timeoutBlocks: 200
    },
    moonbase: {
        provider: 'https://rpc.testnet.moonbeam.network',
        networkId: 1287,
        confirmations: 2,
        timeoutBlocks: 200
    }
};

// Token Configuration
const tokenConfig = {
    name: 'DAPPLEARNING',
    symbol: 'DAPP',
    decimals: 18,
    initialSupply: 10000000
};

// Gas Configuration
const gasConfig = {
    deploy: 8000000,
    transfer: 60000
};

module.exports = {
    networks,
    tokenConfig,
    gasConfig
};