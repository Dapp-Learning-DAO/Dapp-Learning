const { Block } = require('../utils/db');

let latestBlock = 0;

async function setupIndexer(web3) {
  try {
    // 获取最新区块号
    const lastBlock = await Block.findOne().sort({ number: -1 });
    latestBlock = lastBlock ? lastBlock.number : 0;

    // 启动区块同步
    startSync(web3);

    // 监听新区块
    subscribeToNewBlocks(web3);
  } catch (error) {
    console.error('索引器初始化失败:', error);
  }
}

async function startSync(web3) {
  try {
    const currentBlock = await web3.eth.getBlockNumber();
    
    // 从最新的已索引区块开始同步
    for (let i = latestBlock + 1; i <= currentBlock; i++) {
      await processBlock(web3, i);
    }
  } catch (error) {
    console.error('区块同步失败:', error);
  }
}

async function subscribeToNewBlocks(web3) {
  web3.eth.subscribe('newBlockHeaders', async (error, blockHeader) => {
    if (error) {
      console.error('新区块订阅失败:', error);
      return;
    }

    await processBlock(web3, blockHeader.number);
  });
}

async function processBlock(web3, blockNumber) {
  try {
    const block = await web3.eth.getBlock(blockNumber, true);
    
    // 解析区块数据
    const blockData = {
      number: block.number,
      hash: block.hash,
      parentHash: block.parentHash,
      timestamp: block.timestamp,
      transactions: block.transactions.map(tx => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        gas: tx.gas,
        gasPrice: tx.gasPrice,
        input: tx.input
      }))
    };

    // 存储区块数据
    await Block.findOneAndUpdate(
      { number: blockData.number },
      blockData,
      { upsert: true }
    );

    console.log(`区块 ${blockNumber} 已处理`);
  } catch (error) {
    console.error(`处理区块 ${blockNumber} 失败:`, error);
  }
}

module.exports = {
  setupIndexer
};