const { ethers } = require("ethers");

// NFT碎片化相关功能
class NFTFractionalizer {
  constructor(provider, fractionalizerAddress) {
    this.provider = provider;
    this.fractionalizerAddress = fractionalizerAddress;
    
    // 碎片化合约ABI（简化版）
    this.abi = [
      "function fractionalize(address _nftContract, uint256 _tokenId, uint256 _fractionSupply) external",
      "function createSale(uint256 _reservePrice) external",
      "function cancelSale() external",
      "function purchase() external payable",
      "function redeem() external",
      "function balanceOf(address owner) external view returns (uint256)",
      "function totalSupply() external view returns (uint256)",
      "event NFTFractionalized(address indexed nftContract, uint256 indexed tokenId, uint256 fractionSupply)",
      "event NFTRedeemed(address indexed redeemer)"
    ];
    
    this.contract = new ethers.Contract(fractionalizerAddress, this.abi, provider);
  }
  
  // 连接钱包
  connect(signer) {
    this.contract = this.contract.connect(signer);
    return this;
  }
  
  // 碎片化NFT
  async fractionalizeNFT(nftContractAddress, tokenId, fractionSupply) {
    try {
      const tx = await this.contract.fractionalize(nftContractAddress, tokenId, fractionSupply);
      const receipt = await tx.wait();
      console.log(`NFT碎片化成功: ${receipt.transactionHash}`);
      return receipt;
    } catch (error) {
      console.error("NFT碎片化失败:", error);
      throw error;
    }
  }
  
  // 创建整体出售
  async createSale(reservePrice) {
    try {
      const tx = await this.contract.createSale(reservePrice);
      const receipt = await tx.wait();
      console.log(`创建出售成功: ${receipt.transactionHash}`);
      return receipt;
    } catch (error) {
      console.error("创建出售失败:", error);
      throw error;
    }
  }
  
  // 购买整个NFT
  async purchaseNFT(value) {
    try {
      const tx = await this.contract.purchase({ value });
      const receipt = await tx.wait();
      console.log(`购买NFT成功: ${receipt.transactionHash}`);
      return receipt;
    } catch (error) {
      console.error("购买NFT失败:", error);
      throw error;
    }
  }
  
  // 获取碎片余额
  async getBalance(address) {
    return await this.contract.balanceOf(address);
  }
  
  // 获取总供应量
  async getTotalSupply() {
    return await this.contract.totalSupply();
  }
}

// NFT租赁相关功能
class NFTRental {
  constructor(provider, rentalAddress) {
    this.provider = provider;
    this.rentalAddress = rentalAddress;
    
    // 租赁合约ABI（简化版）
    this.abi = [
      "function listForRental(address nftContract, uint256 tokenId, uint256 rentalFee, uint256 rentalDuration) external",
      "function rentNFT(address nftContract, uint256 tokenId, uint256 duration) external payable",
      "function endRental(address nftContract, uint256 tokenId) external",
      "function cancelRental(address nftContract, uint256 tokenId) external",
      "function checkRentalStatus(address nftContract, uint256 tokenId) external view returns (address owner, address currentUser, uint256 endTime, bool isActive)",
      "event NFTListed(address indexed nftContract, uint256 indexed tokenId, uint256 rentalFee, uint256 endTime)",
      "event NFTRented(address indexed nftContract, uint256 indexed tokenId, address indexed renter, uint256 startTime, uint256 endTime)"
    ];
    
    this.contract = new ethers.Contract(rentalAddress, this.abi, provider);
  }
  
  // 连接钱包
  connect(signer) {
    this.contract = this.contract.connect(signer);
    return this;
  }
  
  // 列出NFT进行租赁
  async listNFTForRental(nftContractAddress, tokenId, rentalFeePerDay, durationInDays) {
    const rentalFee = ethers.utils.parseEther(rentalFeePerDay.toString());
    const rentalDuration = durationInDays * 86400; // 转换为秒
    
    try {
      const tx = await this.contract.listForRental(nftContractAddress, tokenId, rentalFee, rentalDuration);
      const receipt = await tx.wait();
      console.log(`NFT租赁列表创建成功: ${receipt.transactionHash}`);
      return receipt;
    } catch (error) {
      console.error("NFT租赁列表创建失败:", error);
      throw error;
    }
  }
  
  // 租用NFT
  async rentNFT(nftContractAddress, tokenId, durationInDays, rentalFeePerDay) {
    const duration = durationInDays * 86400; // 转换为秒
    const totalFee = ethers.utils.parseEther((rentalFeePerDay * durationInDays).toString());
    
    try {
      const tx = await this.contract.rentNFT(nftContractAddress, tokenId, duration, { value: totalFee });
      const receipt = await tx.wait();
      console.log(`NFT租用成功: ${receipt.transactionHash}`);
      return receipt;
    } catch (error) {
      console.error("NFT租用失败:", error);
      throw error;
    }
  }
  
