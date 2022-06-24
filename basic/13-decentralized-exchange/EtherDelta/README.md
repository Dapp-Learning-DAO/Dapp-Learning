English / [中文](https://github.com/Dapp-Learning-DAO/Dapp-Learning/blob/main/basic/13-decentralized-exchange/EtherDelta/README-CN.md)
# EtherDelta

It use contract to realize traditional centralized exchange and order book model exchange

Due to the older `solidity 0.4.9` version of the original code, `Hardhat` did not support it, so updated the contract and test files to `solidity 0.8.0`.  (The old version has too many bugs...)。

The original code is in `./backup `

## Code usage

### Install

```sh
yarn install
```

### Compile Contract

```sh
yarn build
```

或

```sh
npx hardhat compile
```

### Test Contract

```sh
yarn test
```

或

```sh
npx hardhat test
```

## Brief Description of Contract Functions

### ReserveToken

EtherDelta implements a simple token contract, similar to the ERC20 standard contract, for intra-exchange token trading (not ETH)

### AccountLevelsTest

An internal VIP level list is maintained. The administrator can set the VIP level of a user.

### EtherDelta

Exchange core contract

Users must first deposit their assets in the (`deposit()`) exchange contract, and can withdraw( `withdraw()` in their wallet after the transaction, which is basically the same as the process of a centralized exchange.

#### Transaction process

1. The seller invokes `order()` with the invoicing information converted to a hash as a key into the' Orders' contract variable
2. The buyer eats the order `trade()`, passing in the specified order hash

#### constructor

```solidity
constructor(
    address admin_,     //  Creator
    address feeAccount_,  // Commission beneficiary
    address accountLevelsAddr_, // AccountLevelsTest Contract Address
    uint256 feeMake_,   //  Purchase rate
    uint256 feeTake_,   //  Selling rate
    uint256 feeRebate_  //  VIP commission rebate rate
)
```

#### Contract `public` variable

```solidity
...
mapping(address => mapping(address => uint256)) public tokens; // Token List of the number of each token held by the user (address 0 represents Ether)
mapping(address => mapping(bytes32 => bool)) public orders; // List of invoices (true = invoices submitted by the user, requiring verification of offline signature)
mapping(address => mapping(bytes32 => uint256)) public orderFills; // amount of order that has been filled
```

## todo list

### Test Process Description

At present, only the core functions have been tested, and part of the test process has not been upgraded. See `./backup/test.old.js` for the old test file
**Some tests in the original test file are incorrect. You are advised to use the current test file**

## Refer to the link

EtherDelta github 仓库: https://github.com/etherdelta/smart_contract
