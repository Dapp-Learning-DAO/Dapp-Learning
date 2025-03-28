# 简介

[P2PKH（Pay-to-Public-Key-Hash）](../wallet/address.js#L42)是比特币网络中最常用的一种交易类型，设计用来将比特币支付到某个具体的公钥哈希，而不是直接到公钥本身。这种方式提供了更高的安全性和隐私保护。在P2PKH交易中，比特币被发送到一个地址，这个地址实际上是持有者公钥的哈希版本。这种地址通常以数字"1"开头。地址不仅简洁，而且通过哈希公钥，隐藏了公钥的实际内容，增加了隐私保护层。

# 工作过程

## ScriptPubKey(锁定脚本)

P2PKH脚本模式包含一个公钥哈希，该哈希和以下操作码共同构成锁定脚本

```js
// 模版
OP_DUP OP_HASH160 <Public Key Hash> OP_EQUALVERIFY OP_CHECKSIG

OP_DUP // 复制栈顶的元素
OP_HASH160 // 弹出栈顶元素，计算其SHA-256散列，然后计算RIPEMD-160散列
OP_PUSHBYTES_20 // 推送20字节的公钥哈希到栈顶
18e1fad25b2983d5dbb2e2b96e3ce756a69b3bc2 // 公钥哈希
OP_EQUALVERIFY // 比较栈顶元素是否匹配
OP_CHECKSIG // 验证数字签名

```

## ScriptSig(解锁脚本)

要解锁花费此脚本，上面公钥的所有者需要提供原始公钥以及的有效签名

```js
// 模版
<Singature> <Public Key>

OP_PUSHBYTES_72 // 推送72字节到栈顶
3045022100c233c3a8a510e03ad18b0a24694ef00c78101bfd5ac075b8c1037952ce26e91e02205aa5f8f88f29bb4ad5808ebc12abfd26bd791256f367b04c6d955f01f28a772401 // 签名数据
OP_PUSHBYTES_33 // 推送33字节到栈顶
03480b6822120e9936b43859d84c380583c3d0292409b21453ae962815090f8117 // 压缩公钥
```

## 执行过程

1. 脚本合并，ScriptSig在前ScriptPubKey在后

```js
<Singature> <Public Key> OP_DUP OP_HASH160 <Public Key Hash> OP_EQUALVERIFY OP_CHECKSIG
```

2. 栈内执行

- OP_DUP 从栈里取出公钥，复制并做HASH160推进栈顶
- OP_EQUALVERIFY 对比上一步的计算结果和Public Key Hash
- OP_CHECKSIG 校验数字签名，如果通过锁定脚本合法可以花费对应UTXO，如果不通过交易失败

## 地址生成

P2PKH支付方式从公钥生成地址遵循以下详细步骤：

### 步骤1: 计算公钥哈希

1. **计算公钥的SHA-256哈希值**：首先，对公钥进行SHA-256哈希运算。
2. **计算RIPEMD-160哈希值**：然后，对SHA-256的结果再进行RIPEMD-160哈希运算。这两步哈希运算的结果称为公钥哈希（PKH）。

### 步骤2: 添加版本字节

- **添加版本字节**：在公钥哈希前添加一个版本字节（比特币主网络的P2PKH地址的版本是0x00, 测试网是0x6f）。这有助于钱包软件识别和处理不同类型的地址。

### 步骤3: 计算校验和

1. **双重SHA-256哈希**：对带有版本字节的公钥哈希进行两次SHA-256哈希运算。
2. **取前四个字节**：从双重哈希的结果中取出前四个字节，这部分称为校验和。

### 步骤4: 生成地址

- **组合和Base58编码**：将版本字节和公钥哈希以及校验和组合在一起，整个结构为：
  ```js
  [version byte][public key hash][checksum]
  ```
  然后，对整个字节串进行Base58编码，以生成最终的P2PKH地址。

### 示例

假设有一个公钥，步骤如下：

1. **公钥**： `022c3ee7cdb92394e32e82ec5bc8860c8888df6a9910537e90c75079726a2a8469`
2. **SHA-256哈希**：计算结果: `98a21cf747c0fcd80845afffa2260feb64aa7cc2b73ac681407b25229bad3bbc`。
3. **RIPEMD-160哈希**：计算结果: `999ff7726530ed0d0a7eb3b7442c5143f643f638`。
4. **添加版本字节**：`00` + [RIPEMD-160哈希结果]。
5. **计算校验和**：对上述结果执行两次SHA-256，取前四个字节。
6. **Base58编码**：将最终字节串转换为Base58编码：`1F1J22NAAgnNHXNojT7W8GfP9JSXXjTV8N`
