# Multicall

Multicall aggregates results from multiple contract **constant function calls**.

This reduces the number of separate JSON RPC requests that need to be sent (especially useful if using remote nodes like Infura), while also providing the guarantee that all values returned are from the same block (like an atomic read) and returning the block number the values are from (giving them important context so that results from old blocks can be ignored if they're from an out-of-date node).

This smart contract is intended to be used with **Multicall.js** in front-end dapps.


## Multicall.js
 project url: https://github.com/makerdao/multicall.js
 - Get the return value(s) of multiple smart contract function calls in a single call
 - Guarantee that all values are from the same block
 - Use watchers to poll for multiple blockchain state variables/functions
 - Get updates when a watcher detects state has changed
 - Results from out of sync nodes are automatically ignored
 - Get new block updates


## 参考链接
- github 仓库地址: https://github.com/ETHLend/Microstaking/blob/master/contracts/StakingContract.sol  
