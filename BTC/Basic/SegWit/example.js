/**
 * SegWit (隔离见证) 代码示例
 * 
 * 本文件包含与比特币隔离见证(SegWit)相关的JavaScript代码示例，
 * 使用bitcoinjs-lib库演示如何创建SegWit地址和交易。
 */

const bitcoin = require('bitcoinjs-lib');
const network = bitcoin.networks.bitcoin; // 主网

/**
 * 创建不同类型的SegWit地址
 */
function createSegWitAddresses() {
  // 创建密钥对
  const keyPair = bitcoin.ECPair.makeRandom({ network });
  const publicKey = keyPair.publicKey;
  
  // 1. 创建P2WPKH（原生SegWit）地址 - 以bc1q开头
  const p2wpkh = bitcoin.payments.p2wpkh({
    pubkey: publicKey,
    network
  });
  
  // 2. 创建P2SH-P2WPKH（兼容SegWit）地址 - 以3开头
  const p2sh_p2wpkh = bitcoin.payments.p2sh({
    redeem: bitcoin.payments.p2wpkh({ pubkey: publicKey, network }),
    network
  });
  
  // 3. 创建P2WSH（原生SegWit脚本哈希）地址
  // 创建一个2-of-3多签名赎回脚本
  const pubkeys = [
    bitcoin.ECPair.makeRandom({ network }).publicKey,
    bitcoin.ECPair.makeRandom({ network }).publicKey,
    bitcoin.ECPair.makeRandom({ network }).publicKey
  ];
  
  const p2ms = bitcoin.payments.p2ms({
    m: 2, // 需要2个签名
    pubkeys,
    network
  });
  
  const p2wsh = bitcoin.payments.p2wsh({
    redeem: p2ms,
    network
  });
  
  return {
    privateKey: keyPair.privateKey.toString('hex'),
    publicKey: publicKey.toString('hex'),
    p2wpkh: {
      address: p2wpkh.address, // 原生SegWit地址
      type: 'P2WPKH (Native SegWit)'
    },
    p2sh_p2wpkh: {
      address: p2sh_p2wpkh.address, // 兼容SegWit地址
      type: 'P2SH-P2WPKH (Compatible SegWit)'
    },
    p2wsh: {
      address: p2wsh.address, // 原生SegWit脚本哈希地址
      type: 'P2WSH (Native SegWit Script Hash)'
    }
  };
}

/**
 * 构建SegWit交易
 * @param {Object} utxo - 未花费交易输出
 * @param {string} toAddress - 接收地址
 * @param {number} amount - 发送金额（聪）
 * @param {number} fee - 交易费（聪）
 * @param {Object} keyPair - 密钥对
 * @param {string} changeAddress - 找零地址
 * @param {string} addressType - 地址类型 ('p2wpkh', 'p2sh-p2wpkh')
 * @returns {string} 交易的十六进制表示
 */
async function createSegWitTransaction(utxo, toAddress, amount, fee, keyPair, changeAddress, addressType = 'p2wpkh') {
  const txb = new bitcoin.TransactionBuilder(network);
  
  // 添加输入（来自SegWit地址的UTXO）
  txb.addInput(utxo.txid, utxo.vout);
  
  // 添加输出
  txb.addOutput(toAddress, amount);
  
  // 如果有找零，添加找零输出
  const change = utxo.value - amount - fee;
  if (change > 0) {
    txb.addOutput(changeAddress || utxo.address, change);
  }
  
  // 根据地址类型签名交易
  if (addressType === 'p2wpkh') {
    // 原生SegWit地址签名
    txb.sign(0, keyPair, null, null, utxo.value);
  } else if (addressType === 'p2sh-p2wpkh') {
    // 兼容SegWit地址签名
    const p2wpkh = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey, network });
    const p2sh = bitcoin.payments.p2sh({ redeem: p2wpkh, network });
    txb.sign(0, keyPair, p2sh.redeem.output, null, utxo.value);
  }
  
  // 构建并返回交易
  const tx = txb.build();
  return tx.toHex();
}

