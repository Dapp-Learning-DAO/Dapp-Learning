const { ethers } = require("ethers");
const axios = require("axios");

// 跨链NFT合约ABI（简化版）
const crossChainNFTAbi = [
  // 查询方法
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function originalNFTs(uint256 tokenId) view returns (uint16 chainId, uint256 tokenId, address originalOwner)",
  "function crossChainMapping(uint16 srcChainId, uint256 srcTokenId) view returns (uint256)",
  "function estimateFee(uint16 dstChainId, uint256 tokenId, bytes adapterParams) view returns (uint256)",
  
  // 交易方法
  "function mint(string tokenURI) returns (uint256)",
  "function sendNFT(uint16 dstChainId, uint256 tokenId, bytes adapterParams) payable",
  
  // 事件
  "event NFTSent(uint16 indexed dstChainId, uint256 indexed tokenId)",
  "event NFTReceived(uint16 indexed srcChainId, uint256 srcTokenId, uint256 newTokenId, address owner)"
];

// 支持的链配置
const chainConfigs = {
  // 以太坊
  1: {
    name: "Ethereum",
    rpc: "https://mainnet.infura.io/v3/YOUR_INFURA_KEY",
    contractAddress: "0x1234567890123456789012345678901234567890", // 示例地址
    layerZeroId: 101,
    explorer: "https://etherscan.io"
  },
  // Polygon
  137: {
    name: "Polygon",
    rpc: "https://polygon-rpc.com",
    contractAddress: "0x2345678901234567890123456789012345678901", // 示例地址
    layerZeroId: 109,
    explorer: "https://polygonscan.com"
  },
  // Avalanche
  43114: {
    name: "Avalanche",
    rpc: "https://api.avax.network/ext/bc/C/rpc",
    contractAddress: "0x3456789012345678901234567890123456789012", // 示例地址
    layerZeroId: 106,
    explorer: "https://snowtrace.io"
  },
  // Optimism
  10: {
    name: "Optimism",
    rpc: "https://mainnet.optimism.io",
    contractAddress: "0x4567890123456789012345678901234567890123", // 示例地址
    layerZeroId: 111,
    explorer: "https://optimistic.etherscan.io"
  }
};

/**
 * 跨链NFT管理类
 */
class CrossChainNFTManager {
  constructor() {
    this.providers = {};
    this.contracts = {};
    this.currentChainId = null;
    this.signer = null;
    
    // 初始化提供者和合约
    this.initProviders();
  }

  /**
   * 初始化所有支持链的提供者和合约
   */
  initProviders() {
    for (const chainId in chainConfigs) {
      const config = chainConfigs[chainId];
      
      // 创建提供者
      this.providers[chainId] = new ethers.providers.JsonRpcProvider(config.rpc);
      
      // 创建合约实例
      this.contracts[chainId] = new ethers.Contract(
        config.contractAddress,
        crossChainNFTAbi,
        this.providers[chainId]
      );
    }
  }

