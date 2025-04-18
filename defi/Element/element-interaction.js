const { ethers } = require('ethers');

const config = {
  // 提供者配置 - 连接到以太坊网络
  provider: new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_INFURA_KEY'),
  // 钱包配置 - 使用私钥创建钱包实例
  wallet: null, // 需要设置: new ethers.Wallet('YOUR_PRIVATE_KEY', provider),
  // 合约地址
  addresses: {
    dai: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI 代币地址
    tranche: '', // Element Tranche 合约地址
    principalToken: '', // PT 代币地址
    amm: '', // Element AMM 地址
    baseAsset: '' // 基础资产地址
  },
  // ABI 配置
  abis: {
    erc20: [
      'function approve(address spender, uint256 amount) external returns (bool)',
      'function balanceOf(address account) external view returns (uint256)'
    ],
    tranche: [
      'function deposit(uint256 amount, address recipient) external',
      'function unlockTimestamp() external view returns (uint256)',
      'function redeemPrincipal(uint256 amount, address recipient) external'
    ],
    amm: [
      'function getAmountOut(uint256 amountIn, address tokenIn, address tokenOut) external view returns (uint256)',
      'function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, address recipient) external returns (uint256)'
    ]
  }
};

// 合约实例
let contracts = {};

/**
 * 初始化合约实例
 */
async function initContracts() {
  // 确保钱包已配置
  if (!config.wallet) {
    throw new Error('请先配置钱包');
  }

  // 初始化合约实例
  contracts.dai = new ethers.Contract(config.addresses.dai, config.abis.erc20, config.wallet);
  contracts.tranche = new ethers.Contract(config.addresses.tranche, config.abis.tranche, config.wallet);
  contracts.principalToken = new ethers.Contract(config.addresses.principalToken, config.abis.erc20, config.wallet);
  contracts.amm = new ethers.Contract(config.addresses.amm, config.abis.amm, config.wallet);
  contracts.baseAsset = new ethers.Contract(config.addresses.baseAsset, config.abis.erc20, config.wallet);

  console.log('合约初始化完成');
}

/**
 * 1. 存入资产获取 PT 和 YT
 * @param {string} amount - 存入的资产数量（以wei为单位）
 * @returns {Promise<object>} 交易收据
 */
async function depositToElement(amount) {
  console.log(`准备存入 ${ethers.utils.formatEther(amount)} DAI 到 Element...`);
  
  try {
    // 批准 Element Tranche 合约使用 DAI
    console.log('批准 Tranche 合约使用 DAI...');
    const approveTx = await contracts.dai.approve(config.addresses.tranche, amount);
    await approveTx.wait();
    console.log('批准成功，交易哈希:', approveTx.hash);
    
    // 存入 DAI 并获取 PT 和 YT
    console.log('存入 DAI 并获取 PT 和 YT...');
    const depositTx = await contracts.tranche.deposit(amount, config.wallet.address);
    const receipt = await depositTx.wait();
    console.log('存入成功，交易哈希:', depositTx.hash);
    
    // 获取 PT 和 YT 余额
    const ptBalance = await contracts.principalToken.balanceOf(config.wallet.address);
    console.log(`现在持有 ${ethers.utils.formatEther(ptBalance)} PT`);
    
    return receipt;
  } catch (error) {
    console.error('存入资产失败:', error);
    throw error;
  }
}

/**
 * 2. 在 AMM 中交易 PT 获取固定收益
 * @param {string} ptAmount - PT 代币数量（以wei为单位）
 * @param {number} slippageTolerance - 滑点容忍度（0-1之间的小数，默认0.01即1%）
 * @returns {Promise<object>} 交易收据和固定收益率
 */
