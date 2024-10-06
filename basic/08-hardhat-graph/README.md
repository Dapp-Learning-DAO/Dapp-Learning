[中文](./README-CN.md) / English

## Introduction of Graph

When coding smart contract, the change of status is usually expressed by triggering a event. The Graph is a GraphQL interface for capturing the chain events and provide a query event, it can track changes in data. Actually, many kinds of defi is based on The Graph to query data.

## Overview of steps

- deploy the contract on Goerli and call trigger event.
- create Subgraph that defines the data index.
- deploy Subgraph to TheGraph for data indexing
- query and index data in DApp

If you has a private chain, you can clone Graph node code https://github.com/graphprotocol/graph-node/ and finish data indexing by maintain your own Graph node.

TheGraph defines that how to create data index, which is called Subgraph, including three components:

- MainFest (subgraph.yaml) - define config
- Schema mode(schema.graphq1) - define data, reference https://graphql.cn/learn/
- Mapping (mapping.ts) - define the convertion between event and data

## Steps

1. Install related dependencies

   ```bash
   npm install

   #node version v20.11.0
   ```

2. Configure the private key

   You should add private key in `.env` that formatted with "PRIVATE_KEY=xxxx", which read from the code. You also need to set your infura node id, add private key in `.env` that formatted with "INFURA_ID=xxxx"