  /**
   * 连接用户钱包
   * @param {number} chainId 要连接的链ID
   * @returns {Promise<string>} 连接的钱包地址
   */
  async connectWallet(chainId) {
    if (!chainConfigs[chainId]) {
      throw new Error(`不支持的链ID: ${chainId}`);
    }
    
    // 检查是否在浏览器环境且存在以太坊提供者
    if (window.ethereum) {
      try {
        // 请求切换到指定链
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${chainId.toString(16)}` }]
        });
        
        // 请求用户连接钱包
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        
        // 创建Web3Provider和签名者
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        this.signer = provider.getSigner();
        
        // 更新当前链ID
        this.currentChainId = chainId;
        
        // 使用签名者连接合约
        this.contracts[chainId] = this.contracts[chainId].connect(this.signer);
        
        return accounts[0];
      } catch (error) {
        console.error("连接钱包失败:", error);
        throw new Error(`连接钱包失败: ${error.message}`);
      }
    } else {
      throw new Error("未检测到以太坊钱包，请安装MetaMask");
    }
  }

  /**
   * 铸造新的NFT
   * @param {string} tokenURI NFT的元数据URI
   * @returns {Promise<Object>} 铸造结果
   */
  async mintNFT(tokenURI) {
    this.checkConnection();
    
    try {
      // 发送铸造交易
      const tx = await this.contracts[this.currentChainId].mint(tokenURI);
      
      // 等待交易确认
      const receipt = await tx.wait();
      
      // 从事件中获取铸造的tokenId
      const transferEvent = receipt.events.find(event => event.event === "Transfer");
      const tokenId = transferEvent.args.tokenId.toNumber();
      
      return {
        success: true,
        tokenId,
        transactionHash: receipt.transactionHash,
        explorerLink: `${chainConfigs[this.currentChainId].explorer}/tx/${receipt.transactionHash}`
      };
    } catch (error) {
      console.error("铸造NFT失败:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取用户拥有的NFT列表
   * @param {string} address 用户地址
   * @returns {Promise<Array>} NFT列表
   */
  async getUserNFTs(address) {
    this.checkConnection();
    
    try {
      const contract = this.contracts[this.currentChainId];
      
      // 获取用户拥有的NFT数量
      const balance = await contract.balanceOf(address);
      const tokenCount = balance.toNumber();
      
      const nfts = [];
      
      // 获取每个NFT的详细信息
      for (let i = 0; i < tokenCount; i++) {
        // 这里需要实现获取用户的第i个NFT的tokenId
        // 注意：ERC721没有标准方法获取这个信息，可能需要合约提供额外方法或使用事件查询
        // 这里使用简化的方法，假设有一个映射或查询方式
        const tokenId = await this.getTokenIdOfOwnerByIndex(address, i);
        
        // 获取NFT元数据
        const tokenURI = await contract.tokenURI(tokenId);
        const metadata = await this.fetchMetadata(tokenURI);
        
        // 获取原始NFT信息
        const originalInfo = await contract.originalNFTs(tokenId);
        
        nfts.push({
          tokenId,
          tokenURI,
          metadata,
          originalChainId: originalInfo.chainId,
          originalTokenId: originalInfo.tokenId.toNumber(),
          originalOwner: originalInfo.originalOwner
        });
      }
      
      return nfts;
    } catch (error) {
      console.error("获取用户NFT失败:", error);
      throw error;
    }
  }

  /**
   * 获取用户在指定索引处的NFT ID
   * 注意：这是一个模拟方法，实际实现可能需要合约支持或使用事件查询
   * @param {string} address 用户地址
   * @param {number} index 索引
   * @returns {Promise<number>} Token ID
   */
  async getTokenIdOfOwnerByIndex(address, index) {
    // 这里应该调用合约的方法，如tokenOfOwnerByIndex
    // 由于标准ERC721不一定实现这个方法，这里使用模拟数据
    // 实际应用中应该使用合约提供的方法或通过事件查询
    
    // 模拟实现，返回一个基于地址和索引的哈希值作为tokenId
    const addressHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(address));
    const indexBytes = ethers.utils.hexZeroPad(ethers.utils.hexlify(index), 32);
    const combinedHash = ethers.utils.keccak256(ethers.utils.concat([addressHash, indexBytes]));
    
    // 将哈希转换为数字（使用最后8个字节以避免溢出）
    return parseInt(combinedHash.slice(-16), 16) % 1000000; // 模拟一个较小的tokenId
  }

  /**
   * 获取NFT元数据
   * @param {string} tokenURI NFT的元数据URI
   * @returns {Promise<Object>} 元数据对象
   */
  async fetchMetadata(tokenURI) {
    try {
      let url = tokenURI;
      
      // 处理IPFS URI
      if (tokenURI.startsWith("ipfs://")) {
        const ipfsHash = tokenURI.replace("ipfs://", "");
        url = `https://ipfs.io/ipfs/${ipfsHash}`;
      }
      
      // 获取元数据
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error("获取元数据失败:", error);
      return { error: "无法获取元数据" };
    }
  }

