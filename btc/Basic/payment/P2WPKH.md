# 简介

[P2WPKH（Pay to Witness Public Key Hash）](../wallet/address.js#L44)是一种新型地址格式，它是隔离见证（SegWit）的一部分，由比特币改进提案BIP 0141在2017年引入。这种地址类型主要目的是减小交易的大小，从而降低手续费，同时增加交易的修改抵抗力（malleability resistance）。`P2WPKH`简化了标准的`P2PKH`地址脚本，将签名和公钥信息从交易的脚本部分移至见证部分，这样做有助于更高效的签名验证和交易大小的减小。`P2WPKH`地址通常以“bc1”开始，使用Bech32编码格式，与传统的`P2PKH`和`P2SH`地址格式（分别以“1”和“3”开始）显著不同。

# 工作过程

## ScriptPubKey(锁定脚本)

在P2WPKH交易中，锁定脚本变得非常简洁：

```js
// 模版
OP_0 <pubKeyHash>

OP_0  // 表示版本号，对于P2WPKH是0
OP_PUSHBYTES_20 // 推送20字节到栈顶
18e1fad25b2983d5dbb2e2b96e3ce756a69b3bc2 // 公钥哈希
```

- `OP_0`：表示版本号，对于P2WPKH是0。
- `<pubKeyHash>`：是公钥的SHA-256哈希后再进行RIPEMD-160哈希的结果，和传统P2PKH的处理方式相同。

## Witness(见证数据)

为了解锁P2WPKH输出，需要在见证字段提供以下信息：

```js
// 模版
<Singature> <Public Key>

02  // 见证数据的数量
48  // 第一个见证数据的长度72字节
3045022100a5eec95c65d2dd679e8fdcc10668d5d51446f24d1557859cb543e570201257c6022011df04f803a08c97de213ddf211ad193045ff25e59857324a28656de1961351c01  // 签名数据
21  // 第二个见证数据的长度33字节
0295f97f41d0d523bddf39e77e16cc0dda2e56b9bd9fdea10133656635b2c28a39  // 压缩公钥
```

## 执行过程

1. 脚本合并同P2PKH，使用Witness替换ScriptSig在前，ScriptPubKey在后

```js
<Singature> <Public Key> OP_DUP OP_HASH160 <Public Key Hash> OP_EQUALVERIFY OP_CHECKSIG
```

2. 栈内执行通P2PKH

- OP_DUP 从栈里取出公钥，复制并做HASH160推进栈顶
- OP_EQUALVERIFY 对比上一步的计算结果和Public Key Hash
- OP_CHECKSIG 校验数字签名，如果通过锁定脚本合法可以花费对应UTXO，如果不通过交易失败

## 地址生成

P2WPKH地址的生成过程如下：

### 步骤1: 计算公钥哈希

- 使用公钥生成哈希：首先对公钥进行SHA-256，然后进行RIPEMD-160哈希运算。

### 步骤2: Bech32编码

- 使用Bech32编码方案将公钥哈希编码为一个P2WPKH地址。这包括将数据与校验和一起编码，提供了更好的错误检测能力。

### 示例

假设有一个公钥，步骤如下：

1. **公钥**： `022c3ee7cdb92394e32e82ec5bc8860c8888df6a9910537e90c75079726a2a8469`
2. **SHA-256哈希**：计算结果: `98a21cf747c0fcd80845afffa2260feb64aa7cc2b73ac681407b25229bad3bbc`
3. **RIPEMD-160哈希**：计算结果: `999ff7726530ed0d0a7eb3b7442c5143f643f638`
4. **Bech32编码**：将最终字节串转换为Bech32编码:`bc1qnx0lwun9xrks6zn7kwm5gtz3g0my8a3cqde85n`
