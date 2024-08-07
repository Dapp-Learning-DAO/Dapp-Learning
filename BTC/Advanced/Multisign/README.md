## 多签介绍
在比特币 (BTC) 网络中，多签名 (Multi-Signature 或 Multi-Sig) 是一种安全性增强技术，它要求多个密钥签名才能执行一笔交易。具体来说，多签机制允许用户创建一个钱包地址，只有在满足一定数量的签名条件下，才能使用钱包中的资金。多签名技术可以用于提高安全性、实现分布式控制和管理资金等用途。

### 多签名的工作原理
1. **创建多签地址**：
   - 多签地址通常是由多个参与者的公钥共同生成的。
   - 比如，一个 2-of-3 的多签地址意味着需要三个公钥，并且至少需要其中两个公钥对应的私钥来签名交易。

2. **构造交易**：
   - 当需要使用多签地址中的比特币时，必须构造一个包含所有必要签名的交易。
   - 比如，对于 2-of-3 的多签地址，至少需要两个参与者的签名才能执行交易。

3. **广播交易**：
   - 完整签名的交易可以广播到比特币网络，并由矿工进行验证和打包。

### 多签名的应用场景
1. **提高安全性**：
   - 单一私钥被盗将无法转移资金，必须多个私钥同时被盗才能实现恶意交易。
   
2. **分布式控制**：
   - 可以用于多方共同控制资金，比如公司资金的多方管理，防止单人滥用资金。
   
3. **智能合约和去中心化应用**：
   - 多签名可以作为简单的智能合约机制，支持更加复杂的交易条件和逻辑。

### 示例
一个简单的 2-of-3 多签交易流程可能如下：
1. 生成三个公私钥对（用户A、用户B、用户C）。
2. 使用三个公钥生成一个 2-of-3 的多签地址。
3. 将比特币转入这个多签地址。
4. 当需要转出比特币时，用户A和用户B（或者用户A和用户C，或者用户B和用户C）共同签名交易。
5. 交易广播到网络并等待确认。


## 多签验证的OPCode
在比特币网络中，多签名（Multi-Signature，简称多签）是一种提高安全性和灵活性的技术，允许在执行交易时需要多个签名。为了实现多签名，比特币脚本（Bitcoin Script）提供了几个关键的操作码（OPCode）。以下是与多签名相关的主要 OPCode 及其功能：

### 主要的多签名 OPCode

1. **OP_CHECKMULTISIG**
   - **功能**：验证多签名交易。
   - **描述**：从堆栈中弹出 n 个公钥和 m 个签名，检查是否有至少 m 个签名有效。如果有效，则返回 true，否则返回 false。
   - **示例**：
     ```
     <m> <A公钥> <B公钥> <C公钥> <n> OP_CHECKMULTISIG
     ```
     其中，`<m>` 是需要的最小签名数，`<n>` 是提供的公钥数量。

2. **OP_CHECKMULTISIGVERIFY**
   - **功能**：与 OP_CHECKMULTISIG 类似，但在验证失败时终止执行并返回错误。
   - **描述**：与 OP_CHECKMULTISIG 的工作原理相同，只是如果检查失败，脚本将立即失败。
   - **示例**：
     ```
     <m> <A公钥> <B公钥> <C公钥> <n> OP_CHECKMULTISIGVERIFY
     ```

3. **OP_CHECKSIGADD**
   - **功能**：用于在 Taproot 和 Schnorr 签名方案中实现高效的多签名验证。
   - **描述**：从堆栈中取出一个公钥和一个签名，验证该签名是否有效，并将结果添加到一个计数器中。计数器表示有效签名的总数。
   - **示例**：
     ```
     <A公钥> <签名A> OP_CHECKSIGADD
     <B公钥> <签名B> OP_CHECKSIGADD
     <C公钥> <签名C> OP_CHECKSIGADD
     <2> OP_EQUAL
     ```
     - `<A公钥> <签名A> OP_CHECKSIGADD`：验证签名A是否匹配A公钥并将结果加到计数器。
     - `<B公钥> <签名B> OP_CHECKSIGADD`：验证签名B是否匹配B公钥并将结果加到计数器。
     - `<C公钥> <签名C> OP_CHECKSIGADD`：验证签名C是否匹配C公钥并将结果加到计数器。
     - `<2> OP_EQUAL`：检查计数器是否等于2，即验证是否有两个有效签名。

