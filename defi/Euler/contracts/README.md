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
