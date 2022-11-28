[中文](./README-CN.md) / English

# Uniswap v2 Flashswap introduce  

There is a flash loan function that can be called flash swap in v2 version of Uniswap. Thus you can borrow x token from a transaction pair, but repay with y token.

The realization principle of flash swap is:

1. lender can borrow from contract one of x, y token (or both)
2. lender destined the borrow amount and the params of callback function then calling flashswap
3. The contract will send the token to lender which amount destined by user
4. when these tokens send successfully, the contract Uniswap Pair will calling a destined callback function to the contract address also destined by lender, and pass the params of callback function in
5. After calling is over, Uniswap Pair will check whether balance of x, y token sufficient $$ x′⋅y′≥k $$

All these process above are also happened in one same transaction.

In flashswap, user don't need to prepay token can get token what he want, and all you need to do is return these token which need pay in callback function to contract. After flashswap finished, the prices in AMM pool will changed (if use same token to repay it won't change). Flash swap can be used for arbitrage between AMMs, liquidation of lending platforms and other operations.

Flashswap is similar to a more powerful flash loan, just one api can deal the loan and transaction operation. If you want to know more about flash swap, see [official docs](https://docs.uniswap.org/protocol/V2/guides/smart-contract-integration/using-flash-swaps).  


## Steps  
- Install dependencies  
```shell
yarn
```

- Config the envrioument  
```shell
cp .env.example .env
# set INFURA_ID , PRIVATE_KEY in .env
```

- Deploy the contract  
```shell
npx hardhat run scripts/deploy_UniswapFlashloaner.js --network kovan
```

- Start flashloan  
```shell
npx hardhat run scripts/flashloan_test.js --network kovan
```

## Reference link  

- Detail of flash loan：https://liaoph.com/uniswap-v3-6/   
- uniswap-flash-swapper： https://github.com/Austin-Williams/uniswap-flash-swapper    
- Flash Swaps： https://docs.uniswap.org/protocol/V2/guides/smart-contract-integration/using-flash-swaps     
- FlashSwap Example: https://github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/examples/ExampleFlashSwap.sol     
- OneSwap Arbitrage Guide Based on UniswapV2 Flash Loan: https://juejin.cn/post/6878116429590167565   
- Get kovan Dai Token: https://docs.alchemist.wtf/copper/auction-creators/getting-test-tokens-for-balancer-lbps-on-the-kovan-testnet  
