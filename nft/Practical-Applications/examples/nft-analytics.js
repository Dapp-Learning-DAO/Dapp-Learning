const { ethers } = require("ethers");
const axios = require("axios");

// NFT合约ABI（简化版，仅包含需要的函数）
const nftAbi = [
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function totalSupply() view returns (uint256)"
];

// 市场合约ABI（简化版）
const marketplaceAbi = [
  "event ItemSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price, uint256 timestamp)"
];

/**
 * NFT数据分析类
 */
class NFTAnalytics {
  /**
   * 构造函数
   * @param {Object} config 配置对象
   */
  constructor(config) {
    this.config = {
      nftContractAddress: config.nftContractAddress,
      marketplaceAddress: config.marketplaceAddress,
      rpcUrl: config.rpcUrl || "https://mainnet.infura.io/v3/YOUR_INFURA_KEY",
      startBlock: config.startBlock || 0,
      collectionName: config.collectionName || "NFT Collection"
    };
    
    // 初始化提供者和合约
    this.provider = new ethers.providers.JsonRpcProvider(this.config.rpcUrl);
    this.nftContract = new ethers.Contract(this.config.nftContractAddress, nftAbi, this.provider);
    this.marketplaceContract = new ethers.Contract(this.config.marketplaceAddress, marketplaceAbi, this.provider);
    
    // 初始化数据存储
    this.metadata = {};
    this.transactions = [];
    this.attributeFrequency = {};
    this.priceHistory = {};
  }

  /**
   * 初始化分析器，获取基础数据
   */
  async initialize() {
    try {
      console.log(`初始化 ${this.config.collectionName} 数据分析...`);
      
      // 获取NFT总供应量
      this.totalSupply = await this.nftContract.totalSupply();
      console.log(`总供应量: ${this.totalSupply.toString()}`);
      
      // 获取交易历史
      await this.fetchTransactionHistory();
      
      console.log("初始化完成");
      return true;
    } catch (error) {
      console.error("初始化失败:", error);
      return false;
    }
  }

  /**
   * 获取NFT元数据
   * @param {number} startTokenId 起始Token ID
   * @param {number} endTokenId 结束Token ID
   */
  async fetchMetadata(startTokenId, endTokenId) {
    console.log(`获取Token ID ${startTokenId} 到 ${endTokenId} 的元数据...`);
    
    const batchSize = 10; // 每批处理的数量
    const promises = [];
    
    for (let i = startTokenId; i <= endTokenId; i++) {
      promises.push(this.fetchSingleNFTMetadata(i));
      
      // 批量处理，避免请求过多
      if (promises.length >= batchSize || i === endTokenId) {
        await Promise.allSettled(promises);
        promises.length = 0; // 清空数组
        
        // 简单的进度显示
        const progress = Math.floor(((i - startTokenId + 1) / (endTokenId - startTokenId + 1)) * 100);
        console.log(`进度: ${progress}%`);
      }
    }
    
    // 分析属性频率
    this.analyzeAttributeFrequency();
    
    console.log(`元数据获取完成，共 ${Object.keys(this.metadata).length} 个NFT`);
  }

  /**
   * 获取单个NFT的元数据
   * @param {number} tokenId Token ID
   */
  async fetchSingleNFTMetadata(tokenId) {
    try {
      // 获取Token URI
      const tokenURI = await this.nftContract.tokenURI(tokenId);
      
      // 处理IPFS URI
      let url = tokenURI;
      if (tokenURI.startsWith("ipfs://")) {
        const ipfsHash = tokenURI.replace("ipfs://", "");
        url = `https://ipfs.io/ipfs/${ipfsHash}`;
      }
      
      // 获取元数据
      const response = await axios.get(url);
      const metadata = response.data;
      
      // 存储元数据
      this.metadata[tokenId] = metadata;
      
      return metadata;
    } catch (error) {
      console.error(`获取Token ID ${tokenId} 的元数据失败:`, error);
      return null;
    }
  }

