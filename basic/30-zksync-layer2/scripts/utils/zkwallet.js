const ethers = require("ethers");
const zksync = require("zksync");
require('dotenv').config();

async function getZkWallet(targetNetwork, privateKey, zkProviderURL) {

    const provider = new ethers.providers.InfuraProvider(
        targetNetwork,
        process.env.INFURA_API_KEY
    );

    const ethWallet = new ethers.Wallet(privateKey, provider);
    const zkProvider = await zksync.Provider.newHttpProvider(zkProviderURL);

    const zkWallet = await zksync.Wallet.fromEthSigner(ethWallet, zkProvider);
    return zkWallet
}

// Export function getZkWallet
module.exports = getZkWallet;
