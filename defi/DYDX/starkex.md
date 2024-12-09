dYdX 为了提升交易性能和降低成本，采用了 StarkWare 开发的 StarkEx 作为其二层扩展方案。

**StarkEx 技术架构**

StarkEx 利用 STARK（Scalable Transparent Argument of Knowledge）技术，为 dYdX 提供高效的交易处理能力。其核心组件包括：

- **StarkEx 服务（StarkEx Service）**：处理用户的交易请求，并将其打包成批次。
- **SHARP（SHARed Prover）**：为每个交易批次生成有效性证明。
- **Stark 验证器（Stark Verifier）**：在以太坊主网上验证这些证明的有效性。
- **Stark 合约（Stark Contract）**：在链上管理状态更新。

用户的交易首先由 StarkEx Service 处理，随后 SHARP 生成相应的有效性证明。Stark Verifier 验证该证明后，Stark Contract 在以太坊主网上更新状态。

## Starkex 合约
dYdX: L2 Perpetual Smart Contract
dYdX: L2 On-Chain Operator

https://github.com/starkware-libs/starkex-contracts/blob/StarkExchange-v4.5/scalable-dex/contracts/src/interactions/Deposits.sol
https://github.com/starkware-libs/starkex-contracts/blob/StarkExchange-v4.5/scalable-dex/contracts/src/interactions/Withdrawals.sol
Dydx页面显示
https://dydx.l2beat.com/
转账过程
转账15USDT到 dYdX: L2 Perpetual Smart Contract(15-2022-11-15 12:10:59 PM)
L2 Perpetual Smart Contract
https://dashboard.tenderly.co/tx/mainnet/0x8ea3a15828fb5814091d3fc246920228c1c1480086f467978fe357f5bf3a2ac4?trace=0.8.1.1.0.7
状态确认
https://etherscan.io/tx/0x7985593db99c33fa851a196bd8b374221c6063fc654278c9d85d163c29dbcb06
https://github.com/starkware-libs/starkex-contracts/blob/StarkExchange-v4.5/scalable-dex/contracts/src/starkex/interactions/UpdateState.sol     performUpdateState
updateState(uint256[] publicInput, uint256[] applicationData)