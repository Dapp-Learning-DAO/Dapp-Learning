
# 源码解析：
以太坊中的MPT
以太坊中的所有的merkle树都是指Merkle Patricia Tree。

从区块头中可以看到有3棵MPT的根。

stateRoot
transcationsRoot
receiptsRoot

## State树
State树是一棵全局的树，它的key是sha3(ethereumAddress),即账户地址的hash值。其存储的值value为rlp(ethereumAccount)，即账户信息的rlp编码。其中账户信息是一个[nonce,balance,storageRoot,codeHash]的四元组，其中storageRoot指向账户的Storage树。

## Storage树
一般的外部账户Storage为空，而合约账户通常会储存一定的数据，这些数据就是存储在合约账户的Storage树中，storage树中的key与账户地址和其中实际存储的key有关，其value值为合约定义的value值。

## Transactions树
每一个区块都会有一棵Transactions树，其key为rlp(transactionIndex)(交易在区块中的编号，0，1…),其value值为经过rlp编码的交易。在实际情况中该树并不会真的存储到数据库中，只是在生成block以及校验block的时候用于得到当前区块的TransactionsRoot。

## Receipts树
每一个区块都会有一棵Receipts树树，其key为rlp(transactionIndex)(交易在区块中的编号，0，1…),其value值为经过rlp编码的交易收据。在实际情况中该树并不会真的存储到数据库中，只是在生成block以及校验block的时候用于得到当前区块的ReceiptsRoot。




## Trace
5中trace API 
- Trace Transaction: 了解交易详情（gas used, outputs, why it failed, etc）
- Trace Block： 了解一个block的所有交易
- Trace Call： Trace Call 类似于Trace Transaction， 但是返回任何状态diff
- Trace Call Many： traces multiple calls at once.

https://geth.ethereum.org/docs/developers/evm-tracing/built-in-tracers

## 参考链接：
以太坊技术与实现：https://learnblockchain.cn/books/geth/part3/statedb.html