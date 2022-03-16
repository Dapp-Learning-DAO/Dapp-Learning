# web3.js 和 ehterjs 的区别

### connect 到 provider 上

```js
// web3.js

const web3 = new Web3('http://localhost:8545');
// or
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

// ethers
const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
const signer = provider.getSigner();
```

### 获取账户上

用 web3 来和合约交互，需要 abi, 部署合约的地址，一个用来交易的地址。

```js
// ethers
const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
const accounts1 = await provider.listAccounts();

// web3.js
const web3 = new Web3('http://127.0.0.1:8545');
const accounts2 = await web3.eth.getAccounts();
```

### 发布合约上

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

### 调用合约方法上：

#### 非交易类型的：

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

#### 调用一个交易类型的方法：

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

参考链接：
1、https://github.com/adrianmcli/web3-vs-ethers
