const express = require('express');
const router = express.Router();

// 获取区块信息
router.get('/block/:blockNumber', async (req, res) => {
  try {
    const blockNumber = req.params.blockNumber;
    // TODO: 从数据库获取区块信息
    const blockInfo = {}; // 替换为实际的数据库查询
    res.json({
      success: true,
      data: blockInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取交易信息
router.get('/transaction/:txHash', async (req, res) => {
  try {
    const txHash = req.params.txHash;
    // TODO: 从数据库获取交易信息
    const txInfo = {}; // 替换为实际的数据库查询
    res.json({
      success: true,
      data: txInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取地址的交易历史
router.get('/address/:address/transactions', async (req, res) => {
  try {
    const address = req.params.address;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // TODO: 从数据库获取地址的交易历史
    const transactions = []; // 替换为实际的数据库查询
    const total = 0; // 替换为实际的总记录数
    
    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取最新的区块列表
router.get('/blocks/latest', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    // TODO: 从数据库获取最新的区块列表
    const blocks = []; // 替换为实际的数据库查询
    
    res.json({
      success: true,
      data: blocks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取最新的交易列表
router.get('/transactions/latest', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    // TODO: 从数据库获取最新的交易列表
    const transactions = []; // 替换为实际的数据库查询
    
    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 搜索功能（支持区块号、交易哈希、地址）
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    // TODO: 实现搜索逻辑
    const result = {
      type: '', // 'block', 'transaction', 'address'
      data: null
    };
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;