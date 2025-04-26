/**
 * SegWit (隔离见证) 扩展代码示例
 * 
 * 本文件包含与比特币隔离见证(SegWit)相关的JavaScript代码示例，
 * 使用bitcoinjs-lib库演示如何创建SegWit地址和交易，以及高级功能。
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
      type: 'P2WPKH (Native SegWit)',
      witnessProgram: p2wpkh.output.toString('hex') // 见证程序（witness program）
    },
    p2sh_p2wpkh: {
      address: p2sh_p2wpkh.address, // 兼容SegWit地址
      type: 'P2SH-P2WPKH (Compatible SegWit)',
      redeemScript: p2sh_p2wpkh.redeem.output.toString('hex') // 赎回脚本
    },
    p2wsh: {
      address: p2wsh.address, // 原生SegWit脚本哈希地址
      type: 'P2WSH (Native SegWit Script Hash)',
      witnessScript: p2ms.output.toString('hex') // 见证脚本
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
    feeRate: feeRate,
    // 添加不同地址类型的大小比较
    sizeComparison: {
      p2pkh: 10 + (inputCount * 148) + (outputCount * 34),
      p2sh_p2wpkh: 10 + (inputCount * 91) + (outputCount * 31),
      p2wpkh: 10 + (inputCount * 67.75) + (outputCount * 31),
    },
    // 添加不同地址类型的费用比较
    feeComparison: {
      p2pkh: Math.ceil((10 + (inputCount * 148) + (outputCount * 34)) * feeRate),
      p2sh_p2wpkh: Math.ceil((10 + (inputCount * 91) + (outputCount * 31)) * feeRate),
      p2wpkh: Math.ceil((10 + (inputCount * 67.75) + (outputCount * 31)) * feeRate),
    },
    // 计算节省的费用百分比
    savingsPercentage: {
      p2wpkh_vs_p2pkh: Math.round((1 - ((10 + (inputCount * 67.75) + (outputCount * 31)) / (10 + (inputCount * 148) + (outputCount * 34)))) * 100),
      p2sh_p2wpkh_vs_p2pkh: Math.round((1 - ((10 + (inputCount * 91) + (outputCount * 31)) / (10 + (inputCount * 148) + (outputCount * 34)))) * 100)
    }
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
      } else if (result.version === 1) {
        return {
          isValid: true,
          type: 'P2TR (Taproot)',
          isSegWit: 'v1'
        };
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

/**
 * 批量生成SegWit地址
 * @param {number} count - 要生成的地址数量
 * @param {string} addressType - 地址类型 ('p2wpkh', 'p2sh-p2wpkh', 'p2wsh')
 * @returns {Array} 地址数组
 */
function batchGenerateSegWitAddresses(count, addressType = 'p2wpkh') {
  const addresses = [];
  
  for (let i = 0; i < count; i++) {
    const keyPair = bitcoin.ECPair.makeRandom({ network });
    const publicKey = keyPair.publicKey;
    let address;
    
    if (addressType === 'p2wpkh') {
      // 原生SegWit地址
      address = bitcoin.payments.p2wpkh({ pubkey: publicKey, network }).address;
    } else if (addressType === 'p2sh-p2wpkh') {
      // 兼容SegWit地址
      address = bitcoin.payments.p2sh({
        redeem: bitcoin.payments.p2wpkh({ pubkey: publicKey, network }),
        network
      }).address;
    } else if (addressType === 'p2wsh') {
      // 创建一个简单的P2WSH地址（单签名）
      const p2ms = bitcoin.payments.p2ms({
        m: 1,
        pubkeys: [publicKey],
        network
      });
      
      address = bitcoin.payments.p2wsh({
        redeem: p2ms,
        network
      }).address;
    }
    
    addresses.push({
      privateKey: keyPair.privateKey.toString('hex'),
      publicKey: publicKey.toString('hex'),
      address: address,
      type: addressType
    });
  }
  
  return addresses;
}

