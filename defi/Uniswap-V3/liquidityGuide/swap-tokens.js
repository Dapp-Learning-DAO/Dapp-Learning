/**
 * Uniswap V3 代币交换示例
 * 使用ethers.js与Uniswap V3 SwapRouter交互，执行代币交换
 */

const { ethers } = require('ethers');
const { Token, CurrencyAmount, TradeType, Percent } = require('@uniswap/sdk-core');
const { AlphaRouter, SwapType } = require('@uniswap/smart-order-router');
const { abi: ISwapRouter02ABI } = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json');
const { abi: IERC20ABI } = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/IERC20.sol/IERC20.json');
require('dotenv').config();

// 配置常量
const INFURA_URL = process.env.INFURA_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY';
const WALLET_PRIVATE_KEY = process.env.PRIVATE_KEY || 'your_private_key_here';

// Uniswap V3合约地址（以太坊主网）
const SWAP_ROUTER_ADDRESS = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'; // SwapRouter02地址

// 代币配置 - 以ETH/USDC为例
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // 主网WETH地址
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; // 主网USDC地址

/**
 * 主函数：使用Uniswap V3执行代币交换
 */
async function swapTokens() {
  try {
    // 1. 设置provider和wallet
    const provider = new ethers.providers.JsonRpcProvider(INFURA_URL);
    const wallet = new ethers.Wallet(WALLET_PRIVATE_KEY, provider);
    console.log(`使用钱包地址: ${wallet.address}`);
    
    // 2. 获取代币信息
    const chainId = (await provider.getNetwork()).chainId;
    const weth = new Token(chainId, WETH_ADDRESS, 18, 'WETH', 'Wrapped Ether');
    const usdc = new Token(chainId, USDC_ADDRESS, 6, 'USDC', 'USD Coin');
    
    // 3. 设置交易参数
    const amountIn = '0.01'; // 交换0.01 ETH
    const tokenIn = weth;
    const tokenOut = usdc;
    
    // 4. 创建AlphaRouter实例用于获取最佳交易路径
    const router = new AlphaRouter({ chainId, provider });
    
    // 5. 创建代币数量实例
    const wei = ethers.utils.parseEther(amountIn);
    const currencyAmount = CurrencyAmount.fromRawAmount(
      tokenIn,
      wei.toString()
    );
    
    // 6. 获取最佳交易路径
    console.log(`查询 ${amountIn} ${tokenIn.symbol} 到 ${tokenOut.symbol} 的最佳交易路径...`);
    const route = await router.route(
      currencyAmount,
      tokenOut,
      TradeType.EXACT_INPUT,
      {
        recipient: wallet.address,
        slippageTolerance: new Percent(5, 100), // 5% 滑点容忍度
        deadline: Math.floor(Date.now() / 1000 + 1800) // 30分钟后过期
      }
    );
    
    if (!route) {
      throw new Error('无法找到交易路径');
    }
    
    // 7. 显示交易信息
    console.log(`交易路径: ${route.route[0].tokenPath.map(token => token.symbol).join(' -> ')}`);
    console.log(`预计获得: ${route.quote.toFixed(6)} ${tokenOut.symbol}`);
    console.log(`价格影响: ${route.priceImpact.toFixed(2)}%`);
    
    // 8. 授权代币给SwapRouter（如果需要）
    if (tokenIn.address !== WETH_ADDRESS) {
      await approveToken(wallet, tokenIn.address, SWAP_ROUTER_ADDRESS, wei.toString());
    }
    
    // 9. 执行交换
    const swapRouter = new ethers.Contract(SWAP_ROUTER_ADDRESS, ISwapRouter02ABI, wallet);
    
    // 构建交易参数
    const params = {
      tokenIn: route.route[0].tokenPath[0].address,
      tokenOut: route.route[0].tokenPath[route.route[0].tokenPath.length - 1].address,
      fee: route.route[0].pools[0].fee,
      recipient: wallet.address,
      deadline: Math.floor(Date.now() / 1000) + 60 * 30, // 30分钟后过期
      amountIn: wei,
      amountOutMinimum: ethers.utils.parseUnits(
        (parseFloat(route.quote.toFixed(6)) * 0.95).toFixed(6), // 允许5%滑点
        tokenOut.decimals
      ),
      sqrtPriceLimitX96: 0 // 不设置价格限制
    };
    
    // 发送交易
    console.log('执行交换交易...');
    const txOptions = {};
    
    // 如果是ETH到代币的交换，需要添加value
    if (tokenIn.address === WETH_ADDRESS) {
      txOptions.value = wei;
      // 使用exactInputSingle方法
      const tx = await swapRouter.exactInputSingle(params, txOptions);
      console.log(`交易已发送: ${tx.hash}`);
      
      // 等待交易确认
      const receipt = await tx.wait();
      console.log(`交易已确认，区块号: ${receipt.blockNumber}`);
    } else {
      // 使用exactInputSingle方法
      const tx = await swapRouter.exactInputSingle(params, txOptions);
      console.log(`交易已发送: ${tx.hash}`);
      
      // 等待交易确认
      const receipt = await tx.wait();
      console.log(`交易已确认，区块号: ${receipt.blockNumber}`);
    }
    
    // 10. 查询交易后余额
    const usdcContract = new ethers.Contract(USDC_ADDRESS, IERC20ABI, provider);
    const usdcBalance = await usdcContract.balanceOf(wallet.address);
    console.log(`交易后 USDC 余额: ${ethers.utils.formatUnits(usdcBalance, 6)} USDC`);
    
  } catch (error) {
    console.error('代币交换失败:', error);
  }
}

