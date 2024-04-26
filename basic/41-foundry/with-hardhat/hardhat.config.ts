import '@nomicfoundation/hardhat-toolbox';
import '@nomicfoundation/hardhat-foundry';
import { HardhatUserConfig, vars } from 'hardhat/config';
import { NetworkUserConfig } from 'hardhat/types';
// import { ethers } from 'ethers';
import './tasks/accounts';

const chainIds = {
  ropsten: 3,
  rinkeby: 4,
  goerli: 5,
  kovan: 42,
  ganache: 1337,
  hardhat: 31337,
};

const mnemonic = vars.get('MNEMONIC', '');
const infuraApiKey = vars.get('INFURA_API_KEY', '');

function getChainConfig(network: keyof typeof chainIds): NetworkUserConfig {
  const url: string = 'https://' + network + '.infura.io/v3/' + infuraApiKey;
  return {
    url,
    chainId: chainIds[network],
    accounts: {
      mnemonic,
      path: "m/44'/60'/0'/0",
      initialIndex: 0,
      count: 20,
      passphrase: '',
    },
  };
}

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const config: HardhatUserConfig = {
  solidity: '0.8.24',
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      // chainId: chainIds.hardhat,
      // accounts: {
      //   mnemonic,
      //   accountsBalance: ethers.parseEther('10000').toString(),
      // },
      // gasPrice 默认 8000000000, 改为 1000000000 便于计算
      gasPrice: 1000000000,
    },
    ropsten: getChainConfig('ropsten'),
    rinkeby: getChainConfig('rinkeby'),
    goerli: getChainConfig('goerli'),
    kovan: getChainConfig('kovan'),
  },
};

export default config;
