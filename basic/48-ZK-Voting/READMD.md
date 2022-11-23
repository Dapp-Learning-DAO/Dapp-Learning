# ZK Voting

## Quick Start

use `npm` to install, `yarn` may faild.

```sh
npm install
```

setup and generate `input.json`, `public.json`, `proof.json`, `Verifier.sol`...

```sh
cd circuits

# chmod 777 ...

./0-cleanup.sh
./1-setup.sh
./2-add2Tree.sh
./3-proveInTree.sh

```

modify two Verifier contracts

- change pragma version from `^0.6.11` to `^0.8.0`
- change contract name, from `Verifier` to `Add2TreeVerifier` and `ProveInTreeVerifier`

```solidity
// contracts/Add2TreeVerifier.sol
// contracts/ProveInTreeVerifier.sol

...
pragma solidity ^0.8.0;


...
contract Add2TreeVerifier {...}

contract ProveInTreeVerifier {...}

```

test zk dapp

```sh
npm run test
```

## TODO

- complete README
- add Front-End

## Reference

- zk-prove-membership: <https://github.com/scaffold-eth/scaffold-eth-examples/tree/zk-prove-membership>
- zk-voting-example: <https://github.com/scaffold-eth/scaffold-eth-examples/tree/zk-voting-example>
- whats-a-sparse-merkle-tree: <https://medium.com/@kelvinfichter/whats-a-sparse-merkle-tree-acda70aeb837>