### 示例脚本

#### P2SH（Pay-to-Script-Hash）多签名交易
1. **创建赎回脚本（Redeem Script）**：
   ```
   <2> <A公钥> <B公钥> <C公钥> <3> OP_CHECKMULTISIG
   ```
   - `<2>`：至少需要两个签名。
   - `<A公钥> <B公钥> <C公钥>`：三个公钥。
   - `<3>`：表示共有三个公钥。

2. **生成 P2SH 地址**：
   - 将上述赎回脚本的哈希值作为 P2SH 地址，将比特币发送到该地址。

3. **花费 P2SH 多签名交易**：
   - 解锁脚本（Unlocking Script）：
     ```
     <0> <签名1> <签名2> <赎回脚本>
     ```
     - `<0>`：因为 OP_CHECKMULTISIG 有一个历史遗留的 bug，需要额外的空值。
     - `<签名1> <签名2>`：两个有效签名。
     - `<赎回脚本>`：实际的赎回脚本，证明这是正确的解锁条件。

#### Taproot 多签名脚本
1. **赎回脚本（Taproot Script）**：
   ```
   <A公钥> <签名A> OP_CHECKSIGADD
   <B公钥> <签名B> OP_CHECKSIGADD
   <C公钥> <签名C> OP_CHECKSIGADD
   <2> OP_EQUAL
   ```

### 操作码对比
对比比特币多签名相关的主要 OPCode，包括功能、描述、优点、缺点、使用的脚本类型、推出的 BIP 编号及示例：

| OPCode                   | 功能                      | 描述                                                                                                                | 优点                                                              | 缺点                                                                    | 使用的脚本类型               | 推出的 BIP 编号 | 示例                                                                                                           |
|--------------------------|---------------------------|---------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------|-------------------------------------------------------------------------|--------------------------------|------------------|---------------------------------------------------------------------------------------------------------------|
| **[OP_CHECKMULTISIG](./OP_CHECKMULTISIG/README.md)**     | 验证多签名交易            | 从堆栈中弹出 n 个公钥和 m 个签名，检查是否有至少 m 个签名有效。如果有效，则返回 true，否则返回 false。            | 适用于传统多签名交易，广泛支持                                     | 脚本较大，存在历史遗留的 bug 需要额外的空值                             | P2SH, P2WSH                    | BIP 11, BIP 16   | `<2> <A公钥> <B公钥> <C公钥> <3> OP_CHECKMULTISIG`                                                            |
| **[OP_CHECKMULTISIGVERIFY](./OP_CHECKMULTISIGVERIFY/README.md)** | 验证多签名并返回错误     | 与 OP_CHECKMULTISIG 类似，但在验证失败时终止执行并返回错误。                                                        | 简化了错误处理逻辑                                                | 同样存在历史遗留的 bug 需要额外的空值                                   | P2SH, P2WSH                    | BIP 11, BIP 16   | `<2> <A公钥> <B公钥> <C公钥> <3> OP_CHECKMULTISIGVERIFY`                                                      |
| **[OP_CHECKSIGADD](./OP_CHECKSIGADD/README.md)**       | 高效验证多签名            | 从堆栈中取出一个公钥和一个签名，验证该签名是否有效，并将结果添加到一个计数器中。计数器表示有效签名的总数。         | 更高效，简化了多签名脚本，减少交易大小和费用                      | 仅在 Taproot 和 Schnorr 签名方案中可用                                   | Taproot                         | BIP 340, BIP 341 | `<A公钥> <签名A> OP_CHECKSIGADD<br><B公钥> <签名B> OP_CHECKSIGADD<br><C公钥> <签名C> OP_CHECKSIGADD<br><2> OP_EQUAL` |



### 总结
通过这些操作码，比特币网络提供了多种实现多签名的方式。`OP_CHECKMULTISIG` 和 `OP_CHECKMULTISIGVERIFY` 是传统的多签名实现方式，而 `OP_CHECKSIGADD` 则是引入 Taproot 和 Schnorr 签名后，更高效和灵活的实现方式。这些技术共同提升了比特币交易的安全性和灵活性，满足了不同应用场景的需求。

