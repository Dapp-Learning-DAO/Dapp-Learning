PSBT（Partially Signed Bitcoin Transaction）的编码和解码是一个关键环节，它允许各种工具和应用以标准格式交换交易信息。PSBT格式设计为可扩展和兼容未来功能，同时确保可以在不同设备和平台间安全地传输和处理交易数据。

### PSBT格式

PSBT的基本格式是一个序列化的数据结构，包含所有必要的信息，使多个参与者能够独立进行交易签名和验证。这个格式遵循一定的编码规则，详细见[BIP174](https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki)，通常以Base64或十六进制形式进行传输。

**The Partially Signed Bitcoin Transaction (PSBT) format**

```bash
 # whole structure
 <psbt> := <magic> <global-map> <input-map>* <output-map>*

 # start with magic number
 # 0x70 0x73 0x62 0x74 encode of PSBT
 <magic> := 0x70 0x73 0x62 0x74 0xFF
 <global-map> := <keypair>* 0x00
 <input-map> := <keypair>* 0x00
 <output-map> := <keypair>* 0x00

 # keyPair structure
 <keypair> := <key> <value>

 # key structure
 <key> := <keylen> <keytype> <keydata>

 # value structure
 <value> := <valuelen> <valuedata>
```

PSBT数据主要分为以下几部分：

1. **全局数据**：包括事务的未签名版本，以及可能的全局元数据，例如原始交易的版本和锁定时间。
2. **输入数据**：每个输入独立的数据，包括UTXO信息、签名脚本、见证脚本、签名和其他相关信息。
3. **输出数据**：每个输出独立的数据，如赎回脚本和其他可能的输出信息。

### 编码过程

PSBT的编码过程包括将交易的各个部分转换成可序列化的格式，然后通常使用Base64进行编码以便于传输。具体步骤如下：

1. **创建基础交易**：首先，创建一个标准的Bitcoin交易，指定所需的输入和输出。
2. **填充PSBT结构**：为每个输入和输出填充必要的信息，如UTXO详情、赎回路径和必要的签名数据。
3. **序列化数据**：将所有信息序列化为连续的字节流。这包括使用键值对编码各个部分，其中键和值有特定的格式。
4. **Base64编码**：最后，将序列化的数据编码为Base64字符串，便于在网络上或通过其他方式安全传输。

### 解码过程

解码PSBT是编码过程的逆过程，主要步骤包括：

1. **Base64解码**：首先将接收到的Base64字符串解码回原始的字节流。
2. **反序列化数据**：解析字节流，根据PSBT的键值对结构恢复出每个部分的数据。
3. **重建交易信息**：使用解码的数据重建完整的交易视图，包括所有输入和输出的详细信息。
4. **验证和签名**：在交易数据完全恢复后，参与者可以验证交易的有效性，并在必要时添加自己的签名。

## PSBT 创建

以下是一个使用JavaScript和`bitcoinjs-lib`库来处理PSBT（Partially Signed Bitcoin Transaction）的基本示例。这个例子展示了如何创建一个PSBT，添加输入和输出，进行签名，并最终导出为可以广播的比特币交易。

### 环境设置

首先，你需要确保已经安装了`bitcoinjs-lib`。如果尚未安装，可以通过npm进行安装：

```bash
npm install bitcoinjs-lib
```

### 创建和签名PSBT的案例

```javascript
const bitcoin = require('bitcoinjs-lib');

// 设置网络，这里以比特币测试网为例
const network = bitcoin.networks.testnet;

// 创建一个新的比特币密钥对
const keyPair = bitcoin.ECPair.makeRandom({ network: network });
const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network: network });

console.log(`New address: ${address}`);

// 创建一个新的PSBT
let psbt = new bitcoin.Psbt({ network: network });

// 假设这是UTXO的详细信息，你需要从区块链或钱包获取这些信息
const utxo = {
  hash: 'transaction-hash-of-utxo-here', // 事务哈希
  index: 0, // 输出索引
  value: 100000, // Satoshis
};

// 添加输入，这里假设UTXO已经知道
psbt.addInput({
  hash: utxo.hash,
  index: utxo.index,
  nonWitnessUtxo: Buffer.from('raw-transaction-hex-here', 'hex'),
});

// 添加输出，指定接收地址和金额（satoshis）
psbt.addOutput({
  address: 'recipient-address-here',
  value: 90000, // 减去手续费
});

// 对PSBT进行签名
psbt.signInput(0, keyPair);

// 验证签名是否正确
psbt.validateSignaturesOfInput(0);

// 最终确认PSBT
psbt.finalizeAllInputs();

// 导出可以广播的交易
const tx = psbt.extractTransaction().toHex();

console.log(`Transaction ready to be broadcasted: ${tx}`);
```

### 解释

