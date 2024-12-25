dYdX 为了提升交易性能和降低成本，采用了 StarkWare 开发的 StarkEx 作为其二层扩展方案。StarkEx 提供了更高效的交易处理能力，与其他扩展方案相比，其利用零知识证明技术的独特优势包括更低的 gas 费用和更高的扩展性。

**StarkEx 技术架构**

StarkEx 利用 STARK（Scalable Transparent Argument of Knowledge）技术，为 dYdX 提供高效的交易处理能力。其核心组件包括：

- **StarkEx 服务（StarkEx Service）**：处理用户的交易请求，并将其打包成批次，提升交易吞吐量。
- **SHARP（SHARed Prover）**：为每个交易批次生成有效性证明，确保交易的真实性和数据隐私。
- **Stark 验证器（Stark Verifier）**：在以太坊主网上验证这些证明的有效性，确保链上状态的准确性。
- **Stark 合约（Stark Contract）**：在链上管理状态更新，保障整个系统的安全性和一致性。

用户的交易首先由 StarkEx Service 处理，随后 SHARP 生成相应的有效性证明。Stark Verifier 验证该证明后，Stark Contract 在以太坊主网上更新状态，从而实现快速且安全的交易处理。

**StarkEx 合约**

StarkEx 的合约设计涵盖多个模块，用于处理存款、取款和状态更新：

- **Deposits.sol**：管理用户存款的合约模块，用于将资产从 L1 转移到 StarkEx 系统。
  [查看代码](https://github.com/starkware-libs/starkex-contracts/blob/StarkExchange-v4.5/scalable-dex/contracts/src/interactions/Deposits.sol)
- **Withdrawals.sol**：负责处理用户从 StarkEx 系统提取资产到 L1 的逻辑。
  [查看代码](https://github.com/starkware-libs/starkex-contracts/blob/StarkExchange-v4.5/scalable-dex/contracts/src/interactions/Withdrawals.sol)
- **UpdateState.sol**：核心合约模块之一，用于执行状态更新操作，支持高效的批量交易验证。
  [查看代码](https://github.com/starkware-libs/starkex-contracts/blob/StarkExchange-v4.5/scalable-dex/contracts/src/starkex/interactions/UpdateState.sol)
  
updateState 函数示例：
```solidity
updateState(uint256[] publicInput, uint256[] applicationData)
```
此函数通过接收公共输入和应用数据，完成系统状态的更新。

**实际应用示例**

- 在 dYdX 平台上执行交易时，用户资金被转入 **L2 Perpetual Smart Contract** 中。例如：
  [转账交易示例](https://dashboard.tenderly.co/tx/mainnet/0x8ea3a15828fb5814091d3fc246920228c1c1480086f467978fe357f5bf3a2ac4?trace=0.8.1.1.0.7)
- 交易完成后，状态更新操作的执行记录可在以太坊区块链上验证：
  [状态确认交易](https://etherscan.io/tx/0x7985593db99c33fa851a196bd8b374221c6063fc654278c9d85d163c29dbcb06)

更多关于 dYdX 和 StarkEx 的细节可以参考其 [状态仪表盘](https://dydx.l2beat.com/)，了解实时数据与合约交互记录。

