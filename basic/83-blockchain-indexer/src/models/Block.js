const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
  number: { type: Number, required: true, unique: true },
  hash: { type: String, required: true, unique: true },
  parentHash: { type: String, required: true },
  timestamp: { type: Number, required: true },
  transactions: [{ type: String }],
  gasUsed: { type: Number },
  gasLimit: { type: Number },
  miner: { type: String }
});

module.exports = mongoose.model('Block', blockSchema);