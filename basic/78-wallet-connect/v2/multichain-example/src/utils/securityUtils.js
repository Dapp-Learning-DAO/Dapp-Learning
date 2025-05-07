/**
 * 安全工具函数集合
 * 提供交易安全检查和数据加密等功能
 */

import { ethers } from 'ethers';

/**
 * 交易金额安全检查
 * @param {string} amount 交易金额
 * @param {string} balance 账户余额
 * @returns {boolean}
 */
export const isTransactionSafe = (amount, balance) => {
  try {
    const amountBN = ethers.BigNumber.from(amount);
    const balanceBN = ethers.BigNumber.from(balance);
    // 检查交易金额是否超过余额
    if (amountBN.gt(balanceBN)) return false;
    // 检查是否为零或负数
    if (amountBN.lte(0)) return false;
    return true;
  } catch {
    return false;
  }
};

/**
 * 检查交易gas限制
 * @param {string} gasLimit 交易gas限制
 * @returns {boolean}
 */
export const isGasLimitSafe = (gasLimit) => {
  try {
    const limit = ethers.BigNumber.from(gasLimit);
    // 设置合理的gas限制范围
    const MIN_GAS = ethers.BigNumber.from('21000'); // 基础转账gas
    const MAX_GAS = ethers.BigNumber.from('500000'); // 最大允许gas
    return limit.gte(MIN_GAS) && limit.lte(MAX_GAS);
  } catch {
    return false;
  }
};

/**
 * 检查交易nonce值
 * @param {number} nonce 交易nonce
 * @param {number} currentNonce 当前账户nonce
 * @returns {boolean}
 */
export const isNonceSafe = (nonce, currentNonce) => {
  return nonce >= currentNonce;
};

/**
 * 检查合约调用数据
 * @param {string} data 合约调用数据
 * @returns {boolean}
 */
export const isContractDataSafe = (data) => {
  try {
    // 检查数据是否为有效的十六进制
    if (!ethers.utils.isHexString(data)) return false;
    // 检查数据长度是否合理
    const length = ethers.utils.hexDataLength(data);
    return length > 0 && length <= 24576; // 最大24KB
  } catch {
    return false;
  }
};

/**
 * 检查交易接收地址是否为已知的危险地址
 * @param {string} address 交易接收地址
 * @returns {boolean}
 */
export const isAddressSafe = (address) => {
  // 这里可以维护一个已知的危险地址列表
  const DANGEROUS_ADDRESSES = [
    // 示例危险地址
    '0x0000000000000000000000000000000000000000'
  ];
  return !DANGEROUS_ADDRESSES.includes(address.toLowerCase());
};

/**
 * 生成交易消息哈希
 * @param {object} tx 交易对象
 * @returns {string}
 */
export const generateTransactionHash = (tx) => {
  try {
    const encoded = ethers.utils.defaultAbiCoder.encode(
      ['address', 'uint256', 'bytes'],
      [tx.to, tx.value || '0', tx.data || '0x']
    );
    return ethers.utils.keccak256(encoded);
  } catch (error) {
    console.error('生成交易哈希失败:', error);
    throw error;
  }
};

/**
 * 验证交易签名
 * @param {string} message 消息
 * @param {string} signature 签名
 * @param {string} address 签名者地址
 * @returns {boolean}
 */
export const verifySignature = (message, signature, address) => {
  try {
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch {
    return false;
  }
};

/**
 * 检查交易是否为高风险操作
 * @param {object} tx 交易对象
 * @returns {boolean}
 */
export const isHighRiskTransaction = (tx) => {
  // 定义高风险阈值（以ETH为单位）
  const HIGH_VALUE_THRESHOLD = ethers.utils.parseEther('10');
  
  try {
    const value = ethers.BigNumber.from(tx.value || '0');
    // 检查是否为大额交易
    if (value.gte(HIGH_VALUE_THRESHOLD)) return true;
    // 检查是否调用敏感合约方法
    if (tx.data && tx.data.length > 2) {
      const methodId = tx.data.slice(0, 10);
      const SENSITIVE_METHODS = [
        '0x23b872dd', // transferFrom
        '0x095ea7b3', // approve
        '0x42842e0e'  // safeTransferFrom
      ];
      if (SENSITIVE_METHODS.includes(methodId)) return true;
    }
    return false;
  } catch {
    return true; // 如有异常，视为高风险
  }
};