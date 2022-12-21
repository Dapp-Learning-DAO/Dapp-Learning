# Ethereum Virtual Machine 
opcode码：https://www.ethervm.io/


## Solidity Bytecode and Opcode Basics

简单了解 bytecode 和 opcode。

Solidity Bytecode and Opcode Basics <https://medium.com/@blockchain101/solidity-bytecode-and-opcode-basics-672e9b1a88c2>

## Deconstructing a Solidity Contract

Openzeppelin blog 的系列文章，非常棒的科普文。学习笔记参见 :point_right: [DeconstructingSolidityContract.md](./DeconstructingSolidityContract.md)

## 实际项目中手写Opcode的示范：
[sudoswap](https://github.com/sudoswap/lssvm/blob/main/src/lib/LSSVMPairCloner.sol), 它自己手写了Opcode，主要实现的是EIP-1167. 但是比EIP-1167要更复杂一点，复杂之处在于proxy在每一次调用delegatecall的时候都会将创建该proxy的一些参数，例如factory address, nft address等直接concat到calldata后面。关于EIP-1167，可以参考[这篇文章](https://learnblockchain.cn/article/2663)

## 推荐用的手写Opcode的工具
[etk](https://quilt.github.io/etk/ch02-lang/ch03-labels.html), 它可以帮助你计算offset和length。
在Opcode.etk文件中，使用该工具定义的etk格式手写了`cloneETHPair`函数，可以对比sudoswap.lob.sol文件进行查看

### 减少合约size
参阅[libary介绍](./libary.md)
https://ethereum.org/zh/developers/tutorials/downsizing-contracts-to-fight-the-contract-size-limit 


## 参考链接
- [EVM内存布局](
https://mirror.xyz/xyyme.eth/GNVcUgKAOEiLyClKeqkmD35ctLu6_XomT3ZDIfV3tz8?s=09) 

- [深入理解EVM - Part 1 - 从字节码到函数选择器](https://learnblockchain.cn/article/4253)  
- [evm_illustrated](https://takenobu-hs.github.io/downloads/ethereum_evm_illustrated.pdf)
- [EVM Deep Dives](https://noxx.substack.com/p/evm-deep-dives-the-path-to-shadowy?s=r)

