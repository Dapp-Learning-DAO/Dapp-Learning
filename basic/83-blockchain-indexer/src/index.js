require('dotenv').config();
const express = require('express');
const Web3 = require('web3');
const { connectDB } = require('./utils/db');
const { setupIndexer } = require('./indexer');
const { setupRoutes } = require('./api/routes');

const app = express();
const PORT = process.env.PORT || 3000;

// 连接到以太坊节点
const web3 = new Web3(process.env.ETH_NODE_URL || 'http://localhost:8545');

// 初始化数据库连接
connectDB();

// 设置中间件
app.use(express.json());

// 设置路由
setupRoutes(app);

// 启动索引器
setupIndexer(web3);

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});