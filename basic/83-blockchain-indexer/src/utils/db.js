const mongoose = require('mongoose');

// 连接MongoDB数据库
async function connectDB() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blockchain-indexer';
    await mongoose.connect(mongoURI);
    console.log('MongoDB数据库连接成功');
  } catch (error) {
    console.error('MongoDB数据库连接失败:', error);
    process.exit(1);
  }
}

// 定义区块模型
const Block = mongoose.model('Block', {
  number: { type: Number, unique: true },
  hash: { type: String, unique: true },
  parentHash: String,
  timestamp: Number,
  transactions: [{
    hash: String,
    from: String,
    to: String,
    value: String,
    gas: Number,
    gasPrice: String,
    input: String
  }]
});

module.exports = {
  connectDB,
  Block
};