/**
 * 批量处理SegWit交易
 * @param {Array} utxos - 未花费交易输出数组
 * @param {Array} outputs - 输出数组，每个包含address和amount
 * @param {Object} keyPair - 密钥对
 * @param {string} changeAddress - 找零地址
 * @param {string} addressType - 地址类型 ('p2wpkh', 'p2sh-p2wpkh')
 * @returns {string} 交易的十六进制表示
 */
function batchSegWitTransaction(utxos, outputs, keyPair, changeAddress, addressType = 'p2wpkh') {
  const txb = new bitcoin.TransactionBuilder(network);
  
  // 计算总输入金额
  const totalInput = utxos.reduce((sum, utxo) => sum + utxo.value, 0);
  
  // 计算总输出金额
  const totalOutput = outputs.reduce((sum, output) => sum + output.amount, 0);
  
  // 估算交易费用
  const feeEstimation = estimateSegWitTransactionFee(utxos.length, outputs.length + 1, addressType);
  const fee = feeEstimation.estimatedFee;
  
  // 添加所有输入
  utxos.forEach(utxo => {
    txb.addInput(utxo.txid, utxo.vout);
  });
  
  // 添加所有输出
  outputs.forEach(output => {
    txb.addOutput(output.address, output.amount);
  });
  
  // 计算找零并添加找零输出
  const change = totalInput - totalOutput - fee;
  if (change > 0) {
    txb.addOutput(changeAddress, change);
  }
  
  // 签名所有输入
  utxos.forEach((utxo, index) => {
    if (addressType === 'p2wpkh') {
      // 原生SegWit地址签名
      txb.sign(index, keyPair, null, null, utxo.value);
    } else if (addressType === 'p2sh-p2wpkh') {
      // 兼容SegWit地址签名
      const p2wpkh = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey, network });
      const p2sh = bitcoin.payments.p2sh({ redeem: p2wpkh, network });
      txb.sign(index, keyPair, p2sh.redeem.output, null, utxo.value);
    }
  });
  
  // 构建并返回交易
  const tx = txb.build();
  return {
    txHex: tx.toHex(),
    txid: tx.getId(),
    fee: fee,
    changeAmount: change > 0 ? change : 0
  };
}

/**
 * 创建SegWit多签名地址
 * @param {number} m - 需要的签名数量
 * @param {number} n - 公钥总数
 * @param {string} addressType - 地址类型 ('p2wsh', 'p2sh-p2wsh')
 * @returns {Object} 多签名地址信息
 */
function createSegWitMultisigAddress(m, n, addressType = 'p2wsh') {
  // 生成n个密钥对
  const keyPairs = [];
  const pubkeys = [];
  
  for (let i = 0; i < n; i++) {
    const keyPair = bitcoin.ECPair.makeRandom({ network });
    keyPairs.push(keyPair);
    pubkeys.push(keyPair.publicKey);
  }
  
  // 创建多签名赎回脚本
  const p2ms = bitcoin.payments.p2ms({
    m,
    pubkeys,
    network
  });
  
  let address, redeemScript, witnessScript;
  
  if (addressType === 'p2wsh') {
    // 原生SegWit多签名地址
    const p2wsh = bitcoin.payments.p2wsh({
      redeem: p2ms,
      network
    });
    
    address = p2wsh.address;
    witnessScript = p2ms.output;
  } else if (addressType === 'p2sh-p2wsh') {
    // 兼容SegWit多签名地址
    const p2wsh = bitcoin.payments.p2wsh({
      redeem: p2ms,
      network
    });
    
    const p2sh = bitcoin.payments.p2sh({
      redeem: p2wsh,
      network
    });
    
    address = p2sh.address;
    redeemScript = p2wsh.output;
    witnessScript = p2ms.output;
  }
  
  return {
    address,
    m,
    n,
    type: addressType,
    pubkeys: pubkeys.map(pubkey => pubkey.toString('hex')),
    privateKeys: keyPairs.map(kp => kp.privateKey.toString('hex')),
    redeemScript: redeemScript ? redeemScript.toString('hex') : null,
    witnessScript: witnessScript.toString('hex')
  };
}

