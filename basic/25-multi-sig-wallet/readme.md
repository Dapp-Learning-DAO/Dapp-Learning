[中文](./README-CN.md) / English

# Multi-Sig-Wallet

> The old version of the multi-sig-wallet contract uses the 0.4.x version of solidity, and the original repo has been deprecated. The new version is called Gnosis-Safe-Contracts, which integrates multiple security contract modules. Due to the large amount of code in the new version and inconvenient to understand, we still use the old version to learn and understand its usage process and how it work.

- Old Version multi-sig-wallet: gnosis MultiSigWallet: <https://github.com/gnosis/MultiSigWallet>
- New Version Gnosis Safe Contracts: <https://github.com/safe-global/safe-contracts>

## Contract Index

> contract address: <https://github.com/gnosis/MultiSigWallet/tree/master/contracts>

- MultiSigWallet.sol
- MultiSigWalletFactory.sol
- MultiSigWalletWithDailyLimit.sol
- MultiSigWalletWithDailyLimitFactory.sol
- TestCalls.sol
- TestToken.sol

## Contract Interface

- contructor

  Initialize the list of signers, each transaction requires at least few signatures.

- addOwner

  Add new owner of wallet.

- replaceOwner

  Replace existing signer owner with new owner.

- changeRequirement

  Change the minimum number of signatures.

- submitTransaction

  Submit a transaction with contract address, amount and transaction data parameters.

- confirmTransaction

  Confirm the transaction by transaction id. Confirm that the transaction can be executed, if the number of confirmed owners has reached the minimum requirement, the transaction will be executed automatically.

- revokeConfirmation

  Revoke the confirmed transaction.

- executeTransaction

  If the number of confirmed owners has reached the minimum requirement, Execute the corresponding transaction by id.

- isConfirmed

  Check the number of transaction's confirmed owners has reached the minimum requirement.

- getConfirmationCount

  Get the number of times a transaction is currently confirmed.

- getTransactionCount

  Query the number of transactions, the two input parameters are: whether to include transactions in processing, whether to include processed transactions.

- getOwners

  Get owners addresses.

- getConfirmations

  Get confirmers of a transaction.

- getTransactionIds
  
  Query the list of transaction ids, the parameters are: from, to, pending (whether it is in processing), executed (whether it is processed)

## Quick Start

- install dependencies

  ```sh
  yarn
  ```

- compile contracts

  ```sh
  npx hardhat compile
  ```

- test contracts

  ```sh
  npx hardhat test
  ```

- deploy contracts

  ```sh
  npx hardhat run scripts/deploy.js  --network kovan
  ```

## TODO

- New Version Gnosis Safe Contracts: <https://github.com/safe-global/safe-contracts>

## Reference

- [Now open source: friendly multi-signatures for Ethereum 🔑](https://medium.com/dsys/now-open-source-friendly-multi-signatures-for-ethereum-d75ca5a0dc5c)
- gnosis usage: <https://gnosis-safe.io/app/#/welcome>
- gnosis contract address(Polygon): <https://polygonscan.com/address/0xa6b71e26c5e0845f74c812102ca7114b6a896ab2#code>
- Construct your own gnosis multi-signature transaction: <https://mp.weixin.qq.com/s/qgbTnchCHup24ANprGXH5Q>
