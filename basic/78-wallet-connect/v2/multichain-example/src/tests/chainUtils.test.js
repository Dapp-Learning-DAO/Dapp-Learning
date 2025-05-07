import { ethers } from 'ethers';
import {
  isValidAddress,
  formatBalance,
  validateTransaction,
  SUPPORTED_CHAINS
} from '../utils/chainUtils';

describe('Chain Utilities Tests', () => {
  describe('isValidAddress', () => {
    test('应该验证有效的以太坊地址', () => {
      const validAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
      expect(isValidAddress(validAddress)).toBe(true);
    });

    test('应该拒绝无效的地址', () => {
      const invalidAddress = '0xinvalid';
      expect(isValidAddress(invalidAddress)).toBe(false);
    });

    test('应该拒绝非字符串输入', () => {
      expect(isValidAddress(123)).toBe(false);
      expect(isValidAddress(null)).toBe(false);
      expect(isValidAddress(undefined)).toBe(false);
    });
  });

  describe('formatBalance', () => {
    test('应该正确格式化Wei到Ether', () => {
      const weiAmount = ethers.utils.parseEther('1.0');
      expect(formatBalance(weiAmount)).toBe('1.0');
    });

    test('应该处理零值', () => {
      expect(formatBalance('0')).toBe('0');
    });

    test('应该处理自定义精度', () => {
      const amount = '1000000'; // 1.0 with 6 decimals
      expect(formatBalance(amount, 6)).toBe('1.0');
    });
  });

  describe('validateTransaction', () => {
    test('应该验证有效的交易对象', () => {
      const validTx = {
        to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        value: '0x0',
        data: '0x'
      };
      expect(validateTransaction(validTx)).toBe(true);
    });

    test('应该拒绝无效的接收地址', () => {
      const invalidTx = {
        to: '0xinvalid',
        value: '0x0'
      };
      expect(validateTransaction(invalidTx)).toBe(false);
    });

    test('应该拒绝无效的交易值', () => {
      const invalidTx = {
        to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        value: 'invalid'
      };
      expect(validateTransaction(invalidTx)).toBe(false);
    });
  });

  describe('SUPPORTED_CHAINS', () => {
    test('应该包含所有支持的链配置', () => {
      expect(SUPPORTED_CHAINS).toHaveProperty('ethereum');
      expect(SUPPORTED_CHAINS).toHaveProperty('polygon');
      expect(SUPPORTED_CHAINS).toHaveProperty('arbitrum');
      expect(SUPPORTED_CHAINS).toHaveProperty('optimism');
      expect(SUPPORTED_CHAINS).toHaveProperty('bsc');
    });

    test('每个链配置应该包含必要的字段', () => {
      Object.values(SUPPORTED_CHAINS).forEach(chain => {
        expect(chain).toHaveProperty('id');
        expect(chain).toHaveProperty('name');
        expect(chain).toHaveProperty('rpcUrl');
        expect(chain).toHaveProperty('currency');
      });
    });

    test('链ID应该是唯一的', () => {
      const chainIds = Object.values(SUPPORTED_CHAINS).map(chain => chain.id);
      const uniqueChainIds = new Set(chainIds);
      expect(chainIds.length).toBe(uniqueChainIds.size);
    });
  });
});