/**
 * 授权代币给指定合约
 */
async function approveToken(wallet, tokenAddress, spender, amount) {
  const tokenContract = new ethers.Contract(tokenAddress, IERC20ABI, wallet);
  const allowance = await tokenContract.allowance(wallet.address, spender);
  
  if (allowance.lt(amount)) {
    console.log(`授权 ${tokenAddress} 给 ${spender}...`);
    const tx = await tokenContract.approve(spender, ethers.constants.MaxUint256);
    await tx.wait();
    console.log(`授权成功: ${tx.hash}`);
  } else {
    console.log(`${tokenAddress} 已有足够授权`);
  }
}

/**
 * 计算价格影响
 * 价格影响是指交易对市场价格的影响程度
 */
function calculatePriceImpact(marketPrice, executionPrice) {
  return ((marketPrice - executionPrice) / marketPrice) * 100;
}

/**
 * 多跳路径交换示例
 * 如何通过多个池进行代币交换以获得更好的价格
 */
async function multiHopSwap(wallet, provider, amountIn, path) {
  // 创建SwapRouter实例
  const swapRouter = new ethers.Contract(SWAP_ROUTER_ADDRESS, ISwapRouter02ABI, wallet);
  
  // 编码路径
  const encodedPath = ethers.utils.solidityPack(
    ['address', 'uint24', 'address', 'uint24', 'address'],
    [
      path[0].address,      // 第一个代币地址
      path[1],              // 第一个池费率
      path[2].address,      // 中间代币地址
      path[3],              // 第二个池费率
      path[4].address       // 最后代币地址
    ]
  );
  
  // 构建exactInput参数
  const params = {
    path: encodedPath,
    recipient: wallet.address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 30,
    amountIn: ethers.utils.parseEther(amountIn),
    amountOutMinimum: 0 // 在生产环境中应设置最小值
  };
  
  // 发送交易
  const txOptions = {};
  if (path[0].address === WETH_ADDRESS) {
    txOptions.value = params.amountIn;
  }
  
  const tx = await swapRouter.exactInput(params, txOptions);
  console.log(`多跳交换交易已发送: ${tx.hash}`);
  
  return tx;
}

if (require.main === module) {
  swapTokens()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}