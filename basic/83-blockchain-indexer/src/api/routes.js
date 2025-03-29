const express = require('express');
const router = express.Router();
const Block = require('../models/Block');

// 获取区块信息
router.get('/block/:blockNumber', async (req, res) => {
  try {
    const blockNumber = parseInt(req.params.blockNumber);
    const blockInfo = await Block.findOne({ number: blockNumber });
    
    if (!blockInfo) {
      return res.status(404).json({
        success: false,
        error: '区块未找到'
      });
    }

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
    const block = await Block.findOne({ 'transactions.hash': txHash });
    
    if (!block) {
      return res.status(404).json({
        success: false,
        error: '交易未找到'
      });
    }

    const txInfo = block.transactions.find(tx => tx.hash === txHash);
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
    const address = req.params.address.toLowerCase();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const query = {
      $or: [
        { 'transactions.from': address },
        { 'transactions.to': address }
      ]
    };
    
    const [blocks, total] = await Promise.all([
      Block.find(query)
        .sort({ number: -1 })
        .skip(skip)
        .limit(limit),
      Block.countDocuments(query)
    ]);

    const transactions = blocks.reduce((acc, block) => {
      return acc.concat(
        block.transactions.filter(tx =>
          tx.from.toLowerCase() === address ||
          (tx.to && tx.to.toLowerCase() === address)
        )
      );
    }, []);
    
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
    const blocks = await Block.find()
      .sort({ number: -1 })
      .limit(limit)
      .select('-transactions');
    
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
    const blocks = await Block.find()
      .sort({ number: -1 })
      .limit(Math.ceil(limit / 2))
      .select('transactions');
    
    const transactions = blocks.reduce((acc, block) => {
      return acc.concat(block.transactions);
    }, []).slice(0, limit);
    
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
    let result = {
      type: '',
      data: null
    };

    // 尝试作为区块号搜索
    if (/^\d+$/.test(query)) {
      const block = await Block.findOne({ number: parseInt(query) });
      if (block) {
        result = { type: 'block', data: block };
      }
    }
    
    // 尝试作为交易哈希搜索
    if (!result.data && /^0x[a-fA-F0-9]{64}$/.test(query)) {
      const block = await Block.findOne({ 'transactions.hash': query });
      if (block) {
        const transaction = block.transactions.find(tx => tx.hash === query);
        if (transaction) {
          result = { type: 'transaction', data: transaction };
        }
      }
    }
    
    // 尝试作为地址搜索
    if (!result.data && /^0x[a-fA-F0-9]{40}$/.test(query)) {
      const address = query.toLowerCase();
      const blocks = await Block.find({
        $or: [
          { 'transactions.from': address },
          { 'transactions.to': address }
        ]
      }).limit(10);
      
      if (blocks.length > 0) {
        const transactions = blocks.reduce((acc, block) => {
          return acc.concat(
            block.transactions.filter(tx =>
              tx.from.toLowerCase() === address ||
              (tx.to && tx.to.toLowerCase() === address)
            )
          );
        }, []);
        result = { type: 'address', data: transactions };
      }
    }
    
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