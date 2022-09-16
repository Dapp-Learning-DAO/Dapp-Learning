# Euler Contracts Guide

## Moudles

Euler 一共 9 个模块，通过此函数创建 Proxy，后续升级可以根据需求分模块升级

- `DToken` 债务凭证
- `Etoken` 抵押凭证
- `Exec` 执行合约（可批量执行操作）
- `Governance` 治理模块
- `Installer` 模块安装器，涉及模块的设置和权限
- `Liquidiation` 清算模块
- `Markets` 资产市场，存储资产在 Euler 借贷市场中的相关参数，例如 `BorrowFactor` `CollateralFactor`
- `RiskManager` 风险管理模块
- `Swap` 交易模块（用户 EToken 的交易，不是 underlying）

## Moudles Upgrade

Euler finance 对于常规的合约可升级模式进行了改进，形成了模块化升级模式，相比于常规 Proxy 模式有以下特点：

1. 可以将合约拆分成各个模块单独管理版本，例如可以仅升级其中一个模块而不用升级所有逻辑合约
2. 协议所有 Storage 状态变量都集中在入口合约上 `Euler.sol`，并非分布于不同模块的 Proxy 合约上，对于状态管理更加方便
3. 部分日志可以由模块 Proxy 发出，而不是统一由入口合约 `Euler.sol` 发出，详见 `emitViaProxy_Transfer` 和 `emitViaProxy_Approval`
4. 每个模块都有 `moudleId` 和 `moduleGitCommits` 作为特征，id 是每种模块的固定编号，GitCommits 是版本标记，便于比对
