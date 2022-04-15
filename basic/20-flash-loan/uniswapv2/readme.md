# Uniswap v2 Flashswap 介绍  

Uniswap v2 版本中，就已经提供了被称作 flash swap 的闪电贷功能。即可以向一个交易对借贷 x token，但在还贷时使用 y token.

falsh swap 的实现原理是：

1. 借贷方可以先向合约借贷 x, y token 中某一个（或者两个都借贷）
2. 借贷方指定借贷的数量，以及回调函数的参数，调用 flashswap
3. 合约会先将用户请求借贷的 token 按指定数量发送给借贷方
4. 发送完毕后，Uniswap Pair 合约会向借贷方指定的合约的地址调用指定的回调函数，并将回调函数的参数传入
5. 调用完成后，Uniswap Pair 合约检查 x, y token 余额满足 $$ x′⋅y′≥k $$

以上过程也都发生在同一个交易中。

在 flashswap 中，用户可以不需要预先支付 token 就可以得到想要的 token，这部分需要支付的 token 只需要在回调函数中转回给合约即可。在 flashswap 完成后 AMM 池中的价格会发生改变（如果使用同币种还债则价格不会改变）。flash swap 可以用来进行 AMM 之间套利，借贷平台清算等操作。

flashswap 类似于一个功能更强的闪电贷，一个接口即可完成借贷和交易的操作。关于 flash swap 的更多内容，可以参考 [官方文档](https://docs.uniswap.org/protocol/V2/guides/smart-contract-integration/using-flash-swaps)。  


## 操作步骤  
- 安装依赖  
```shell
yarn
```

- 配置环境变量  
```shell
cp .env.example .env
# 在 .env 中配置  INFURA_ID , PRIVATE_KEY
```

- 部署合约  
```shell
npx hardhat run scripts/deploy_UniswapFlashloaner.js --network kovan
```

- 执行闪电贷  
```shell
npx hardhat run scripts/flashloan_test.js --network kovan
```

参考：  
- 闪电贷详解：https://liaoph.com/uniswap-v3-6/   
- uniswap-flash-swapper： https://github.com/Austin-Williams/uniswap-flash-swapper    
- Flash Swaps： https://docs.uniswap.org/protocol/V2/guides/smart-contract-integration/using-flash-swaps     
- FlashSwap Example: https://github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/examples/ExampleFlashSwap.sol     
- 基于UniswapV2闪电贷的OneSwap套利指南: https://juejin.cn/post/6878116429590167565   
- 获取 kovan Dai Token: https://docs.alchemist.wtf/copper/auction-creators/getting-test-tokens-for-balancer-lbps-on-the-kovan-testnet  