/**
 * 创建闪电网络通道资金交易
 * @param {Object} utxo - 未花费交易输出
 * @param {Buffer} localPubkey - 本地节点公钥
 * @param {Buffer} remotePubkey - 远程节点公钥
 * @param {number} localAmount - 本地节点出资金额（聪）
 * @param {number} remoteAmount - 远程节点出资金额（聪）
 * @param {Object} keyPair - 本地节点密钥对
 * @param {number} fee - 交易费（聪）
 * @returns {Object} 通道资金交易信息
 */
function createLightningChannelFundingTx(utxo, localPubkey, remotePubkey, localAmount, remoteAmount, keyPair, fee) {
  const txb = new bitcoin.TransactionBuilder(network);
  
  // 添加输入
  txb.addInput(utxo.txid, utxo.vout);
  
  // 创建2-of-2多签名脚本
  const p2ms = bitcoin.payments.p2ms({
    m: 2,
    pubkeys: [localPubkey, remotePubkey].sort((a, b) => a.compare(b)), // BIP-69要求公钥排序
    network
  });
  
  // 创建P2WSH地址（闪电网络通道使用P2WSH）
  const p2wsh = bitcoin.payments.p2wsh({
    redeem: p2ms,
    network
  });
  
  // 添加通道资金输出
  const channelAmount = localAmount + remoteAmount;
  txb.addOutput(p2wsh.address, channelAmount);
  
  // 计算找零
  const change = utxo.value - channelAmount - fee;
  if (change > 0) {
    // 创建找零地址（使用P2WPKH）
    const p2wpkh = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey, network });
    txb.addOutput(p2wpkh.address, change);
  }
  
  // 签名交易
  if (utxo.addressType === 'p2wpkh') {
    txb.sign(0, keyPair, null, null, utxo.value);
  } else if (utxo.addressType === 'p2sh-p2wpkh') {
    const p2wpkh = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey, network });
    const p2sh = bitcoin.payments.p2sh({ redeem: p2wpkh, network });
    txb.sign(0, keyPair, p2sh.redeem.output, null, utxo.value);
  }
  
  // 构建交易
  const tx = txb.build();
  
  return {
    txHex: tx.toHex(),
    txid: tx.getId(),
    channelAddress: p2wsh.address,
    witnessScript: p2ms.output.toString('hex'),
    localAmount,
    remoteAmount,
    totalAmount: channelAmount
  };
}

/**
 * 解析SegWit交易结构
 * @param {string} txHex - 交易的十六进制表示
 * @returns {Object} 解析后的交易结构
 */
