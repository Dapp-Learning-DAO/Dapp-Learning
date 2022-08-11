## 前言

通过本样例代码，开发者了解到 `web3.js`和 `ehters.js`的区别

项目里主要针对 `连接到etherum `，`获取账户`，`部署合约`，`调用合约方法`这些业务做了示例演示。



## 测试流程

1. 安装依赖

```
yarn install
```



2. 执行 compile.js 脚本

```
yarn compile
```



3. 启动本地测试网络

```
yarn chain
```



4. 测试脚本

```
yarn test
```



## 示例说明



### 1、connect 到 etherum

```js
// web3.js

const web3 = new Web3('http://localhost:8545');
// or
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

// ethers
const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
const signer = provider.getSigner();
```



### 2、获取账户

```js
// ethers
const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
const accounts1 = await provider.listAccounts();

// web3.js
const web3 = new Web3('http://127.0.0.1:8545');
const accounts2 = await web3.eth.getAccounts();
```



### 3、发布合约

```js
// using ethers
// ethers部署合约需要abi，bytecode, signer。
const factory = new ethers.ContractFactory(abi, bytecode, signer);
const contractInstance = await factory.deploy(0);
const tx = await contractInstance.deployTransaction.wait();
console.log(tx);
console.log('Contract deployed at address:', contractInstance.address);

// using web3
const accounts = await web3.eth.getAccounts();
const contract = new web3.eth.Contract(abi);
const tx = contract.deploy({
  data: bytecode,
  arguments: [0],
});
// const deployReceipt = tx.send({
//   from: accounts[0],
//   gas: gasLimit,
//   gasPrice,
// });
// deployReceipt.on('receipt', function (receipt) {
//   console.log(`Contract deployed at address: ${receipt.contractAddress}`);
// });
const contractInstance = await tx.send({
  from: accounts[0],
  gas: gasLimit,
  gasPrice,
});
console.log('Contract deployed at address:', contractInstance.options.address);
```



### 4、调用合约方法：

#### 调用非交易类型的方法：

```js
// Web3.js
const contractInstance = new web3.eth.Contract(abi, contractAddress);
let currentValue = await contractInstance.methods.currentValue().call();
console.log('Incrementer Contract currentValue:', currentValue);

// ethers
const readContract = new ethers.Contract(contractAddress, abi, provider);
let currentValue = await readContract.currentValue();
console.log('Incrementer Contract currentValue:', currentValue.toString());
```

#### 调用交易类型的方法：

```js
// Web3.js
const accounts = await web3.eth.getAccounts();
const contractInstance = new web3.eth.Contract(abi, contractAddress);
const tx = contractInstance.methods.descrement(1);
await tx
  .send({
    from: accounts[0],
    gas: gasLimit,
    gasPrice,
  })
  .on('receipt', async (recepit) => {
    currentValue = await contractInstance.methods.currentValue().call();
    console.log('Incrementer Contract currentValue:', currentValue);
  });

// ethers
const writeContract = new ethers.Contract(contractAddress, abi, signer);
const tx = await writeContract.increment(ethers.BigNumber.from(5));
await tx.wait();
currentValue = await readContract.currentValue();
console.log('Incrementer Contract currentValue:', currentValue.toString());
```



#### 查询event事件

```js
// etherjs写法
const readContract = new ethers.Contract(contractAddress, abi, provider);
// filters里传入的参数只能是indexed的参数
const filter = readContract.filters.Bid(null, utils.hexlify(BigNumber.from(auction.recordId)));
// 过滤区块
const logsFrom = await readContract.queryFilter(filter, 0, "latest");
logsFrom.forEach(item => console.log(items.args));

// web3的写法
const web3 = new Web3(provider);
const contractInstance = new web3.eth.Contract(abi, contractAddress);
const logs = await contractInstance.getPastEvents('Descrement', {
  filter: {},
  fromBlock: 0,
});

logs.forEach((item) => {
  console.log('Descrement Event:', item); // same results as the optional callback above
});
```



#### 订阅event事件

```js

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
// http provider不支持订阅
const web3 = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:8545'));

  // using ethers
  async function subByEthers() {
    const readContract = new ethers.Contract(contractAddress, abi, provider);
    let filterForm = readContract.filters.Increment();
    readContract.on(filterForm, (amount, event) => {
      console.log('Increment events:', event);
    });
  }
  subByEthers();

  
  // using web3
  async function subByWeb3() {
    const contractInstance = new web3.eth.Contract(abi, contractAddress);
    contractInstance.events
      .Descrement({
        fromBlock: 0,
      })
      .on('data', (event) => {
        console.log('Descrement Event:', event); // same results as the optional callback above
      })
      .on('error', function (error, receipt) {
        console.error('Descrement Event error:', error);
      });
  }
  subByWeb3();
}

const server = http.createServer(() => {});
server.listen(8002);

```





## 参考资料

[1 - web3-vs-ethers](https://github.com/adrianmcli/web3-vs-ethers)

[2 - web3js文档](https://web3js.readthedocs.io/en/v1.2.11/index.html)

[3 - ethers 文档](https://docs.ethers.io/v5/)