  // 结束租赁
  async endRental(nftContractAddress, tokenId) {
    try {
      const tx = await this.contract.endRental(nftContractAddress, tokenId);
      const receipt = await tx.wait();
      console.log(`租赁结束成功: ${receipt.transactionHash}`);
      return receipt;
    } catch (error) {
      console.error("租赁结束失败:", error);
      throw error;
    }
  }
  
  // 检查租赁状态
  async checkRentalStatus(nftContractAddress, tokenId) {
    try {
      const status = await this.contract.checkRentalStatus(nftContractAddress, tokenId);
      return {
        owner: status.owner,
        currentUser: status.currentUser,
        endTime: new Date(status.endTime.toNumber() * 1000),
        isActive: status.isActive
      };
    } catch (error) {
      console.error("检查租赁状态失败:", error);
      throw error;
    }
  }
}

// NFT抵押借贷相关功能
class NFTLending {
  constructor(provider, lendingAddress) {
    this.provider = provider;
    this.lendingAddress = lendingAddress;
    
    // 借贷合约ABI（简化版）
    this.abi = [
      "function createLoan(address nftContract, uint256 tokenId, uint256 loanAmount, uint256 duration, uint256 interestRate) external",
      "function fundLoan(uint256 loanId) external payable",
      "function repayLoan(uint256 loanId) external payable",
      "function liquidateLoan(uint256 loanId) external",
      "function getLoanDetails(uint256 loanId) external view returns (address borrower, address lender, address nftContract, uint256 tokenId, uint256 loanAmount, uint256 interestRate, uint256 startTime, uint256 endTime, uint8 status)",
      "event LoanCreated(uint256 indexed loanId, address indexed borrower, address indexed nftContract, uint256 tokenId, uint256 loanAmount)",
      "event LoanFunded(uint256 indexed loanId, address indexed lender)",
      "event LoanRepaid(uint256 indexed loanId)",
      "event LoanLiquidated(uint256 indexed loanId)"
    ];
    
    this.contract = new ethers.Contract(lendingAddress, this.abi, provider);
  }
  
  // 连接钱包
  connect(signer) {
    this.contract = this.contract.connect(signer);
    return this;
  }
  
  // 创建贷款请求
  async createLoan(nftContractAddress, tokenId, loanAmount, durationInDays, interestRatePerYear) {
    const loanAmountWei = ethers.utils.parseEther(loanAmount.toString());
    const duration = durationInDays * 86400; // 转换为秒
    const interestRate = interestRatePerYear * 100; // 转换为基点 (1% = 100)
    
    try {
      const tx = await this.contract.createLoan(nftContractAddress, tokenId, loanAmountWei, duration, interestRate);
      const receipt = await tx.wait();
      console.log(`贷款请求创建成功: ${receipt.transactionHash}`);
      return receipt;
    } catch (error) {
      console.error("贷款请求创建失败:", error);
      throw error;
    }
  }
  
  // 资助贷款
  async fundLoan(loanId, loanAmount) {
    const loanAmountWei = ethers.utils.parseEther(loanAmount.toString());
    
    try {
      const tx = await this.contract.fundLoan(loanId, { value: loanAmountWei });
      const receipt = await tx.wait();
      console.log(`贷款资助成功: ${receipt.transactionHash}`);
      return receipt;
    } catch (error) {
      console.error("贷款资助失败:", error);
      throw error;
    }
  }
  
  // 偿还贷款
  async repayLoan(loanId, repaymentAmount) {
    const repaymentAmountWei = ethers.utils.parseEther(repaymentAmount.toString());
    
    try {
      const tx = await this.contract.repayLoan(loanId, { value: repaymentAmountWei });
      const receipt = await tx.wait();
      console.log(`贷款偿还成功: ${receipt.transactionHash}`);
      return receipt;
    } catch (error) {
      console.error("贷款偿还失败:", error);
      throw error;
    }
  }
  
  // 获取贷款详情
  async getLoanDetails(loanId) {
    try {
      const details = await this.contract.getLoanDetails(loanId);
      return {
        borrower: details.borrower,
        lender: details.lender,
        nftContract: details.nftContract,
        tokenId: details.tokenId.toString(),
        loanAmount: ethers.utils.formatEther(details.loanAmount),
        interestRate: details.interestRate.toNumber() / 100, // 转换为百分比
        startTime: new Date(details.startTime.toNumber() * 1000),
        endTime: new Date(details.endTime.toNumber() * 1000),
        status: ["Pending", "Active", "Repaid", "Defaulted", "Liquidated"][details.status]
      };
    } catch (error) {
      console.error("获取贷款详情失败:", error);
      throw error;
    }
  }
}