function parseSegWitTransaction(txHex) {
  const tx = bitcoin.Transaction.fromHex(txHex);
  
  // 基本交易信息
  const result = {
    txid: tx.getId(),
    wtxid: tx.getHash(true).reverse().toString('hex'),
    version: tx.version,
    locktime: tx.locktime,
    hasWitnesses: tx.hasWitnesses(),
    virtualSize: tx.virtualSize(),
    weight: tx.weight(),
    byteLength: tx.byteLength(),
    inputs: [],
    outputs: []
  };
  
  // 解析输入
  tx.ins.forEach((input, index) => {
    const inputInfo = {
      txid: Buffer.from(input.hash).reverse().toString('hex'),
      vout: input.index,
      sequence: input.sequence,
      hasWitness: input.witness.length > 0,
      scriptSig: input.script.toString('hex')
    };
    
    // 如果有见证数据，解析见证数据
    if (input.witness.length > 0) {
      inputInfo.witness = input.witness.map(w => w.toString('hex'));
    }
    
    result.inputs.push(inputInfo);
  });
  
  // 解析输出
  tx.outs.forEach((output, index) => {
    const script = output.script;
    let address = null;
    let type = 'unknown';
    
    // 尝试识别输出类型和地址
    try {
      // 检查是否为P2PKH
      if (bitcoin.payments.p2pkh({ output: script, network }).output) {
        address = bitcoin.payments.p2pkh({ output: script, network }).address;
        type = 'p2pkh';
      }
      // 检查是否为P2SH
      else if (bitcoin.payments.p2sh({ output: script, network }).output) {
        address = bitcoin.payments.p2sh({ output: script, network }).address;
        type = 'p2sh';
      }
      // 检查是否为P2WPKH
      else if (bitcoin.payments.p2wpkh({ output: script, network }).output) {
        address = bitcoin.payments.p2wpkh({ output: script, network }).address;
        type = 'p2wpkh';
      }
      // 检查是否为P2WSH
      else if (bitcoin.payments.p2wsh({ output: script, network }).output) {
        address = bitcoin.payments.p2wsh({ output: script, network }).address;
        type = 'p2wsh';
      }
    } catch (e) {
      // 无法识别的脚本类型
    }
    
    result.outputs.push({
      value: output.value,
      scriptPubKey: script.toString('hex'),
      type,
      address
    });
  });
  
  return result;
}

/**
 * 比较SegWit与Taproot交易
 * @param {number} inputCount - 输入数量
 * @param {number} outputCount - 输出数量
 * @returns {Object} 比较结果
 */
function compareSegWitWithTaproot(inputCount, outputCount) {
  // 不同类型交易的大小估算（字节）
  const sizes = {
    p2pkh: 10 + (inputCount * 148) + (outputCount * 34),
    p2sh_p2wpkh: 10 + (inputCount * 91) + (outputCount * 31),
    p2wpkh: 10 + (inputCount * 67.75) + (outputCount * 31),
    p2tr: 10 + (inputCount * 57.5) + (outputCount * 31) // Taproot (P2TR)
  };
  
  // 假设费率为10聪/字节
  const feeRate = 10;
  
  // 计算不同类型的费用
  const fees = {
    p2pkh: Math.ceil(sizes.p2pkh * feeRate),
    p2sh_p2wpkh: Math.ceil(sizes.p2sh_p2wpkh * feeRate),
    p2wpkh: Math.ceil(sizes.p2wpkh * feeRate),
    p2tr: Math.ceil(sizes.p2tr * feeRate)
  };
  
  // 计算相对于传统交易的节省百分比
  const savings = {
    p2sh_p2wpkh_vs_p2pkh: Math.round((1 - (sizes.p2sh_p2wpkh / sizes.p2pkh)) * 100),
    p2wpkh_vs_p2pkh: Math.round((1 - (sizes.p2wpkh / sizes.p2pkh)) * 100),
    p2tr_vs_p2pkh: Math.round((1 - (sizes.p2tr / sizes.p2pkh)) * 100),
    p2tr_vs_p2wpkh: Math.round((1 - (sizes.p2tr / sizes.p2wpkh)) * 100)
  };
  
  return {
    transactionSizes: sizes,
    fees,
    savingsPercentage: savings,
    comparison: {
      inputCount,
      outputCount,
      feeRate,
      notes: [
        "P2TR (Taproot) 提供了比 P2WPKH (SegWit) 更小的交易大小和更低的费用",
        "Taproot 还提供了更好的隐私性和可扩展性",
        "SegWit 是 Taproot 的基础，Taproot 是 SegWit v1"
      ]
    }
  };
}

/**
 * 获取SegWit采用率和性能数据
 * 注意：这里使用的是静态数据，实际应用中可以从API获取最新数据
 * @returns {Object} SegWit采用率和性能数据
 */
