/**
 * Uniswap V3 添加流动性示例
 * 使用ethers.js与Uniswap V3交互，在特定价格区间内添加流动性
 */
const { ethers } = require('ethers');
const { Token } = require('@uniswap/sdk-core');
const { Pool, Position, nearestUsableTick } = require('@uniswap/v3-sdk');
const { abi: IUniswapV3PoolABI } = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json');
const { abi: INonfungiblePositionManagerABI } = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/INonfungiblePositionManager.sol/INonfungiblePositionManager.json');
const { abi: IERC20ABI } = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/IERC20.sol/IERC20.json');
require('dotenv').config();

// 配置常量
const INFURA_URL = process.env.INFURA_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY';
const WALLET_PRIVATE_KEY = process.env.PRIVATE_KEY || 'your_private_key_here';

// Uniswap V3合约地址（以太坊主网）
const NONFUNGIBLE_POSITION_MANAGER_ADDRESS = '0xC36442b4a4522E871399CD717aBDD847Ab11FE88';

// 代币配置 - 以ETH/USDC为例
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // 主网WETH地址
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; // 主网USDC地址
const POOL_FEE = 3000; // 0.3%费率

/**
 * 主函数：添加流动性到Uniswap V3池
 */
async function addLiquidity() {
  try {
    // 1. 设置provider和wallet
    const provider = new ethers.providers.JsonRpcProvider(INFURA_URL);
    const wallet = new ethers.Wallet(WALLET_PRIVATE_KEY, provider);
    console.log(`使用钱包地址: ${wallet.address}`);

    // 2. 获取代币信息
    const [token0, token1, poolAddress] = await getPoolInfo(provider);
    
    // 3. 获取池信息
    const poolContract = new ethers.Contract(poolAddress, IUniswapV3PoolABI, provider);
    const [liquidity, slot0] = await Promise.all([
      poolContract.liquidity(),
      poolContract.slot0()
    ]);
    
    // 4. 创建Pool实例
    const pool = new Pool(
      token0,
      token1,
      POOL_FEE,
      slot0.sqrtPriceX96.toString(),
      liquidity.toString(),
      slot0.tick
    );
    console.log(`当前池价格: ${pool.token0Price.toSignificant(6)} ${token0.symbol} per ${token1.symbol}`);
    
    // 5. 设置价格区间（当前价格的±5%）
    const currentPrice = parseFloat(pool.token0Price.toSignificant(6));
    const lowerPrice = currentPrice * 0.95;
    const upperPrice = currentPrice * 1.05;
    console.log(`设置价格区间: ${lowerPrice.toFixed(6)} - ${upperPrice.toFixed(6)} ${token0.symbol} per ${token1.symbol}`);
    
    // 6. 计算tick范围
    const lowerTick = nearestUsableTick(
      Math.log(lowerPrice) / Math.log(1.0001),
      pool.tickSpacing
    );
    const upperTick = nearestUsableTick(
      Math.log(upperPrice) / Math.log(1.0001),
      pool.tickSpacing
    );
    
    // 7. 创建Position实例
    const position = new Position({
      pool: pool,
      liquidity: ethers.utils.parseEther('0.1'), // 流动性数量
      tickLower: lowerTick,
      tickUpper: upperTick,
    });
    
    // 8. 计算需要的代币数量
    const { amount0, amount1 } = position.mintAmounts;
    console.log(`需要存入: ${ethers.utils.formatUnits(amount0, token0.decimals)} ${token0.symbol}`);
    console.log(`需要存入: ${ethers.utils.formatUnits(amount1, token1.decimals)} ${token1.symbol}`);
    
    // 9. 授权代币给Position Manager
    await approveTokens(
      wallet,
      [
        { token: token0.address, amount: amount0.toString() },
        { token: token1.address, amount: amount1.toString() }
      ],
      NONFUNGIBLE_POSITION_MANAGER_ADDRESS
    );
    
    // 10. 添加流动性
    const positionManager = new ethers.Contract(
      NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
      INonfungiblePositionManagerABI,
      wallet
    );
    
    // 构建mint参数
    const mintParams = {
      token0: token0.address,
      token1: token1.address,
      fee: POOL_FEE,
      tickLower: lowerTick,
      tickUpper: upperTick,
      amount0Desired: amount0.toString(),
      amount1Desired: amount1.toString(),
      amount0Min: 0, // 在生产环境中应设置最小值以防止滑点
      amount1Min: 0,
      recipient: wallet.address,
      deadline: Math.floor(Date.now() / 1000) + 60 * 20 // 20分钟后过期
    };
    
    // 发送交易
    console.log('添加流动性中...');
    const tx = await positionManager.mint(mintParams, { gasLimit: 5000000 });
    console.log(`交易已发送: ${tx.hash}`);
    
    // 等待交易确认
    const receipt = await tx.wait();
    console.log(`交易已确认，区块号: ${receipt.blockNumber}`);
    
    // 解析事件获取NFT ID
    const mintEvent = receipt.events.find(event => event.event === 'IncreaseLiquidity');
    const tokenId = mintEvent.args.tokenId.toString();
    console.log(`成功创建流动性头寸，NFT ID: ${tokenId}`);
    
    // 输出头寸信息
    console.log('\n流动性头寸信息:');
    console.log(`- 代币对: ${token0.symbol}/${token1.symbol}`);
    console.log(`- 费率: ${POOL_FEE / 10000}%`);
    console.log(`- 价格区间: ${lowerPrice.toFixed(6)} - ${upperPrice.toFixed(6)} ${token0.symbol} per ${token1.symbol}`);
    console.log(`- 流动性: ${position.liquidity.toString()}`);
    
  } catch (error) {
    console.error('添加流动性失败:', error);
  }
}