  /**
   * 获取交易历史
   */
  async fetchTransactionHistory() {
    console.log("获取交易历史...");
    
    try {
      // 创建过滤器获取销售事件
      const filter = this.marketplaceContract.filters.ItemSold();
      
      // 获取事件日志
      const logs = await this.marketplaceContract.queryFilter(
        filter,
        this.config.startBlock,
        "latest"
      );
      
      console.log(`找到 ${logs.length} 条交易记录`);
      
      // 处理事件日志
      for (const log of logs) {
        const { tokenId, seller, buyer, price, timestamp } = log.args;
        
        const transaction = {
          tokenId: tokenId.toString(),
          seller: seller,
          buyer: buyer,
          price: ethers.utils.formatEther(price), // 转换为ETH
          priceWei: price.toString(),
          timestamp: timestamp.toNumber(),
          date: new Date(timestamp.toNumber() * 1000).toISOString(),
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash
        };
        
        this.transactions.push(transaction);
        
        // 更新价格历史
        if (!this.priceHistory[tokenId]) {
          this.priceHistory[tokenId] = [];
        }
        
        this.priceHistory[tokenId].push({
          price: transaction.price,
          timestamp: transaction.timestamp,
          date: transaction.date
        });
      }
      
      // 按时间排序交易
      this.transactions.sort((a, b) => a.timestamp - b.timestamp);
      
      // 对每个NFT的价格历史按时间排序
      for (const tokenId in this.priceHistory) {
        this.priceHistory[tokenId].sort((a, b) => a.timestamp - b.timestamp);
      }
      
      return this.transactions;
    } catch (error) {
      console.error("获取交易历史失败:", error);
      return [];
    }
  }

  /**
   * 分析属性频率
   */
  analyzeAttributeFrequency() {
    console.log("分析属性频率...");
    
    // 初始化属性频率对象
    this.attributeFrequency = {};
    
    // 遍历所有元数据
    for (const tokenId in this.metadata) {
      const metadata = this.metadata[tokenId];
      
      // 检查是否有属性数组
      if (!metadata.attributes || !Array.isArray(metadata.attributes)) {
        continue;
      }
      
      // 遍历属性
      for (const attribute of metadata.attributes) {
        const { trait_type, value } = attribute;
        
        if (!trait_type || value === undefined) continue;
        
        // 初始化特征类型
        if (!this.attributeFrequency[trait_type]) {
          this.attributeFrequency[trait_type] = {};
        }
        
        // 增加特征值计数
        const valueStr = String(value);
        if (!this.attributeFrequency[trait_type][valueStr]) {
          this.attributeFrequency[trait_type][valueStr] = 0;
        }
        
        this.attributeFrequency[trait_type][valueStr]++;
      }
    }
    
    console.log("属性频率分析完成");
    return this.attributeFrequency;
  }

  /**
   * 计算NFT稀有度分数
   * @param {number} tokenId Token ID
   * @returns {Object} 稀有度分数和详情
   */
  calculateRarityScore(tokenId) {
    const metadata = this.metadata[tokenId];
    if (!metadata || !metadata.attributes || !Array.isArray(metadata.attributes)) {
      return { score: 0, details: {} };
    }
    
    let totalScore = 0;
    const details = {};
    const totalNFTs = Object.keys(this.metadata).length;
    
    // 遍历属性计算稀有度
    for (const attribute of metadata.attributes) {
      const { trait_type, value } = attribute;
      
      if (!trait_type || value === undefined) continue;
      
      const valueStr = String(value);
      const frequency = this.attributeFrequency[trait_type][valueStr];
      const rarityScore = totalNFTs / frequency; // 稀有度分数 = 总数 / 频率
      
      details[trait_type] = {
        value: valueStr,
        frequency,
        frequencyPercentage: (frequency / totalNFTs) * 100,
        rarityScore
      };
      
      totalScore += rarityScore;
    }
    
    return {
      tokenId,
      score: totalScore,
      normalizedScore: totalScore / metadata.attributes.length, // 归一化分数
      details
    };
  }