async function tradePTForBaseAsset(ptAmount, slippageTolerance = 0.01) {
  console.log(`准备交易 ${ethers.utils.formatEther(ptAmount)} PT 获取固定收益...`);
  
  try {
    // 批准 AMM 使用 PT
    console.log('批准 AMM 使用 PT...');
    const approveTx = await contracts.principalToken.approve(config.addresses.amm, ptAmount);
    await approveTx.wait();
    console.log('批准成功，交易哈希:', approveTx.hash);
    
    // 计算预期获得的基础资产数量
    const baseAssetAmount = await contracts.amm.getAmountOut(
      ptAmount,
      config.addresses.principalToken,
      config.addresses.baseAsset
    );
    console.log(`预期获得 ${ethers.utils.formatEther(baseAssetAmount)} 基础资产`);
    
    // 计算最小获得的基础资产数量（考虑滑点）
    const minAmountOut = baseAssetAmount.mul(
      ethers.BigNumber.from(Math.floor((1 - slippageTolerance) * 10000))
    ).div(ethers.BigNumber.from(10000));
    
    // 执行交易
    console.log('执行交易...');
    const swapTx = await contracts.amm.swap(
      config.addresses.principalToken,
      config.addresses.baseAsset,
      ptAmount,
      minAmountOut,
      config.wallet.address
    );
    const receipt = await swapTx.wait();
    console.log('交易成功，交易哈希:', swapTx.hash);
    
    // 计算固定收益率
    const fixedRate = calculateFixedRate(ptAmount, baseAssetAmount);
    console.log(`固定收益率: ${fixedRate.toFixed(2)}%`);
    
    return { receipt, fixedRate };
  } catch (error) {
    console.error('交易 PT 失败:', error);
    throw error;
  }
}

/**
 * 3. 到期后赎回 PT
 * @param {string} ptAmount - PT 代币数量（以wei为单位）
 * @returns {Promise<object>} 交易收据
 */
async function redeemPT(ptAmount) {
  console.log(`准备赎回 ${ethers.utils.formatEther(ptAmount)} PT...`);
  
  try {
    // 检查是否已到期
    const unlockTimestamp = await contracts.tranche.unlockTimestamp();
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    if (currentTimestamp < unlockTimestamp) {
      const remainingTime = unlockTimestamp - currentTimestamp;
      const days = Math.floor(remainingTime / 86400);
      throw new Error(`尚未到期，还需等待 ${days} 天`);
    }
    
    // 赎回基础资产
    console.log('赎回基础资产...');
    const redeemTx = await contracts.tranche.redeemPrincipal(ptAmount, config.wallet.address);
    const receipt = await redeemTx.wait();
    console.log('赎回成功，交易哈希:', redeemTx.hash);
    
    return receipt;
  } catch (error) {
    console.error('赎回 PT 失败:', error);
    throw error;
  }
}

/**
 * 计算固定收益率
 * @param {ethers.BigNumber} ptAmount - PT 代币数量
 * @param {ethers.BigNumber} baseAssetAmount - 获得的基础资产数量
 * @returns {number} 年化固定收益率（百分比）
 */
function calculateFixedRate(ptAmount, baseAssetAmount) {
  // 获取当前时间和到期时间
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const unlockTimestamp = contracts.tranche.unlockTimestamp();
  
  // 计算剩余时间（年）
  const timeRemainingInYears = (unlockTimestamp - currentTimestamp) / (365 * 24 * 60 * 60);
  
  // 计算收益率
  // 假设 PT 和基础资产的面值相同，那么：
  // 收益率 = ((面值 / 当前价格) - 1) / 剩余时间
  const faceValue = ethers.utils.parseEther('1'); // 假设面值为1
  const currentPrice = baseAssetAmount.mul(faceValue).div(ptAmount);
  
  const yieldRate = (faceValue.mul(ethers.BigNumber.from(10000)).div(currentPrice).toNumber() / 10000 - 1) / timeRemainingInYears;
  
  // 转换为百分比
  return yieldRate * 100;
}

/**
 * 使用示例
 */
async function main() {
  try {
    // 初始化合约
    await initContracts();
    
    // 示例1：存入1000 DAI
    const depositAmount = ethers.utils.parseEther('1000');
    await depositToElement(depositAmount);
    
    // 示例2：交易PT获取固定收益
    const ptAmount = ethers.utils.parseEther('1000'); // 假设我们有1000个PT
    await tradePTForBaseAsset(ptAmount, 0.01); // 1%滑点容忍度
    
    // 示例3：到期后赎回PT（注意：只有在到期后才能执行）
    // await redeemPT(ptAmount);
    
    console.log('示例执行完成');
  } catch (error) {
    console.error('执行示例时出错:', error);
  }
}

// 如果直接运行此脚本，则执行main函数
if (require.main === module) {
  // 在运行前，请先在配置中设置正确的合约地址和私钥
  // main().catch(console.error);
}

module.exports = {
  initContracts,
  depositToElement,
  tradePTForBaseAsset,
  redeemPT,
  calculateFixedRate
};