1. **初始化**：首先创建一个比特币网络的环境，并生成一个新的密钥对和地址。
2. **创建PSBT**：实例化一个PSBT对象，为添加输入和输出做准备。
3. **添加输入**：添加一个UTXO作为输入。这通常需要事务的原始数据，这里使用`nonWitnessUtxo`字段传入原始交易的hex字符串。
4. **添加输出**：添加一个输出，指定收款地址和金额。
5. **签名**：使用私钥对输入进行签名。
6. **验证签名**：验证输入的签名是否有效。
7. **完成PSBT**：完成所有输入，锁定PSBT，使之准备好转换为最终的交易格式。
8. **导出交易**：将PSBT转换为一个标准的比特币交易，并将其转换为hex格式，准备广播到网络。

## PSBT 解析

要解析PSBT（Partially Signed Bitcoin Transaction）并查看其详细内容，你可以使用`bitcoinjs-lib`库在JavaScript环境中执行这一任务。下面的示例将展示如何读取一个PSBT，解析其内容，以及如何查看关键信息，如输入和输出详情。

### 示例：解析PSBT

```javascript
const bitcoin = require('bitcoinjs-lib');

// 假设这是一个已经存在的PSBT的Base64编码字符串
const psbtBase64 =
  'cHNidP8BAHECAAAAAZtuEiavDmeZR6WUjIhjFbkFh7m+yywCfHlni6uTrgH/////AZD+GwAAAAAAF6kU9BeD5tGIzjL0VzU3+kEUNw+HME3/////8C0wbdQAAAAAAF6kUAAAAAAAAiACATWsYQSE/C85hv5jZVDezl0l4AAAAAAAEBKxAnAAAAAAAAFgAUjVv8Fy0Qdk84W/oBhiMllC+HIHg=';

// 将Base64编码的PSBT解码
const psbt = bitcoin.Psbt.fromBase64(psbtBase64);

// 遍历PSBT的输入和输出
psbt.data.inputs.forEach((input, index) => {
  console.log(`Input ${index}:`);
  console.log(input);
});

psbt.data.outputs.forEach((output, index) => {
  console.log(`Output ${index}:`);
  console.log(output);
});

// 如果需要更详细地查看某个特定的输入或输出，可以根据实际需要提取更多信息
```

### 解释

1. **解码PSBT**：首先使用`bitcoinjs-lib`的`Psbt.fromBase64`方法将Base64编码的PSBT字符串解码成一个PSBT对象。
2. **遍历输入和输出**：通过访问`psbt.data.inputs`和`psbt.data.outputs`数组，可以查看每个输入和输出的详细信息。这包括UTXO信息、脚本、签名等。
3. **打印信息**：在控制台打印每个输入和输出的详细信息，这有助于开发者理解和调试PSBT。

## 原生解析

在比特币的PSBT（Partially Signed Bitcoin Transaction）处理中，原生编码和解码是指不使用任何外部库直接操作PSBT格式数据的方法。这通常涉及到直接处理PSBT的二进制表示，理解其结构，并根据规范来手动解析或构建数据。由于PSBT规范的复杂性，这一过程比较繁琐，但非常重要，因为它能提供对PSBT工作原理的深入理解。

### PSBT数据结构

PSBT是一种包含多个键值对的数据结构，每个部分都有其特定的分隔符和格式。其结构大致如下：

1. **全局部分**：包含交易的全局信息，如未签名的交易（除了witness）和其他全局类型的数据。
2. **输入部分**：每个输入都有自己的键值对集，可能包括非见证UTXO、签名脚本、序列号等。
3. **输出部分**：每个输出可能包括与之相关的脚本或其他数据。

### 原生编码过程

编码PSBT时，你需要遵循BIP 174（PSBT规范）中定义的格式，将交易的各个部分转换为键值对，并且每个键值对之后跟一个分隔符。具体步骤如下：

1. **开始全局部分**：使用特定的魔术字节（`0x70736274FF`，表示"psbt"加上分隔符）开始。
2. **编码全局键值对**：例如，将交易版本、交易输入和输出数量等编码为键值对。
3. **输入部分**：对每个输入，编码所有相关信息（如UTXO、见证数据、部分签名等）为键值对。
4. **输出部分**：对每个输出，编码所有相关信息（如赎回脚本）为键值对。
5. **结束**：每个部分结束时都需要一个`0x00`作为分隔符。

### 原生解码过程

解码PSBT时，需要按照编码的相反顺序来操作：

1. **读取并验证魔术字节**：确认PSBT的开始符合规范。
2. **解析全局键值对**：读取键值对，直到遇到分隔符。
3. **逐个解析输入部分**：对于每个输入，读取其键值对，直到遇到分隔符。
4. **逐个解析输出部分**：对于每个输出，同样读取其键值对。
5. **验证完整性**：确保所有必要的数据都已正确解析，并且数据结构符合PSBT的规范。
