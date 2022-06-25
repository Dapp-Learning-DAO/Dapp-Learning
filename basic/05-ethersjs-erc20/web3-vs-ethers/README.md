[中文](./README-cn.md) / English

## Tips

With example codes shown below, developers can learn the difference between web3.js and etherjs

This project mainly focus on tasks including `connect to ethereum `, `get accounts `, `deploy the contract `, `call methods of the contract `.



## Test

1. Install dependencies

```
yarn install
```



2. Run compile.js script

```
yarn compile
```



3. Start local test network

```
yarn chain
```



4. Run the test script

```
yarn test
```



## Example explanation



### 1、connect to etherum

```js
// web3.js

const web3 = new Web3('http://localhost:8545');
// or
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

// ethers
const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
const signer = provider.getSigner();
```



### 2、Get accounts

```js
// ethers
const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
const accounts1 = await provider.listAccounts();

// web3.js
const web3 = new Web3('http://127.0.0.1:8545');
const accounts2 = await web3.eth.getAccounts();
```



### 3、Deploy the contract

```js
// using ethers
//  deploying contract with ethers needs abi, bytecode, signer.
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



### 4、Call methods：

#### Call non-payable method：

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

#### Call payable method：

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



#### Query events

```js
// written in etherjs
const readContract = new ethers.Contract(contractAddress, abi, provider);
// The parameters passed to filters can only be indexed parameters.
const filter = readContract.filters.Bid(null, utils.hexlify(BigNumber.from(auction.recordId)));
// Filter the blocks
const logsFrom = await readContract.queryFilter(filter, 0, "latest");
logsFrom.forEach(item => console.log(items.args));

// written in web3
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



#### Subscribe events

```js

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
// http provider does not support subscription
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





## Reference

[1 - web3-vs-ethers](https://github.com/adrianmcli/web3-vs-ethers)

[2 - web3js doc](https://web3js.readthedocs.io/en/v1.2.11/index.html)

[3 - ethers doc](https://docs.ethers.io/v5/)

