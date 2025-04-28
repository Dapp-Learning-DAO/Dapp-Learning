# WalletConnect 多链交互示例

这个示例项目展示了如何使用 WalletConnect v2 实现多链交互功能，包括跨链资产查看、多链钱包连接和链间切换等功能。

## 功能特点

- 支持多个区块链网络的同时连接
- 实时显示多链资产余额
- 支持在不同链之间无缝切换
- 展示跨链交易历史
- 集成多链交易签名功能

## 技术栈

- React.js - 前端框架
- wagmi - 以太坊 React Hooks 库
- web3modal - Web3钱包连接组件
- ethers.js - 区块链交互库
- viem - 现代以太坊开发工具包

## 支持的网络

- Ethereum Mainnet
- Polygon
- Arbitrum
- Optimism
- Binance Smart Chain

## 开始使用

1. **安装依赖**
   ```bash
   yarn install
   ```

2. **环境配置**
   - 复制 `.env.example` 到 `.env`
   - 在 [WalletConnect Cloud](https://cloud.walletconnect.com) 注册并获取项目ID
   - 在 [Infura](https://infura.io) 注册并获取API密钥
   - 更新 `.env` 文件中的配置

3. **启动开发服务器**
   ```bash
   yarn start
   ```

## 项目结构

```
├── src/
│   ├── components/     # React组件
│   ├── hooks/         # 自定义Hooks
│   ├── config/        # 配置文件
│   ├── utils/         # 工具函数
│   └── services/      # 区块链服务
```

## 主要功能演示

1. **多链钱包连接**
   - 支持同时连接多个区块链网络
   - 显示每个网络的连接状态
   - 提供网络切换功能

2. **资产管理**
   - 查看多链资产余额
   - 显示代币价格和市值
   - 支持资产转账功能

3. **交易功能**
   - 发送跨链交易
   - 查看交易历史
   - 交易状态追踪

## 测试

```bash
# 运行单元测试
yarn test

# 运行E2E测试
yarn test:e2e
```

## 参考资源

- [WalletConnect v2 文档](https://docs.walletconnect.com/2.0)
- [Wagmi 文档](https://wagmi.sh)
- [Web3Modal 文档](https://docs.walletconnect.com/2.0/web3modal/about)