/**
 * 获取池信息和代币信息
 */
async function getPoolInfo(provider) {
  // 创建代币实例
  const chainId = (await provider.getNetwork()).chainId;
  
  const token0 = new Token(
    chainId,
    WETH_ADDRESS,
    18,
    'WETH',
    'Wrapped Ether'
  );
  
  const token1 = new Token(
    chainId,
    USDC_ADDRESS,
    6,
    'USDC',
    'USD Coin'
  );
  
  // 确保token0和token1按地址排序
  const [tokenA, tokenB] = token0.address.toLowerCase() < token1.address.toLowerCase()
    ? [token0, token1]
    : [token1, token0];
  
  // 计算池地址 - 在实际应用中，您可以使用PoolAddress.computeAddress函数
  // 这里为了简化，我们直接使用ETH/USDC 0.3%池的地址
  const poolAddress = '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8'; // ETH/USDC 0.3%池
  
  return [tokenA, tokenB, poolAddress];
}

/**
 * 授权代币给指定合约
 */
async function approveTokens(wallet, tokens, spender) {
  for (const { token, amount } of tokens) {
    const tokenContract = new ethers.Contract(token, IERC20ABI, wallet);
    const allowance = await tokenContract.allowance(wallet.address, spender);
    
    if (allowance.lt(amount)) {
      console.log(`授权 ${token} 给 ${spender}...`);
      const tx = await tokenContract.approve(spender, ethers.constants.MaxUint256);
      await tx.wait();
      console.log(`授权成功: ${tx.hash}`);
    } else {
      console.log(`${token} 已有足够授权`);
    }
  }
}

/**
 * 无常损失计算函数 - 实现风险管理指南中的公式
 */
function calculateImpermanentLoss(initialPrice, currentPrice) {
  const priceRatio = currentPrice / initialPrice;
  const sqrtRatio = Math.sqrt(priceRatio);
  
  // 使用风险管理指南中的公式: IL = 2 * √(P_current/P_initial) / (1 + P_current/P_initial) - 1
  const il = (2 * sqrtRatio / (1 + priceRatio)) - 1;
  
  return il * 100; // 转换为百分比
}

/**
 * 风险评估函数 - 基于风险管理指南中的模型
 */
function assessRisk(position, currentPrice, initialPrice, volatility) {
  // 1. 计算无常损失风险 (0-40分)
  const il = Math.abs(calculateImpermanentLoss(initialPrice, currentPrice));
  const ilRisk = Math.min(il * 2, 40); // 无常损失每1%计2分，最高40分
  
  // 2. 计算范围外风险 (0-30分)
  const lowerPrice = position.lowerPrice;
  const upperPrice = position.upperPrice;
  let rangeRisk = 0;
  
  if (currentPrice < lowerPrice || currentPrice > upperPrice) {
    // 价格已经在范围外
    rangeRisk = 30;
  } else {
    // 计算价格到边界的接近程度
    const lowerDistance = (currentPrice - lowerPrice) / lowerPrice;
    const upperDistance = (upperPrice - currentPrice) / currentPrice;
    const minDistance = Math.min(lowerDistance, upperDistance);
    
    // 距离边界越近，风险越高
    rangeRisk = 30 * (1 - Math.min(minDistance / 0.1, 1)); // 假设10%为安全距离
  }
  
  // 3. 代币风险 (0-20分) - 这里简化处理
  const tokenRisk = 10; // 假设中等风险
  
  // 4. 协议风险 (0-10分)
  const protocolRisk = 5; // Uniswap经过多次审计，风险较低
  
  // 计算总风险分数 (0-100)
  const totalRisk = ilRisk + rangeRisk + tokenRisk + protocolRisk;
  
  return {
    totalRisk,
    ilRisk,
    rangeRisk,
    tokenRisk,
    protocolRisk,
    riskLevel: totalRisk <= 20 ? '低风险' :
               totalRisk <= 50 ? '中等风险' :
               totalRisk <= 75 ? '高风险' : '极高风险'
  };
}

if (require.main === module) {
  addLiquidity()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}