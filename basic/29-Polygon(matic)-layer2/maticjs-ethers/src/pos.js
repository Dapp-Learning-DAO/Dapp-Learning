const { POSClient, use } = require("@maticnetwork/maticjs")
const { Web3ClientPlugin } = require('@maticnetwork/maticjs-ethers')
const { providers, Wallet } = require("ethers");
const config = require('./config')

// install web3 plugin
use(Web3ClientPlugin);

const parentProvider = new providers.JsonRpcProvider(config.rpc.parent);
const childProvider = new providers.JsonRpcProvider(config.rpc.child);

const privateKey = config.user1.privateKey
const fromAddress = config.user1.address

const getPosClient = async (network = 'testnet', version = 'mumbai') => {
  const posClient = new POSClient();
  return posClient.init({
    network: network,
    version: version,
    parent: {
      provider: new Wallet(privateKey, parentProvider),
      defaultConfig: {
        from: fromAddress
      }
    },
    child: {
      provider: new Wallet(privateKey, childProvider),
      defaultConfig: {
        from: fromAddress
      }
    }
  });
}


module.exports = {
  getPosClient: getPosClient,
  from: config.user1.address,
  privateKey: config.user1.privateKey,
  to: config.user2.address,
  ERC20: config.ERC20
}