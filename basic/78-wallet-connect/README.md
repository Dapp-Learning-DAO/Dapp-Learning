# WalletConnect

## 简介

**WalletConnect** 是一个开放协议，允许用户将加密钱包安全地连接到去中心化应用（DApps），并支持多区块链网络的交互。用户只需扫描二维码或使用深度链接，即可与 DApp 进行交互，而无需暴露私钥，提供了安全、便捷的体验。

WalletConnect 通过加密消息在钱包与 DApp 之间传递信息，确保安全性。此外，WalletConnect 还支持多链和多会话连接，已广泛应用于 DeFi 和 NFT 平台等 Web3 领域。

## 功能

- **多链支持**：WalletConnect v2 支持跨多个区块链网络的连接，用户可以在单一会话中管理多链资产。
- **安全消息传递**：所有通信均加密，确保钱包和 DApp 之间的交互安全。
- **灵活的会话管理**：支持多会话，用户可以轻松在不同 DApps 和区块链网络之间切换。
- **简单的集成方式**：DApp 和钱包开发者可以使用 WalletConnect SDK 快速集成，并支持广泛的钱包连接。
- **跨平台兼容**：支持 iOS、Android 和 Web，确保用户在各种设备上都能访问。

## 安装

在 DApp 中使用 WalletConnect 时，可以安装 WalletConnect JavaScript 客户端库：

```bash
npm install @walletconnect/client
```

对于钱包提供方，需要集成 WalletConnect SDK（提供 iOS、Android 和 Web 版本）。

## 使用

### 步骤 1：初始化 WalletConnect 客户端

在 JavaScript/TypeScript 代码中，导入并初始化 WalletConnect 客户端：

```javascript
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "@walletconnect/qrcode-modal";

// 创建 WalletConnect 客户端实例
const connector = new WalletConnect({
  bridge: "https://bridge.walletconnect.org", // 必填项
  qrcodeModal: QRCodeModal,
});
```

### 步骤 2：检查连接并创建会话

如果没有已建立的连接，则创建一个新会话，提示用户连接钱包。

```javascript
// 检查是否已连接
if (!connector.connected) {
  // 创建新会话
  await connector.createSession();
}

// 监听会话事件
connector.on("connect", (error, payload) => {
  if (error) {
    throw error;
  }

  // 连接成功
  const { accounts, chainId } = payload.params[0];
});

connector.on("session_update", (error, payload) => {
  if (error) {
    throw error;
  }

  // 更新的账户和链ID
  const { accounts, chainId } = payload.params[0];
});

connector.on("disconnect", (error, payload) => {
  if (error) {
    throw error;
  }

  // 已断开连接
});
```

### 步骤 3：发送交易

连接成功后，即可与区块链进行交互。例如，发送一笔交易：

```javascript
// 设置交易详情
const tx = {
  from: accounts[0], // 用户地址
  to: "0xRecipientAddress",
  value: "0xAmountInWei", // 金额，单位为 wei
  data: "0x", // 可选数据
};

// 发送交易请求
const result = await connector.sendTransaction(tx);
```

## 从 WalletConnect v1 迁移到 v2

随着 WalletConnect v2 的发布，应用现已支持多链、多会话功能，并提供了更高的安全性。如果您仍在使用 WalletConnect v1，建议尽快迁移到 v2，以享受这些新功能的优势。


## WalletConnect V1 与 V2 对比

WalletConnect V2 引入了多链、多会话支持和改进的协议设计，提升了用户体验和开发灵活性。以下是 V1 和 V2 主要功能的对比：

| 功能                      | WalletConnect V1                        | WalletConnect V2                               |
|---------------------------|-----------------------------------------|------------------------------------------------|
| **多链支持**               | 不支持                                  | 支持多个区块链网络，允许跨链操作               |
| **多会话管理**             | 不支持                                  | 支持多个会话同时存在，简化用户切换             |
| **连接效率**               | 单一桥接服务器，容易过载               | 分布式桥接，降低延迟，提升连接稳定性           |
| **消息加密方式**           | 使用 AES-256-CBC 加密                    | 使用 X25519 和 Noise 协议的混合加密方案         |
| **会话恢复**               | 每次需重新连接，体验不佳                | 支持持久会话，用户无需频繁扫码                  |
| **会话控制和管理**         | 简单控制，功能有限                     | 提供更细致的权限控制和管理接口                  |
| **拓展性**                 | 限制较多                                | 模块化设计，支持不同应用场景的灵活扩展          |
| **链选择**                 | 无法在会话中切换链                     | 用户可在单一会话中选择并切换多个区块链          |
| **连接稳定性**             | 依赖于中心化桥接服务器                 | 支持分布式和多节点桥接，增强连接稳定性          |
| **事件监听**               | 支持基础事件监听                       | 提供丰富的事件 API，简化多链事件处理            |
| **开发难度**               | 较低                                    | 功能更强大，集成更复杂，需要额外的配置           |

## 常见问题

- **二维码未显示**：请确保 `QRCodeModal` 正确导入并配置。
- **连接问题**：请检查桥接 URL，默认桥接为 `"https://bridge.walletconnect.org"`，也支持自托管桥接。

## 资源

- [WalletConnect 文档](https://docs.walletconnect.com/)
- [WalletConnect GitHub](https://github.com/WalletConnect)
- [WalletConnect 博客](https://walletconnect.com/blog)

## 许可证

本项目采用 MIT 许可证。
