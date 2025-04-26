const { ethers } = require("ethers");
const axios = require("axios");

// 身份NFT合约ABI（简化版）
const identityNFTAbi = [
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function verifyCredential(uint256 tokenId) view returns (bool)",
  "function credentials(uint256 tokenId) view returns (address subject, uint256 issuanceDate, uint256 expirationDate, uint8 status)"
];

// 身份验证类
class NFTIdentityVerifier {
  constructor(contractAddress, provider) {
    this.provider = provider;
    this.contract = new ethers.Contract(contractAddress, identityNFTAbi, provider);
  }

  /**
   * 连接用户钱包
   */
  async connectWallet() {
    // 检查是否在浏览器环境且存在以太坊提供者
    if (window.ethereum) {
      try {
        // 请求用户连接钱包
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        
        // 创建Web3Provider
        this.provider = new ethers.providers.Web3Provider(window.ethereum);
        this.signer = this.provider.getSigner();
        
        // 使用签名者连接合约
        this.contract = this.contract.connect(this.signer);
        
        return accounts[0];
      } catch (error) {
        console.error("连接钱包失败:", error);
        throw new Error("连接钱包失败");
      }
    } else {
      throw new Error("未检测到以太坊钱包，请安装MetaMask");
    }
  }

  /**
   * 检查用户是否拥有身份NFT
   * @param {string} address 用户地址
   * @returns {Promise<boolean>} 是否拥有身份NFT
   */
  async hasIdentityNFT(address) {
    try {
      const balance = await this.contract.balanceOf(address);
      return balance.gt(0);
    } catch (error) {
      console.error("检查身份NFT失败:", error);
      return false;
    }
  }

  /**
   * 获取用户的身份NFT ID
   * @param {string} address 用户地址
   * @returns {Promise<number|null>} 身份NFT的ID，如果没有则返回null
   */
  async getIdentityTokenId(address) {
    try {
      const balance = await this.contract.balanceOf(address);
      if (balance.gt(0)) {
        const tokenId = await this.contract.tokenOfOwnerByIndex(address, 0);
        return tokenId.toNumber();
      }
      return null;
    } catch (error) {
      console.error("获取身份Token ID失败:", error);
      return null;
    }
  }

  /**
   * 验证身份NFT的有效性
   * @param {number} tokenId 身份NFT的ID
   * @returns {Promise<boolean>} 身份是否有效
   */
  async verifyIdentity(tokenId) {
    try {
      // 调用合约的验证方法
      const isValid = await this.contract.verifyCredential(tokenId);
      return isValid;
    } catch (error) {
      console.error("验证身份失败:", error);
      return false;
    }
  }

  /**
   * 获取身份凭证详情
   * @param {number} tokenId 身份NFT的ID
   * @returns {Promise<Object>} 凭证详情
   */
  async getCredentialDetails(tokenId) {
    try {
      // 获取链上凭证基本信息
      const credential = await this.contract.credentials(tokenId);
      
      // 获取凭证元数据
      const tokenURI = await this.contract.tokenURI(tokenId);
      let metadata;
      
      // 处理IPFS URI
      if (tokenURI.startsWith("ipfs://")) {
        const ipfsHash = tokenURI.replace("ipfs://", "");
        const response = await axios.get(`https://ipfs.io/ipfs/${ipfsHash}`);
        metadata = response.data;
      } else {
        // 处理HTTP URI
        const response = await axios.get(tokenURI);
        metadata = response.data;
      }
      
      // 组合链上数据和元数据
      return {
        tokenId,
        subject: credential.subject,
        issuanceDate: new Date(credential.issuanceDate.toNumber() * 1000).toISOString(),
        expirationDate: new Date(credential.expirationDate.toNumber() * 1000).toISOString(),
        status: ["Valid", "Revoked", "Expired"][credential.status],
        metadata
      };
    } catch (error) {
      console.error("获取凭证详情失败:", error);
      throw error;
    }
  }

  /**
   * 选择性披露身份信息
   * @param {number} tokenId 身份NFT的ID
   * @param {Array<string>} fields 需要披露的字段
   * @returns {Promise<Object>} 选择性披露的身份信息
   */
  async discloseSelectedInfo(tokenId, fields) {
    try {
      const details = await this.getCredentialDetails(tokenId);
      
      // 如果凭证无效，拒绝披露任何信息
      if (details.status !== "Valid") {
        throw new Error("凭证无效，无法披露信息");
      }
      
      // 从可验证凭证中提取请求的字段
      const credential = details.metadata.verifiableCredential;
      const subject = credential.credentialSubject;
      
      const disclosedInfo = {};
      
      // 只返回请求的字段
      fields.forEach(field => {
        if (subject[field] !== undefined) {
          disclosedInfo[field] = subject[field];
        }
      });
      
      // 添加验证信息，但不包含完整凭证
      disclosedInfo.verified = true;
      disclosedInfo.issuer = credential.issuer;
      disclosedInfo.issuanceDate = credential.issuanceDate;
      
      return disclosedInfo;
    } catch (error) {
      console.error("披露信息失败:", error);
      throw error;
    }
  }

