## Ethereum2.0
三部分： The Beacon Chain, The Merge, The Sharding.

### EIP-4844
Proto-danksharding（又名 EIP-4844）是一个以太坊改进提议（EIP）.
EIP-4844 提案是在以太坊 2.0 更新完成之前作为临时解决方案。该提案解释了一种新方法来帮助划分交易中所需的信息，例如验证规则和交易格式，而无需实际实施任何分片.
EIP-4844 包括以下内容：

- 一种新的交易类型，是“全分片”所需要的
- 全分片所需的所有执行层逻辑
- 全分片所需的所有执行/共识交叉验证逻辑
- 信标块验证和数据可用性采样 blob 之间的层分离
- 完全分片需要信标块逻辑。
- blob 的自我调整和独立的 gas 价格。

EIP-4844 最重要的特性是 blob，它是一种新型事务。blob 类似于常规事务，但它只携带一个额外的数据——称为 blob。数据片段或 blob 是大型数据包（大约 125 KB），但执行此类事务会比执行具有相同数据的 calldata 更便宜。但是，存储在 blob 中的数据无法被 EVM 访问，它只能看到它，而不能验证它。

这些 blob 可以由验证者和用户下载。proto-danksharding 中插槽的数据带宽限制为 1 MB（而不是 16 MB）。数据传输方式的这种变化产生了巨大的影响，解决了我们在以太坊方面都非常熟悉的可扩展性问题。通过采用 EIP-4844 提案，来自 blob 的这些数据不是普通以太坊交易的 gas 使用量。

为了向前兼容，EIP-4844 还引入了对块中包含的最大 blob 数量的限制。这些存储在共识层（信标节点）上，而不是执行层。它们只需要来自 EVM 的确认。 

Danksharding会把以太坊转变为一个统一的结算和数据可用性（DA）层。将结算和数据可用性抽样（data availability sampling）统一起来。

**PBS**
提议者-构建者（数据生成者）分离 (PBS:proposer/builder separation PBS) 
Builders（数据生成者）是一种新角色，它会聚合所有以太坊L1交易以及来自rollup的原始数据。使用crList，区块提议者可以强制Builders包含交易。


**纠删码(Erasure coding)**

**DA证明数据层**

**Celestia**
模块化区块链分成三部分：执行、安全性以及数据可用性。


**verkel**



**KZG承诺**
https://hackmd.io/yqfI6OPlRZizv9yPaD-8IQ



### EIP-4488
EIP-4488降低calldata费用。


## DA(data availability)
https://www.8btc.com/article/6721900




## 参考文档

- EIP4844： https://bicoin8.com/152740.html
- 一文了解以太坊的“扩容杀手锏”danksharding: https://www.defidaonews.com/article/6727438
- V神科普的“Danksharding”到底是什么: https://mp.weixin.qq.com/s/6SaXnZtSHN-pb7rvCm7B9g  
- 認識 Danksharding -以太未來擴容的新方案： https://medium.com/taipei-ethereum-meetup/%E7%9E%AD%E8%A7%A3%E7%A5%9E%E7%A7%98%E7%9A%84-zk-starks-ee56a697af76


