## Run your own Ethereum Validator:

### EPF

系统课程： https://www.youtube.com/watch?v=nrwKxyBIYYk

https://medium.com/coinmonks/run-your-own-ethereum-validator-part-1-pbft-casper-ffg-casper-cbc-and-lmd-ghost-e68e8461acf8

https://eth2book.info/

## 节点同步

Full node ， archive node

### Full node

同步方式有

1. snap sync: 从最近的特定区块开始同步（checkpoint）， 保留最近的128个区块在内存中。

snap sync 先下载区块头，验证通过后，下载区块体和收据。同时，进行state-sync， geth先下载每个区块的state trie的叶子节点，然后本地自己生成完整的state trie.
用eth.syncing 检查是否同步完成。

- download and verify headers
- download block bodies and receipts. In parallel, download raw state data and build state trie
- heal state trie to account for newly arriving data

--syncmode 默认是snap

2. FUll sync:  
   full sync 逐个区块的同步，并从创世区块开始执行每个区块的交易，并生成状态。 也只保留128个区块状态。 约25分钟。其他block state会被pruned periddically.

### Archive node

适合用来查历史数据， 会保留所有区块的历史状态。 无需从checkpoint同步。
通过配置geth的垃圾回收， 历史数据就不会被删除。
geth --syncmode full --gcmode archive.

## 共识客户端

eth2.0 ，区块下载是由 共识客户端负责，验证由执行客户端负责。
共识客户端有两个同步方式：
optimistic syncing 和 checkpoint syncing

### optimistic syncing

在执行端验证之前就下载区块。 不能参与出块

### checkpoint sync

从https://eth-clients.github.io/checkpoint-sync-endpoints/ 下载checkpoint。

## Databases

since V1.9.0 , geth将 database分成两个部分。 Recent blocks 和state data 存储在 quick- access storage.

旧数据 和收据 stored in Freezer database。

### Recent blocks

存贮在leverdb。 主要是SSD存储

### Freezer/ ancients

Older segments of the chain are moved out of the LevelDB database and into a freezer database. 主要存在HDD。

the ancient chain segments is inside the chaindata directory

## Pruning

修剪操作依赖于状态数据库的“快照”（snapshots）来判断状态树（state trie）中哪些节点是“有用的”可以保留，哪些是“过时的”可以被删除。快照就像一个参照点，用来对比哪些数据仍然有效。

Geth 的修剪过程分为 三个阶段：
第一步是“遍历快照状态”：Geth 会遍历最底层的快照，并用 布隆过滤器（Bloom Filter） 构建一个集合，这个集合用来快速判断哪些状态树节点是属于目标状态树的。

第二步是“修剪状态数据”：Geth 会删除那些 不在布隆过滤器集合中的状态树节点，也就是不再需要的旧数据。

第三步是“压缩数据库”：修剪后会有很多空闲空间，Geth 会对数据库进行整理以释放出这些空间。

## TXPOOL

pending： 有效的交易
Queued: 未来的交易,nonce更多的

主要有以下几个方法：

- txpool_content  
  返回pending 和queued的交易
- txpool_contentFrom  
  返回特定地址的交易
- txpool_inspect
  比content的方法内容更详细
- txpool_status
  返回pending和queue的数量

  ### MEV BOT

  https://medium.com/@solidquant/how-i-spend-my-days-mempool-watching-part-1-transaction-prediction-through-evm-tracing-77f4c99207f
