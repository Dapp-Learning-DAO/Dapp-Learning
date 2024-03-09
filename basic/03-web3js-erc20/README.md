[中文](./README-cn.md) / English

# Web3js ERC20

This basic task is to show how to interact with ERC20 contract, so the developer can understand the basic interface of ERC20 contract.

## Getting started
### SimpleToken contract function description

- IERC20
  totalSupply: Get the total amount of ERC20 token in the contract
  balanceOf: Get the amount of ERC20 token of specific account in the contract
  transfer: Transfer ERC20 token to specific account
  allowance: Get the amount of ERC20 tokens of the source account that the target account can use
  approve: Authorize the target account to transfer the specified amount of ERC20 Tokens
  transferFrom: (Third party call) Transfer a specific amount of ERC20 token from the source account to target account

- IERC20Metadata
  name: Get the name of the Token
  symbol: Get the symbol of the Token
  decimals: Get the decimals of the Token


### How to run it
1. Please use node v20.11.0 to run following commands
2. Install dependencies: `npm install`
3. Copy the configuration file: `cp .env.example .env`
4. Edit the configuration file: `vim .env`, copy your project ID and private key to the `.env` file.
    ```text
    PRIVATE_KEY=YOUR_PRIVATE_KEY
    INFURA_ID=YOUR_PROJECT_ID
    ``` 
5. Run the `index.js` file: `node index.js`

## Interpret Source Code

### `compile.js`

You can't use `.sol` files directly, you need to compile it to binary file firstly.


1. Load the smart contract file `SimpleToken.sol` into `source` variable.

```js
// Load contract
const source = fs.readFileSync('SimpleToken.sol', 'utf8');
```

2. Compile the smart contract file

```js
// compile solidity
const input = {
    language: 'Solidity',
    sources: {
    'SimpleToken.sol': {
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

3. Get the Contract Binary Object 

The solidity object that was successfully compiled in the previous step contains many properties/values, and what we only need is the contract object, so we can get the `SimpleToken` contract object by accessing the object properties.

```js
const contractFile = tempFile.contracts['SimpleToken.sol']['SimpleToken'];
```

4. Export `contractFile` Object
If you want to use the `contractFile` object in other `js` files, you can export it.


```js
module.exports = contractFile;
```

---

### `index.js`

1. Load the `SimpleToken` smart contract from `compile` file
    
```js
const contractFile = require('./compile');
```

2. Load private key

For security’s sake, the private key is not hard-coded, but it can be read as environment variables. When run this task, the `dotenv` plugin will automatically read the configurations in the `.env` file and load them as environment variables, and then you can use the private key and other environment variables via `process.env`.  

```js
require('dotenv').config();
const privatekey = process.env.PRIVATE_KEY;
```

3. Create a `receiver` account for testing

```js
const receiver = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
```

4. Build the `web3` object

```js
const web3 = new Web3(new Web3.providers.HttpProvider('https://sepolia.infura.io/v3/' + process.env.INFURA_ID));
```
| Note: The `INFURA_ID` is the `PROJECT ID` of the `Infura` project you created in last [task](../01-web3js-deploy/README.md)

5. Get the `account` address

On blockchain, each user has a `address`, which is unique for others, and you can get the `address` by the private key. In this task, you can use the `we3.eth.accounts.privateKeyToAccount` API to get your `account` address by passing the private key as a parameter.

```js
const account = web3.eth.accounts.privateKeyToAccount(privatekey);
const account_from = {
    privateKey: account.privateKey,
    accountaddress: account.address,
};
```

6. Get the `abi` and `bin`
When deploying the smart contract, we need two important parameters which are the `bytecode` and `abi` of the smart contract. In previous step 1, we loaded the compiled `SimpleToken` object, so we can get the `bytecode` and `abi` from it.


```js
const bytecode = contractFile.evm.bytecode.object;
const abi = contractFile.abi;
```

7. Get contract instance
In the last step, you got the `bin` and `abi`, so we can create the contract instance by the `abi`.
   
```js
const deployContract = new web3.eth.Contract(abi);
```

8. Create the transaction of the `deployContract`

```js
const deployTx = deployContract.deploy({
    data: bytecode,
    arguments: ['DAPPLEARNING', 'DAPP', 0, 10000000],
});
```
| So far, this transaction has not been deployed into the blockchain.


9. Sign the transaction
Use your private key to sign the transaction.

```js
const deployTransaction = await web3.eth.accounts.signTransaction(
    {
    data: deployTx.encodeABI(),
    gas: '8000000',
    },
    account_from.privateKey
);
```

10. Deploy the contract
Send your signed `deployTransaction` transaction to the blockchain. You will receive a receipt, and get this contract address from it.


```js
const deployReceipt = await web3.eth.sendSignedTransaction(deployTransaction.rawTransaction);
console.log(`Contract deployed at address: ${deployReceipt.contractAddress}`);
```

11. Create a transfer transaction

We created a transfer transaction for `ERC20` token, the receiver is `receiver` account, and the amount is `100000` token.

```js
const transferTx = erc20Contract.methods.transfer(receiver, 100000).encodeABI();
```

12. Sign and send the transaction

```js
const transferReceipt = await web3.eth.sendSignedTransaction(transferTransaction.rawTransaction);
```

13. Check the balance of the `receiver` account

After the transaction is sent, you can log the balance of the `receiver` and make sure the balance is correct.

```js
erc20Contract.methods
    .balanceOf(receiver)
    .call()
    .then((result) => {
    console.log(`The balance of receiver is ${result}`);
    });
```

## Notes

- `infura` doesn't support `sendTransaction`, only support `sendRawTransaction`
- `infura` doesn't invoke `eth_sendTransaction`, so you need to an unlocked account on the `ethereum` node. More details, please refer to [this](https://ethereum.stackexchange.com/questions/70853/the-method-eth-sendtransaction-does-not-exist-is-not-available-on-infura)

## References

- Mocha tutorial: http://www.ruanyifeng.com/blog/2015/12/a-mocha-tutorial-of-examples.html
- Mocha blog: https://pcaaron.github.io/pages/fe/block/improve4.html#%E8%B7%91%E6%B5%8B%E8%AF%95
- ERC20 doc: https://docs.openzeppelin.com/contracts/2.x/api/token/erc20