function getSegWitAdoptionAndPerformanceData() {
  // 静态数据，实际应用中可以从API获取最新数据
  return {
    // SegWit采用率数据（截至2023年的近似值）
    adoption: {
      overallPercentage: 85, // 总体采用率
      byAddressType: {
        p2sh_p2wpkh: 15, // 兼容SegWit地址采用率
        p2wpkh: 45, // 原生SegWit地址采用率
        p2tr: 25, // Taproot地址采用率
        legacy: 15 // 传统地址使用率
      },
      byYear: {
        '2017': 10,
        '2018': 30,
        '2019': 50,
        '2020': 65,
        '2021': 75,
        '2022': 80,
        '2023': 85
      }
    },
    // 性能数据
    performance: {
      // 交易大小比较（字节）
      transactionSize: {
        // 1输入1输出的交易
        oneInOneOut: {
          p2pkh: 192, // 传统地址
          p2sh_p2wpkh: 132, // 兼容SegWit
          p2wpkh: 109, // 原生SegWit
          p2tr: 98 // Taproot
        },
        // 2输入2输出的交易
        twoInTwoOut: {
          p2pkh: 374,
          p2sh_p2wpkh: 254,
          p2wpkh: 208,
          p2tr: 186
        }
      },
      // 交易费用比较（假设10聪/字节）
      transactionFee: {
        oneInOneOut: {
          p2pkh: 1920,
          p2sh_p2wpkh: 1320,
          p2wpkh: 1090,
          p2tr: 980
        },
        twoInTwoOut: {
          p2pkh: 3740,
          p2sh_p2wpkh: 2540,
          p2wpkh: 2080,
          p2tr: 1860
        }
      },
      // 区块容量提升
      blockCapacity: {
        legacy: '1MB（约2,000笔交易）',
        withSegWit: '2.1-4MB（约4,000-8,000笔交易）'
      },
      // 网络吞吐量（TPS）
      throughput: {
        legacy: '3-7 TPS',
        withSegWit: '7-14 TPS'
      }
    },
    // 实际案例研究
    caseStudies: {
      exchange: {
        name: '某大型交易所',
        before: {
          avgFee: '15,000聪/交易',
          dailyWithdrawals: 5000,
          dailyFeeTotal: '0.75 BTC'
        },
        after: {
          avgFee: '6,000聪/交易',
          dailyWithdrawals: 5000,
          dailyFeeTotal: '0.3 BTC',
          savings: '60%'
        }
      },
      wallet: {
        name: '某热门钱包',
        userAdoption: {
          legacy: '15%',
          segwitCompatible: '25%',
          segwitNative: '45%',
          taproot: '15%'
        },
        avgFeeSavings: '55%'
      }
    }
  };
}

/**
 * 解释SegWit交易序列化格式
 * @returns {Object} SegWit交易序列化格式说明
 */
function explainSegWitTransactionFormat() {
  return {
    format: {
      legacy: [
        '4字节: 版本',
        'n个输入: [上一笔交易ID(32字节) + 输出索引(4字节) + 脚本长度(变长) + 脚本 + 序列号(4字节)]',
        'n个输出: [金额(8字节) + 脚本长度(变长) + 脚本]',
        '4字节: 锁定时间'
      ],
      segwit: [
        '4字节: 版本',
        '1字节: 标记(0x00)',
        '1字节: 标志(0x01)',
        'n个输入: [上一笔交易ID(32字节) + 输出索引(4字节) + 脚本长度(变长) + 脚本 + 序列号(4字节)]',
        'n个输出: [金额(8字节) + 脚本长度(变长) + 脚本]',
        'n个见证数据: [见证数据数量(变长) + 见证数据]',
        '4字节: 锁定时间'
      ]
    },
    differences: [
      'SegWit交易添加了标记(0x00)和标志(0x01)字节',
      'SegWit交易将签名数据移到了交易的末尾（见证数据部分）',
      'SegWit交易的txid计算不包括见证数据，而wtxid包括见证数据',
      'SegWit交易引入了新的权重单位(weight units)来计算交易大小'
    ],
    weightCalculation: [
      '非见证字节的权重为4',
      '见证字节的权重为1',
      '区块权重限制为4,000,000单位（相当于传统的1MB区块大小）',
      '最大区块大小可达到约4MB（如果全部是见证数据）'
    ],
    examples: {
      p2wpkh: {
        scriptPubKey: '0014{20字节公钥哈希}',
        witnessData: '[签名, 公钥]'
      },
      p2wsh: {
        scriptPubKey: '0020{32字节脚本哈希}',
        witnessData: '[签名1, 签名2, ..., 见证脚本]'
      }
    }
  };
}