// NFT流动性池相关功能
class NFTLiquidityPool {
  constructor(provider, poolAddress) {
    this.provider = provider;
    this.poolAddress = poolAddress;
    
    // 流动性池合约ABI（简化版）
    this.abi = [
      "function getBuyPrice() public view returns (uint256)",
      "function getSellPrice() public view returns (uint256)",
      "function buyNFT() external payable returns (uint256)",
      "function sellNFT(uint256 tokenId) external",
      "function getPoolSize() external view returns (uint256)",
      "event NFTAdded(uint256 indexed tokenId, uint256 price)",
      "event NFTRemoved(uint256 indexed tokenId, uint256 price)"
    ];
    
    this.contract = new ethers.Contract(poolAddress, this.abi, provider);
  }
  
  // 连接钱包
  connect(signer) {
    this.contract = this.contract.connect(signer);
    return this;
  }
  
  // 获取购买价格
  async getBuyPrice() {
    try {
      const priceWei = await this.contract.getBuyPrice();
      return ethers.utils.formatEther(priceWei);
    } catch (error) {
      console.error("获取购买价格失败:", error);
      throw error;
    }
  }
  
  // 获取出售价格
  async getSellPrice() {
    try {
      const priceWei = await this.contract.getSellPrice();
      return ethers.utils.formatEther(priceWei);
    } catch (error) {
      console.error("获取出售价格失败:", error);
      throw error;
    }
  }
  
  // 从池中购买NFT
  async buyNFT() {
    try {
      const buyPrice = await this.contract.getBuyPrice();
      const tx = await this.contract.buyNFT({ value: buyPrice });
      const receipt = await tx.wait();
      
      // 从事件中获取购买的tokenId
      const event = receipt.events.find(e => e.event === 'NFTRemoved');
      const tokenId = event.args.tokenId.toString();
      
      console.log(`从流动性池购买NFT成功: TokenID ${tokenId}, 交易哈希 ${receipt.transactionHash}`);
      return { tokenId, receipt };
    } catch (error) {
      console.error("从流动性池购买NFT失败:", error);
      throw error;
    }
  }
  
  // 向池中出售NFT
  async sellNFT(tokenId) {
    try {
      const tx = await this.contract.sellNFT(tokenId);
      const receipt = await tx.wait();
      console.log(`向流动性池出售NFT成功: TokenID ${tokenId}, 交易哈希 ${receipt.transactionHash}`);
      return receipt;
    } catch (error) {
      console.error("向流动性池出售NFT失败:", error);
      throw error;
    }
  }
  
  // 获取池中NFT数量
  async getPoolSize() {
    try {
      const size = await this.contract.getPoolSize();
      return size.toNumber();
    } catch (error) {
      console.error("获取池大小失败:", error);
      throw error;
    }
  }
}

// 使用示例
async function example() {
  // 连接到以太坊网络
  const provider = new ethers.providers.JsonRpcProvider("https://mainnet.infura.io/v3/YOUR_INFURA_KEY");
  const wallet = new ethers.Wallet("YOUR_PRIVATE_KEY", provider);
  
  // 示例合约地址
  const fractionalizerAddress = "0x...";
  const rentalAddress = "0x...";
  const lendingAddress = "0x...";
  const poolAddress = "0x...";
  
  // 初始化各功能类
  const fractionalizer = new NFTFractionalizer(provider, fractionalizerAddress).connect(wallet);
  const rental = new NFTRental(provider, rentalAddress).connect(wallet);
  const lending = new NFTLending(provider, lendingAddress).connect(wallet);
  const liquidityPool = new NFTLiquidityPool(provider, poolAddress).connect(wallet);
  
  // 示例：碎片化NFT
  const nftContractAddress = "0x...";
  const tokenId = "123";
  await fractionalizer.fractionalizeNFT(nftContractAddress, tokenId, ethers.utils.parseEther("1000"));
  
  // 示例：列出NFT进行租赁
  await rental.listNFTForRental(nftContractAddress, tokenId, 0.1, 30); // 每天0.1 ETH，租期30天
  
  // 示例：创建NFT抵押贷款
  await lending.createLoan(nftContractAddress, tokenId, 5, 30, 10); // 借5 ETH，期限30天，年利率10%
  
  // 示例：从流动性池购买NFT
  const { tokenId: purchasedTokenId } = await liquidityPool.buyNFT();
  console.log(`购买的NFT TokenID: ${purchasedTokenId}`);
  
  // 示例：获取流动性池信息
  const buyPrice = await liquidityPool.getBuyPrice();
  const sellPrice = await liquidityPool.getSellPrice();
  const poolSize = await liquidityPool.getPoolSize();
  
  console.log(`当前购买价格: ${buyPrice} ETH`);
  console.log(`当前出售价格: ${sellPrice} ETH`);
  console.log(`池中NFT数量: ${poolSize}`);
}

module.exports = {
  NFTFractionalizer,
  NFTRental,
  NFTLending,
  NFTLiquidityPool
};
