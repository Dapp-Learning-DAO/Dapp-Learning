## Flashbot 

### 拯救被盗钱包

**设置gasfee**
您可以创建一系列交易，让盗账户执行，并且转账给矿工在此区块收到的ETH 。
1559之后，必须设置baseFee，之前0 手续费的场景不再work
```
const block = await provider.getBlock(blockNumber)
const maxBaseFeeInFutureBlock = FlashbotsBundleProvider.getMaxBaseFeeInFutureBlock(block.baseFeePerGas, BLOCKS_IN_THE_FUTURE)
const eip1559Transaction = {
    to: wallet.address,
    type: 2,
    maxFeePerGas: PRIORITY_FEE.add(maxBaseFeeInFutureBlock),
    maxPriorityFeePerGas: PRIORITY_FEE,
    gasLimit: 21000,
    data: '0x',
    chainId: CHAIN_ID
}
```

**设置bundle transaction**
```
const wallet = new Wallet(PRIVATE_KEY)
const transaction = {
  to: CONTRACT_ADDRESS,
  data: CALL_DATA
}
const transactionBundle = [
    {
      signedTransaction: SIGNED_ORACLE_UPDATE_FROM_PENDING_POOL // serialized signed transaction hex
    },
    {
      signer: wallet, // ethers signer
      transaction: transaction // ethers populated transaction object
    }
  ]
```

**设置执行区块** 
Block Targeting ,每个bundle一般指向一个区块。
如果想bundle在多个区块（包括被挖掘前的所有区块）中有效，则必须在每个区块中调用 sendBundle()。
```
const targetBlockNumber = (await provider.getBlockNumber()) + 1
```

**发送交易** 
1. flashbotsProvider
2. transactionBundle
3. targetBlockNumber

```
  const signedTransactions = await flashbotsProvider.signBundle(transactionBundle)
  const simulation = await flashbotsProvider.simulate(signedTransactions, targetBlockNumber)
  console.log(JSON.stringify(simulation, null, 2))

  const flashbotsTransactionResponse = await flashbotsProvider.sendBundle(
  transactionBundle,
  targetBlockNumber,
  )
```

**可选的 eth_sendBundle 参数**
```
{
  minTimestamp, // optional minimum timestamp at which this bundle is valid (inclusive)
  maxTimestamp, // optional maximum timestamp at which this bundle is valid (inclusive)
  revertingTxHashes: [tx1, tx2] // optional list of transaction hashes allowed to revert. Without specifying here, any revert invalidates the entire bundle.
}

bundle可以含有失败的交易
```

**Paying for your bundle**
除了要付gasfee，也可以设置条件支付矿工费用:
```
block.coinbase.transfer(_minerReward) or block.coinbase.call{value: _minerReward}("");

```

**Sending a Private Transaction**
只是发送一笔交易且不用捆绑交易，可以直接用sendPrivateTransaction， 会在25个区块内打包
```
const tx = {
    from: wallet.address,
    to: wallet.address,
    value: "0x42",
    gasPrice: BigNumber.from(99).mul(1e9), // 99 gwei
    gasLimit: BigNumber.from(21000),
}
const privateTx = {
    transaction: tx,
    signer: wallet,
}

const res = await flashbotsProvider.sendPrivateTransaction(privateTx)
```


**查询交易状态** 
https://protect-sepolia.flashbots.net/tx
https://blocks.flashbots.net/

### 环境
- ETHEREUM_RPC_URL - Ethereum RPC endpoint. Can not be the same as FLASHBOTS_RPC_URL
- PRIVATE_KEY_EXECUTOR - 被盗私钥账户
- PRIVATE_KEY_SPONSOR - 付款给矿工gasfee的账户
- RECIPIENT - Ethereum EOA to receive assets from ZERO_GAS account
- FLASHBOTS_RELAY_SIGNING_KEY - Optional param, private key used to sign messages to Flashbots to establish reputation of profitability


### run
```
 npx hardhat run scripts/send-1559-flashbot.js --network sepolia 
``` 

### 套利机器人
https://github.com/flashbots/simple-arbitrage/blob/master/contracts/BundleExecutor.sol
todo

## 参考链接

- MEV in 2021 - a year in review: https://www.youtube.com/watch?v=V_wlCeVWMgk
- flashbots-bundle github: https://github.com/flashbots/ethers-provider-flashbots-bundle
- flashbot youtube : https://www.youtube.com/watch?v=V_wlCeVWMgk
- flashbots github: https://github.com/flashbots/pm#resources  
- flashbots doc: https://docs.flashbots.net/new-to-mev
- Eden Network 介绍: https://imtoken.fans/t/topic/41713
- Eden Network 官方文档: https://docs.edennetwork.io/mechanism  
- flashbots 介绍: https://www.chainnews.com/zh-hant/articles/008263592610.htm  
- flashbots 官网文档: https://docs.flashbots.net/new-to-mev  
- blocknative:https://www.blocknative.com/blog/flashbots?utm_campaign=MEV&utm_medium=email&_hsmi=186954588&_hsenc=p2ANqtz-9CqQ6OB52h7Sx9VLFDspHcAxfN66k_EOARwGtRkJXxJdNRvBAk0kaQNhKxwYwZ8nz99SyyaKCQrdF-5r_3Jm9siVO9lw&utm_content=186955925&utm_source=hs_email
- front-running: https://github.com/Supercycled/cake_sniper
- Flashbots Docs: https://docs.flashbots.net/flashbots-mev-boost/introduction
- How to create and send Flashbot transactions: https://ethereum.stackexchange.com/questions/98494/how-to-create-and-send-flashbot-transactions

- blocknative: https://www.blocknative.com/mev-protection