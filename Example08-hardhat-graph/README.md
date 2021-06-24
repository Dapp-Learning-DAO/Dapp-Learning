## Graph 介绍
编写智能合约时，通常状态的变化是通过触发一个事件来表达，The Graph 则是捕捉区块链事件并提供一个查询事件的 GraphQL 接口，让我们可以方便的跟踪数据的变化。实际上很多defi协议及都是 The Graph 来基于查询数据。  

## 流程概述   
  - 在 Ropsten 部署一个合约，并调用触发事件。
  - 创建定义数据索引的 Subgraph。
  - 部署 Subgraph 到 TheGraph，实现数据索引。
  - 在前端 DApp 中查询索引数据。
  
如果你有自己的私有链，这可以克隆 Graph 节点代码 https://github.com/graphprotocol/graph-node/  自己运行Graph节点来完成数据的索引。  

TheGraph 中定义如何为数据建立索引，称为 Subgraph，它包含三个组件：  
- Manifest 清单(subgraph.yaml) - 定义配置项  
- Schema 模式(schema.graphql) - 定义数据 , 参考文档 https://graphql.cn/learn/
- Mapping 映射(mapping.ts) - 定义事件到数据的转换 
   
## 操作步骤   
1)  安装相关依赖
```
  npm install
```

2) 配置私钥  
在 sk.txt 中，配置账户私钥    

3) 部署合约  
```
  npx hardhat run ./scripts/deploy.js --network kovan
```

输出信息类似如下:  
```
Deploying contracts with the account: xxxxxxxxxxxxxx
Account balance: 10000000000000000000000
Token address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Transfer 50 to receiver  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Account balance of receiver is:  50
```

4) TheGraph 创建一个 Subgraph 空间  
因为需要借助 TheGraph 的节点来完成数据的索引，因此我们需要在 [TheGraph网站](https://thegraph.com/) 上创建一个 Subgraph。

如果没有The Graph 的账户，可以用 GitHub 注册。
创建账户之后，点击右上角账户的图标，会出现 "Dashboard" 和 "Sign out" 两个选项，选择 "Dashboard" 进入仪表盘，然后点击右侧的“Add Subgraph" 就可以开始通过界面创建 subgraph.
进入 "Create a subgraph" 界面，输入 "Subgraph NAME", 这里假设输入的 "subgraph name" 为 "graphtest", 后续说明均以这个 subgraph name 为例进行说明. 同时，输入 "SUBTITLE" 为 ”graphtest“, 然后点击 "Create subgraph"


5) 开发和部署 subgraph  
先使用 NPM 在全局安装 Graph CLI  
```
 npm install -g @graphprotocol/graph-cli
```


6) 初始化配置: 
```
  graph init <GITHUB_USERNAME>/<SUBGRAPH_NAME>
```

 - GITHUB_USERNAME:  thegraph 的账户，可以登录 [TheGraph 网站](https://thegraph.com/) ，然后进入 Dashboard 查看
 - SUBGRAPH_NAME： 上面在 Thegraph 创建的 subgraph 空间名字 ( 这里以 graphtest 为例 )

最终命令样式如下:  
```
  graph init longdacao/graphtest
```

7) 输入信息如下:
```
✔ Subgraph name · longdacao/graphtest
✔ Directory to create the subgraph in · Gameplayer
✔ Ethereum network · kovan
✔ Contract address · 0x5FbDB2315678afecb367f032d93F642f64180aa3
✖ Failed to fetch ABI from Etherscan: request to https://api-kovan.etherscan.io/api?module=contract&action=getabi&address=0x5FbDB2315678afecb367f032d93F642f64180aa3 failed, reason: connect ETIMEDOUT 103.240.180.117:443
✔ ABI file (path) · /Users/app/temp/DappLearn/Example08-hardhat-graph/abis/SimpleToken.json
✔ Contract Name · SimpleToken

 输出说明
1. 在 "Subgraph name" 和 "Directory to create the subgraph"  这里，直接回车即可
2. Ethereum network 这里选择 kovan
3. "Contract address" 这里输入在步骤 3 中部署合约时生成的合约地址
4. 上面执行到 "fetch ABI from Etherscan" 时会报执行失败，然后出现 "ABI file (path)" 字样，提示输入本机中 abi 的文件路径，这里我们输入 SimpleToken.json 所在的路径即可
``` 

8) 定义模式  
这里，已经根据 SimpleToken 合约，调整了 schema.graphql, mapping.ts, 所以我们使用调整后的这两个个文件。

- 复制文件
```
  >> 复制 schema.graphql 文件
  cp ./scripts/schema.graphql graphtest/   

  >> 复制 mapping.ts 文件
  cp ./scripts/mapping.ts graphtest/src
```
   

9) 部署 Subgraph
在控制台先用 graph auth 进行授权:  
```
  graph auth https://api.thegraph.com/deploy/ <ACCESS_TOKEN>
```
<ACCESS_TOKEN> 请使用你在创建 Subgraph 空间提示的 Access token。
然后使用 graph deploy 进行部署：

```
  graph deploy \
    --debug \
    --node https://api.thegraph.com/deploy/ \
    --ipfs https://api.thegraph.com/ipfs/ \
    <SUBGRAPH_NAME>
```
<SUBGRAPH_NAME> 使用完成的 Subgraph 名称，我们这里是：longdacao/graphtest 。


10) 在 TheGraph 查看  
如果顺利的话，可以在 TheGraph 的面板上观察到 subgraph 索引过程，初始索引可能需要等待几分钟

## subgraph 
subgraph 定义了你希望通过 GraphQL API 提供的数据、数据源和数据访问模式。开发者可以选择直接使用别人已经部署[17]的 subgraph，或者自己定义并部署 subgraph。
1 GraphQL Schema
GraphQL Schema 定义了你想保存和查询的数据类型/实体。也可定义如关系或全文搜索的配置项。
2 subgraph 清单（ yaml 配置）
manifest定义了 subgraph 索引的智能合约、合约的ABI、关注这些合约的事件，以及如何将事件数据映射到 Graph 节点存储并允许查询。
3 AssemblyScript 映射
AssemblyScript 映射允许您使用 schema 中定义的实体类型保存要索引的数据。Graph CLI还使用 schema 与智能合约的 ABI 的组合生成 AssemblyScript 类型。

通过@derivedFrom建立关系
通过@derivedFrom字段在实体上定义反向查询，这样就在实体上创建了一个虚拟字段，使它可以被查询，但不能通过映射 API 手动设置。实际上，这是从另一个实体上定义的关系中衍生出来的。这样的关系，对存储关系的两者意义不大，如果只存储一方而派生另一方，则索引和查询性能都会更好。

## 参考链接  
官方文档：   
https://thegraph.com/docs/introduction
   
本项目参考文档：  
https://mp.weixin.qq.com/s/DlC5jAS_CzXuOZFmmveNXA  
https://mp.weixin.qq.com/s/LhdAREmhXSHxIaVfhcJQ_g
https://dev.to/dabit3/building-graphql-apis-on-ethereum-4poa   
https://learnblockchain.cn/article/2566  
 
   
## to do
在 thegraph 网站上支持字段过滤  
https://thegraph.com/  
https://graphql.cn/learn/ 
