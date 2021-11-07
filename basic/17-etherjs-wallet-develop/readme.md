# 钱包开发

HD 钱包(分层确定性钱包)，钱包协议：BIP32、BIP44、BIP39
[钱包原理](https://learnblockchain.cn/2018/09/28/hdwallet/)

## 钱包类型

1. 随机数创建
2. 私钥创建
3. 助记词创建
4. keystore 创建  
   Keystore 文件是以太坊钱包存储私钥的一种文件格式 (JSON)。。使用用户自己设置的密码来加密，以起到一定程度上的保护作用, 而保护的程度取决于用户加密该钱包的密码强度。
5. 脑记忆钱包(etherjs 5 已经移除)

## provider 类型

1. Etherscan Provider：连接 Etherscan API 的 provider，需要 2 个参数，一个是网络名称，一个查询 API 所需的 token（之前的文章 有讲过，查询 Etherscan 的 API 时 apitoken 不是必须的，但如果没有的话会受到每秒 5 次的调用限制）。
2. Json Rpc Provider：连接本地以太坊网点的 Provider。
3. Infura Provider：连接 Infura 网络的 Provider，Infura 是一套以太坊的基础设施服务，同样有以太坊的主网络和测试网络。
4. Web3 Provider：连接已有 web3 对象的 provider。
5. Fallback Provider：连接一个可以是多种类型的 provider 集合，如果前面的 provider 有问题，会自动去连接后面的。

```js
const provider = providers.getDefaultProvider();
const wallet = new Wallet(privateKey, provider);
```

或者
```js
const wallet = new Wallet(privateKey);
wallet.provider = provider;
```

如果用普通的 JS number 对象来存储操作的话，可能会因为数据溢出而导致结果异常。

## 参考链接

- https://learnblockchain.cn/2019/04/11/wallet-dev-guide/#ethers.js
- http://zhaozhiming.github.io/blog/2018/04/25/how-to-use-ethers-dot-js/
- https://learnblockchain.cn/2018/10/25/eth-web-wallet_2/
