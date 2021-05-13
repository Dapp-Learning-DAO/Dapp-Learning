## graph

   编写智能合约时，通常状态的变化是通过触发一个事件来表达，The Graph 则是捕捉区块链事件并提供一个查询事件的 GraphQL 接口，让我们可以方便的跟踪数据的变化。实际上很多defi协议及都是 The Graph 来基于查询数据。
   官方文档： https://thegraph.com/docs/introduction
   
   本项目参考文档： https://mp.weixin.qq.com/s/DlC5jAS_CzXuOZFmmveNXA
   
    - 在 Ropsten 部署一个合约，并调用触发事件。
    - 创建定义数据索引的 Subgraph。
    - 部署 Subgraph 到 TheGraph，实现数据索引。
    - 在前端 DApp 中查询索引数据。
  
 如果你有自己的私有链，这可以克隆 Graph 节点代码（https://github.com/graphprotocol/graph-node/），自己运行Graph节点来完成数据的索引。

   TheGraph 中定义如何为数据建立索引，称为 Subgraph，它包含三个组件：  
   Manifest 清单(subgraph.yaml) - 定义配置项
   Schema 模式(schema.graphql) - 定义数据
   Mapping 映射(mapping.ts) - 定义事件到数据的转换 
   
 ### 使用流程
 初始化配置：
 ```
  graph init <GITHUB_USERNAME>/<SUBGRAPH_NAME> <DIRECTORY>
```
 
 contractAddress: 0x1c61e5c4e7c7d531df88924ba64d80248e010093
   
   