/**
 * 计算SegWit交易的交易ID
 * @param {string} txHex - 交易的十六进制表示
 * @returns {Object} 包含txid和wtxid的对象
 */
function calculateSegWitTransactionId(txHex) {
  const tx = bitcoin.Transaction.fromHex(txHex);
  
  // 计算传统txid（不包含见证数据）
  const txid = tx.getId();
  
  // 计算wtxid（包含见证数据）
  const wtxid = tx.getHash(true).reverse().toString('hex');
  
  return {
    txid,
    wtxid,
    isSame: txid === wtxid
  };
}

/**
 * 估算SegWit交易的大小和费用
 * @param {number} inputCount - 输入数量
 * @param {number} outputCount - 输出数量
 * @param {string} addressType - 地址类型 ('p2wpkh', 'p2sh-p2wpkh')
 * @param {number} feeRate - 费率（聪/字节）
 * @returns {Object} 包含大小和费用的对象
 */
function estimateSegWitTransactionFee(inputCount, outputCount, addressType = 'p2wpkh', feeRate = 10) {
  let txSize = 0;
  
  // 计算交易大小（近似值）
  if (addressType === 'p2wpkh') {
    // 原生SegWit (P2WPKH) 交易大小估算
    // 基本交易大小 + 输入大小 + 输出大小
    txSize = 10 + (inputCount * 67.75) + (outputCount * 31);
  } else if (addressType === 'p2sh-p2wpkh') {
    // 兼容SegWit (P2SH-P2WPKH) 交易大小估算
    txSize = 10 + (inputCount * 91) + (outputCount * 31);
  } else {
    // 传统 (P2PKH) 交易大小估算
    txSize = 10 + (inputCount * 148) + (outputCount * 34);
  }
  
  // 计算费用
  const fee = Math.ceil(txSize * feeRate);
  
  return {
    estimatedSize: txSize,
    estimatedFee: fee,
    feeRate: feeRate
  };
}

/**
 * 验证地址是否为SegWit地址
 * @param {string} address - 比特币地址
 * @returns {Object} 包含验证结果的对象
 */
function validateSegWitAddress(address) {
  try {
    // 尝试解析地址
    const result = bitcoin.address.fromBase58Check(address);
    
    // 检查是否为P2SH地址（可能是P2SH-P2WPKH）
    if (result.version === network.scriptHash) {
      return {
        isValid: true,
        type: 'P2SH (可能是P2SH-P2WPKH兼容SegWit)',
        isSegWit: 'Compatible'
      };
    }
    
    return {
      isValid: true,
      type: 'P2PKH (传统地址)',
      isSegWit: false
    };
  } catch (e) {
    // 如果不是Base58地址，尝试Bech32
    try {
      const result = bitcoin.address.fromBech32(address);
      
      if (result.version === 0) {
        if (result.data.length === 20) {
          return {
            isValid: true,
            type: 'P2WPKH (原生SegWit)',
            isSegWit: 'Native'
          };
        } else if (result.data.length === 32) {
          return {
            isValid: true,
            type: 'P2WSH (原生SegWit脚本哈希)',
            isSegWit: 'Native'
          };
        }
      }
      
      return {
        isValid: true,
        type: '未知的Bech32地址',
        isSegWit: 'Unknown'
      };
    } catch (e) {
      return {
        isValid: false,
        type: '无效地址',
        isSegWit: false
      };
    }
  }
}

// 导出函数
module.exports = {
  createSegWitAddresses,
  createSegWitTransaction,
  calculateSegWitTransactionId,
  estimateSegWitTransactionFee,
  validateSegWitAddress
};

// 使用示例
/*
// 创建SegWit地址
const addresses = createSegWitAddresses();
console.log('SegWit地址:', addresses);

// 验证地址
const addressValidation = validateSegWitAddress('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq');
console.log('地址验证结果:', addressValidation);

// 估算交易费用
const feeEstimation = estimateSegWitTransactionFee(2, 2, 'p2wpkh', 5);
console.log('费用估算:', feeEstimation);
*/