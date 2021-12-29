## uniswap v3 sdk 介绍  

You will learn how to invoke each function with the required parameters necessary in returning the calldata.  
Because any liquidity related action relies on setting up pool and position instances.
the following is what you will learn in this guide:  
  1. Set up the pool instance. This follows the same structure as the previous guide. Refer to Creating a Pool Instance for more detail.
  2. Create a position.
  3. Construct the calldata for minting a position.
  4. Construct the calldata for adding to a position.
  5. Construct the calldata for removing from a position.  

## flash swap 
   we will write a smart contract that calls flash on a V3 pool and swaps the full amount withdrawn of token0 and token1 in the corresponding pools with the same token pair - but different fee tiers. After the swap, the contract will pay back the first pool and transfer profits to the original calling address.

Uniswap V3 introduces a new function, flash, within the Pool contract.

## hardhat js to ts
注意下面三项：
- Plugins must be loaded with import instead of require.
- You need to explicitly import the Hardhat config functions, like task.
- If you are defining tasks, they need to access the Hardhat Runtime Environment explicitly, as a parameter.



## 操作步骤
```
npx hardhat run scripts/pool-simple.ts --network mainnet

npx hardhat run scripts/pool.ts --network mainnet

```

## 参考文档  
https://docs.uniswap.org/sdk/introduction
https://hardhat.org/guides/typescript.html  hardhat use ts
https://arxiv.org/pdf/2010.12252.pdf  flashloadn paper  