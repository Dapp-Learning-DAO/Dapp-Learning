const bitcoin = require('bitcoinjs-lib');

// 创建一个包含 OP_CAT 的脚本
function createScript() {
  // 连接的目标结果
  const target = Buffer.from('HelloWorld');

  const script = bitcoin.script.compile([
    bitcoin.opcodes.OP_DUP,
    bitcoin.opcodes.OP_HASH160,
    Buffer.from('...'), // 使用适当的公钥哈希
    bitcoin.opcodes.OP_EQUALVERIFY,
    bitcoin.opcodes.OP_CHECKSIG,
    // 连接两个字符串
    Buffer.from('Hello'), // 第一个元素
    Buffer.from('World'), // 第二个元素
    bitcoin.opcodes.OP_CAT, // 连接操作，必须在两个字符串之后
    target, // 连接后的目标结果
    bitcoin.opcodes.OP_EQUAL, // 验证连接结果是否等于 'HelloWorld'
  ]);

  return script;
}

// 创建和打印 P2SH 地址
function createP2SHAddress() {
  const script = createScript();
  const { address } = bitcoin.payments.p2sh({ redeem: { output: script, network: bitcoin.networks.bitcoin } });

  console.log('P2SH Address:', address);
}

createP2SHAddress();
