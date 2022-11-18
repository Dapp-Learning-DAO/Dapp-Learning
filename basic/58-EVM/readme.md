# Ethereum Virtual Machine Opcodes

## 以太坊存储模型

[以太坊存储](./store.md)
以太坊是一个基于交易的“状态”机器.
三棵树： 交易树，状态树和收据树。

<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/58-EVM/storage.jpg?raw=true" /></center>
账户余额等数据并不直接存储在以太坊区块链的区块中。只有交易树、状态树和收据树的根节点哈希直接存储在区块链中。
存储树（保存所有智能合约数据）的根节点哈希实际上指向状态树，而状态树又指向区块链。
**永久存储和临时存储**
永久数据和临时数据。永久数据的一个例子是交易。一旦交易被完全确认，它就会被记录在交易树中；它永远不会改变。临时数据的一个例子是特定以太坊账户地址的余额。帐户地址的余额存储在状态树中，并在针对该特定帐户的交易发生时更改。永久数据（如挖掘交易）和临时数据（如账户余额）应该分开存储是有道理的。以太坊使用 trie 数据结构来管理数据。

### 状态树

1. 在以太坊中只有一个全局状态树。这个全局状态树会不断更新。
   状态树包含存在于以太坊网络上的每个帐户的键值对。key 是 160 位地址。
   value 是账户信息（使用递归 RLP 编码）

- nonce
- balance
- storageRoot
- codeHash

2. 状态树的根节点（给定时间点整个状态树的散列）用作状态树的安全唯一标识符；状态树的根节点在密码学上依赖于所有内部状态树数据。
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/58-EVM/stateTree.jpg?raw=true" /></center>

### 存储树 -- 合约数据所在位置

每个以太坊账户都有自己的存储树。存储树根节点的 256 位散列作为 storageRoot 值存储在全局状态树中.
每个以太坊账户都有自己的存储树。存储树根节点的 256 位散列作为 storageRoot 值存储在全局状态树中

<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/58-EVM/storeTree.png?raw=true" /></center>

### 交易树 -- 每个区块一个

每个以太坊区块都有自己独立的交易树。一个区块包含许多交易。开采的区块永远不会更新；交易在区块中的位置永远不会改变。

<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/58-EVM/transactionTree.png?raw=true" /></center>

### SPV

### EVM 


### 减少合约size
https://ethereum.org/zh/developers/tutorials/downsizing-contracts-to-fight-the-contract-size-limit 


### 数据库选型

以太坊的 Rust 客户端 Parity 使用 Rocksdb。而以太坊的 Go、C++ 和 Python 客户端都使用 leveldb。
ethereumjs 可以查看 leveldb.

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



## 参考链接

- ethervm.io <https://ethervm.io/>
- Opcode playground <https://www.evm.codes/playground>
- Solidity Bytecode and Opcode Basics <https://medium.com/@blockchain101/solidity-bytecode-and-opcode-basics-672e9b1a88c2>
- Deconstructing a Solidity Contract (by Openzeppelin)
  1. Introduction [https://blog.openzeppelin.com/deconstructing-a-solidity-contract-part-i-introduction-832efd2d7737/](https://blog.openzeppelin.com/deconstructing-a-solidity-contract-part-i-introduction-832efd2d7737/)
  2. Creation vs. Runtime [https://blog.openzeppelin.com/deconstructing-a-solidity-contract-part-i-introduction-832efd2d7737/](https://blog.openzeppelin.com/deconstructing-a-solidity-contract-part-i-introduction-832efd2d7737/)
  3. The Function Selector [https://blog.zeppelin.solutions/deconstructing-a-solidity-contract-part-iii-the-function-selector-6a9b6886ea49](https://blog.zeppelin.solutions/deconstructing-a-solidity-contract-part-iii-the-function-selector-6a9b6886ea49)
  4. Function Wrappers [https://blog.zeppelin.solutions/deconstructing-a-solidity-contract-part-iv-function-wrappers-d8e46672b0ed](https://blog.zeppelin.solutions/deconstructing-a-solidity-contract-part-iv-function-wrappers-d8e46672b0ed)
  5. Function Bodies [https://blog.zeppelin.solutions/deconstructing-a-solidity-contract-part-v-function-bodies-2d19d4bef8be](https://blog.zeppelin.solutions/deconstructing-a-solidity-contract-part-v-function-bodies-2d19d4bef8be)
  6. The Metadata Hash [https://blog.zeppelin.solutions/deconstructing-a-solidity-contract-part-vi-the-swarm-hash-70f069e22aef](https://blog.zeppelin.solutions/deconstructing-a-solidity-contract-part-vi-the-swarm-hash-70f069e22aef)
- call opcode: https://learnblockchain.cn/article/3141
- 轻客户端验证： https://blog.ethereum.org/2015/01/10/light-clients-proof-stake/
- 一篇优秀的 medium: https://medium.com/@vaibhavsaini_67863
- evm 介绍： https://www.yuque.com/docs/share/15f0bbf1-87ce-44b0-b95d-a872551a4e7f
- solidity gas优化：https://hackmd.io/@totomanov/gas-optimization-loops