3. Deploy contracts(testing graph's simple contracts)

   ```bash
   npx hardhat run ./scripts/deploy.js --network sepolia
   ```

   print info as follows:

   ```bash
   Deploying contracts with the account: xxxxxxxxxxxxxx
   Account balance: 10000000000000000000000
   Token address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
   Transfer 50 to receiver  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   Account balance of receiver is:  50
   ```

4. TheGraph create a space of Subgraph

   We have to index data by the node of TheGraph, so we need to create a Subgraph on [TheGraph Studio](https://thegraph.com/studio/).
   If lacking of a account of TheGraph, you can connect to wallet to register. The account name is address of wallet, the following is called `<THEGRAPH_USERNAME>`.

   After approving the signature of wallet, it will jump to the "My Subgraphs" panel and click `Create a Subgraph` button.
   <center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/08-hardhat-graph/create_subgraph_btn.png?raw=true" /></center>

   Input your project name(e.x. TEST01), it will be called `<SUBGRAPH_NAME>` as follows. Clicking continue button, then it will jump to subgraph which is the main page of project.

   Note: latest Graph CLI only support to deploy mainnet and goerli. If you want to use it on the others networks, you need to login by Github account, then create and deploy it on Hosted Service.

5. Develop and deploy subgraph

   use yarn to install Graph CLI globally

   ```bash
   yarn global add @graphprotocol/graph-cli
   ```

6. Initialize configuration:

   ```bash
   graph init --studio <SUBGRAPH_NAME>
   ```

   If using Hosted Service, the initializing command is as follows:

   ```bash
   graph init --product hosted-service <GITHUB_USER>/<SUBGRAPH NAME>
   ```
   - Protocol Select Ethereum
   - choose "Subgraph name" and "Direction to create the subgraph", then enter it.
   - choose sepolia in Ethereum network
   - input your contract address generated when the contract was deployed in Step 3 in "Contract address"
   - When it came to "fetch ABI from Etherscan", it will fail, then show "ABI file (path)" which prompt that input the path of abi, we should input the path of SimpleToken.json(`./abis/SimpleToken.json`)
   . If task 07-hardhat has been successfully executed and ethyscan has been configured in hardhat.config.js, the execution here will pass through
   -After the "fetch Start Block" execution fails, enter n for retry, "Start Block", and "Contract Name" default to carriage return. "Add another contract?" Enter n
   - If yarn install fails (network error), you can enter in the new directory and install npm dependencies manually.

7. Modify the mode of defining

   - modifying template in `./scripts/schema.graphql` and `./scripts/mapping.ts`

   - `<SUBGRAPH_NAME>/schema.graphql` the modified content as follows:

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

   - `<SUBGRAPH_NAME>/src/mapping.ts` the modified content as follows:

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

8. Modify the name of entity

   - enter graphtest directory
   - modify entities in subgraph.yaml:

   ```yaml
   ---
   entities:
     - TransferEntity
     - ApprovalEntity
   ```

9. Authorize and deploy Subgraph

   Get your `<DEPLOY KEY>` first, find it in your home page of subgraph:
   <center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/08-hardhat-graph/auth_deploy_key.png?raw=true" /></center>

   - Authorize

     ```bash
     graph auth --studio <DEPLOY KEY>
     ```

     If use Hosted Service, the initing command is as follows:

     ```bash
     graph auth --product hosted-service <ACCESS_TOKEN>
     ```

   - enter the directory of subgraph

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

     If use Hosted Service, the initing command is as follows:

     ```bash
     graph deploy --product hosted-service <GITHUB_USER>/<SUBGRAPH NAME>
     ```

     - You have to input `Version Label`, such as `0.0.1`, or it will give an error prompt `You must provide a version label.`

## Check if subgraph deploy

Enter your home page of subgraph from subgraph panel, check index progress, it could be called when the progress is finished.

An sample request has been pre-produced here, click to button to request data. So far we have succeeded

<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/08-hardhat-graph/query_subgraph.png?raw=true" /></center>

## Graph Node build locally

1. Build graph-node
   For convenience's sake, we use the docker compose provided by official to deploy node, database and IPFS.

- clone graph node( https://github.com/graphprotocol/graph-node/ )
- enter docker directory
- change the value of ethereum filed in docker-compose.yml to the connection info which need connect to chain

Note: if yours are latest mac (big sur system), do not use brew cask install docker when install docker, please refer to https://www.jianshu.com/p/50037be9c00d for details.

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
    ethereum: 'mainnet:http://127.0.0.1:8545' # the mainnet need to follow to the network of subgraph.yml
    # ethereum: 'dev:https://goerli.infura.io/v3/INFURA_ID' # could connect to test networks
    RUST_LOG: info
```

> Note 1: the node in graph-node need start archive mode(when start the node, add flag --syncmode full --gcmode archive). 2. graph-node startup
> Note 1: When you need to start multiple graph-nodes in one machine, and each graph-node is connected to a different chain, you only need to add the corresponding graph-node service in docker-compose. Configure the sepolia and optimism graph node services as follows, and change the ports exposed to graph-node-optimism to 8100,8101,8120,8130,8140. Note that you can only modify the exposed local port (8100/8101/8120/8130/8140). Do not modify the port (8000/8001/8020/8030/8040) in the container. Otherwise, an error will be reported.

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


2. Startup with docker compose directly

```bash
docker-compose -f docker-compose.yml up -d
```

3. Compile subgraph

   Enter the directory of subgraph to run the command

   Because the command was executed in the previous step: `npx hardhat run ./scripts/deploy.js --network sepolia`

   subgraph.yml need to be changed as follows:

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

4. Deploy subgraph

```bash
graph create davekaj/SimpleToken --node http://127.0.0.1:8020

graph deploy davekaj/SimpleToken --debug --ipfs http://localhost:5001 --node http://127.0.0.1:8020
```

5. Use GraphQL to query data。

## subgraph

subgraph provide the data, data sources and the mode of querying with GraphQL API. Developers can use the deployed subgraph by others[17], or they can customize it and deploy

1. GraphQL Schema  
   GraphQL Schema define the type or entities of data which you want to save and query. Or you can define the config about relationship or full-text search.
2. subgraph manifest( yaml )
   manifest define the smart contract indexed by subgraph, ABI of contracts, events that subscribe to these contracts, and how to map the event datas to the node of Graph to store and allowed to query.
3. AssemblyScript mapping
   AssemblyScripts mappings allows you to use the type of entities defined in schema to store indexed data. Graph CLI also uses the combination of schema and ABI of smart contract to generate the type of AssemblyScript
4. establish relationship with @derivedFrom
   Define reverse queries on entities with the @derivedfrom field to create a virtual field in entities which coule be queried. But you can not configure it manually by mapping API. Actually, it is grew from the relationship defined on another entity. The relation do not make sence to the relation of store, if you only store one and grow another, the performance of indexing and querying will be better.

## Thegraph's equivalent  
In addition to Thegraph, there are other similar products, so that we can choose the best products according to product characteristics, costs, etc.

### Alchemy  
Alchemy also provides Subgraph functionality, users can easily migrate Subgraph from Thegraph to Alchemy.

- Deploy    
The deployment process is the same as that of the thegraph host service. codegen and build are performed after the ts code is written. At last, you need to enter the deploy-key parameter when deploying is performed

<center><img src="https://github.com/Dapp-Learning-DAO/Imgs-for-tasks/blob/main/basic%20task/Alchemy_Subgraph.jpg?raw=true" /></center>

Reference: https://docs.alchemy.com/reference/subgraphs-quickstart   


2. Alchemy Subgraph Pricing  
By default, Free Plan is used, which is sufficient for developers to use themselves, and when used for projects, Plan needs to be upgraded to unlock the number of queries  

<center><img src="https://github.com/Dapp-Learning-DAO/Imgs-for-tasks/blob/main/basic%20task/Alchemy_Pricing.jpg?raw=true" /></center>        


3. Thegraph Pricing    
The Growth Plan is $49 a month, with 1,000,000 query times, averaging $0.000049/ time, while thegraph queries 1,000,000 times, requiring about 186 GRT. If GRT is calculated according to $0.2, thegraph average $0.000037/ time  
<center><img src="https://github.com/Dapp-Learning-DAO/Imgs-for-tasks/blob/main/basic%20task/Thegraph_Pricing.jpg?raw=true" /></center>

Reference：https://www.alchemy.com/pricing


### Envio  
1. Build locally  
Initialize the project directory with 'envio init' and then start the local Indexer with 'envio dev'. Envio local indexer start soon, start after can through [http://localhost:8080/] (http://localhost:8080/console) for a visit   
<center><img src="https://github.com/Dapp-Learning-DAO/Imgs-for-tasks/blob/main/basic%20task/envio_start.jpg?raw=true" /></center>   


2. Host Service Mode
Upload the project initialized with envio init to github, then envio will assign access to the repo, and after committing, envio will automatically deploy    
<center><img src="https://github.com/Dapp-Learning-DAO/Imgs-for-tasks/blob/main/basic%20task/envio_init.jpg?raw=true" /></center>  

3. Deploy Successfully
Once the deployment is successful, you can view the access in envio's Host Service    
<center><img src="https://github.com/Dapp-Learning-DAO/Imgs-for-tasks/blob/main/basic%20task/envio_dashboard.jpg?raw=true" /></center>  

Reference：https://docs.envio.dev/docs/HyperIndex/hosted-service-deployment


#### Envio Advantages   
- Local builds are fast  
- The Host Service is currently free to use 

### Ponder  
1. Local build  
Ponder can also be built locally, but he needs to use Ethereum RPC to get data to nodes, similar to Alchemy's subgraph, which is limited by the frequency of Ethereum RPC nodes. The official website recommends using Alchemy's RPC, but as described above, Alchemy's RPC has access restrictions  
<center><img src="https://github.com/Dapp-Learning-DAO/Imgs-for-tasks/blob/main/basic%20task/ponder_build.jpg?raw=true" /></center> 

2. Host Service construction 
At present ponder has only been fully tested for compatibility on [Railway](https://railway.app/), and has not been fully tested on other platforms.

Reference：https://ponder.sh/docs/production/deploy   

#### Ponder Disadvantages  
1. When building locally, the PONDER RPC URL 1 variable needs to be entered into the.env.local file to pull Ethereum node data. There is a limite rate limit for using infura or Alchemy's PRC URL 
2. For factory contracts such as Uniswap V2 and V3, only 10,000 sub-contracts are supported. When a factory contract issues an event to create a subcontract, the numeric type in the event event cannot be array or struct 
3. The structure and syntax of developing subgraph is different from thegraph, and it needs to be re-adapted if the existing subgraph is migrated   

## Reference

official documentation:

- https://thegraph.com/docs/developer/quick-start

reference document for this project:

- https://mp.weixin.qq.com/s/DlC5jAS_CzXuOZFmmveNXA
- https://mp.weixin.qq.com/s/LhdAREmhXSHxIaVfhcJQ_g
- https://dev.to/dabit3/building-graphql-apis-on-ethereum-4poa
- https://learnblockchain.cn/article/2566
- https://blog.openzeppelin.com/subgraphs-announcement  
  OpenZeppelin subgraphs libraray: set subgraphs for the usual contracts of OpenZeppelin
- https://github.com/graphprotocol/agora  
  cost model
- Subgraph usage(Analyze node costs, benefits, and which subGraphs should be indexed):  
  <https://wavefive.notion.site/The-Graph-Protocol-Indexer-Subgraph-Selection-Guide-725f6e575f6e4024ad7e50f2f4e9bbad>

other reference documents:

- https://thegraph.com/
- https://graphql.cn/learn/
- https://gql-guide.vercel.app/
- https://thegraph.com/docs/graphql-api  
  GraphGen——命令行工具，用于快速生成子图，由一些有 GraphGen 命令注释的 Solidity 接口文件组成。
  GraphGen——the command tool, used to generate subgraph quickly, consisting of some Solidity interface files commented by Graphgen commands.
- https://medium.com/protean-labs/introducing-graphgen-a-subgraph-generator-for-the-graph-network-836fe0385336

- Matchstick —— a framework for unit testing by Limechain, a simulator node of graph, used to map logic deployed by subgraph in sandbox
  reference: https://limechain.tech/blog/matchstick-what-it-is-and-how-to-use-it/
