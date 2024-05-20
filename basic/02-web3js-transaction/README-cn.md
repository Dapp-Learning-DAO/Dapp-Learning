中文 / [English](./README.md)
## 前言
通过本样例代码，开发者了解到如何对交易进行签名，发送，接收交易回执，验证交易执行结果。同时，样例也提供了事件监听的逻辑代码，开发者可以了解如何对一个事件进行一次或多次监听


## 合约功能说明   
constructor: 构造函数, 用于部署合约时调用, 同时在其中初始化了公共变量 number 的值  
increment:   增值函数, 根据传入的数值 ( _value ), 对公共变量 number 进行增值 ( number + _value )   
reset:       重置函数, 用于重置公共变量 number 的值为 0    
getNumber:   查询函数, 用于查询公共变量 number 当前的数值  

## 测试流程 
1) 安装依赖
```js
npm install
// 本教程使用的 node 版本为 v20.11.0
```

2) 配置 .env
```
cp .env.example .env

## 修改 .env 中的 INFURA_ID 和 PRIVATE_KEY 为实际的值  
PRIVATE_KEY=xxxxxxxxxxxxxxxx
INFURA_ID=yyyyyyyy
```

3) 执行 index.js 脚本
```
node index.js
```

## compile.js 代码逻辑说明    
我们无法直接使用 .sol 文件, 需要把它编译为 bin 文件 ( 二进制文件 ), 因此在代码中需要进行这一步的逻辑处理.  
1) 读取文件   
第一步, 我们先进行文件的读取, 把 sol 文件加载为 source 变量 
```js
// Load contract
const source = fs.readFileSync("Incrementer.sol", "utf8");
```

2) 进行合约编译    
这里进行编译动作. 把 sol 源码编译为 solidity 对象. 这里需要注意的是不同的 sol 源码版本, 编译的方式可能稍有不同, 这里因为 "Incrementer.sol" 对应的是 sol 是 0.8.0 版本, 所以我们可以使用如下的方式进行编译 
```js 
// compile solidity
const input = {
  language: "Solidity",
  sources: {
    "Incrementer.sol": {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      "*": {
        "*": ["*"],
      },
    },
  },
};

const tempFile = JSON.parse(solc.compile(JSON.stringify(input)));
```

3) 获取二进制对象  
在上一步编译成功的 solidity 对象里面包含很多的属性/值, 而我们需要的是其中合约对象, 通过访问对象属性的方式提示 Incrementer 合约对象  
```js
const contractFile = tempFile.contracts["Incrementer.sol"]["Incrementer"];
``` 

4) 导出对象  
为了能使其他 js 文件使用 Incrementer 合约对象 , 我们需要对合约对象进行导出
```js
module.exports = contractFile;
```  

## index.js 代码逻辑说明  
1) 编译合约  
导入 compile 文件中的 Incrementer 合约对象 
```js
const contractOfIncrementer = require("./compile");
```

2) 读取私钥  
处于安全考虑, 私钥没有进行硬编码, 而是通过环境变量的方式进行获取. 启动测试时, dotenv 插件自动读取 .env 配置文件中的配置项, 然后加载为环境变量, 之后在代码中可以通过 process.env 读取私钥 ( 也包括其他环境变量 )    
```js
require("dotenv").config();
const privatekey = process.env.PRIVATE_KEY;
```     

3) 构造 web3 对象   
通过 web3 对象可以很方便的发送相应的交易到区块链网络, 同时获取区块链的处理结果. 
构造 web3 对象时, 主要需要传入一个参数, 就是对应的区块链网络, 包括 sepolia 测试网络, 或是 mainnet 主网. 
这里我们使用 sepolia 测试网络. 如果没有 sepolia 网络的测试币, 可以切换到其他的测试网络. 
同时需要注意的是, 这里我们通过 infura 向对应的区块链网络发送交易, 而 INFURA_ID 这个变量值也需要配置在 .env 文件中, 具体如何获取 infura_id, 可自行搜索查找相关文档 
```js
// Provider
const providerRPC = {
  development: "https://sepolia.infura.io/v3/" + process.env.INFURA_ID,
  moonbase: "https://rpc.testnet.moonbeam.network",
};
const web3 = new Web3(providerRPC.development); //Change to correct network
```

4) 获取账户地址  
在区块链上, 每个用户都有一个对应的账户地址, 而这个账户地址可以通过私钥进行获取. 这里, 我们调用 web3.eth.accounts.privateKeyToAccount 接口, 传入对应的私钥, 就可以获取对应的账户地址
```js
const account = web3.eth.accounts.privateKeyToAccount(privatekey);
const account_from = {
  privateKey: privatekey,
  accountAddress: account.address,
};
```

5) 获取 abi 和 bin  
在部署合约的过程中, 我们会用到两个重要的参数, 合约对应的 bytecode 和 abi. 在步骤 1 的时候, 我们导入了编译后的 Incrementer 合约对象, 通过这个对象, 我们可以获取的合约对应的 bytecode 和 abi  
```js
const bytecode = contractOfIncrementer.evm.bytecode.object;
const abi = contractOfIncrementer.abi;
```

