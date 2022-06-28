# Reentrancy

Reentrancy attack can lead to great loss. How it works? Basicly, when contract A interact with contract B, contract B can reenter into contract A, exposing vulnerabilities.

Here is a bad designed code:

```
import "./IVault.sol";
import "hardhat/console.sol";


contract BuggyVault is IVault {

    mapping(address=>uint256) public balances;
    
    function deposit() external override payable{
        balances[msg.sender] += msg.value;
    }

    function withdraw() external override{
        address payable target = payable(msg.sender);
        (bool success,) = target.call{gas:500000, value:balances[msg.sender]}("");
        console.log(success);
        balances[msg.sender] = 0;
    }
}
```

if there is a malicious contract with a malicious receive() or fallback():
```
pragma solidity ^0.8.7;


import "./IVault.sol";
import "hardhat/console.sol";


contract BuggyVault is IVault {

    mapping(address=>uint256) public balances;
    
    function deposit() external override payable{
        balances[msg.sender] += msg.value;
    }

    function withdraw() external override{
        address payable target = payable(msg.sender);
        (bool success,) = target.call{value:balances[msg.sender]}("");
        console.log(success);
        balances[msg.sender] = 0;
    }
}
```

When malicious contract calls withdraw() in BuggyVault, the money transfer reenterer into receive() of malicious receive, causing keeping sending ether to malicious contract.

Though reentrancy attack could potentially cause great, great loss, it is not that easy to happen. If we use "transfer" or "send" instead of "call", it would not happen.

- what if we use "transfer": transfer has a limit gas of 2300 only to emit events, and failure of transfer would cause revert.
- what if we use "send": send has a limit gas of 2300 only to emit events, but failure of "send" would not revert, causing the attacker lost all his vault balance and not withdrawing any ether from the vault!Loosing everything :)
  
# Analysis

The reentrancy attack is caused by many factors:
- it has reentrancies: When withdraw() in BuggyVault is called, it transfer money to Malicious contract, activating its fallback which enters into "withdraw()" again.
- it does not check balance: Before transfering money, withdraw() function does not check money.
- it doesn't specify gas limit: The default gas of "call" is 63*gas()/64, which is sufficient for malicious contract to do bad stuffs.
- it doen't check transfer result: Transfering ethers using "call" would not panic on failure, so you should alway check whether your call is success.


# Best practices

According to the analysis above, we can do several things:

## Use reentrancy guard(Only use it in risks)
We can mark additional status from reentrancy. Several libraries like openzeppelin can be helpful. Refer to SafeVault1.sol for more details.

```
pragma solidity ^0.8.7;


import "./IVault.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SafeVault1 is IVault, ReentrancyGuard {

    mapping(address=>uint256) public balances;
    
    function deposit() external override payable{
        balances[msg.sender] += msg.value;
    }

    function withdraw() external override nonReentrant{
        address payable target = payable(msg.sender);
        (bool success,) = target.call{value:balances[msg.sender]}("");
        balances[msg.sender] = 0;
    }
}
```

Note that use this manner only when there is a risk of reentering since it costs more gas to maintain reentering status.

You may find that in test "2 attack failed due to reentrancy", the malicious call is not reverted. Could you explain it? :)

## Keep Check-Effect-Interact pattern(Recommended)

Always keep Check-Effect-Interact pattern where:
- Check: strictly check your preconditions before your next move.
- Effect: modify your inner states.
- Interact: interact with other accounts.
 
 Following this style, the attack would not success because the vault balance has been changes. Refer to SafeVault2.sol for more details.

```
pragma solidity ^0.8.7;


import "./IVault.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SafeVault2 is IVault {

    mapping(address=>uint256) public balances;
    
    function deposit() external override payable{
        balances[msg.sender] += msg.value;
    }

    function withdraw() external override nonReentrant{
        //Checks
        require(balances[msg.sender] > 0, "Insufficient money");
        //Effects
        balances[msg.sender] = 0;
        //Interact
        address payable target = payable(msg.sender);
        (bool success,) = target.call{value:balances[msg.sender]}("");
    }
}
```

You may find that in test "3 attack failed due to check-effects-interact", the malicious call is not reverted. Could you explain it? :)

## Careful use of call when transfering(Recommended)

There are three ways of transfering native token:
- transfer: call "fallback()" or "receive()" if target is contract; only deliver 2300 gas;  panic on failure.
- send: call "fallback()" or "receive()" if target is contract; only deliver 2300 gas;  No panic on failure.
- call: call whatever function you want and gather return data; By default deliver gas()*63/64, and you can specify it. No panic on failure.

The "transfer" manner could fulfill most cases while maintaining safety; The "call" manner is strong, but be sure to specifiy the gas and CHECK THE RESULT!! Refer to GoodVault3.sol for more details.


```
pragma solidity ^0.8.7;


import "./IVault.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SafeVault3 is IVault {

    mapping(address=>uint256) public balances;
    
    function deposit() external override payable{
        balances[msg.sender] += msg.value;
    }

    function withdraw() external override nonReentrant{
        address payable target = payable(msg.sender);
        (bool success,) = target.call{gas:2300, value:balances[msg.sender]}("");
        require(success, "transfer failed!");
        balances[msg.sender] = 0;

        //Or simply use transfer:
        //target.transfer(balances[msg.sender]);
    }
}
```

# How to use

```
npm install
```


```
npx hardhat test
```