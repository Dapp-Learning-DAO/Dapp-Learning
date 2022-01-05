# Multicall

Multicall aggregates results from multiple contract **constant function calls**.

This reduces the number of separate JSON RPC requests that need to be sent (especially useful if using remote nodes like Infura), while also providing the guarantee that all values returned are from the same block (like an atomic read) and returning the block number the values are from (giving them important context so that results from old blocks can be ignored if they're from an out-of-date node).

This smart contract is intended to be used with **Multicall.js** in front-end dapps.
 
index finance的multicall实现更为简单。
## 合约调用方法：
合约之间的调用有2种方式： 底层的call方式和 new 合约的方式

call：通过合约ContractAddres.call(编码后的方法名和参数），返回调用是否成功，以及返回值data

delegatecall ：设计是为了调用其它合约的API用的,类似于 Copy了API合约的API函数到**本地合约**执行，会修改调用者合约的状态变量。

staticcall： Since byzantium staticcall can be used as well. This is basically the same as call, but will revert if the called function modifies the state in any way



## Multicall.js
 project url: https://github.com/makerdao/multicall.js
 indexed-finance multicall: https://github.com/indexed-finance/multicall
 - Get the return value(s) of multiple smart contract function calls in a single call
 - Guarantee that all values are from the same block
 - Use watchers to poll for multiple blockchain state variables/functions
 - Get updates when a watcher detects state has changed
 - Results from out of sync nodes are automatically ignored
 - Get new block updates


## 参考链接
- github 仓库地址: https://github.com/ETHLend/Microstaking/blob/master/contracts/StakingContract.sol  
- index finance: https://github.com/indexed-finance/dividends/tree/master/contracts
- Solidity Call函数: https://www.jianshu.com/p/a5c97d0d7cae
