中文 / [English](./README.md)

## Graph 介绍

编写智能合约时，通常状态的变化是通过触发一个事件来表达，The Graph 则是捕捉区块链事件并提供一个查询事件的 GraphQL 接口，让我们可以方便的跟踪数据的变化。实际上很多 defi 协议都是 The Graph 来基于查询数据。

## 流程概述

- 在 Goerli 部署一个合约，并调用触发事件。
- 创建定义数据索引的 Subgraph。
- 部署 Subgraph 到 TheGraph，实现数据索引。
- 在前端 DApp 中查询索引数据。

如果你有自己的私有链，这可以克隆 Graph 节点代码 https://github.com/graphprotocol/graph-node/ 自己运行 Graph 节点来完成数据的索引。

TheGraph 中定义如何为数据建立索引，称为 Subgraph，它包含三个组件：

- Manifest 清单(subgraph.yaml) - 定义配置项
- Schema 模式(schema.graphql) - 定义数据 , 参考文档 https://graphql.cn/learn/
- Mapping 映射(mapping.ts) - 定义事件到数据的转换

## 操作步骤

1. 安装相关依赖

   ```bash
   npm install
  
    #node版本 v20.11.0
   ```

2. 配置私钥

   为方便获取，在 .env 中放入的私钥，格式为 "PRIVATE_KEY=xxxx", 然后代码自动从中读取<br>
   另外需要设置你的 infura 节点 id，在 .env 中放入的私钥，格式为 "INFURA_ID=xxxx"

3. 部署合约(用于测试 graph 的简单合约)

   ```bash
   npx hardhat run ./scripts/deploy.js --network sepolia
   ```

   输出信息类似如下:

   ```bash
   Deploying contracts with the account: xxxxxxxxxxxxxx
   Account balance: 10000000000000000000000
   Token address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
   Transfer 50 to receiver  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   Account balance of receiver is:  50
   ```

