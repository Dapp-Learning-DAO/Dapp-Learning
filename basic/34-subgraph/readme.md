# subgraph

subgraph使开发人员能够通过从以太坊和其他区块链提取索引数据来构建可发现的api。Graph根据subgraph描述(称为子图清单)学习索引数据的内容和方法。
subgraph描述定义了感兴趣的智能合约、这些合约中要注意的事件，以及如何将事件数据映射到Graph将存储在其数据库中的数据
 此任务会从0搭建graph节点。

Subgraph Selection
Subgraph Deployment

## 介绍
indexer
  indexer 是Graph 网络中的节点运营者，质押GRT提供索引和查询处理服务。 indexer 赚取查询费用和索引奖励。他们赚取回扣池，
  该回扣池与所有网络贡献者按他们的工作比例共享，遵循柯布斯-道格拉斯回扣函数。
  协议中的GRT将会有一个冻结期，如果Indexers恶意向应用程序提供不正确的数据，或者索引不正确，GRT可能会被罚没。indexer也可以从委派者那里获得股份，为网络做出贡献。

Delegation
   委托token给indexer
   奖励方式：
   1. Indexing Reward Cut
   2. Query Fee Cut

Curators
   signaling



## 参考链接
- 成本模型：https://github.com/graphprotocol/agora
openzeppelin: https://blog.openzeppelin.com/subgraphs-announcement/
- 整体介绍：https://wavefive.notion.site/The-Graph-Protocol-Indexer-Subgraph-Selection-Guide-725f6e575f6e4024ad7e50f2f4e9bbad
- 官方文档：https://thegraph.com/docs/curating
- 索引文档：https://bihu.com/article/1634618544?i=1xP0&c=1&s=1MCGXe 