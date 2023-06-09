# What is CREATE2

The Opcode CREATE2 is imported in EIP-1014,which allows the user to determinesticly deploy and address given the tripple: the deployer, the init code, and the salt, while with the traditional CREATE the address of the contract to deploy is decided by the hash of the pair: the deployer, the nonce of the deployer. 


What's more ,with the help of CREATE2, we can even pre-calculate the address before the contract is deployed.

# Why we need CREATE2

CREATE2 allows user to determinesticly deploy the contract. This is useful when we want to controll the address of the contract, especially in multi-chain scenarios. For example, if we want to have the contrac to then same address on different blockchains, we cannot use CREATE because the same deployer may have different nonces on different chains.

# How the address is calculated?

The address is determined by the following rule:

```
addr = keccak256(0xff, deployer, salt, initCodeHash)
```

where:
- deployer: the address of the deployer. Also, it is a CA rather than EOA since the Ethereum transaction does not support it. Usually the deployer is a factory contract like the one defined in EIP-2470.
- salt: this is a byte32 value.
- initCodeHash: the keccak256 hash of the initCode which is the creationCode(compiled from source solidity) plus the constructor args.

# How to deploy

## Solidity

Basicly you can deploy it via **new**:

```
address actual = address(new Target{salt: salt}());

```

You can also deploy it via OZ:

```
import "@openzeppelin/contracts/utils/Create2.sol";
...

    bytes32 salt = xxx;
    bytes memory initCode = xxx;
    address actual = Create2.deploy(0, salt,initCode);
    require(actual != address(0), "deploy failed");

```
## Ethers

You can deploy it through EIP-2470.

# QA

## What if we deploy the contract to the address that has existing balance? 

The deployment will be successful, and the contract will hold the previous balance.
