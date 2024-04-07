[中文](./README-CN.md) / English

# wallet development

HD Wallet (Hierarchical Deterministic Wallet), Wallet Protocol: BIP32, BIP44, BIP39
[Wallet Principle](https://learnblockchain.cn/2018/09/28/hdwallet/)

## wallet type

Created by:

1. Random number
2. Private key
3. Mnemonic
4. keystore
   A Keystore file is a file format (JSON) in which the Ethereum wallet stores private keys. Use the password set by the user to encrypt to a certain extent, and the degree of protection depends on the password strength of the user to encrypt the wallet.
5. Brain wallets (etherjs 5 has been removed)

## provider type

1. Etherscan Provider: It requires two parameters to connect the Etherscan API, one is the network name, and the other is the token required to query the API (the API token is not necessary when querying the Etherscan API, but if not, the subject will be limited of 5 calls per second).
2. Json Rpc Provider: The Provider that connects to the local Ethereum network.
3. Infura Provider: The Provider that connects to the Infura network. Infura is a set of Ethereum infrastructure services, and also has the Ethereum main network and test network.
4. Web3 Provider: A provider that connects to an existed web3 object.
5. Fallback Provider: Connect to a group of providers that can be of various types. If there is a problem with the previous provider, it will automatically connect to the latter.

```js
const provider = providers.getDefaultProvider();
const wallet = new Wallet(privateKey, provider);
```

or

```js
const wallet = new Wallet(privateKey);
wallet.provider = provider;
```

If you use a normal JS number object to store the operation, it may cause abnormal results due to data overflow.

Execute test case
```js
hardhat test
```

## Reference link

- <https://learnblockchain.cn/2019/04/11/wallet-dev-guide/#ethers.js>
- <http://zhaozhiming.github.io/blog/2018/04/25/how-to-use-ethers-dot-js/>
- <https://learnblockchain.cn/2018/10/25/eth-web-wallet_2/>
