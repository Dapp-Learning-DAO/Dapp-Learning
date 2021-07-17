# Polygon
Polygon的目标不是提供一两个扩展解决方案，而是创建一个生态系统，使其能够轻松连接多个不同的扩展解决方案——从具有不同共识机制的侧链到第二层网络，如Plasma、Optimistic rollps和ZK rollps。
Polygon支持与以太坊兼容的两种区块链网络：独立网络（stand-alone network）和安全链（secured chain）
独立网络依赖于它们自己的安全性，例如，它们可以有自己的共识模型，如权益证明（PoS）或委托权益证明（DPoS）
安全链使用“安全即服务”模型。它可以由以太坊直接提供，例如通过Plasma使用的欺诈证明（fraud proofs），或由专业验证节点提供。这些验证节点运行在Polygon生态系统中，可以被多个项目共享——这个概念类似于波卡的共享安全模型。
当谈到Polygon的架构时，我们需要关注的主要要点是它被刻意地设计成通用和抽象的。这允许其他希望扩展的应用程序选择最适合其需求的扩展解决方案。

[matic官方文档](https://docs.matic.network/docs/develop/getting-started)
[原理图](./img/matic.jpeg)

## Matic PoS Chain
Matic PoS Chain是一个未经许可的侧链，它与以太坊链并行运行。该链由具有自身验证节点的权益证明共识机制来保护。

尽管Matic PoS Chain有自己的共识机制，但在验证节点staking和检查点方面，它也依赖于以太坊的安全性。

## Matic Plasma Chain
Plasma允许使用者将交易从主链转移到子链，从而实现快速和廉价的交易。Plasma的一个缺点是用户从第2层网络中提取资金需要很长的等待时间。Plasma不能用于扩展通用的智能合约。

## matic测试网
测试网（Mumbai）：https://rpc-mumbai.maticvigil.com

测试网浏览器：https://explorer-mumbai.maticvigil.com/

matic主网：https://rpc-mainnet.maticvigil.com

主网浏览器：https://polygonscan.com/

## 操作步骤
`npx hardhat run scripts/sample-script.js --network matic_mumbai`

## 参考链接

https://www.yuque.com/docs/share/8e737364-c380-418e-af21-0f07095fe900

使用教程: https://cloud.tencent.com/developer/article/1828250

hardhat: https://docs.matic.network/docs/develop/hardhat/

https://medium.com/pinata/how-to-create-layer-2-nfts-with-polygon-and-ipfs-aef998ff8ef2

https://github.com/maticnetwork/matic.js/tree/master/examples  maticjs

https://biquan365.com/12636.html

https://www.chainnews.com/articles/022315243415.htm