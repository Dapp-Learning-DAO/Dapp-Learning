# Optimism

[中文](https://github.com/Dapp-Learning-DAO/Dapp-Learning/blob/main/basic/28-optimism-layer2/README-CN.md) / English

## Abstract

Optimistic Rollups（OR）is a Layer2 solution，which means it's not an independent chain，but relys on Ethereum mainnet。The benefits of such construction are that it can not only run smart contracts at scale，but also enjoys the benefit of Ethereum security，just similar to Plasma，but have less capacity of transactions。OR chooses to use OVM（Optimistic Virtual Machine）compatible with EVM，allowing contracts to have same behavior on both sides.

The name "Opmistic Rollup" comes from the characteristics of the solution itself。 Optimistic means less infomation for aggregator to publish ，and no need to provide any proof。 Rollup means transactions are submitted to L1 in bundles。

## Bedrock

- [OptimismBedrock.md](./OptimismBedrock.md)
- [Optimism Bedrock Sharing meeting video (coming soon)](https://www.youtube.com/@DappLearning)

Bedrock is the next major release of the Optimism network, planned for the first quarter of 2023 (subject to approval by Optimism governance). It will further reduce the differences between Optimism and L1 Ethereum.

## Contracts

### System Overview

The smart contracts in the Optimism protocol can be separated into a few key components.

- **[Chain:](#chain-contracts)** Contracts on layer-1, which hold the ordering of layer-2 transactions, and commitments to the associated layer-2 state roots.
- **[Verification:](#verification)** Contracts on layer-1 which implement the process for challenging a transaction result.
- **[Bridge:](#bridge-contracts)** Contracts which facilitate message passing between layer-1 and layer-2.
- **[Predeploys:](#predeployed-contracts)** A set of essential contracts which are deployed and available in the genesis state of the system. These contracts are similar to Ethereum's precompiles, however they are written in Solidity, and can be found at addresses prefixed with 0x42.

## Test steps

### ETH cross-chain with Optimism gateway

- Deposite ETH to Optimistic  
  Optimism testnet links to Goerli testnet。 Before we send transactions to Optimistic， we need to deposite ETH to Optimistic first。  
  Visit Optimism gateway，then choose "Deposite" ，and input ETH amount

- Waiting for deposite finish  
  It may takes at least 20 minutes to finish deposite, please be patient.

- Check Balance  
  After ETH deposite successfully，check balance on Optimistic with MetaMask

- Install dependencies

```bash
npm install
```

- Config env parameters  
  Use template .env.example to create .env ，then config PRIVATE_KEY && INFURA_ID in it

- Deploy Contract

```bash
❯ npx hardhat run scripts/deploy.js --network optimism
Deploying contracts with the account: 0xa3F2Cf140F9446AC4a57E9B72986Ce081dB61E75
Account balance: 1500000000000000000
Token address: 0x0d29e73F0b1AE67e28495880636e2407e41480F2
```

### ETH cross-chain with script

- Deposite ETH to Optimism with script  
  In addition to do cross-chain through UI，we can also do it with script。  
  In the following script，by calling cross-chain contract on Goerli side， ETH will be deposited to Optimism。

```sh
npx hardhat run scripts/deposit-eth.js --network goerli

## It will takes about 5 minuts to finish the deposite，then it will add 0.0001 ETH to your account on Optimism side
```

- Withdraw ETH to Goerli  
  After deposite ETH to Optimism，we can also withdraw it back to Goerli.  
  Similar to deposite，we just call cross-chain contract on Optimism side，ETH will be withdrawed to Goerli.

```sh
npx hardhat run scripts/withdraw-eth.js --network optimism

## It will takes about 5 minuts to finish the withdraw，then it will add 0.0001 ETH to your account on Goerli side
```

## References

- Optimism github: <https://github.com/ethereum-optimism/optimism-tutorial>
- Optimism doc: <https://community.optimism.io/docs/protocol/protocol-2.0/>
- Optimistic Rollup contracts: <https://medium.com/plasma-group/-ethereum-smart-contracts-in-l2-optimistic-rollup-2c1cef2ec537>
- Optimism Rollup Principle Explanation : <https://zhuanlan.zhihu.com/p/350541979>
- Optimism Cross Bridge : <https://gateway.optimism.io/>
- Optimism Goerli deposite proxy contract : <https://goerli.etherscan.io/address/-0x636af16bf2f682dd3109e60102b8e1a089fedaa8#code>
- Optimism Goerli withdraw proxy contract : <https://goerli-optimism.etherscan.io/-address/0x4200000000000000000000000000000000000010>
