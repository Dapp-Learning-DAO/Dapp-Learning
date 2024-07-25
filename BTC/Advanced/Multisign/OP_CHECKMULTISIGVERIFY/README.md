## OP_CHECKMULTISIGVERIFY

`OP_CHECKMULTISIGVERIFY` 并没有通过单独的 BIP 提出，但其背景和实现与 BIP 16 的提出密切相关。BIP 16 提出了支付到脚本哈希（P2SH）的机制，使得复杂的脚本可以更简洁地在链上表示，并且增强了多重签名的可用性。

### 详细背景

#### BIP 16 提出

1. **BIP 16**：
   - 标题：`Pay to Script Hash`
   - 提案作者：Gavin Andresen
   - 提出时间：2012 年 1 月
   - 内容：定义了支付到脚本哈希（P2SH）的机制。P2SH 允许复杂的脚本在链上以更简洁的形式表示，并在解锁时提供完整的脚本内容。这极大地简化了多重签名等复杂交易的实现。

#### OP_CHECKMULTISIGVERIFY 的引入

在 BIP 16 提出并实现后，比特币开发社区继续寻找优化和简化脚本的方法。`OP_CHECKMULTISIGVERIFY` 作为 `OP_CHECKMULTISIG` 和 `OP_VERIFY` 的组合，自然而然地被引入，以简化多重签名验证的脚本编写和执行过程。

### OP_CHECKMULTISIGVERIFY 的工作原理

`OP_CHECKMULTISIGVERIFY` 结合了 `OP_CHECKMULTISIG` 和 `OP_VERIFY` 的功能。其主要目的是在验证多重签名后，立即判断验证结果并返回执行状态。

脚本构建和签名过程可以参考[OP_CHECKMULTISIG](../OP_CHECKMULTISIG/README.md)，这里不再赘述。