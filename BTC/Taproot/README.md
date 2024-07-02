### Taproot的详细历史和特点

#### 起源与发展

1. **提案的提出**：
   - Taproot的设计始于比特币改进提案 [BIP 340](https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki)、[BIP 341](https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki)和[BIP 342](https://github.com/bitcoin/bips/blob/master/bip-0342.mediawiki)。BIP 340介绍了Schnorr签名算法在比特币中的应用，BIP 341提出了Taproot的概念，而BIP 342则探讨了Taproot和Schnorr的集成。

2. **设计目标**：
   - Taproot的主要设计目标包括提高比特币网络的隐私性、可扩展性和支持更复杂的智能合约。通过引入Schnorr签名和Merkle树结构，Taproot旨在优化多重签名交易的外观，并将其与常规单签名交易统一化，从而提升隐私保护。

#### 技术特点

1. **Schnorr签名和签名聚合**：
   - Taproot引入了Schnorr签名算法，这种签名算法相较于比特币当前使用的ECDSA签名更高效，并支持多个输入的签名聚合。这意味着多重签名交易的签名可以被聚合成一个单一的签名，显著减小了交易大小，降低了交易费用，并提高了链上交易的隐私性。

2. **Merkle树结构**：
   - Taproot利用Merkle树结构，将多种不同的比特币脚本路径合并成一个单一的“扩展公钥”。这使得在链上查看的所有交易看起来都像是来自一个单一的地址，从而隐藏了实际执行的交易路径和使用的脚本类型，进一步提升了隐私性。

3. **智能合约支持**：
   - Taproot通过其灵活的脚本能力，支持更复杂和高级的智能合约。这些合约可以以更简洁和隐私的方式实现，允许比特币用户创建更复杂的交易逻辑和条件，如多重签名、时间锁定、条件支付等。

#### 部署和实施

1. **社区支持和开发**：
   - Taproot的开发经历了长时间的讨论和审查，由比特币社区内的核心开发者、研究人员和网络参与者共同推动。通过开放的讨论和测试网络（如Bitcoin Testnet），确保了升级的安全性和兼容性。

2. **激活过程**：
   - Taproot于2021年11月通过比特币矿工社区的投票得到了广泛支持和认可。随后，升级计划在2022年11月在比特币主网上正式生效，这意味着所有比特币节点都支持Taproot升级，并能够开始使用新的Taproot功能。

### Segwit版本区别

#### Segwit 版本0（P2WPKH和P2WSH）

##### 特点：
1. **P2WPKH（Pay to Witness Public Key Hash）**：这种类型的地址通常以`bc1q`开头。
2. **P2WSH（Pay to Witness Script Hash）**：这种类型的地址通常以`bc1q`开头，用于更复杂的多重签名（multisig）脚本。
3. **隔离见证**：交易的见证数据被隔离到一个独立的区块部分，减小了交易数据的大小，从而提高了区块的容量。
4. **交易格式**：新的交易格式，包含一个见证字段，用于存储签名等见证数据。
5. **可延展性问题的解决**：通过隔离见证，解决了交易的可延展性问题，使得交易ID在没有更改其内容的情况下不能被篡改。

#### Segwit 版本1（Taproot）

##### 特点：
1. **Taproot**：这是Segwit版本1的主要改进，它是一个更复杂的地址方案，通常以`bc1p`开头。
2. **Schnorr签名**：引入了Schnorr签名算法，这种算法比原来的ECDSA签名更高效和安全，可以实现批量验证签名，从而进一步提高效率。
3. **Mast（Merkelized Abstract Syntax Tree）**：允许更复杂的智能合约和多重签名方案，只有在执行时需要的部分才会被暴露，增强了隐私性和效率。
4. **更高的灵活性和隐私**：与传统的多重签名方案相比，Taproot允许在不暴露具体条件的情况下进行复杂的条件支付，大大增强了隐私性。
5. **兼容性**：保持与Segwit版本0的兼容性，新的功能和特性在使用时才会生效。

#### 功能对比

| 特点                           | Segwit 版本0                       | Segwit 版本1 (Taproot)          |
|-------------------------------|------------------------------------|---------------------------------|
| **地址格式**                   | `bc1q` 开头                        | `bc1p` 开头                     |
| **主要改进**                   | 隔离见证（Segregated Witness）      | Taproot                         |
| **签名算法**                   | ECDSA 签名                         | Schnorr 签名                    |
| **交易格式**                   | 包含见证字段，分离见证数据          | 与版本0兼容，增加了新的见证字段 |
| **隐私和效率**                 | 提高区块容量，解决交易可延展性问题   | 进一步提高隐私性和效率          |
| **智能合约功能**               | 基础单签名和简单多重签名方案        | 支持更复杂的智能合约和条件支付   |
| **Mast 支持**                  | 不支持                              | 支持（Merkelized Abstract Syntax Tree） |
| **批量签名验证**               | 不支持                              | 支持（Schnorr签名的特性）        |
| **兼容性**                     | 不适用于Taproot                    | 兼容Segwit版本0                 |

#### 锁定脚本和解锁脚本的对比
| Type                    | scriptPubKey（锁定时使用）                     | Witness（花费时使用）                         | 说明                                      |
|-------------------------|------------------------------------------------|----------------------------------------------|-----------------------------------------|
| **P2WPKH**              | 0x0014{20-byte-key-hash}                       | \<signature\> \<pubkey\>                    | 支付到单一公钥哈希，常用于单签名交易。       |
| **P2WSH**               | 0x0020{32-byte-hash}                           | \<script\> \<witness\>                      | 支付到复杂脚本哈希，适用于多重签名或其他复杂脚本。|
| **P2TR (Key Path)**     | 0x5120{32-byte-tweaked-public-key}             | \<schnorr-signature\>                       | 使用Taproot支付到单一公钥，简化的单签名。       |
| **P2TR (Script Path)**  | 0x5120{32-byte-tweaked-public-key}             | \<schnorr-signature\> \<script\> \<control-block\> | 使用Taproot支付到复杂脚本路径，支持复杂的条件支付。|

### 锁定脚本(scriptPubKey)
对于隔离见证 Output，其 scriptPubKey 为 **OP_n tweaked-public-key**  
#### OP_n
OP_n 表示隔离见证版本，版本 0 隔离见证 Output 的 scriptPubKey 的首个字节是 0x00，而版本 1 隔离见证 Output 的 scriptPubKey 的首个字节是 0x51
```js
OP_0: 0x00
OP_1: 0x51
OP_2: 0x52
...

See: https://github.com/bitcoin/bitcoin/blob/v22.0/src/script/script.h#L68
```

#### tweaked-public-key
tweaked-public-key的计算比较复杂，有internal public key和script tree的Merkle Root组成，然后再进行Bech32m编码就能得到Taproot地址
##### script path
script path是Taproot中比较灵活、同时比较复杂的一种方式  
tweaked-public-key的计算比较如下图：$$Q = P + t*G$$
![$$Q = P + t*G$$](https://aandds.com/blog/images/taproot_tweak.gif)

#### key path
key path不需要 Script Path，则可以去掉 Script 相关的哈希
即：$$Q = P + t*G = P + TaggedHash('TapTweak', P)G$$
钱包中的taproot地址就是基于**用户公钥做P**代入上方公式推导得到


### 解锁脚本(Witness)
Taproot属于Segwit v1版本，其相关解锁脚本放在Witness位置
如果在花费 P2TR UTXO 时，Witness 只包含一个元素，则是 P2TR (Key Path)，如果在花费 P2TR UTXO 时，Witness 至少包含两个元素，则是 P2TR (Script Path)。在花费一个 P2TR UTXO 时，是通过 Witness 中元素的个数来决定使用 Key Path（Witness 元素个数为 1）还是 Script Path（Witness 元素个数大于等于 2）。

#### script path
[905ecdf95a84804b192f4dc221cfed4d77959b81ed66013a7e41a6e61e7ed530](https://blockchain.info/rawtx/905ecdf95a84804b192f4dc221cfed4d77959b81ed66013a7e41a6e61e7ed530)是花费 P2TR (Script Path) 的例子（它是一个 2-of-2 多签脚本），它的 Witness 为
```js
044123b1d4ff27b16af4b0fcb9672df671701a1a7f5a6bb7352b051f461edbc614aa6068b3e5313a174f90f3d95dc4e06f69bebd9cf5a3098fde034b01e69e8e788901400fd4a0d3f36a1f1074cb15838a48f572dc18d412d0f0f0fc1eeda9fa4820c942abb77e4d1a3c2b99ccf4ad29d9189e6e04a017fe611748464449f681bc38cf394420febe583fa77e49089f89b78fa8c116710715d6e40cc5f5a075ef1681550dd3c4ad20d0fa46cb883e940ac3dc5421f05b03859972639f51ed2eccbf3dc5a62e2e1b15ac41c02e44c9e47eaeb4bb313adecd11012dfad435cd72ce71f525329f24d75c5b9432774e148e9209baf3f1656a46986d5f38ddf4e20912c6ac28f48d6bf747469fb1
```
根据编码我们得知有4个元素
```js
0070: .. .. .. .. .. .. 04 .. .. .. .. .. .. .. .. .. vin0 Witness Count: 4
0070: .. .. .. .. .. .. .. 41 23 b1 d4 ff 27 b1 6a f4 vin0 Witness 0 Length:65 (0x41)
0080: b0 fc b9 67 2d f6 71 70 1a 1a 7f 5a 6b b7 35 2b
0090: 05 1f 46 1e db c6 14 aa 60 68 b3 e5 31 3a 17 4f
00a0: 90 f3 d9 5d c4 e0 6f 69 be bd 9c f5 a3 09 8f de
00b0: 03 4b 01 e6 9e 8e 78 89 01 .. .. .. .. .. .. ..
00b0: .. .. .. .. .. .. .. .. .. 40 0f d4 a0 d3 f3 6a vin0 Witness 1 Length:64 (0x40)
00c0: 1f 10 74 cb 15 83 8a 48 f5 72 dc 18 d4 12 d0 f0
00d0: f0 fc 1e ed a9 fa 48 20 c9 42 ab b7 7e 4d 1a 3c
00e0: 2b 99 cc f4 ad 29 d9 18 9e 6e 04 a0 17 fe 61 17
00f0: 48 46 44 49 f6 81 bc 38 cf 39 .. .. .. .. .. ..
00f0: .. .. .. .. .. .. .. .. .. .. 44 20 fe be 58 3f vin0 Witness 2 Length:68 (0x44)
0100: a7 7e 49 08 9f 89 b7 8f a8 c1 16 71 07 15 d6 e4
0110: 0c c5 f5 a0 75 ef 16 81 55 0d d3 c4 ad 20 d0 fa
0120: 46 cb 88 3e 94 0a c3 dc 54 21 f0 5b 03 85 99 72
0130: 63 9f 51 ed 2e cc bf 3d c5 a6 2e 2e 1b 15 ac ..
0130: .. .. .. .. .. .. .. .. .. .. .. .. .. .. .. 41 vin0 Witness 3 Length:65 (0x41)
0140: c0 2e 44 c9 e4 7e ae b4 bb 31 3a de cd 11 01 2d
0150: fa d4 35 cd 72 ce 71 f5 25 32 9f 24 d7 5c 5b 94
0160: 32 77 4e 14 8e 92 09 ba f3 f1 65 6a 46 98 6d 5f
0170: 38 dd f4 e2 09 12 c6 ac 28 f4 8d 6b f7 47 46 9f
0180: b1
```


#### key path
[dbef583962e13e365a2069d451937a6de3c2a86149dc6a4ac0d84ab450509c91](https://blockchain.info/rawtx/dbef583962e13e365a2069d451937a6de3c2a86149dc6a4ac0d84ab450509c91)是花费 P2TR (Key Path) 的例子，它的 witness 为：
```js
044123b1d4ff27b16af4b0fcb9672df671701a1a7f5a6bb7352b051f461edbc614aa6068b3e5313a174f90f3d95dc4e06f69bebd9cf5a3098fde034b01e69e8e788901400fd4a0d3f36a1f1074cb15838a48f572dc18d412d0f0f0fc1eeda9fa4820c942abb77e4d1a3c2b99ccf4ad29d9189e6e04a017fe611748464449f681bc38cf394420febe583fa77e49089f89b78fa8c116710715d6e40cc5f5a075ef1681550dd3c4ad20d0fa46cb883e940ac3dc5421f05b03859972639f51ed2eccbf3dc5a62e2e1b15ac41c02e44c9e47eaeb4bb313adecd11012dfad435cd72ce71f525329f24d75c5b9432774e148e9209baf3f1656a46986d5f38ddf4e20912c6ac28f48d6bf747469fb1
```
```js
0141e6e1fe41524e65e3040bc3d080a136345c2c806eb7f336dd6a7a79e9054b0d1fc6a8d836667ef6e9f2188cd1270ab28e5e0eb642eac89f2ec50a32ca54aaf9d601

01 .. .. .. .. .. .. .. .. .. .. .. .. .. .. vin0 Witness Count: 1
.. 41 .. .. .. .. .. .. .. .. .. .. .. .. .. vin0 Witness 0 Length:65, schnorr_sig (64 bytes) + sig_hash (1 bytes)
.. .. e6 e1 fe 41 52 4e 65 e3 04 0b c3 d0 80 schnorr_sig
a1 36 34 5c 2c 80 6e b7 f3 36 dd 6a 7a 79 e9 
05 4b 0d 1f c6 a8 d8 36 66 7e f6 e9 f2 18 8c 
d1 27 0a b2 8e 5e 0e b6 42 ea c8 9f 2e c5 0a 
32 ca 54 aa f9 d6
.. .. .. .. .. .. 01                                     sig_hash: SIGHASH_ALL (0x01)
```
