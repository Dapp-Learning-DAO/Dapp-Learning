# WalletConnect 安装和使用指南

## 安装

在 DApp 中使用 WalletConnect 时，可以安装 WalletConnect JavaScript 客户端库：

```bash
npm install @walletconnect/client
```

对于钱包提供方，需要集成 WalletConnect SDK（提供 iOS、Android 和 Web 版本）。

## 基本使用

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

## 高级配置

### 多链支持

要支持多个区块链网络，可以在初始化时配置：

```javascript
const connector = new WalletConnect({
  bridge: "https://bridge.walletconnect.org",
  qrcodeModal: QRCodeModal,
  chainId: 1, // 默认以太坊主网
  supportedChainIds: [1, 56, 137] // 支持的链ID：以太坊、BSC、Polygon
});
```

### 自定义配置

```javascript
const connector = new WalletConnect({
  bridge: "https://your-custom-bridge.com",
  qrcodeModal: QRCodeModal,
  clientMeta: {
    name: "Your DApp",
    description: "Your DApp Description",
    url: "https://your-dapp.com",
    icons: ["https://your-dapp.com/icon.png"]
  }
});
```

## 错误处理最佳实践

### 连接错误处理

```javascript
connector.on("connect", (error, payload) => {
  if (error) {
    console.error("连接错误:", error);
    // 实现重试逻辑
    return;
  }
  // 连接成功处理
});

// 自定义错误处理
try {
  await connector.createSession();
} catch (error) {
  if (error.message.includes("User rejected")) {
    console.log("用户拒绝连接");
  } else {
    console.error("创建会话失败:", error);
  }
}
```

### 交易错误处理

```javascript
try {
  const result = await connector.sendTransaction(tx);
} catch (error) {
  if (error.message.includes("insufficient funds")) {
    console.error("余额不足");
  } else if (error.message.includes("gas")) {
    console.error("Gas 费用估算失败");
  } else {
    console.error("交易失败:", error);
  }
}
```

## 安全性考虑

### 数据加密

- 确保所有敏感数据在传输前进行加密
- 不要在客户端存储私钥或助记词
- 使用安全的通信协议（HTTPS）

### 交易安全

- 在发送交易前进行金额和地址验证
- 实现交易确认对话框
- 显示详细的交易信息供用户确认

### 会话管理

- 定期检查会话状态
- 实现自动断开连接的超时机制
- 在用户离开应用时清理会话数据

## 性能优化

- 使用 WebSocket 保持连接状态
- 实现重连机制
- 缓存常用数据
- 批量处理交易请求

## 常见问题

- **二维码未显示**：请确保 `QRCodeModal` 正确导入并配置。
- **连接问题**：请检查桥接 URL，默认桥接为 `"https://bridge.walletconnect.org"`，也支持自托管桥接。
- **断开连接**：检查网络状态，确保 WebSocket 连接正常。
- **交易失败**：验证账户余额、Gas 费用设置是否合理。
- **兼容性问题**：确认钱包版本是否支持当前协议版本。
