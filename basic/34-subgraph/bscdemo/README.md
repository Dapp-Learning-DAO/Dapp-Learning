# 从零开始搭建Graph Node通过 GraphQL 从区块链查询复杂数据

>关键词
>
>1. *GraphQL*
>2. 区块链
>3. 以太坊
>4. yarn

## 一、什么是graph

Graph 是一种去中心化协议，用于从以太坊开始索引和查询区块链中的数据。它使查询难以直接查询的数据成为可能。

[Uniswap](https://uniswap.org/)等具有复杂智能合约的项目和[Bored Ape Yacht Club](https://boredapeyachtclub.com/)等 NFT 计划将数据存储在以太坊区块链上，这使得直接从区块链读取基本数据以外的任何内容变得非常困难。

在 Bored Ape Yacht Club 的情况下，我们可以对[合约](https://etherscan.io/address/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d#code)执行基本的读取操作，例如获取某个 Ape 的所有者，根据 Ape 的 ID 或总供应量获取 Ape 的内容 URI，因为这些读取操作是经过编程的直接进入智能合约，但更高级的现实世界查询和操作，如聚合、搜索、关系和非平凡过滤是不可能的。例如，如果我们想查询某个地址拥有的猿类，并根据其特征之一进行过滤，我们将无法通过直接与合约本身交互来获取该信息。

要获取此数据，您必须处理[`transfer`](https://etherscan.io/address/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d#code#L1746)曾经发出的每个事件，使用令牌 ID 和 IPFS 哈希从 IPFS 读取元数据，然后对其进行聚合。即使对于这些类型相对简单的问题，运行在浏览器中的去中心化应用程序（dapp）也需要**数小时甚至数天**才能得到答案。

您还可以构建自己的服务器，在那里处理事务，将它们保存到数据库中，并在其上构建 API 端点以查询数据。但是，此选项是资源密集型的，需要维护，存在单点故障，并且破坏了去中心化所需的重要安全属性。

**索引区块链数据真的非常非常困难。**

区块链属性，如终结性、链重组或未处理的块，使这个过程进一步复杂化，不仅耗时，而且在概念上很难从区块链数据中检索正确的查询结果。

The Graph 通过去中心化协议解决了这个问题，该协议可以索引并实现对区块链数据的高性能和高效查询。然后可以使用标准 GraphQL API 查询这些 API（索引“子图”）。今天，有一个托管服务以及一个具有相同功能的去中心化协议。两者都由[Graph Node 的](https://github.com/graphprotocol/graph-node)开源实现支持。

**原理**

[![Data Flow Diagram](https://github.com/graphprotocol/graph-node/raw/master/docs/images/TheGraph_DataFlowDiagram.png)](https://github.com/graphprotocol/graph-node/blob/master/docs/images/TheGraph_DataFlowDiagram.png)

## 二、创建第一个Subgraph子图

本示例，我将在本地搭建graph node 节点实现跟踪bsc测试链所有区块信息。

### 准备

1. 一个有事件函数的合约，此示例使用bsc测试区块链的系统合约 “0x0000000000000000000000000000000000001000”
   + [合约地址](https://testnet.bscscan.com/address/0x0000000000000000000000000000000000001000)
2. graph node
3. graph-cli
4. node.js 
   + node  -v: v14.17.3
   + yarn -v: 1.22.10

### graph-node

**安装[graph-node](https://github.com/graphprotocol/graph-node)**。

安装方式分为两种:

​	一种是Rust 源码安装，

​	一种是docker安装（本示例以docker安装为例）

首先

```shell
git clone https://github.com/graphprotocol/graph-node.git
```

clone后进入项目文件夹

```shell
cd graph-node
```

进入docker文件夹

```
cd docker
```

因为我们想追踪BSC测试链，所以需要修改docker-compose.yaml 的配置

```
version: '3'
services:
  graph-node:
    image: graphprotocol/graph-node
    ports:
      - '8000:8000'
      - '8001:8001'
      - '8020:8020'
      - '8030:8030'
      - '8040:8040'
    depends_on:
      - ipfs
      - postgres
    environment:
      postgres_host: postgres
      postgres_user: graph-node
      postgres_pass: let-me-in
      postgres_db: graph-node
      ipfs: 'ipfs:5001'
      ethereum: 'bsc:https://data-seed-prebsc-1-s1.binance.org:8545'
      GRAPH_LOG: info
  ipfs:
    image: ipfs/go-ipfs:v0.4.23
    ports:
      - '5001:5001'
    volumes:
      - ./data/ipfs:/data/ipfs
  postgres:
    image: postgres
    ports:
      - '5432:5432'
    command: ["postgres", "-cshared_preload_libraries=pg_stat_statements"]
    environment:
      POSTGRES_USER: graph-node
      POSTGRES_PASSWORD: let-me-in
      POSTGRES_DB: graph-node
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
```



将```  ethereum: 'mainnet:http://host.docker.internal:8545'``` 修改成BSC测试链的RPC地址```ethereum: 'bsc:https://data-seed-prebsc-1-s1.binance.org:8545'```

```
docker-compose up
```

🎉安装完成。（它需要打开端口 4001、5001、8000、8001、8020、8080 和 5432，因为它将启动一个 postgre sql、一个 ipfs 本地节点和 Graph 节点本身，出现报错首先排查端口是否被占用。）




### 定义我们的graph

1. 创建一个新的节点项目。

   ```
   mkdir bscdemo && cd bscdemo
   ```

2. 我推荐使用 yarn初始化项目， npm 也可以：

   ```
   yarn init
   ```

3. 初始化完成后，编写脚本安装依赖，复制到package.json文件中

   这里面有个坑，注意组件的版本，最新版本部署时会出现apiVersion 错误。

    ```
    "scripts": {
       "codegen": "graph codegen --output-dir generated/",
       "build": "graph build",
       "create-local": "graph create myBSCGraph --node http://127.0.0.1:8020",
       "deploy-local": "graph deploy myBSCGraph --debug --ipfs http://localhost:5001 --node http://127.0.0.1:8020/"
     },
     "devDependencies": {
       "@graphprotocol/graph-cli": "^0.21.0",
       "@graphprotocol/graph-ts": "^0.20.0"
     }
    ```

4. 创建文件夹abis，存储合约的abi文件

   ```
   mkdir abis && touch BSCValidatorSet.json
   ```

打开[合约地址](https://testnet.bscscan.com/address/0x0000000000000000000000000000000000001000) 复制ABI到我们创建的json文件中。

5. 创建映射文件夹

   ```
   mkdir mappings && touch index.ts
   ```

   将监听事件的方法粘贴到index.ts中，

   ```
   /* eslint-disable prefer-const */
   import { ethereum } from "@graphprotocol/graph-ts";
   import { Block } from "../generated/schema";
   
   export function handleBlock(block: ethereum.Block): void {
     let entity = new Block(block.hash.toHex());
     entity.parentHash = block.parentHash;
     entity.unclesHash = block.unclesHash;
     entity.author = block.author;
     entity.stateRoot = block.stateRoot;
     entity.transactionsRoot = block.transactionsRoot;
     entity.receiptsRoot = block.receiptsRoot;
     entity.number = block.number;
     entity.gasUsed = block.gasUsed;
     entity.gasLimit = block.gasLimit;
     entity.timestamp = block.timestamp;
     entity.difficulty = block.difficulty;
     entity.totalDifficulty = block.totalDifficulty;
     entity.size = block.size;
     entity.save();
   }
   ```

   此时会编辑器会提示错误，暂时不用管。

6. 创建一个subgraph.yaml文件来描述subgraph

   ```
   specVersion: 0.0.2
   description: Binance Smart Chain TestNet Blocks
   repository: https://github.com/pancakeswap
   schema:
     file: ./schema.graphql
   dataSources:
     - kind: ethereum/contract
       name: BSCValidatorSet
       network: bsc
       source:
         address: "0x0000000000000000000000000000000000001000"
         abi: BSCValidatorSet
       mapping:
         kind: ethereum/events
         apiVersion: 0.0.4
         language: wasm/assemblyscript
         file: ./mappings/index.ts
         entities:
           - Block
         abis:
           - name: BSCValidatorSet
             file: ./abis/BSCValidatorSet.json
         blockHandlers:
           - handler: handleBlock
   
   ```

7. 创建一个schema.graphql描述 SubGraph 使用GraphQl查询实体。

   ```
   """
   Binance Smart Chain TestNet blocks
   """
   type Block @entity {
       "ID (hash)"
       id: ID!
       "Parent Hash"
       parentHash: Bytes!
       "Uncles Hash"
       unclesHash: Bytes!
       "Author"
       author: Bytes!
       "State Root"
       stateRoot: Bytes!
       "Transactions Root"
       transactionsRoot: Bytes!
       "Receipts Root"
       receiptsRoot: Bytes!
       "Number"
       number: BigInt!
       "Gas Used"
       gasUsed: BigInt!
       "Gas Limit"
       gasLimit: BigInt!
       "Timestamp"
       timestamp: BigInt!
       "Difficulty"
       difficulty: BigInt!
       "Total Difficulty"
       totalDifficulty: BigInt!
       "Size"
       size: BigInt
   }
   ```

   至此所有的准备完成。

## 三、部署我们的graph

1. 安装graph-cli

   ```
   yarn global add @graphprotocol/graph-cli
   ```

2. 安装依赖

   ```
   yarn && yarn codegen
   ```

   ![image-20211104180150595](/Users/yyhaier/Documents/%E5%85%AC%E5%8F%B8%E9%A1%B9%E7%9B%AE/%E4%BB%8E%E9%9B%B6%E5%BC%80%E5%A7%8B%E6%90%AD%E5%BB%BAGraph%20Node%E9%80%9A%E8%BF%87%20GraphQL%20%E4%BB%8E%E5%8C%BA%E5%9D%97%E9%93%BE%E6%9F%A5%E8%AF%A2%E5%A4%8D%E6%9D%82%E6%95%B0%E6%8D%AE.assets/image-20211104180150595.png)

3. 分配subgraph 名字

   ```
   yarn create-local
   ```

   ![image-20211104180251303](/Users/yyhaier/Documents/%E5%85%AC%E5%8F%B8%E9%A1%B9%E7%9B%AE/%E4%BB%8E%E9%9B%B6%E5%BC%80%E5%A7%8B%E6%90%AD%E5%BB%BAGraph%20Node%E9%80%9A%E8%BF%87%20GraphQL%20%E4%BB%8E%E5%8C%BA%E5%9D%97%E9%93%BE%E6%9F%A5%E8%AF%A2%E5%A4%8D%E6%9D%82%E6%95%B0%E6%8D%AE.assets/image-20211104180251303-6020172.png)

4. 本地部署

   ```
   yarn deploy-local
   ```

   ![image-20211104180333944](/Users/yyhaier/Documents/%E5%85%AC%E5%8F%B8%E9%A1%B9%E7%9B%AE/%E4%BB%8E%E9%9B%B6%E5%BC%80%E5%A7%8B%E6%90%AD%E5%BB%BAGraph%20Node%E9%80%9A%E8%BF%87%20GraphQL%20%E4%BB%8E%E5%8C%BA%E5%9D%97%E9%93%BE%E6%9F%A5%E8%AF%A2%E5%A4%8D%E6%9D%82%E6%95%B0%E6%8D%AE.assets/image-20211104180333944-6020214.png)

至此部署完成。

## 四、测试

打开GraphQl图形化界面 “http://127.0.0.1:8000/subgraphs/name/myBSCGraph”

![image-20211104180550974](/Users/yyhaier/Documents/%E5%85%AC%E5%8F%B8%E9%A1%B9%E7%9B%AE/%E4%BB%8E%E9%9B%B6%E5%BC%80%E5%A7%8B%E6%90%AD%E5%BB%BAGraph%20Node%E9%80%9A%E8%BF%87%20GraphQL%20%E4%BB%8E%E5%8C%BA%E5%9D%97%E9%93%BE%E6%9F%A5%E8%AF%A2%E5%A4%8D%E6%9D%82%E6%95%B0%E6%8D%AE.assets/image-20211104180550974-6020352.png)

随机选一组数据进行验证，例如：第[21004](https://testnet.bscscan.com/block/21004)区块

![image-20211104180700191](/Users/yyhaier/Documents/%E5%85%AC%E5%8F%B8%E9%A1%B9%E7%9B%AE/%E4%BB%8E%E9%9B%B6%E5%BC%80%E5%A7%8B%E6%90%AD%E5%BB%BAGraph%20Node%E9%80%9A%E8%BF%87%20GraphQL%20%E4%BB%8E%E5%8C%BA%E5%9D%97%E9%93%BE%E6%9F%A5%E8%AF%A2%E5%A4%8D%E6%9D%82%E6%95%B0%E6%8D%AE.assets/image-20211104180700191-6020421.png)

完成。🎉



## 参考文献

**连接地址如下**

1. https://thegraph.com/docs/developer/quick-start
2. https://medium.com/blockrocket/dapp-development-with-a-local-subgraph-ganache-setup-566a4d4cbb
3. https://www.chainnews.com/articles/907413969684.htm
4. https://thegraph.academy/developers/local-development/
5. https://github.com/dabit3/building-a-subgraph-workshop
6. https://medium.com/intech-conseil-expertise/create-your-graph-node-to-query-complex-data-from-blockchain-via-graphql-6f08fbd494c5
7. https://github.com/graphprotocol/example-subgraph
8. https://ethereum.stackexchange.com/questions/99409/failed-to-deploy-to-graph-node-ethereum-network-not-supported-by-registrar-mai
9. https://www.chainnews.com/articles/907413969684.htm