/**
 * SegWit与Taproot的详细比较
 * @returns {Object} 比较结果
 */
function compareSegWitAndTaproot() {
  return {
    overview: {
      segwit: {
        version: 'v0',
        activationDate: '2017年8月',
        bip: ['BIP141', 'BIP143', 'BIP144', 'BIP173'],
        addressPrefix: ['bc1q (P2WPKH/P2WSH)'],
        mainFeatures: ['交易延展性修复', '区块容量增加', '签名验证优化']
      },
      taproot: {
        version: 'v1 (SegWit v1)',
        activationDate: '2021年11月',
        bip: ['BIP340', 'BIP341', 'BIP342'],
        addressPrefix: ['bc1p (P2TR)'],
        mainFeatures: ['Schnorr签名', '密钥聚合', 'MAST (默克尔抽象语法树)', '脚本增强']
      }
    },
    technicalComparison: {
      scriptExecution: {
        segwit: '使用传统的CHECKSIG操作符验证签名',
        taproot: '使用新的OP_CHECKSIGADD和Schnorr签名'
      },
      privacyFeatures: {
        segwit: '有限的隐私保护',
        taproot: '增强的隐私保护（所有输出看起来相同，无法区分单签和多签）'
      },
      multisigEfficiency: {
        segwit: '每个签名都需要单独验证',
        taproot: '使用密钥聚合，多个签名可以聚合为一个'
      },
      scriptComplexity: {
        segwit: '复杂脚本会增加交易大小',
        taproot: '使用MAST，只有执行的脚本路径会被公开'
      }
    },
    performanceComparison: {
      transactionSize: {
        example: '2-of-3多签名交易',
        segwit: '约222字节',
        taproot: '约104字节',
        improvement: '约53%'
      },
      verificationSpeed: {
        segwit: '基准',
        taproot: '提高约2.5倍',
        reason: 'Schnorr签名验证更快，批量验证更高效'
      }
    },
    evolutionPath: [
      'SegWit (v0) 解决了交易延展性问题，为二层解决方案铺平道路',
      'Taproot (SegWit v1) 建立在SegWit的基础上，提供更高级的脚本功能和隐私保护',
      '未来可能的SegWit v2将进一步扩展比特币的功能'
    ]
  };
}

// 导出函数
module.exports = {
  createSegWitAddresses,
  createSegWitTransaction,
  calculateSegWitTransactionId,
  estimateSegWitTransactionFee,
  validateSegWitAddress,
  batchGenerateSegWitAddresses,
  batchSegWitTransaction,
  createSegWitMultisigAddress,
  createLightningChannelFundingTx,
  parseSegWitTransaction,
  compareSegWitWithTaproot,
  getSegWitAdoptionAndPerformanceData,
  explainSegWitTransactionFormat,
  compareSegWitAndTaproot
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

// 比较SegWit与Taproot
const comparison = compareSegWitWithTaproot(2, 2);
console.log('SegWit与Taproot比较:', comparison);

// 获取SegWit采用率和性能数据
const adoptionData = getSegWitAdoptionAndPerformanceData();
console.log('SegWit采用率和性能数据:', adoptionData);
*/