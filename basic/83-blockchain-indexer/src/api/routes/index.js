const express = require('express');
const { Block } = require('../../utils/db');

function setupRoutes(app) {
  const router = express.Router();

  // 获取最新区块
  router.get('/blocks/latest', async (req, res) => {
    try {
      const block = await Block.findOne().sort({ number: -1 });
      res.json(block);
    } catch (error) {
      res.status(500).json({ error: '获取最新区块失败' });
    }
  });

  // 根据区块号获取区块
  router.get('/blocks/:number', async (req, res) => {
    try {
      const block = await Block.findOne({ number: parseInt(req.params.number) });
      if (!block) {
        return res.status(404).json({ error: '区块未找到' });
      }
      res.json(block);
    } catch (error) {
      res.status(500).json({ error: '获取区块失败' });
    }
  });

  // 根据区块哈希获取区块
  router.get('/blocks/hash/:hash', async (req, res) => {
    try {
      const block = await Block.findOne({ hash: req.params.hash });
      if (!block) {
        return res.status(404).json({ error: '区块未找到' });
      }
      res.json(block);
    } catch (error) {
      res.status(500).json({ error: '获取区块失败' });
    }
  });

  // 获取交易列表
  router.get('/transactions', async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      const blocks = await Block.find()
        .sort({ number: -1 })
        .limit(limit)
        .skip((page - 1) * limit);

      const transactions = blocks.reduce((acc, block) => {
        return acc.concat(block.transactions);
      }, []);

      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: '获取交易列表失败' });
    }
  });

  // 根据地址获取交易
  router.get('/transactions/address/:address', async (req, res) => {
    try {
      const address = req.params.address.toLowerCase();
      const blocks = await Block.find({
        $or: [
          { 'transactions.from': address },
          { 'transactions.to': address }
        ]
      });

      const transactions = blocks.reduce((acc, block) => {
        return acc.concat(
          block.transactions.filter(tx =>
            tx.from.toLowerCase() === address ||
            (tx.to && tx.to.toLowerCase() === address)
          )
        );
      }, []);

      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: '获取地址交易失败' });
    }
  });

  app.use('/api', router);
}

module.exports = {
  setupRoutes
};