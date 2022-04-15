# Uniswap v3 Flashswap 介绍  

Uniswap v3 版本中，和 v2 一样也有两种闪电贷的方式，但是是通过不同的函数接口来完成的。

第一种是普通的闪电贷，即借入 token 和还贷 token 相同，通过 UniswapV3Pool.flash() 完成
第二种是类似 v2 的 flash swap，即借入 token 和还贷 token 不同，这个是通过 UniswapV3Pool.swap() 来完成的。


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

- 执行闪电贷 && swap callback    
```shell
npx hardhat run scripts/flashloan_and_swapcallback.js --network rinkeby  
```

参考：  
- 闪电贷详解：https://liaoph.com/uniswap-v3-6/   
- uniswap-flash-swapper： https://github.com/gebob19/uniswap-v3-flashswap           
- 获取 kovan Dai Token: https://docs.alchemist.wtf/copper/auction-creators/getting-test-tokens-for-balancer-lbps-on-the-kovan-testnet    
- WETH Token List: https://docs.uniswap.org/protocol/reference/deployments    
- uniswap v3 swap callback: https://github.com/makerdao/univ3-lp-oracle/blob/master/src/GUniLPOracle.t.sol  
- uniswap v3 pool: https://github.com/Uniswap/v3-core/blob/main/contracts/UniswapV3Pool.sol  