  /**
   * 计算集合中所有NFT的稀有度排名
   * @returns {Array} 稀有度排名
   */
  calculateRarityRanking() {
    console.log("计算稀有度排名...");
    
    const rarityScores = [];
    
    // 计算每个NFT的稀有度分数
    for (const tokenId in this.metadata) {
      const rarityData = this.calculateRarityScore(tokenId);
      rarityScores.push(rarityData);
    }
    
    // 按稀有度分数排序（从高到低）
    rarityScores.sort((a, b) => b.score - a.score);
    
    // 添加排名
    rarityScores.forEach((item, index) => {
      item.rank = index + 1;
    });
    
    console.log("稀有度排名计算完成");
    return rarityScores;
  }

  /**
   * 分析价格趋势
   * @returns {Object} 价格趋势分析结果
   */
  analyzePriceTrends() {
    console.log("分析价格趋势...");
    
    // 按时间段分组的交易
    const dailyVolume = {};
    const weeklyVolume = {};
    const monthlyVolume = {};
    
    // 价格统计
    let totalVolume = 0;
    let minPrice = Infinity;
    let maxPrice = 0;
    let totalTransactions = this.transactions.length;
    
    // 处理每笔交易
    for (const tx of this.transactions) {
      const price = parseFloat(tx.price);
      const date = new Date(tx.timestamp * 1000);
      
      // 更新统计数据
      totalVolume += price;
      minPrice = Math.min(minPrice, price);
      maxPrice = Math.max(maxPrice, price);
      
      // 日期格式化
      const dailyKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const weeklyKey = this.getWeekKey(date);
      const monthlyKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      
      // 更新日交易量
      if (!dailyVolume[dailyKey]) {
        dailyVolume[dailyKey] = { volume: 0, count: 0, avgPrice: 0 };
      }
      dailyVolume[dailyKey].volume += price;
      dailyVolume[dailyKey].count += 1;
      dailyVolume[dailyKey].avgPrice = dailyVolume[dailyKey].volume / dailyVolume[dailyKey].count;
      
      // 更新周交易量
      if (!weeklyVolume[weeklyKey]) {
        weeklyVolume[weeklyKey] = { volume: 0, count: 0, avgPrice: 0 };
      }
      weeklyVolume[weeklyKey].volume += price;
      weeklyVolume[weeklyKey].count += 1;
      weeklyVolume[weeklyKey].avgPrice = weeklyVolume[weeklyKey].volume / weeklyVolume[weeklyKey].count;
      
      // 更新月交易量
      if (!monthlyVolume[monthlyKey]) {
        monthlyVolume[monthlyKey] = { volume: 0, count: 0, avgPrice: 0 };
      }
      monthlyVolume[monthlyKey].volume += price;
      monthlyVolume[monthlyKey].count += 1;
      monthlyVolume[monthlyKey].avgPrice = monthlyVolume[monthlyKey].volume / monthlyVolume[monthlyKey].count;
    }
    
    // 计算平均价格
    const avgPrice = totalVolume / totalTransactions;
    
    // 转换为数组格式，方便前端处理
    const dailyVolumeArray = Object.entries(dailyVolume).map(([date, data]) => ({
      date,
      volume: data.volume,
      count: data.count,
      avgPrice: data.avgPrice
    }));
    
    const weeklyVolumeArray = Object.entries(weeklyVolume).map(([week, data]) => ({
      week,
      volume: data.volume,
      count: data.count,
      avgPrice: data.avgPrice
    }));
    
    const monthlyVolumeArray = Object.entries(monthlyVolume).map(([month, data]) => ({
      month,
      volume: data.volume,
      count: data.count,
      avgPrice: data.avgPrice
    }));
    
    // 按日期排序
    dailyVolumeArray.sort((a, b) => a.date.localeCompare(b.date));
    weeklyVolumeArray.sort((a, b) => a.week.localeCompare(b.week));
    monthlyVolumeArray.sort((a, b) => a.month.localeCompare(b.month));
    
    // 计算价格变化趋势
    let priceChangeTrend = "稳定";
    if (dailyVolumeArray.length >= 2) {
      const firstAvgPrice = dailyVolumeArray[0].avgPrice;
      const lastAvgPrice = dailyVolumeArray[dailyVolumeArray.length - 1].avgPrice;
      const priceChangePercent = ((lastAvgPrice - firstAvgPrice) / firstAvgPrice) * 100;
      
      if (priceChangePercent > 10) {
        priceChangeTrend = "上涨";
      } else if (priceChangePercent < -10) {
        priceChangeTrend = "下跌";
      }
    }
    
    console.log("价格趋势分析完成");
    
    return {
      summary: {
        totalVolume,
        totalTransactions,
        minPrice,
        maxPrice,
        avgPrice,
        priceChangeTrend
      },
      daily: dailyVolumeArray,
      weekly: weeklyVolumeArray,
      monthly: monthlyVolumeArray
    };
  }

