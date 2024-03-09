[中文](./README-cn.md) / English
# Abstract
The demo code provides developers with an overview of how to sign, send, and receive receipt of transactions, and verify the results of their execution. The sample also provides the event monitoring code so that the developer can understand how to listen to an event one or more times.

# Getting Started

## Understanding The Functions of the [Smart Contract](Incrementer.sol)
- `Constructor`: The constructor function of the smart contract, which is called when the contract is deploying, at the same time it will initialize the `number` to `_initialNumber`;
- `increment`: The function of incrementing the `number` by given `_value`;
- `rest`: The function of resetting the `number` to 0;
- `getNumber`: The function of getting the `number`.

## How to run it

1. Please use node v20.11.0 to run following commands
2. Install dependencies: `npm install`
3. Copy the configuration file: `cp .env.example .env`
4. Edit the configuration file: `vim .env`, copy your project ID and private key to the `.env` file.
    ```text
    PRIVATE_KEY=YOUR_PRIVATE_KEY
    INFURA_ID=YOUR_PROJECT_ID
    ``` 
5. Run the `index.js` file: `node index.js`

# Interpret Source Code
## `compile.js`
You can't use `.sol` files directly, you need to compile it to binary file firstly.
### Load the smart contract file `Incrementer.sol` into `source` variable.

```js
// Load contract
// please use node v20.11.0 to run following commands
const source = fs.readFileSync("Incrementer.sol", "utf8");
```
### Compile the smart contract file

```js
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
| Note: The version of solidity in this task is `0.8.0`, different versions may have different compile ways.

### Get the Contract Object

```js
const contractFile = tempFile.contracts["Incrementer.sol"]["Incrementer"];
```  

### Export `contractFile` Object

If you want to use the `contractFile` object in other `js` files, you need to export it.
```js
module.exports = contractFile;
```  

## `index.js`

### 1. Load the `Incrementer` smart contract from `compile` file
```js
const contractOfIncrementer = require("./compile");
```

### 2. Read private key from environment variables
For security’s sake, the private key is not hard-coded, but it can be read as environment variables. When run this task, the `dotenv` plugin will automatically read the configurations in the `.env` file and load them as environment variables, and then you can use the private key and other environment variables via `process.env`.  
```js
require("dotenv").config();
const privatekey = process.env.PRIVATE_KEY;
```

### 3. Create the `web3` instance
`web3` is the main API of the `web3js` library. It is used to interact with the blockchain.

```js
// Provider
const providerRPC = {
  development: "https://sepolia.infura.io/v3/" + process.env.INFURA_ID,
  moonbase: "https://rpc.testnet.moonbeam.network",
};
const web3 = new Web3(providerRPC.development); //Change to correct network
```
| Note: The `INFURA_ID` is the `PROJECT ID` of the `Infura` project you created in last [task](../01-web3js-deploy/README.md)

### 4. Get the `account` address
On blockchain, each user has a `address`, which is unique for others, and you can get the `address` by the private key. In this task, you can use the `we3.eth.accounts.privateKeyToAccount` API to get your `account` address by passing the private key as a parameter.
```js
const account = web3.eth.accounts.privateKeyToAccount(privatekey);
const account_from = {
  privateKey: privatekey,
  accountAddress: account.address,
};
```

### 5. Get the `bytecode` and `abi`
When deploying the smart contract, you need to specify the `bytecode` and `abi` of the smart contract. The `bytecode` is the compiled binary code of the smart contract, and the `abi` (Application Binary Interface) is the interface of the smart contract.
```js
const bytecode = contractOfIncrementer.evm.bytecode.object;
const abi = contractOfIncrementer.abi;
```  

### 6. Get contract instance
In the last step, you got the `bytecode` and `abi`, so you can create the contract instance by the `abi`.
```js
// Create contract instance
  const deployContract = new web3.eth.Contract(abi);
```

### 7. Create the transaction of the `deployContract`
```js
// Create Tx
const deployTx = deployContract.deploy({
    data: bytecode,
    arguments: [5],
});

#arguments: [5] -> incrementer.sol : function increment
```  

### 8. Sign the transaction
Use your private key to sign the transaction.
```js
// Sign Tx
const createTransaction = await web3.eth.accounts.signTransaction(
    {
        data: deployTx.encodeABI(),
        gas: 8000000,
    },
    account_from.privateKey
);
```

### 9. Send the transaction / Deploy your smart contract
Send your `deploy` transaction to the blockchain. You will receive a receipt, and get this contract address from the receipt.
```js
const createReceipt = await web3.eth.sendSignedTransaction(
    createTransaction.rawTransaction
);
console.log(`Contract deployed at address: ${createReceipt.contractAddress}`);
```


### 10. Load the contract instance from blockchain through above address
In previous steps, you built a contract instance, and then deployed the transaction by sending the contract to the blockchain so that you can operate the transaction later. Besides, you could also load a contract instance that is already on the blockchain so that you can operate it directly and avoid the process of deploying it.
```js
let incrementer = new web3.eth.Contract(abi, deployReceipt.contractAddress);
```

### 11. Use the `view` function of a contract
Whether a contract instance is create by deploying, or by loading, you can interact with the contract once you have an instance of the contract already on the blockchain.  
There are two types of contract functions: `view` and without `view`. The functions with `view` promise not to modify the state, while the functions without `view` will generate the corresponding block data on the blockchain.
For example, after calling the `getNumber` function of the contract, you will get the public variable number of the contract, and this operation will not charge any gas.
```js
let number = await incrementer.methods.getNumber().call();
```

### 12. Build a transaction
Before you send the transaction to the blockchain, you need to build the transaction, it means you need to specify the parameters of the transaction.
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

### 13. Send the transaction and get the receipt
You can use `sendSignedTransaction` function to send above transaction to the blockchain, and got the receipt to check result.
```js
const incrementReceipt = await web3.eth.sendSignedTransaction(
  incrementTransaction.rawTransaction
);
```

### Listen to Event Increment 
When invoking the interfaces of the contract, the only way to get information about the processing details, apart from the results returned by the interface, is through `events`.  
In the interfaces, you retrieve the corresponding internal information by triggering an event, and then capturing this event generated by the external block.


```js
const web3Socket = new Web3(
new Web3.providers.WebsocketProvider(
    'wss://sepolia.infura.io/ws/v3/' + process.env.INFURA_ID
));
#Web3 can intital without assign Provider("new Web3.providers.WebsocketProvider"), it also work. check index.js line 162

```

#we use sepolia now, it you interest in goerli, view below :
| sepolia don't support http protocol to event listen, need to use websocket. More details , please refer to this [blog](https://medium.com/blockcentric/listening-for-smart-contract-events-on-public-blockchains-fdb5a8ac8b9a)

#### Listen to  Increment event only once
```js
incrementer.once('Increment', (error, event) => {
    console.log('I am a onetime event listener, I am going to die now');
});
```
#### Listen to Increment event continuously
```js
incrementer.events.Increment(() => {
    console.log("I am a longlive event listener, I get a event now");
});

# event continuously code already change in index.js: from line 171~184, but above code also work.
```

# References
- Code part: https://docs.moonbeam.network/getting-started/local-node/deploy-contract/
- web3socket of sepolia: https://medium.com/blockcentric/listening-for-smart-contract-events-on-public-blockchains-fdb5a8ac8b9a 