# 简介

[P2SH-P2PKH（Pay to Script Hash - Pay to Public Key Hash）](../wallet/address.js#L43)是一种混合地址类型，结合了P2SH（支付到脚本哈希）和P2PKH（支付到公钥哈希）的特点。这种地址类型旨在增强比特币交易的灵活性和安全性。`P2SH`是在2012年通过比特币改进提案BIP 0016引入的，允许用户发送比特币到一个脚本的哈希值，而不是直接发送到公钥的哈希值。这样做的好处是可以隐藏脚本的具体细节，只有在花费比特币时才需要揭示。这对于实现更复杂的交易类型（如多重签名）非常有用。`P2SH-P2PKH`结合了`P2SH`和`P2PKH`的特性。在这种地址类型中，交易输出不是直接支付到公钥哈希，而是支付到一个包含`P2PKH`脚本的`P2SH`地址。`P2SH-P2PKH`地址通常以“3”开始，不同于传统的`P2PKH`地址，后者以“1”开始。这种地址类型是比特币地址方案中的一种进阶形式，适用于需要额外安全或复杂交易类型的用户。

# 工作过程

## ScriptPubKey(锁定脚本)

在P2SH-P2PKH交易中，锁定脚本不直接包含传统的P2PKH脚本。相反，它包含了对应P2PKH脚本的哈希值。锁定脚本的形式如下：

```js
// 模版
OP_HASH160 <scriptHash> OP_EQUAL
其中
scriptHash = hash160(OP_DUP OP_HASH160 <Public Key Hash> OP_EQUALVERIFY OP_CHECKSIG)

OP_HASH160 // 弹出栈顶元素，计算其SHA-256散列，然后计算RIPEMD-160散列
OP_PUSHBYTES_20 // 推送20字节到栈顶
18e1fad25b2983d5dbb2e2b96e3ce756a69b3bc2 // 脚本哈希
OP_EQUAL // 比较栈顶两个元素相等
```

## ScriptSig(解锁脚本)

要解锁花费此脚本，上面公钥的所有者需要提供公钥，有效签名以及原始脚本

```js
// 模版
<Singature> <Public Key> <redeemScript>

OP_PUSHBYTES_72 // 推送72字节到栈顶
3045022100c233c3a8a510e03ad18b0a24694ef00c78101bfd5ac075b8c1037952ce26e91e02205aa5f8f88f29bb4ad5808ebc12abfd26bd791256f367b04c6d955f01f28a772401 // 签名数据
OP_PUSHBYTES_33 // 推送33字节到栈顶
03480b6822120e9936b43859d84c380583c3d0292409b21453ae962815090f8117 // 压缩公钥
OP_PUSHBYTES_25 // 推送25字节到栈顶
76a9148876d7c7a76e29c4c9d160c066fead1d2adfe5a788ac // 赎回脚本
```

## 执行过程

1. 脚本合并，ScriptSig在前ScriptPubKey在后

```js
<Singature> <Public Key> <redeemScript> OP_HASH160 <scriptHash> OP_EQUAL

其中
redeemScript = OP_DUP OP_HASH160 <Public Key Hash> OP_EQUALVERIFY OP_CHECKSIG

scriptHash = hash160(OP_DUP OP_HASH160 <Public Key Hash> OP_EQUALVERIFY OP_CHECKSIG)
```

2. 栈内执行

- 提取和验证`redeemScript`：  
  首先，从`ScriptSig`中提取`redeemScript`。
  然后，计算`redeemScript`的哈希值，并检查它是否与`ScriptPubKey`中的`<scriptHash>`相匹配。

- 执行`redeemScript`：  
  如果`redeemScript`的哈希值验证通过，接下来的步骤是执行`redeemScript`本身。
  这时，栈中应该已经有了签名`<Singature>`和公钥`<Public Key>`。
  redeemScript首先复制公钥`OP_DUP`，计算公钥的哈希`OP_HASH160`，并与栈中的公钥哈希`<Public Key Hash>`进行比较`OP_EQUALVERIFY`。
  如果公钥哈希匹配，最后一步是验证签名是否正确`OP_CHECKSIG`。这一步检查提供的签名是否是用相关的私钥对交易的其余部分进行了签名。

- 完成验证：  
  如果以上步骤都成功，说明交易中的资金可以被花费，否则交易将被拒绝。

## 地址生成

P2SH-P2PKH地址生成遵循以下步骤，这些步骤与生成P2PKH地址的步骤相似，但涉及一些关键的不同之处，特别是在脚本的使用和版本字节的应用上。

### 步骤1: 创建并哈希化 `P2PKH` 脚本

1. **创建 `P2PKH` 脚本**：
   - 构建一个典型的P2PKH脚本：`OP_DUP OP_HASH160 <Public Key Hash> OP_EQUALVERIFY OP_CHECKSIG`，其中`<Public Key Hash>`是公钥的RIPEMD-160哈希。
2. **计算脚本的SHA-256哈希值**：
   - 对整个脚本进行SHA-256哈希运算。
3. **计算RIPEMD-160哈希值**：
   - 接着，对SHA-256的结果再进行RIPEMD-160哈希运算。这个哈希值称为脚本哈希（Script Hash）。

### 步骤2: 添加版本字节

- **添加版本字节**：
  - 在脚本哈希前添加版本字节（比特币主网络的P2SH地址的版本是0x05, 测试网是0xc4）。这有助于钱包软件识别和处理P2SH地址。

### 步骤3: 计算校验和

1. **双重SHA-256哈希**：
   - 对带有版本字节的脚本哈希进行两次SHA-256哈希运算。
2. **取前四个字节**：
   - 从双重哈希的结果中取出前四个字节作为校验和。

### 步骤4: 生成地址

- **组合和Base58编码**：
  - 将版本字节、脚本哈希以及校验和组合在一起，结构如下：
    ```js
    [version byte][script hash][checksum]
    ```
  - 然后，对整个字节串进行Base58编码，生成最终的P2SH-P2PKH地址。

### 示例

假设有一个公钥，步骤如下：

1. **公钥**： `04480b6822120e9022c3ee7cdb92394e32e82ec5bc8860c8888df6a9910537e90c75079726a2a8469936b43859d84c380583c3d0292409b21453ae962815090f8117883c2a3fd7571b12f34491809d48467dae4e2f162aef23de91e4532d0fc1e0c5`
2. **SHA-256哈希**：计算结果: `98a21cf747c0fcd80845afffa2260feb64aa7cc2b73ac681407b25229bad3bbc`
3. **RIPEMD-160哈希**：计算结果: `999ff7726530ed0d0a7eb3b7442c5143f643f638`
4. **创建并哈希化 P2PKH 脚本**：  
   创建一个P2PKH脚本：OP_DUP OP_HASH160 <pubKeyHash> OP_EQUALVERIFY OP_CHECKSIG。  
   计算脚本哈希：将整个P2PKH脚本进行SHA-256哈希运算，然后再进行RIPEMD-160哈希运算，生成脚本哈希。
5. **添加版本字节**：`05` + [RIPEMD-160哈希结果]。
6. **计算校验和**：对上述结果执行两次SHA-256，取前四个字节。
7. **Base58编码**：将最终字节串转换为Base58编码：`3NB2grHkCeer9o7Guvr6qCXCsDsjX3mTan`