  /**
   * 获取周标识（YYYY-WW格式）
   * @param {Date} date 日期
   * @returns {string} 周标识
   */
  getWeekKey(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    return `${date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
  }

  /**
   * 分析持有者分布
   * @returns {Object} 持有者分布分析结果
   */
  async analyzeHolderDistribution() {
    console.log("分析持有者分布...");
    
    // 持有者映射：地址 => 拥有的NFT数量
    const holders = {};
    // 持有者映射：地址 => 拥有的NFT ID列表
    const holderTokens = {};
    
    // 获取当前区块
    const currentBlock = await this.provider.getBlockNumber();
    
    // 使用最新交易记录确定当前持有者
    // 注意：这是一个简化方法，完整实现应该考虑所有Transfer事件
    for (const tokenId in this.metadata) {
      try {
        // 获取当前持有者
        const owner = await this.nftContract.ownerOf(tokenId);
        
        // 更新持有者计数
        if (!holders[owner]) {
          holders[owner] = 0;
          holderTokens[owner] = [];
        }
        
        holders[owner]++;
        holderTokens[owner].push(tokenId);
      } catch (error) {
        console.error(`获取Token ID ${tokenId} 的持有者失败:`, error);
      }
    }
    
    // 计算持有者统计信息
    const uniqueHolders = Object.keys(holders).length;
    const holdersArray = Object.entries(holders).map(([address, count]) => ({
      address,
      count,
      percentage: (count / this.totalSupply) * 100
    }));
    
    // 按持有数量排序（从高到低）
    holdersArray.sort((a, b) => b.count - a.count);
    
    // 计算集中度指标
    const top10Holders = holdersArray.slice(0, 10);
    const top10Percentage = top10Holders.reduce((sum, holder) => sum + holder.percentage, 0);
    
    // 计算鲸鱼账户（拥有1%以上供应量的账户）
    const whaleThreshold = this.totalSupply.toNumber() * 0.01;
    const whales = holdersArray.filter(holder => holder.count >= whaleThreshold);
    
    console.log("持有者分布分析完成");
    
    return {
      totalHolders: uniqueHolders,
      holders: holdersArray,
      top10Holders,
      top10Percentage,
      whales,
      concentration: {
        top10Percentage,
        whaleCount: whales.length,
        whalePercentage: whales.reduce((sum, whale) => sum + whale.percentage, 0)
      },
      holderTokens
    };
  }

  /**
   * 生成完整分析报告
   * @returns {Object} 完整分析报告
   */
  async generateFullReport() {
    console.log("生成完整分析报告...");
    
    // 确保已初始化
    if (Object.keys(this.metadata).length === 0) {
      console.log("元数据尚未加载，获取前100个NFT的元数据...");
      await this.fetchMetadata(0, 99); // 获取前100个NFT的元数据作为样本
    }
    
    // 计算稀有度排名
    const rarityRanking = this.calculateRarityRanking();
    
    // 分析价格趋势
    const priceTrends = this.analyzePriceTrends();
    
    // 分析持有者分布
    const holderDistribution = await this.analyzeHolderDistribution();
    
    // 分析属性分布
    const attributeDistribution = {};
    for (const traitType in this.attributeFrequency) {
      const values = this.attributeFrequency[traitType];
      const totalCount = Object.values(values).reduce((sum, count) => sum + count, 0);
      
      attributeDistribution[traitType] = Object.entries(values).map(([value, count]) => ({
        value,
        count,
        percentage: (count / totalCount) * 100
      })).sort((a, b) => b.count - a.count);
    }
    
    // 生成报告
    const report = {
      collectionName: this.config.collectionName,
      contractAddress: this.config.nftContractAddress,
      totalSupply: this.totalSupply.toString(),
      analysisDate: new Date().toISOString(),
      summary: {
        uniqueHolders: holderDistribution.totalHolders,
        totalTransactions: this.transactions.length,
        totalVolume: priceTrends.summary.totalVolume,
        avgPrice: priceTrends.summary.avgPrice,
        priceChangeTrend: priceTrends.summary.priceChangeTrend,
        top10HolderPercentage: holderDistribution.concentration.top10Percentage
      },
      rarityAnalysis: {
        topRarest: rarityRanking.slice(0, 10),
        attributeDistribution
      },
      priceAnalysis: priceTrends,
      holderAnalysis: holderDistribution
    };
    
    console.log("完整分析报告生成完成");
    return report;
  }

  /**
   * 导出分析数据为JSON文件
   * @param {Object} data 要导出的数据
   * @param {string} filename 文件名
   */
  exportToJSON(data, filename) {
    // 在浏览器环境中
    if (typeof window !== 'undefined') {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      
      URL.revokeObjectURL(url);
      console.log(`数据已导出到 ${filename}`);
    }
    // 在Node.js环境中
    else if (typeof require !== 'undefined') {
      const fs = require('fs');
      fs.writeFileSync(filename, JSON.stringify(data, null, 2));
      console.log(`数据已导出到 ${filename}`);
    }
  }
}

// 使用示例
async function demoNFTAnalytics() {
  try {
    // 初始化分析器（以Bored Ape Yacht Club为例）
    const analytics = new NFTAnalytics({
      nftContractAddress: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D", // BAYC合约地址
      marketplaceAddress: "0x7Be8076f4EA4A4AD08075C2508e481d6C946D12b", // OpenSea Wyvern Exchange v1
      rpcUrl: "https://mainnet.infura.io/v3/YOUR_INFURA_KEY",
      startBlock: 12287507, // BAYC部署区块
      collectionName: "Bored Ape Yacht Club"
    });
    
    // 初始化分析器
    await analytics.initialize();
    
    // 获取前100个NFT的元数据（完整分析应获取全部）
    await analytics.fetchMetadata(0, 99);
    
    // 生成完整报告
    const report = await analytics.generateFullReport();
    
    // 导出报告
    analytics.exportToJSON(report, "bayc_analysis_report.json");
    
    // 输出一些关键指标
    console.log("\n关键分析指标:");
    console.log(`总供应量: ${report.totalSupply}`);
    console.log(`独立持有者数量: ${report.summary.uniqueHolders}`);
    console.log(`总交易量: ${report.summary.totalTransactions}`);
    console.log(`总成交额: ${report.summary.totalVolume.toFixed(2)} ETH`);
    console.log(`平均价格: ${report.summary.avgPrice.toFixed(2)} ETH`);
    console.log(`价格趋势: ${report.summary.priceChangeTrend}`);
    console.log(`前10名持有者集中度: ${report.summary.top10HolderPercentage.toFixed(2)}%`);
    
    // 输出最稀有的5个NFT
    console.log("\n最稀有的5个NFT:");
    report.rarityAnalysis.topRarest.slice(0, 5).forEach(item => {
      console.log(`#${item.rank}: Token ID ${item.tokenId} - 稀有度分数: ${item.score.toFixed(2)}`);
    });
    
  } catch (error) {
    console.error("演示过程中出错:", error);
  }
}

if (typeof window !== 'undefined') {
  window.NFTAnalytics = NFTAnalytics;
}

if (typeof module !== 'undefined') {
  module.exports = {
    NFTAnalytics
  };
}
