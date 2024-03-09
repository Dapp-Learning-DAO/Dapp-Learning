[中文](./README-cn.md) / English

# Abstract

Through this basic task, you can learn the processes of compiling and deploying a smart contract, as well as learn how to use the basic APIs of `web3js`.

# Preparation

- You need to create a project on [Infura](https://infura.io), and get the `PROJECT ID`, change your `ENDPOINTS` to `Sepolia`;

- Create an account on `MetaMask`, which is a browser extension;

  1. Get a wallet `address`, and the private key;
  2. Go `Settings` - `advanced` and open `Show test networks`;
     - Select `Sepolia`, and record this address
  3. Top up your account through [faucets](https://faucets.chain.link) or others web services;
  4. Wait for minutes, and see the balance on `MetaMask`

- Create a `.env` file, and add the following lines:

  ```text
  PRIVATE_KEY=YOUR_PRIVATE_KEY
  INFURA_ID=YOUR_PROJECT_ID
  ```

  | Note: You can check the `.env.example` file.

- If you know Chinese, you can check these tasks on [BILIBILI](https://www.bilibili.com/video/BV1Y44y1r7E6/).


# Getting Started

## Understanding The Functions of the [Smart Contract](Incrementer.sol)

- `Constructor`: The constructor function of the smart contract, which is called when the contract is deployed, at the same time it will initialize the `number` to `_initialNumber`;
- `increment`: The function of incrementing the `number` by given `_value`;
- `rest`: The function of resetting the `number` to 0;
- `getNumber`: The function of getting the `number`.

## How to run it

1. Please use node v20.11.0 to run following commands
2. Install dependencies: `npm install`
3. Copy the configuration file: `cp .env.example .env`
4. Edit the configuration file: `vim .env`, copy your project ID and private key to the `.env` file
   ```text
   PRIVATE_KEY=YOUR_PRIVATE_KEY
   INFURA_ID=YOUR_PROJECT_ID
   ```
5. Run the `index.js` file: `node index.js`

# Interpret the Code in `index.js`

`index.js` contains the most important part of this task, which includes the following functions:

## 1. Load the configuration file

For security sake, the private key is not hard-coded, but it can be read as environment variables. When run this task, the `dotenv` plugin will automatically read the configurations in the `.env` file and load them as environment variables, and then you can use the private key and other environment variables via `process.env` .  
Here is the code:

```js
require('dotenv').config();
const privatekey = process.env.PRIVATE_KEY;
```

## 2. Compile the smart contract file

You can not use `.sol` files directly, you need to compile it to binary file firstly.

### Load the smart contract file `Incrementer.sol` into `source` variable.

```js
// Load contract
const source = fs.readFileSync('Incrementer.sol', 'utf8');
```

#### Compile the smart contract file

```js
const input = {
  language: 'Solidity',
  sources: {
    'Incrementer.sol': {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['*'],
      },
    },
  },
};

const tempFile = JSON.parse(solc.compile(JSON.stringify(input)));
```

| Note: The version of solidity in this task is `0.8.0`, different versions may have different compile ways.

## 3. Get the `bytecode` and `abi`

```js
const contractFile = tempFile.contracts['Incrementer.sol']['Incrementer'];

// Get bin & abi
const bytecode = contractFile.evm.bytecode.object;
const abi = contractFile.abi;
```

## 4. Create the `web3` instance

`web3` is the main API of the `web3js` library. It is used to interact with the blockchain.

```js
// Create web3 with sepolia provider，you can change sepolia to other testnet
const web3 = new Web3('https://sepolia.infura.io/v3/' + process.env.INFURA_ID);
```

| Note: The `INFURA_ID` is the `PROJECT ID` of the `Infura` project you created in **Preparation** part.

## 5. Get the `account` address

On blockchain, each user has a `address`, which is unique for others, and you can get the `address` by the private key. In this task, you can use to `web3.eth.accounts.privateKeyToAccount` API to get your `account` address by passing the private key as a parameter.

```js
// Create account from privatekey
const accounts = web3.eth.accounts.wallet.add(privatekey);
```

## 6. Get contract instance

In the 3rd step, you got the `bytecode` and `abi`, so you can create the contract instance by the `abi`

```js
// Create contract instance
const deployContract = new web3.eth.Contract(abi);
```

## 7. Create the `deploy` transaction

```js
// Create Tx
const deployTx = deployContract.deploy({
  data: '0x' + bytecode,
  arguments: [0], // Pass arguments to the contract constructor on deployment(_initialNumber in Incremental.sol)
});
```

## 8. Deploy your smart contract

Use your private key to sign the `deploy` transaction.

```js
const tx = await deployTx.send({
  from: accounts[0].address,
  gas,
  // gasPrice: 10000000000,
});
```

# References

- Web3js Official Documents: https://web3js.readthedocs.io/en/v1.2.11/getting-started.html
- Code and Examples: https://docs.moonbeam.network/getting-started/local-node/deploy-contract/
- How to use web3js: https://www.dappuniversity.com/articles/web3-js-intro
- Nodejs APIs Documents: http://nodejs.cn/api/fs.html