4. TheGraph 创建一个 Subgraph 空间

   因为需要借助 TheGraph 的节点来完成数据的索引，因此我们需要在 [TheGraph Studio](https://thegraph.com/studio/) 上创建一个 Subgraph。

   如果没有 The Graph 的账户，可以直接连接钱包注册，账户名即为钱包地址，以下称之为 `<THEGRAPH_USERNAME>`。

   批准钱包签名之后，会跳转到 `My Subgraphs` 面板，点击 `Create a Subgraph` 按钮。
   <center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/08-hardhat-graph/create_subgraph_btn.png?raw=true" /></center>

   输入你的项目名称(例如 TEST01)，以下称之为 `<SUBGRAPH_NAME>`，点击 continue 按钮，之后会跳转到 subgraph 的项目主页

   注：最新版的 Graph CLI 仅支持在 mainnet 和 goerli 上部署，若要在其他网络上使用，需要使用 Github 账户登录后在 Hosted Service 上创建和部署

5. 开发和部署 subgraph

   先使用 yarn 在全局安装 Graph CLI

   ```bash
   yarn global add @graphprotocol/graph-cli
   ```

6. 初始化配置:

   ```bash
   graph init --studio <SUBGRAPH_NAME>
   ```

   若使用 Hosted Service，则初始化命令如下：

   ```bash
   graph init --product hosted-service <GITHUB_USER>/<SUBGRAPH NAME>
   ```

  - Protocol 选择ethereum
   - 在 "Subgraph slug" 和 "Directory to create the subgraph" 直接回车即可
   - Ethereum network 这里选择 sepolia
   - "Contract address" 这里输入在步骤 3 中部署合约时生成的合约地址
   - 上面执行到 "fetch ABI from Etherscan" 时会报执行失败，然后出现 "ABI file (path)" 字样，提示输入本机中 abi 的文件路径，这里我们输入 SimpleToken.json 所在的路径即可(`./abis/SimpleToken.json`)
   。如果已经成功执行 07-hardhat , 同时在hardhat.config.js 里配置了ethescan,此处执行会通过
   -"fetch Start Block"执行失败后，retry输入n,“Start Block”，“Contract Name”默认回车。 “Add another contract?” 输入n
   - 如果 yarn install 失败(例如网络错误)，可以进入新生成的项目目录，手动安装 npm 依赖

7. 修改定义模式

   - 两个文件的修改范例在 `./scripts/schema.graphql` 和 `./scripts/mapping.ts`

   - `<SUBGRAPH_NAME>/schema.graphql` 修改文件内容如下

     ```graphql
     type TransferEntity @entity {
       id: ID!
       from: Bytes! # address
       to: Bytes! # address
       value: BigInt!
     }

     type ApprovalEntity @entity {
       id: ID!
       owner: Bytes! # address
       spender: Bytes! # address
       value: BigInt!
     }
     ```

   - `<SUBGRAPH_NAME>/src/mapping.ts` 修改文件内容如下

     ```ts
     import { BigInt } from '@graphprotocol/graph-ts';
     import { SimpleToken, Transfer, Approval } from '../generated/SimpleToken/SimpleToken';
     import { TransferEntity, ApprovalEntity } from '../generated/schema';

     export function handleTransfer(event: Transfer): void {
       // Entities can be loaded from the store using a string ID; this ID
       // needs to be unique across all entities of the same type
       let entity = TransferEntity.load(event.transaction.from.toHex());

       // Entities only exist after they have been saved to the store;
       // `null` checks allow to create entities on demand
       if (entity == null) {
         entity = new TransferEntity(event.transaction.from.toHex());
       }

       // BigInt and BigDecimal math are supported
       entity.value = event.params.value;

       // Entity fields can be set based on event parameters
       entity.from = event.params.from;
       entity.to = event.params.to;

       // Entities can be written to the store with `.save()`
       entity.save();

       // Note: If a handler doesn't require existing field values, it is faster
       // _not_ to load the entity from the store. Instead, create it fresh with
       // `new Entity(...)`, set the fields that should be updated and save the
       // entity back to the store. Fields that were not set or unset remain
       // unchanged, allowing for partial updates to be applied.

       // It is also possible to access smart contracts from mappings. For
       // example, the contract that has emitted the event can be connected to
       // with:
       //
       // let contract = Contract.bind(event.address)
       //
       // The following functions can then be called on this contract to access
       // state variables and other data:
       //
       // - contract.approve(...)
       // - contract.totalSupply(...)
       // - contract.transferFrom(...)
       // - contract.increaseAllowance(...)
       // - contract.balanceOf(...)
       // - contract.decreaseAllowance(...)
       // - contract.transfer(...)
       // - contract.allowance(...)
     }

     export function handleApproval(event: Approval): void {
       // Entities can be loaded from the store using a string ID; this ID
       // needs to be unique across all entities of the same type
       let entity = ApprovalEntity.load(event.transaction.from.toHex());

       // Entities only exist after they have been saved to the store;
       // `null` checks allow to create entities on demand
       if (entity == null) {
         entity = new ApprovalEntity(event.transaction.from.toHex());
       }

       // BigInt and BigDecimal math are supported
       entity.value = event.params.value;

       // Entity fields can be set based on event parameters
       entity.owner = event.params.owner;
       entity.spender = event.params.spender;

       // Entities can be written to the store with `.save()`
       entity.save();
     }
     ```

8. 修改实体名字

   - 进入 graphtest 目录
   - 修改 subgraph.yaml 中 entities 定义如下

   ```yaml
   ---
   entities:
     - TransferEntity
     - ApprovalEntity
   ```

9. 授权和部署 Subgraph

   首先获取你的 `<DEPLOY KEY>`，在你的 subgraph 项目主页可以找到：
   <center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/08-hardhat-graph/auth_deploy_key.png?raw=true" /></center>

   - 授权

     ```bash
     graph auth --studio <DEPLOY KEY>

     #注意需要按截图所示点击copy key按钮，并替换<DEPLOY KEY> , 不要直接copy 官网右侧的代码，因为key不全
     ```

     若使用 Hosted Service，则初始化命令如下：

     ```bash
     graph auth --product hosted-service <ACCESS_TOKEN>
     ```

   - 进入 subgraph 的本地目录

     ```bash
     cd ./<SUBGRAPH_NAME>
     ```

   - BUILD SUBGRAPH

     ```bash
     graph codegen && graph build
     ```

   - DEPLOY SUBGRAPH

     ```bash
     graph deploy --studio <SUBGRAPH_NAME>
     ```

     若使用 Hosted Service，则初始化命令如下：

     ```bash
     graph deploy --product hosted-service <GITHUB_USER>/<SUBGRAPH NAME>
     ```

     - 这里必须输入 `Version Label` , 比如`0.0.1`， 否则会报错提示 `You must provide a version label.`

## 检验 subgraph 是否部署成功

从 subgraphs 面板进入你的 subgraph 项目主页， 查看索引进度，当进度 100%可以开始调用。

这里已经预生成了一个示例请求，点击播放按钮即可请求数据。至此 subgraph 部署成功

<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/08-hardhat-graph/query_subgraph.png?raw=true" /></center>

## Graph Node 本地搭建

1. 搭建 graph-node
   出于便捷的考虑，我们使用官方提供的 docker compose 来进行节点、数据库、IPFS 的部署。

- 克隆 graph node( https://github.com/graphprotocol/graph-node/ )代码
- 进入 docker 目录
- 将 docker-compose.yml 中 ethereum 字段的值改为需要连接链的节点连接信息。

注意：如果是最新的 mac（big sur 系统）,在安装 docker 的时候，不能使用 brew cask install docker 命令，具体原因参考链接：https://www.jianshu.com/p/50037be9c00d

```yaml
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
    ethereum: 'mainnet:http://127.0.0.1:8545' #此处的mainnet需要和subgraph.yml里network对应上
    # ethereum: 'dev:https://sepolia.infura.io/v3/INFURA_ID' # 也可以连测试网络
    RUST_LOG: info
```

> 注意 1: graph-node 连接的节点需要开启 archive 模式（启动节点时，添加 flag --syncmode full --gcmode archive）。
> 注意 2: 当需要在一个机器中启动多个 graph-node, 并且每个 graph-node 连接到不同的链时，只需要在 docker-compose.yml 添加对应的 graph-node service 即可。如下，配置里 sepolia 和 optimism 的 graph node 服务，同时修改 graph-node-optimism 对外暴露的端口为 8100，8101，8120，8130，8140。修改的时候特别需要注意的是，只能修改暴露的本地端口 (8100/8101/8120/8130/8140), 容器内部的端口 (8000/8001/8020/8030/8040) 千万不要修改，不然会启动报错

```yaml
version: '3'
services:
  graph-node-sepolia:
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
    extra_hosts:
      - host.docker.internal:host-gateway
    environment:
      postgres_host: postgres
      postgres_user: graph-node
      postgres_pass: let-me-in
      postgres_db: graph-node
      ipfs: 'ipfs:5001'
      ethereum: 'sepolia:http://infura.sepolia.com/xxxx'
      GRAPH_LOG: info
  graph-node-optimism:
    image: graphprotocol/graph-node
    ports:
      - '8100:8000'
      - '8101:8001'
      - '8120:8020'
      - '8130:8030'
      - '8140:8040'
    depends_on:
      - ipfs
      - postgres
    extra_hosts:
      - host.docker.internal:host-gateway
    environment:
      postgres_host: postgres
      postgres_user: graph-node
      postgres_pass: let-me-in
      postgres_db: graph-node
      ipfs: 'ipfs:5001'
      ethereum: 'optimism:http://infura.optimism.com/yyy'
      GRAPH_LOG: info
  ipfs:
    image: ipfs/kubo:v0.17.0
    ports:
      - '5001:5001'
    volumes:
      - ./data/ipfs:/data/ipfs:Z
```

2. graph-node 启动

直接使用 docker compose 来进行启动

```bash
docker-compose -f docker-compose.yml up -d
```

3. 编译 subgraph  
   进入 subgraph 的本地目录运行下列命令

   由于在前一步骤执行过命令 npx hardhat run ./scripts/deploy.js --network sepolia

   因此，此处修改 subgraph.yaml，修改内容如下：

```bash
dataSources:
  - kind: ethereum/contract
    name: SimpleToken
    network: sepolia

```

```bash
graph codegen --output-dir src/types/
graph build
```

4. 部署 subgraph

```bash
graph create davekaj/SimpleToken --node http://127.0.0.1:8020

graph deploy davekaj/SimpleToken --debug --ipfs http://localhost:5001 --node http://127.0.0.1:8020
```

5. 可以使用 GraphQL 来进行查询数据。

## subgraph

subgraph 定义了你希望通过 GraphQL API 提供的数据、数据源和数据访问模式。开发者可以选择直接使用别人已经部署[17]的 subgraph，或者自己定义并部署 subgraph。

1. GraphQL Schema  
   GraphQL Schema 定义了你想保存和查询的数据类型/实体。也可定义如关系或全文搜索的配置项。
2. subgraph 清单（ yaml 配置）  
   manifest 定义了 subgraph 索引的智能合约、合约的 ABI、关注这些合约的事件，以及如何将事件数据映射到 Graph 节点存储并允许查询。
3. AssemblyScript 映射  
   AssemblyScript 映射允许您使用 schema 中定义的实体类型保存要索引的数据。Graph CLI 还使用 schema 与智能合约的 ABI 的组合生成 AssemblyScript 类型。
4. 通过@derivedFrom 建立关系  
   通过@derivedFrom 字段在实体上定义反向查询，这样就在实体上创建了一个虚拟字段，使它可以被查询，但不能通过映射 API 手动设置。实际上，这是从另一个实体上定义的关系中衍生出来的。这样的关系，对存储关系的两者意义不大，如果只存储一方而派生另一方，则索引和查询性能都会更好。

## Thegraph 的同类产品  
除了 Thegraph, 还有其他同类的产品，以便我们可以根据产品特点，费用等选择最优的产品。  

### Alchemy  
Alchemy 也提供了 Subgraph 功能，用户可以轻松的从 Thegraph 上把 Subgraph 迁移到 Alchemy 上来。 

- 部署  
部署流程和 thegraph host service 流程一样，编写完 ts 代码后进行 codegen、build，最后deploy 的时候需要输入 deploy-key 这个参数，这个 key 需要在 Dashboard 界面获取

<center><img src="https://github.com/yingjingyang/Imgs-for-tasks-01/blob/main/basic-task/task-08/Alchemy_Subgraph.jpg?raw=true" /></center>

参考: https://docs.alchemy.com/reference/subgraphs-quickstart   


2. Alchemy Subgraph Pricing  
默认情况下，使用的是 Free Plan， 对于开发者自己使用是足够的，当用于项目时，需要升级 Plan，解锁更都的查询次数  

<center><img src="https://github.com/yingjingyang/Imgs-for-tasks-01/blob/main/basic-task/task-08/Alchemy_Pricing.jpg?raw=true" /></center>        


3. Thegraph Pricing    
Growth Plan 一个月 $49, 有 100,0000 的查询次数，平均 $0.000049/次，而 thegraph 查询 100,0000 次，需要约 186 GRT,  GRT 按照 $0.2 计算的话，thegraph 平均 $0.000037/次  

<center><img src="https://github.com/yingjingyang/Imgs-for-tasks-01/blob/main/basic-task/task-08/Thegraph_Pricing.jpg?raw=true" /></center>

参考：https://www.alchemy.com/pricing


### Envio  
1. 本地构建  
使用 `envio init` 初始化项目目录，然后使用 `envio dev` 启动本地 Indexer。
envio 本地 indexer 启动很快，启动后便可通过 [http://localhost:8080/](http://localhost:8080/console) 进行访问  

<center><img src="https://github.com/yingjingyang/Imgs-for-tasks-01/blob/main/basic-task/task-08/envio_start.jpg?raw=true" /></center>   

2. 部署 Host Service   
把使用 envio init 初始化后的项目上传到 github, 然后对授权这个 repo 的访问权限个 envio，那么提交 commit 后，envio 就会自动进行部署  

<center><img src="https://github.com/yingjingyang/Imgs-for-tasks-01/blob/main/basic-task/task-08/envio_init.jpg?raw=true" /></center>  

3. 部署成功
部署成功后，即可在 envio 的 Host Service 处查看访问   
<center><img src="https://github.com/yingjingyang/Imgs-for-tasks-01/blob/main/basic-task/task-08/envio_dashboard.jpg?raw=true" /></center>  

参考：https://docs.envio.dev/docs/HyperIndex/hosted-service-deployment


#### Envio 优势  
- 本地构建速度很快  
- Host Service 目前是免费使用  

### Ponder  
1. 本地构建  
Ponder 也可以本地进行构建，但是他需要使用 Ethereum RPC 到节点去获取数据，类似 Alchemy 的 subgraph ，受限于 Ethereum RPC 节点的访问频率。官方网站推荐使用 Alchemy 的 RPC， 但根据上面介绍的，Alchemy 的 RPC 有访问限制  

<center><img src="https://github.com/yingjingyang/Imgs-for-tasks-01/blob/main/basic-task/task-08/ponder_build.jpg?raw=true" /></center> 

2. Host Service 构建  
目前 ponder 只在 [Railway](https://railway.app/) 上进行了全面的测试兼容，对于其他的平台，没有进行完整的测试。

参考：https://ponder.sh/docs/production/deploy   

#### Ponder 不足  
1. 本地构建的时候，在 .env.local 文件中需要输入 `PONDER_RPC_URL_1` 变量，用以拉取 Ethereum node 数据。这里使用 infura 或是 Alchemy 的 PRC_URL 都是有 limite_rate 限制的  
2. 对于 Uniswap V2, V3 这类的 factory 合约，只支持监听 10,000 个子合约。同时当工厂合约发出事件创建子合约的时候，event 事件里面的数值类型不能是 array 或是 struct
3. 开发 subgraph 的结构与语法不同与 thegraph, 对于已有 subgraph 进行迁移的话，需要重新进行适配  



## 参考文档

官方文档：

- https://thegraph.com/docs/developer/quick-start  
- https://edgeandnode.notion.site/The-Graph-Chinese-Links-803371459c6f402aba32a22467acda32#13589dfd8041445380731860c4b4e029  

本项目参考文档：

- https://mp.weixin.qq.com/s/DlC5jAS_CzXuOZFmmveNXA
- https://mp.weixin.qq.com/s/LhdAREmhXSHxIaVfhcJQ_g
- https://dev.to/dabit3/building-graphql-apis-on-ethereum-4poa
- https://learnblockchain.cn/article/2566
- https://blog.openzeppelin.com/subgraphs-announcement  
  OpenZeppelin subgraphs 库: 为常用的 OpenZeppelin 合约建立 subgraphs
- https://github.com/graphprotocol/agora  
  成本模型
- Subgraph 选择指南(分析节点成本，收益以及应该索引哪些 Subgraph):  
  <https://wavefive.notion.site/The-Graph-Protocol-Indexer-Subgraph-Selection-Guide-725f6e575f6e4024ad7e50f2f4e9bbad>

其他相关参考文档：

- https://thegraph.com/
- https://graphql.cn/learn/
- https://gql-guide.vercel.app/
- https://thegraph.com/docs/graphql-api  
  GraphGen——命令行工具，用于快速生成子图，由一些有 GraphGen 命令注释的 Solidity 接口文件组成。
- https://medium.com/protean-labs/introducing-graphgen-a-subgraph-generator-for-the-graph-network-836fe0385336

- Matchstick ——是 Limechain 做一个开发的单元测试框架，一个 graph 模拟节点，用于在沙盒环境中测试子图部署的映射逻辑  
  相关教程：https://limechain.tech/blog/matchstick-what-it-is-and-how-to-use-it/
