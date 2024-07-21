# 简介

[P2TR（Pay to Taproot）](../wallet/address.js#L45)是一种使用Taproot技术的比特币地址类型，由BIP 0341在2020年正式引入。Taproot是通过使用Schnorr签名和MAST（Merkelized Abstract Syntax Trees）来增强比特币的隐私性和效率。Taproot Output 是版本为 1 的隔离见证 Output，统一了这两种形式。P2TR 的 Output 的 scriptPubKey 字段是一样的，我们无法从 Output 的格式来得知这个 Output 是由 Schnorr 签名锁定（即 Key Path）还是由脚本锁定（即 Script Path），这样有更好的隐私。这种类型的地址支持更复杂的条件，同时在外部看起来与普通交易无异。P2TR地址通常使用Bech32m编码格式，以“bc1p”开始。

# 工作过程

## ScriptPubKey(锁定脚本)

在P2TR交易中，锁定脚本包括：

```js
// 模版
OP_1 <x-only-pubkey>


OP_1 // 表示版本号，对于P2TR是1
OP_PUSHBYTES_20 // 推送20字节到栈顶
18e1fad25b2983d5dbb2e2b96e3ce756a69b3bc2 // tweaked-public-key
```

- `OP_1`：标识Taproot版本号，目前为1。
- `<x-only-pubkey>`：是tweak公钥的X坐标，key path和script path在生成方式上不同，采用32字节的压缩格式。

## Witness(见证数据)

解锁P2TR输出，需要在见证字段提供以下信息，具体取决于花费条件：

```js
// 模版
[signature] [control block] [script]

01  // Witness 元素的个数
40  // schnorr签名长度
743bbb3df4e95df5e70c2a3e72dd9d05933a018ad1bbd4b700841824ed18bebbc54d1b4d03b252aaa5c373390c68ba119fdf70e0bab71694a4db0da3fe8fefcc  // schnorr签名
```

- `signature`：Schnorr签名。
- `control block`：如果是通过脚本路径花费，包含与Taproot脚本路径相关的数据
- `script`：如果是通过脚本路径花费，此处包含实际脚本。

## 执行过程

P2TR分为key path和script path，通过在花费 P2TR UTXO 时，Witness 中包含元素个数来区分，只包含一个元素签名的即为key path。签名算法可以参考[Schnorr](../signature/README.md#L105)，P2TR的验签过称可以参考[taproot](https://aandds.com/blog/bitcoin-taproot.html)

## 地址生成

P2TR地址包含key path和script path两种情况，目前常见的钱包支持基于用户公钥的key path地址，改地址的生成过程如下：

### 步骤1: 获取用户公钥

获取用户公钥的`internalPubkey`坐标 `P`  
 $P = toXOnly(internalPubkey)$

### 步骤2: 计算扭曲公钥

$Q = P + t\*G = P + TaggedHash('TapTweak', P)G$

### 步骤3: Bech32m编码

使用Bech32m编码方案将曲公钥编码为一个P2TR地址。这种编码格式提供了比Bech32更好的错误校验能力。

### 示例

假设有一个公钥的X坐标，步骤如下：

1. **公钥X坐标**： `2c3ee7cdb92394e32e82ec5bc8860c8888df6a9910537e90c75079726a2a8469`
2. **扭曲公钥X坐标**： `84d67b14669b9eccf5fa76ac48294527e44e829a4534f0e695061e5a1a5a5c20`
3. **Bech32m编码**：将扭曲公钥X坐标转换为Bech32m编码：`bc1psnt8k9rxnw0vea06w6kys229yljyaq56g560pe54qc095xj6tssq3fpwfp`
