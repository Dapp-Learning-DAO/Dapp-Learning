# Reentrancy

Reentrancy 攻击可能导致严重的资产损失。这种攻击是如何实现的？基本上，当合约 A 调用合约 B 时，如果合约 B 再次调用合约 A 的函数，将暴露出潜在的漏洞。

以下是一个设计不当的示例代码：

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

如果有一个恶意合约具备恶意的 `receive()` 或 `fallback()` 函数：

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

当恶意合约调用 `BuggyVault` 的 `withdraw()` 函数时，资金传递到恶意合约的 `receive()` 函数中，导致反复调用 `withdraw()` 函数，不断地将以太坊转入恶意合约。

虽然重入攻击可能导致严重损失，但使用 `transfer` 或 `send` 而不是 `call` 可以防止此类攻击。

- **使用 `transfer`**：`transfer` 的 gas 限制为 2300，仅足够触发事件，传输失败会触发回滚。
- **使用 `send`**：`send` 同样有 2300 的 gas 限制，不会回滚传输失败的情况，攻击者将损失其在 Vault 中的余额而无法提取任何以太坊。

## 分析

重入攻击的成因包括以下因素：
- **存在重入路径**：`BuggyVault` 的 `withdraw()` 函数在转账过程中调用恶意合约，激活其 `fallback()` 函数，再次调用 `withdraw()`。
- **缺乏余额检查**：在转账前没有检查余额。
- **缺少 gas 限制**：`call` 默认分配大量 gas，为恶意合约执行攻击提供条件。
- **未检查传输结果**：`call` 的传输失败不会导致错误，因此应检查传输是否成功。

## 最佳实践

根据以上分析，可以采用以下措施防范重入攻击：

### 使用 Reentrancy Guard（仅在必要时使用）

通过状态标记防止重入调用。像 OpenZeppelin 提供的库可用于实现此功能。参考 `SafeVault1.sol`：

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

### 遵循“检查-影响-交互”模式（推荐）

“检查-影响-交互”模式能有效避免重入攻击：

1. **检查 (Check)**：严格检查条件。
2. **影响 (Effect)**：修改内部状态。
3. **交互 (Interact)**：与外部合约进行交互。

以下是 `SafeVault2.sol` 的示例：

```solidity
pragma solidity ^0.8.7;

import "./IVault.sol";

contract SafeVault2 is IVault {
    mapping(address => uint256) public balances;
    
    function deposit() external override payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external override {
        // 检查
        require(balances[msg.sender] > 0, "Insufficient balance");
        // 影响
        uint256 balance = balances[msg.sender];
        balances[msg.sender] = 0;
        // 交互
        address payable target = payable(msg.sender);
        (bool success,) = target.call{value: balance}("");
        require(success, "Transfer failed");
    }
}
```

### 谨慎使用 `call` 进行转账（推荐）

转账有三种方式：

1. **`transfer`**：调用 `fallback()` 或 `receive()`，gas 限制为 2300，传输失败会回滚。
2. **`send`**：调用 `fallback()` 或 `receive()`，gas 限制为 2300，传输失败不会回滚。
3. **`call`**：可以指定传输 gas 并检查返回值。确保指定 gas 并检查成功状态。

以下是 `SafeVault3.sol` 的示例：

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

        // 或使用 transfer:
        // target.transfer(balances[msg.sender]);
    }
}
```

## 使用说明

安装依赖并运行测试：

```bash
npm install
npx hardhat test
```

## 测试流程

1. **设置签名人**：在 `before` 钩子中初始化 `vaultOwner`、`maliciousUser`、`user2` 和 `user3` 作为测试参与者的地址。

2. **第一部分 - 攻击成功测试**：
   - 部署 `BuggyVault` 合约（存在重入攻击漏洞）并部署 `Malicious` 恶意合约，指向 `BuggyVault` 合约地址。
   - `maliciousUser`、`user2` 和 `user3` 分别向 `vault` 合约存款。
   - `maliciousUser` 使用恶意合约进行重入攻击调用 `withdrawFromVault` 函数。
   - 检查恶意合约的余额，确认重入攻击成功，并显示 `user2` 和 `user3` 无法再取回他们的资金。

3. **第二部分 - 因重入保护失败的攻击**：
   - 部署 `SafeVault1` 合约（带重入保护机制），并将恶意合约连接到该 `vault` 合约。
   - 三个用户（`maliciousUser`、`user2` 和 `user3`）分别进行存款。
   - 尝试使用恶意合约进行重入攻击调用 `withdrawFromVault`。
   - 确认余额未被恶意用户提取，确认重入攻击失败。

4. **第三部分 - 因检查-效果-交互模式失败的攻击**：
   - 部署 `SafeVault2` 合约（使用“检查-效果-交互”模式）。
   - 设置并进行存款操作。
   - 尝试使用恶意合约进行重入攻击，确认攻击失败并验证合约余额和恶意用户余额。

5. **第四部分 - 因使用 `call()` 防范失败的攻击**：
   - 部署 `SafeVault3` 合约（使用限制性 `call()` 模式）。
   - 设置并进行存款操作。
   - 尝试使用恶意合约进行重入攻击，预期重入调用将会失败。

这些测试通过验证不同的合约防范措施，能够有效检测 `BuggyVault` 中的重入攻击漏洞并确认防御的有效性。