  /**
   * 将NFT发送到目标链
   * @param {number} destinationChainId 目标链ID
   * @param {number} tokenId 要发送的NFT ID
   * @returns {Promise<Object>} 发送结果
   */
  async sendNFTToChain(destinationChainId, tokenId) {
    this.checkConnection();
    
    if (!chainConfigs[destinationChainId]) {
      throw new Error(`不支持的目标链ID: ${destinationChainId}`);
    }
    
    try {
      // 获取LayerZero链ID
      const dstChainId = chainConfigs[destinationChainId].layerZeroId;
      
      // 设置适配器参数（这里使用默认参数）
      const adapterParams = ethers.utils.solidityPack(["uint16", "uint256"], [1, 200000]);
      
      // 估算跨链费用
      const fee = await this.contracts[this.currentChainId].estimateFee(
        dstChainId,
        tokenId,
        adapterParams
      );
      
      // 添加10%的缓冲
      const feeWithBuffer = fee.mul(110).div(100);
      
      // 发送NFT到目标链
      const tx = await this.contracts[this.currentChainId].sendNFT(
        dstChainId,
        tokenId,
        adapterParams,
        { value: feeWithBuffer }
      );
      
      // 等待交易确认
      const receipt = await tx.wait();
      
      // 从事件中获取发送信息
      const sentEvent = receipt.events.find(event => event.event === "NFTSent");
      
      return {
        success: true,
        sourceChainId: this.currentChainId,
        destinationChainId,
        tokenId,
        transactionHash: receipt.transactionHash,
        explorerLink: `${chainConfigs[this.currentChainId].explorer}/tx/${receipt.transactionHash}`
      };
    } catch (error) {
      console.error("发送NFT失败:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 估算跨链费用
   * @param {number} destinationChainId 目标链ID
   * @param {number} tokenId 要发送的NFT ID
   * @returns {Promise<string>} 估算的费用（以ETH为单位）
   */
  async estimateCrossChainFee(destinationChainId, tokenId) {
    this.checkConnection();
    
    if (!chainConfigs[destinationChainId]) {
      throw new Error(`不支持的目标链ID: ${destinationChainId}`);
    }
    
    try {
      // 获取LayerZero链ID
      const dstChainId = chainConfigs[destinationChainId].layerZeroId;
      
      // 设置适配器参数
      const adapterParams = ethers.utils.solidityPack(["uint16", "uint256"], [1, 200000]);
      
      // 估算跨链费用
      const fee = await this.contracts[this.currentChainId].estimateFee(
        dstChainId,
        tokenId,
        adapterParams
      );
      
      // 添加10%的缓冲
      const feeWithBuffer = fee.mul(110).div(100);
      
      // 转换为ETH单位
      return ethers.utils.formatEther(feeWithBuffer);
    } catch (error) {
      console.error("估算费用失败:", error);
      throw error;
    }
  }

  /**
   * 检查跨链NFT的状态
   * @param {number} sourceChainId 源链ID
   * @param {number} sourceTokenId 源链上的Token ID
   * @returns {Promise<Object>} NFT在目标链上的状态
   */
  async checkCrossChainNFTStatus(sourceChainId, sourceTokenId) {
    this.checkConnection();
    
    try {
      // 获取LayerZero源链ID
      const srcChainId = chainConfigs[sourceChainId].layerZeroId;
      
      // 查询目标链上的映射Token ID
      const targetTokenId = await this.contracts[this.currentChainId].crossChainMapping(
        srcChainId,
        sourceTokenId
      );
      
      if (targetTokenId.toNumber() === 0) {
        return {
          exists: false,
          message: "NFT尚未在当前链上接收或映射不存在"
        };
      }
      
      // 获取NFT所有者
      const owner = await this.contracts[this.currentChainId].ownerOf(targetTokenId);
      
      // 获取NFT元数据
      const tokenURI = await this.contracts[this.currentChainId].tokenURI(targetTokenId);
      const metadata = await this.fetchMetadata(tokenURI);
      
      return {
        exists: true,
        targetTokenId: targetTokenId.toNumber(),
        owner,
        tokenURI,
        metadata
      };
    } catch (error) {
      console.error("检查跨链NFT状态失败:", error);
      return {
        exists: false,
        error: error.message
      };
    }
  }

  /**
   * 检查钱包连接状态
   * @private
   */
  checkConnection() {
    if (!this.currentChainId || !this.signer) {
      throw new Error("请先连接钱包");
    }
  }

  /**
   * 获取支持的链列表
   * @returns {Array} 支持的链列表
   */
  getSupportedChains() {
    return Object.entries(chainConfigs).map(([chainId, config]) => ({
      chainId: parseInt(chainId),
      name: config.name,
      layerZeroId: config.layerZeroId
    }));
  }

  /**
   * 获取当前连接的链信息
   * @returns {Object|null} 当前链信息
   */
  getCurrentChain() {
    if (!this.currentChainId) return null;
    
    return {
      chainId: this.currentChainId,
      name: chainConfigs[this.currentChainId].name,
      layerZeroId: chainConfigs[this.currentChainId].layerZeroId
    };
  }
}

// 使用示例
async function demoCrossChainNFT() {
  try {
    // 初始化管理器
    const manager = new CrossChainNFTManager();
    
    // 显示支持的链
    const supportedChains = manager.getSupportedChains();
    console.log("支持的链:", supportedChains);
    
    // 连接以太坊钱包
    const address = await manager.connectWallet(1); // 连接以太坊主网
    console.log(`已连接钱包: ${address}`);
    
    // 铸造新NFT
    const mintResult = await manager.mintNFT("ipfs://QmXxxx...");
    console.log("铸造结果:", mintResult);
    
    if (mintResult.success) {
      // 获取用户NFT
      const nfts = await manager.getUserNFTs(address);
      console.log("用户NFT:", nfts);
      
      // 估算跨链费用
      const fee = await manager.estimateCrossChainFee(137, mintResult.tokenId); // 发送到Polygon
      console.log(`发送到Polygon的估算费用: ${fee} ETH`);
      
      // 发送NFT到Polygon
      const sendResult = await manager.sendNFTToChain(137, mintResult.tokenId);
      console.log("发送结果:", sendResult);
      
      if (sendResult.success) {
        // 切换到Polygon检查NFT状态
        await manager.connectWallet(137);
        
        // 等待一段时间让跨链消息传递
        console.log("等待跨链消息传递...");
        await new Promise(resolve => setTimeout(resolve, 60000)); // 等待60秒
        
        // 检查NFT在Polygon上的状态
        const status = await manager.checkCrossChainNFTStatus(1, mintResult.tokenId);
        console.log("Polygon上的NFT状态:", status);
      }
    }
  } catch (error) {
    console.error("演示过程中出错:", error);
  }
}

if (typeof window !== 'undefined') {
  window.CrossChainNFTManager = CrossChainNFTManager;
}

if (typeof module !== 'undefined') {
  module.exports = {
    CrossChainNFTManager
  };
}
