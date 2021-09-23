## 概要  
### ERC865 
通过 test_DToken.js 介绍了如何使用“无Gas”交易，阐明了“无Gas”实际上意味着将Gas成本转移给其他人。 
使用此模式有很多好处，因此，它被广泛使用. 签名允许将交易 gas 成本从用户转移到服务提供商, 从而在许多情况下消除了相当大的障碍. 它还允许实现更高级的委派模式, 通常会对UX进行相当大的改进  

### ERC875
支持原子交易的token  

### EIP712  
通过签名功能函数的好处是用户可以免费完成委托或投票交易, 同时会有可信的第三方花费gas费用将投票结果写到区块链中. 在本次教程中，我们重点展示这类函数的例子. 

## 测试步骤 
- 安装依赖 
```
yarn
```

- 测试代理合约 
```
npx hardhat test test/test_DToken.js 
``` 

## 参考链接
https://github.com/propsproject/props-token-distribution 
https://learnblockchain.cn/article/1357    
https://learnblockchain.cn/2019/04/24/token-EIP712  
https://learnblockchain.cn/article/1496  
https://medium.com/alphawallet/erc875-a-new-standard-for-non-fungible-tokens-and-cheap-atomic-swaps-93ab85b9e7f9  
https://github.com/AlphaWallet/ERC875-Example-Implementation  
https://github.com/ethereum/EIPs/tree/master/assets 
EIP712知乎：https://www.zhihu.com/people/wang-da-chui-82-1/posts