6) 构造合约实例 
在步骤 5 中, 我们获取了 sol 源文件编译后的二进制 和 abi, 这里就可以使用对应的 abi 构造相应的合约实例, 以便在后续中通过合约实例进行交易的发送
```js
// Create contract instance
  const deployContract = new web3.eth.Contract(abi);
```

7) 创建合约交易   
调用 deployContract.deploy 接口, 我们创建了部署合约的二进制交易. 这里, 此交易还没有发送到区块链网络, 即合约还没有被创建  
```js
// Create Tx
const deployTx = deployContract.deploy({
  data: bytecode,
  arguments: [5],
});
```  

8) 交易签名 
如下使用私钥对交易进行签名,
```js
// Sign Tx
const createReceipt = await web3.eth.accounts.signTransaction(
  {
    data: deployTx.encodeABI(),
    gas: 8000000,
  },
  account_from.privateKey
);
```

9) 部署合约  
这里使用发送签名后的交易到区块量网络, 同时回去返回的交易回执. 从返回的交易回执中可以得到此次部署的合约的地址 
```js
const createReceipt = await web3.eth.sendSignedTransaction(
    createTransaction.rawTransaction
);
console.log(`Contract deployed at address: ${createReceipt.contractAddress}`);
```

10) 通过已经部署的合约地址加载合约实例  
上述, 我们是先构造了一个合约实例, 然后再通过发送合约部署交易, 实现合约实例的上链, 以便后续进行相应的交易操作. 但同时, 我们也可以直接加载一个已经上链的合约实例, 这样就可以直接对合约进行操作, 避免了中间的部署过程  
```js
let incrementer = new web3.eth.Contract(abi, createReceipt.contractAddress);
```

11) 调用合约只读接口   
不管是通过部署创建的合约实例, 还是通过加载已经部署的合约创建的合约实例, 在拥有一个已经上链的合约实例后, 就可以和合约进行交互.  
合约接口分为只读和交易接口, 其中只读接口不会产生区块, 而交易接口调用会在区块链网络上产生相应的区块数据 
如下, 调用合约的 getNumber 接口后, 获取合约中的公共变量 number 的数值 
```js
let number = await incrementer.methods.getNumber().call();
```

12) 构造交易   
发送交易之前, 先进行交易的构造, 即编码合约接口及相应的传入参数 
```js
let incrementTx = incrementer.methods.increment(_value);

// Sign with Pk
let incrementTransaction = await web3.eth.accounts.signTransaction(
  {
    to: createReceipt.contractAddress,
    data: incrementTx.encodeABI(),
    gas: 8000000,
  },
  account_from.privateKey
);
```

13) 发送交易并获取回执  
调用 sendSignedTransaction 接口, 发送上一步变码好的交易, 同时获取交易回执用户检查交易的处理结果 
```js 
const incrementReceipt = await web3.eth.sendSignedTransaction(
  incrementTransaction.rawTransaction
);
```

14) 监听事件  
在合约接口调用中, 除了接口返回的结果外, 唯一能获取接口处理中间信息的方法便是 "事件" .  
在接口中, 通过触发一个事件, 然后在外部捕获区块产生的事件, 就可以获取相应的内部信息  
- 一次性事件监听器  
如下, 在合约实例上调用 once 接口, 传入监听的事件为 "Increment",  就生成了一个一次性的事件监听器. 当有 "Increment" 触发时, 就会打印相应的提示信息 
```js
const web3Socket = new Web3(
   "wss://sepolia.infura.io/ws/v3/" ++ process.env.INFURA_ID
  );
  

  // listen to  Increment event only once
  incrementer.once("Increment", (error, event) => {
    console.log("I am a onetime event listner, I am going to die now");
  });
```

- 持续性事件监听器  
同样的, 也可以在合约实例上生成持续性的事件监听器, events 后面紧跟着的就是对应的事件名称 
```js
incrementer.events.Increment(() => {
    console.log("I am a longlive event listner, I get a event now");
  });
  #以上持续监听代码已更新，新的代码参考 index.js中 第171行 ～ 第184行
```

- 触发事件  
如下, 构造交易, 调用 increment 接口, 触发 "Increment" 事件, 在终端上就可以看到相应的输出  
```js
let incrementTx = incrementer.methods.increment(_value);

//为了演示触发error的事件机制，index.js 中将上述 “_value”直接设定为0，触发'increment value should be positive number'事件

incrementTransaction = await web3.eth.accounts.signTransaction(
      {
        to: createReceipt.contractAddress,
        data: incrementTx.encodeABI(),
        gas: 8000000,
      },
      account_from.privateKey
    );

   await web3.eth
       .sendSignedTransaction(incrementTransaction.rawTransaction)
      .on('error', console.error)
```

## 参考文章
代码参考文章如下   
https://docs.moonbeam.network/getting-started/local-node/deploy-contract/

sepolia 测试网无法使用 http 进行 event 监听，需要使用 web3socket, 可参考如下文章  
https://medium.com/blockcentric/listening-for-smart-contract-events-on-public-blockchains-fdb5a8ac8b9a
