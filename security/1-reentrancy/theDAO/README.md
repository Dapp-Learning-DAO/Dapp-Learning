# Reentrancy

A reentrancy attack can lead to significant asset loss. How does this attack occur? Essentially, when Contract A calls Contract B, if Contract B calls back into a function in Contract A, it exposes a potential vulnerability.

Here’s an example of poorly designed code:

```solidity
import "./IVault.sol";
import "hardhat/console.sol";

contract BuggyVault is IVault {
    mapping(address => uint256) public balances;
    
    function deposit() external override payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external override {
        address payable target = payable(msg.sender);
        (bool success,) = target.call{gas:500000, value:balances[msg.sender]}("");
        console.log(success);
        balances[msg.sender] = 0;
    }
}
```

If a malicious contract includes a harmful `receive()` or `fallback()` function:

```solidity
pragma solidity ^0.8.7;

import "./IVault.sol";
import "hardhat/console.sol";

contract Malicious {
    IVault public vault;

    constructor(IVault _vault) {
        vault = _vault;
    }

    function addDeposit() external payable {
        vault.deposit{value: msg.value}();
    }

    function withdrawFromVault() external {
        vault.withdraw();
    }

    fallback() external payable {
        vault.withdraw();
    }
}
```

When the malicious contract calls the `withdraw()` function of `BuggyVault`, funds are transferred to the malicious contract’s `receive()` function, triggering repeated `withdraw()` calls and continuously transferring Ether to the malicious contract.

While reentrancy attacks can cause significant loss, using `transfer` or `send` instead of `call` can prevent such attacks.

- **Using `transfer`**: `transfer` has a gas limit of 2300, which is enough to trigger an event, and if the transfer fails, it reverts the transaction.
- **Using `send`**: `send` also has a 2300 gas limit, but it does not revert on failure, so attackers cannot withdraw any Ether if they don’t have sufficient balance in the Vault.

## Analysis

The causes of a reentrancy attack include the following factors:
- **Existence of a reentrancy path**: The `withdraw()` function of `BuggyVault` calls into the malicious contract, which activates its `fallback()` function to re-enter `withdraw()`.
- **Lack of balance check**: No balance verification is done before the transfer.
- **Insufficient gas restriction**: `call` provides ample gas by default, enabling the malicious contract to execute the attack.
- **No transfer result check**: `call` doesn’t trigger an error on failed transfers, so it’s essential to verify whether the transfer succeeded.

## Best Practices

Based on the analysis, the following measures can prevent reentrancy attacks:

### Use a Reentrancy Guard (only when necessary)

Prevent reentrant calls by using state flags. Libraries like OpenZeppelin provide this functionality. Refer to `SafeVault1.sol`:

```solidity
pragma solidity ^0.8.7;

import "./IVault.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SafeVault1 is IVault, ReentrancyGuard {
    mapping(address => uint256) public balances;
    
    function deposit() external override payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external override nonReentrant {
        address payable target = payable(msg.sender);
        (bool success,) = target.call{value: balances[msg.sender]}("");
        balances[msg.sender] = 0;
    }
}
```

### Follow the "Check-Effect-Interaction" Pattern (recommended)

The "Check-Effect-Interaction" pattern effectively prevents reentrancy attacks:

1. **Check**: Strictly verify conditions.
2. **Effect**: Update internal state.
3. **Interaction**: Interact with external contracts.

Here’s an example of `SafeVault2.sol`:

```solidity
pragma solidity ^0.8.7;

import "./IVault.sol";

contract SafeVault2 is IVault {
    mapping(address => uint256) public balances;
    
    function deposit() external override payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external override {
        // Check
        require(balances[msg.sender] > 0, "Insufficient balance");
        // Effect
        uint256 balance = balances[msg.sender];
        balances[msg.sender] = 0;
        // Interaction
        address payable target = payable(msg.sender);
        (bool success,) = target.call{value: balance}("");
        require(success, "Transfer failed");
    }
}
```

### Carefully Use `call` for Transfers (recommended)

There are three ways to transfer funds:

1. **`transfer`**: Calls `fallback()` or `receive()` with a 2300 gas limit and reverts on failure.
2. **`send`**: Calls `fallback()` or `receive()` with a 2300 gas limit but does not revert on failure.
3. **`call`**: Allows specifying gas and checking the return value. Be sure to specify gas and check success.

Here’s an example of `SafeVault3.sol`:

```solidity
pragma solidity ^0.8.7;

import "./IVault.sol";

contract SafeVault3 is IVault {
    mapping(address => uint256) public balances;
    
    function deposit() external override payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external override {
        address payable target = payable(msg.sender);
        (bool success,) = target.call{gas: 2300, value: balances[msg.sender]}("");
        require(success, "Transfer failed!");
        balances[msg.sender] = 0;

        // Alternatively, use transfer:
        // target.transfer(balances[msg.sender]);
    }
}
```

## Instructions

Install dependencies and run tests:

```bash
npm install
npx hardhat test
```

## Test Flow

1. **Setup Signers**: Initialize `vaultOwner`, `maliciousUser`, `user2`, and `user3` as test participants in the `before` hook.

2. **Part 1 - Successful Attack Test**:
   - Deploy the `BuggyVault` contract (with reentrancy vulnerability) and the `Malicious` contract pointing to the `BuggyVault` address.
   - Have `maliciousUser`, `user2`, and `user3` deposit funds to the `vault`.
   - `maliciousUser` initiates a reentrancy attack using the `withdrawFromVault` function.
   - Verify that `user2` and `user3` are unable to recover their funds due to the attack.

3. **Part 2 - Attack Failure due to Reentrancy Protection**:
   - Deploy the `SafeVault1` contract (with reentrancy guard) and connect the malicious contract to this vault.
   - Each user (`maliciousUser`, `user2`, and `user3`) makes a deposit.
   - Attempt a reentrancy attack through the malicious contract’s `withdrawFromVault` function.
   - Verify that the malicious user cannot extract their balance, confirming the attack failed.

4. **Part 3 - Attack Failure due to Check-Effect-Interaction Pattern**:
   - Deploy the `SafeVault2` contract (using "Check-Effect-Interaction" pattern).
   - Setup and make deposits.
   - Attempt a reentrancy attack using the malicious contract, and verify that the attack failed, confirming contract and malicious user balances.

5. **Part 4 - Attack Failure due to Restricted `call()` Use**:
   - Deploy the `SafeVault3` contract (using restrictive `call()`).
   - Setup and make deposits.
   - Attempt a reentrancy attack, expecting the reentrancy call to fail.

These tests effectively detect the reentrancy vulnerability in `BuggyVault` and confirm the efficacy of the defensive measures.