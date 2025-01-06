[中文](./README-CN.md) / English
# Arbitrum

The difference between Arbitrum and Optimism lies in the Interactive Proving challenge.

Arbitrum is more dependent on Ethereum virtual machine (EVM). When someone submits a challenge in Optimism, **The transaction in question is run through EVM**. In contrast, **Arbitrum uses the off-chain dispute resolution process to reduce the dispute to one step in a transaction **. The protocol then sends this one-step assertion (rather than the entire transaction) to EVM for final validation. Therefore, conceptually speaking, the dispute resolution process of Optimism is much simpler than Arbitrum.

Advantages of Interactive Proving:

1. More efficient in the optimistic case;
2. More efficient in the pessimistic case;
3. Much higher per-tx gas limit;
4. No limit on contract size
5. More implementation flexibility

This means that in the case of disputed transactions, in the case of Arbitrum, the final confirmation of Arbitrum will be delayed longer than that of Optimism.

Arbitrum is cheaper in transaction cost in dispute settlement (in Layer1).

The dispute resolution process of Optimism is simpler and faster than Arbitrum, because it only provides disputed transactions to EVM. Speed is an advantage of Optimism, because disputes can be resolved quickly and without interfering with future progress of the rollup chain.

## The Arbitrum 2.0 protocol

The current Arbitrum protocol makes important advances over the original Arbitrum protocol in that it supports multiple pipelined DAs In the new protocol, each state can have at most one DA following from it. If a DA has no following state, then anybody can create a DA that follows it, creating a new branch point. The result will be a tree of possible futures, like the one shown below.

## AVM

The Arbitrum Virtual Machine (AVM) is the interface between the Layer 1 and Layer 2 parts of Arbitrum. Layer 1 provides the AVM interface and ensures correct execution of the virtual machine.

Every Arbitrum chain has a single AVM which does all of the computation and maintains all of the storage for everything that happens on the chain.

Differences between AVM and EVM are motivated by the needs of Arbitrum's Layer 2 protocol and Arbitrum's use of a interactive proving to resolve disputes.

### Gotchas

Block Numbers: Arbitrum vs. Ethereum

- One Ehtereum block may contain several Arbitrum's multiple block.
- Arbitrum block use layer1's `blocktimestamp`

Useful Addresses： <https://developer.offchainlabs.com/docs/useful_addresses>

## L1 to L2 messaging

### Ethereum to Arbitrum: Retryable Tickets

Retryable tickets are the Arbitrum protocol’s canonical method for passing generalized messages from Ethereum to Arbitrum. A retryable ticket is an L2 message encoded and delivered by L1; if gas is provided, it will be executed immediately. If no gas is provided or the execution reverts, it will be placed in the L2 retry buffer, where any user can re-execute for some fixed period (roughly one week).

- <https://github.com/OffchainLabs/arbitrum-tutorials/tree/master/packages/greeter>

### L2 to L1 messaging

<https://github.com/OffchainLabs/arbitrum-tutorials/tree/master/packages/outbox-execute>

## Quick Start

### depoly SimpleToken

- install dependencies

  ```bash
  yarn
  ```

- config env variables  
  copy .env.example file rename it to .env, then modify `PRIVATE_KEY` and `INFURA_ID`

- switch network to arbitrum testnet (arbitrum rinkeby)

  Because the testnet is arbitrum rinkeby, so we need get some test token from ethereum rinkeby network [rinkeby 测试网](https://www.alchemy.com/faucets/ethereum-sepolia).

  Then transfer ethereum rinkeby test token to arbitrum testnet through [arbitrum bridge](https://bridge.arbitrum.io/) , it will take 10mins.

  After a while, we can see balance on arbitrum testnet is not zero any more.

- run script

  ```bash
  npx hardhat run scripts/deploy.js --network arbitrum_rinkeby
  ```

  output content (421611 is Arbitrum-Rinkeby chainId)

  ```bash
  Network ChainId: 421611
  Deploying contracts with the account: 0x....
  Account balance: ...
  Token address: 0x...
  ```

### L1 to L2

```sh
node ./scripts/L1toL2.js
```

output:

```sh
Arbitrum Demo: Cross-chain Greeter
Lets
Go ➡️
...🚀

Deploying L1 Greeter 👋
deployed to 0x24b11e81B6477129f298e546c568C20e73b6DD5b
Deploying L2 Greeter 👋👋
deployed to 0x4998e921AC9Cd7ba3B2921aDA9dCedbDC1341465
...
```

## TODO

- L2 to L1 messaging demo

## Reference

- <https://developer.offchainlabs.com/docs/inside_arbitrum>
- Arbitrum github: <https://github.com/OffchainLabs>
- Arbitrum docs-CN： <https://github.com/dysquard/Arbitrum_Doc_CN>
- compare with OP: <https://medium.com/stakingbits/guide-to-arbitrum-and-setting-up-metamask-for-arbitrum-543e513cdd8b>
- Difference between Arbitrum and Optimism: <https://new.qq.com/omn/20210709/20210709A0CL6M00.html>
- Layer2 Rollup: <https://q6rsx4wom8.feishu.cn/file/boxcnu89en45JWelsoUv8nIwdRc>
- arbi intro: <https://q6rsx4wom8.feishu.cn/file/boxcnu89en45JWelsoUv8nIwdRc>
- Mubu tree graph: <https://mubu.com/app/edit/clb/NIhGqZda80#m>
