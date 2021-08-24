## uniswap v3 sdk 介绍  

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