  /**
   * 生成用于第三方验证的证明
   * @param {number} tokenId 身份NFT的ID
   * @param {Array<string>} fields 需要证明的字段
   * @returns {Promise<Object>} 包含签名的证明对象
   */
  async generateProof(tokenId, fields) {
    try {
      // 确保用户已连接钱包
      if (!this.signer) {
        throw new Error("请先连接钱包");
      }
      
      // 获取选择性披露的信息
      const disclosedInfo = await this.discloseSelectedInfo(tokenId, fields);
      
      // 创建证明消息
      const message = JSON.stringify({
        tokenId: tokenId.toString(),
        fields,
        timestamp: Date.now(),
        disclosedInfo
      });
      
      // 用户签名证明消息
      const signature = await this.signer.signMessage(message);
      
      // 返回完整证明
      return {
        message,
        signature,
        address: await this.signer.getAddress()
      };
    } catch (error) {
      console.error("生成证明失败:", error);
      throw error;
    }
  }
}

/**
 * 第三方验证器 - 验证用户提供的身份证明
 */
class IdentityProofVerifier {
  /**
   * 验证用户提供的身份证明
   * @param {Object} proof 用户提供的证明对象
   * @returns {boolean} 证明是否有效
   */
  static verifyProof(proof) {
    try {
      // 解析消息
      const messageObj = JSON.parse(proof.message);
      
      // 验证签名
      const recoveredAddress = ethers.utils.verifyMessage(proof.message, proof.signature);
      
      // 检查签名地址是否匹配
      if (recoveredAddress.toLowerCase() !== proof.address.toLowerCase()) {
        return false;
      }
      
      // 检查时间戳是否在合理范围内（例如15分钟内）
      const timestamp = messageObj.timestamp;
      const now = Date.now();
      if (now - timestamp > 15 * 60 * 1000) {
        return false; // 证明已过期
      }
      
      // 验证通过
      return true;
    } catch (error) {
      console.error("验证证明失败:", error);
      return false;
    }
  }
}

// 使用示例
async function demoIdentityVerification() {
  try {
    // 初始化验证器（使用Infura提供者示例）
    const provider = new ethers.providers.JsonRpcProvider("https://mainnet.infura.io/v3/YOUR_INFURA_KEY");
    const verifier = new NFTIdentityVerifier("0x1234567890123456789012345678901234567890", provider);
    
    // 连接钱包
    const userAddress = await verifier.connectWallet();
    console.log(`已连接钱包: ${userAddress}`);
    
    // 检查用户是否拥有身份NFT
    const hasIdentity = await verifier.hasIdentityNFT(userAddress);
    
    if (hasIdentity) {
      // 获取用户的身份NFT ID
      const tokenId = await verifier.getIdentityTokenId(userAddress);
      console.log(`找到身份NFT，Token ID: ${tokenId}`);
      
      // 验证身份有效性
      const isValid = await verifier.verifyIdentity(tokenId);
      console.log(`身份验证结果: ${isValid ? '有效' : '无效'}`);
      
      if (isValid) {
        // 获取完整凭证详情
        const details = await verifier.getCredentialDetails(tokenId);
        console.log("凭证详情:", details);
        
        // 选择性披露信息（仅披露验证级别）
        const disclosedInfo = await verifier.discloseSelectedInfo(tokenId, ["verificationLevel"]);
        console.log("选择性披露信息:", disclosedInfo);
        
        // 生成用于第三方验证的证明
        const proof = await verifier.generateProof(tokenId, ["verificationLevel"]);
        console.log("生成的证明:", proof);
        
        // 第三方验证证明
        const isProofValid = IdentityProofVerifier.verifyProof(proof);
        console.log(`证明验证结果: ${isProofValid ? '有效' : '无效'}`);
      }
    } else {
      console.log("用户没有身份NFT");
    }
  } catch (error) {
    console.error("演示过程中出错:", error);
  }
}

if (typeof window !== 'undefined') {
  window.NFTIdentityVerifier = NFTIdentityVerifier;
  window.IdentityProofVerifier = IdentityProofVerifier;
}

if (typeof module !== 'undefined') {
  module.exports = {
    NFTIdentityVerifier,
    IdentityProofVerifier
  };
}
