# 区块链索引器

## 简介
本项目实现了一个简单的区块链索引器，用于抓取、解析和存储区块链数据。通过这个项目，你可以学习到：

1. 如何从区块链节点获取区块数据
2. 如何解析区块和交易信息
3. 如何设计和实现数据存储结构
4. 如何构建查询API接口

## 功能特点

- 实时同步区块数据
- 解析交易信息
- 数据持久化存储
- 提供查询API接口

## 技术栈

- Node.js
- Web3.js
- Express.js
- MongoDB

## 项目结构

```
├── src/
│   ├── indexer/        # 索引器核心逻辑
│   ├── models/         # 数据模型
│   ├── api/            # API接口
│   └── utils/          # 工具函数
├── config/            # 配置文件
└── tests/            # 测试文件
```

## 快速开始

1. 安装依赖
```bash
npm install
```

2. 配置环境变量
```bash
cp .env.example .env
# 编辑.env文件，设置必要的配置项
```

3. 启动项目
```bash
npm start
```

## API文档

### 获取区块信息
```
GET /api/block/:blockNumber
```

### 获取交易信息
```
GET /api/transaction/:txHash
```

### 获取地址信息
```
GET /api/address/:address
```

## 开发计划

- [ ] 实现基础区块同步功能
- [ ] 实现交易解析功能
- [ ] 实现数据存储功能
- [ ] 实现API接口
- [ ] 添加测试用例
- [ ] 优化性能
- [ ] 添加监控功能

## 注意事项

1. 确保有可用的以太坊节点
2. 注意数据同步的性能优化
3. 建议使用索引优化查询性能

## 参考资料

- [Web3.js文档](https://web3js.readthedocs.io/)
- [以太坊JSON-RPC API](https://eth.wiki/json-rpc/API)
- [MongoDB文档](https://docs.mongodb.com/)