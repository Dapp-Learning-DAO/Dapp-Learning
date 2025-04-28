import { ethers } from 'ethers';

/**
 * 链配置信息
 */
export const SUPPORTED_CHAINS = {
  ethereum: {
    id: 1,
    name: 'Ethereum',
    rpcUrl: `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
    currency: 'ETH'
  },
  polygon: {
    id: 137,
    name: 'Polygon',
    rpcUrl: `https://polygon-mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
    currency: 'MATIC'
  },
  arbitrum: {
    id: 42161,
    name: 'Arbitrum',
    rpcUrl: `https://arbitrum-mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
    currency: 'ETH'
  },
  optimism: {
    id: 10,
    name: 'Optimism',
    rpcUrl: `https://optimism-mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
    currency: 'ETH'
  },
  bsc: {
    id: 56,
    name: 'BSC',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    currency: 'BNB'
  }
};

/**
 * 获取链的Provider实例
 * @param {string} chainId 链ID
 * @returns {ethers.providers.JsonRpcProvider}
 */
export const getChainProvider = (chainId) => {
  const chain = Object.values(SUPPORTED_CHAINS).find(c => c.id === chainId);
  if (!chain) throw new Error('不支持的链');
  return new ethers.providers.JsonRpcProvider(chain.rpcUrl);
};

/**
 * 检查地址格式是否有效
 * @param {string} address 待检查的地址
 * @returns {boolean}
 */
export const isValidAddress = (address) => {
  try {
    return ethers.utils.isAddress(address);
  } catch {
    return false;
  }
};

/**
 * 格式化余额显示
 * @param {string|number} balance Wei单位的余额
 * @param {number} decimals 代币精度
 * @returns {string}
 */
export const formatBalance = (balance, decimals = 18) => {
  try {
    return ethers.utils.formatUnits(balance, decimals);
  } catch {
    return '0';
  }
};

/**
 * 检查交易参数
 * @param {object} tx 交易对象
 * @returns {boolean}
 */
export const validateTransaction = (tx) => {
  if (!tx || typeof tx !== 'object') return false;
  if (!isValidAddress(tx.to)) return false;
  if (tx.value && !ethers.utils.isHexString(tx.value)) return false;
  return true;
};

/**
 * 获取链上代币余额
 * @param {string} tokenAddress 代币合约地址
 * @param {string} walletAddress 钱包地址
 * @param {ethers.providers.Provider} provider Provider实例
 * @returns {Promise<string>}
 */
export const getTokenBalance = async (tokenAddress, walletAddress, provider) => {
  try {
    const abi = ['function balanceOf(address) view returns (uint256)'];
    const contract = new ethers.Contract(tokenAddress, abi, provider);
    const balance = await contract.balanceOf(walletAddress);
    return balance.toString();
  } catch (error) {
    console.error('获取代币余额失败:', error);
    return '0';
  }
};

/**
 * 估算交易gas费用
 * @param {object} tx 交易对象
 * @param {ethers.providers.Provider} provider Provider实例
 * @returns {Promise<string>}
 */
export const estimateGas = async (tx, provider) => {
  try {
    const gasEstimate = await provider.estimateGas(tx);
    return gasEstimate.toString();
  } catch (error) {
    console.error('估算gas失败:', error);
    throw error;
  }
};