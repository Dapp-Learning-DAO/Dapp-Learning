import React, { useState, useEffect } from 'react';
import { useAccount, useNetwork, useBalance, useConnect, useDisconnect } from 'wagmi';
import { SUPPORTED_CHAINS } from '../utils/chainUtils';
import { isTransactionSafe, isHighRiskTransaction } from '../utils/securityUtils';

const MultiChainWallet = () => {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [selectedChain, setSelectedChain] = useState(null);

  // 获取当前链上的余额
  const { data: balance } = useBalance({
    address,
    chainId: selectedChain?.id,
    watch: true,
  });

  // 监听链切换
  useEffect(() => {
    if (chain) {
      const currentChain = Object.values(SUPPORTED_CHAINS).find(
        (c) => c.id === chain.id
      );
      setSelectedChain(currentChain);
    }
  }, [chain]);

  // 处理连接钱包
  const handleConnect = async (connector) => {
    try {
      await connect({ connector });
    } catch (error) {
      console.error('连接钱包失败:', error);
    }
  };

  // 处理断开连接
  const handleDisconnect = async () => {
    try {
      await disconnect();
      setSelectedChain(null);
    } catch (error) {
      console.error('断开连接失败:', error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">多链钱包</h1>

      {/* 连接状态 */}
      <div className="mb-4">
        {isConnected ? (
          <div>
            <p>已连接地址: {address}</p>
            <p>当前网络: {selectedChain?.name || '未知网络'}</p>
            <p>余额: {balance?.formatted || '0'} {balance?.symbol}</p>
            <button
              onClick={handleDisconnect}
              className="bg-red-500 text-white px-4 py-2 rounded mt-2"
            >
              断开连接
            </button>
          </div>
        ) : (
          <div>
            <p>请连接钱包</p>
            <div className="flex gap-2 mt-2">
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  onClick={() => handleConnect(connector)}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  {connector.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 支持的链列表 */}
      {isConnected && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">支持的网络</h2>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(SUPPORTED_CHAINS).map((supportedChain) => (
              <div
                key={supportedChain.id}
                className={`p-3 rounded border ${
                  selectedChain?.id === supportedChain.id
                    ? 'bg-green-100 border-green-500'
                    : 'bg-gray-100 border-gray-300'
                }`}
              >
                <p className="font-medium">{supportedChain.name}</p>
                <p className="text-sm text-gray-600">
                  Chain ID: {supportedChain.id}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 安全提示 */}
      {isConnected && (
        <div className="mt-4 p-3 bg-yellow-100 rounded">
          <h3 className="font-semibold">安全提示</h3>
          <ul className="list-disc list-inside text-sm">
            <li>请确保在进行跨链操作时仔细检查网络和地址</li>
            <li>大额转账请使用小额测试</li>
            <li>谨防钓鱼网站和恶意合约</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default MultiChainWallet;