## OP_CHECKSIGADD
`OP_CHECKSIGADD` 是比特币脚本语言中的一个操作码（opcode），其引入主要目的是为了优化和简化多重签名验证过程。它在 Taproot 和 Schnorr 签名方案中扮演了重要角色，允许更高效地实现多重签名和复杂交易。

### BIP 提出的背景

`OP_CHECKSIGADD` 的引入是为了配合 Taproot 和 Schnorr 签名的实现，这两个方案显著优化了比特币的签名机制，提高了隐私性和效率。

#### 具体的 BIP
1. **BIP 340**：
  - 标题：`Schnorr Signatures for secp256k1`
  - 提案作者：Pieter Wuille, Jonas Nick, Tim Ruffing
  - 提出时间：2020 年 1 月
  - 内容：介绍了 Schnorr 签名算法，为比特币带来了更简洁的签名和更高的验证效率。

2. **BIP 341**：
  - 标题：`Taproot: SegWit version 1 spending rules`
  - 提案作者：Pieter Wuille, Jonas Nick, Anthony Towns
  - 提出时间：2020 年 1 月
  - 内容：定义了 Taproot 升级，引入了一种新的输出类型，使得复杂的交易更加高效和隐私。

3. **BIP 342**：
  - 标题：`Validation of Taproot Scripts`
  - 提案作者：Pieter Wuille
  - 提出时间：2020 年 1 月
  - 内容：引入了 `OP_CHECKSIGADD` 操作码，用于在 Taproot 中实现更高效的多重签名验证。

### 关键人物

1. **Pieter Wuille**：
   - 比特币核心开发者，BIP 340、BIP 341 和 BIP 342 的主要作者，对 Taproot 和 Schnorr 签名的引入和实施起到了关键作用。

2. **Jonas Nick**：
   - 比特币核心开发者，参与了 Schnorr 签名和 Taproot 的研究和开发。

3. **Tim Ruffing**：
   - 密码学研究者，参与了 Schnorr 签名和多重签名方案的研究和开发。

4. **Anthony Towns**：
   - 比特币核心开发者，参与了 Taproot 的设计和实现。

### 激活过程
为了激活 Taproot 升级，比特币网络采用了一种称为“Speedy Trial”的激活机制。这种机制允许矿工通过在区块中设置特定的标志位（version bits）来表示他们对 Taproot 升级的支持。

- **信号期**：矿工在每个区块中设置信号位，表示对 Taproot 升级的支持。
- **激活门槛**：在一个难度调整周期（2016 个区块）内，需要至少 90% 的区块（即 1815 个区块）设置信号位，以表示对升级的支持。
- **锁定期**：如果在一个信号期内达到了激活门槛，Taproot 升级会进入“锁定期”（lock-in period），再经过一个难度调整周期后，升级正式生效。

#### 5. 正式激活

Taproot 升级在 2021 年 6 月达到了激活门槛，随后在 2021 年 11 月正式激活。从这个时间点开始，`OP_CHECKSIGADD` 和其他相关的新功能在比特币网络上正式生效。

### 关键时间点

- **2020 年 1 月**：BIP 340、BIP 341 和 BIP 342 提出。
- **2021 年 6 月**：Taproot 升级达到了激活门槛。
- **2021 年 11 月 14 日**：Taproot 升级正式激活。

### 工作原理

`OP_CHECKSIGADD` 操作码的主要功能是验证单个签名并将结果（0 或 1）与现有的累计值相加。这在构建多重签名验证时尤其有用，因为它允许逐步累积签名验证的结果，然后在最后进行总和检查。

#### 操作步骤

1. 从堆栈中弹出一个公钥。
2. 从堆栈中弹出一个签名。
3. 从堆栈中弹出一个累计值。
4. 验证公钥和签名：
   - 如果签名有效，返回 1；否则返回 0。
5. 将验证结果与累计值相加。
6. 将新的累计值压回堆栈。

### 示例脚本

假设我们有三个公钥和三个对应的签名，我们希望验证至少两个签名，脚本如下：

```
<sig1> <sig2> <sig3> <0> <pubKey1> OP_CHECKSIGADD <pubKey2> OP_CHECKSIGADD <pubKey3> OP_CHECKSIGADD <2> OP_EQUAL
```

在这个脚本中：
- `<sig1> <sig2> <sig3>` 是签名。
- `<0>` 是初始累计值。
- `<pubKey1> <pubKey2> <pubKey3>` 是公钥。
- `OP_CHECKSIGADD` 执行单个签名验证并累加结果。
- `<2> OP_EQUAL` 检查累加值是否等于 2。


`OP_CHECKSIGADD` 是比特币脚本语言中用于优化多重签名验证的新操作码。它简化了多重签名的实现，使得复杂交易更加高效。它的引入与 BIP 340、BIP 341 和 BIP 342 紧密相关，标志着比特币在隐私性和效率方面的显著提升。通过 `OP_CHECKSIGADD`，比特币能够更灵活地实现多重签名验证，同时保持较高的安全性和性能。

### 案例
这里以上面示例中taproot script-path脚本中的2-3多签为例

1. 随机生成internal public key和三份多签用户的私钥
```js
const internalKey = bip32.fromSeed(rng(64), regtest);

const leafKeys = [];
const leafPubkeys = [];
for (let i = 0; i < 3; i++) {
  const leafKey = bip32.fromSeed(rng(64), regtest);
  leafKeys.push(leafKey);
  leafPubkeys.push(toXOnly(leafKey.publicKey).toString('hex'));
}
```

2. 构造锁定脚本
```js
 const leafScriptAsm = `${leafPubkeys[2]} OP_CHECKSIG ${leafPubkeys[1]} OP_CHECKSIGADD ${leafPubkeys[0]} OP_CHECKSIGADD OP_3 OP_NUMEQUAL`;
```

3. 构造MAST
```js
const leafScript = bitcoin.script.fromASM(leafScriptAsm);

const scriptTree: Taptree = [
  {
    output: bitcoin.script.fromASM(
      '50929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0 OP_CHECKSIG',
    ),
  },
  [
    {
      output: bitcoin.script.fromASM(
        '50929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0 OP_CHECKSIG',
      ),
    },
    {
      output: leafScript,
    },
  ],
];
const redeem = {
  output: leafScript,
  redeemVersion: LEAF_VERSION_TAPSCRIPT,
};

const { output, address, witness } = bitcoin.payments.p2tr({
  internalPubkey: toXOnly(internalKey.publicKey),
  scriptTree,
  redeem,
  network: regtest,
});
```

4. 构造PSBT交易
```js
// amount from faucet
const amount = 42e4;
// amount to send
const sendAmount = amount - 1e4;
// get faucet
const unspent = await regtestUtils.faucetComplex(wallet.output, amount);

const psbt = new bitcoin.Psbt({ network: regtest });

// Adding an input is a bit special in this case,
// So we contain it in the wallet class
// Any wallet can do this, wallet2 or wallet3 could be used.
wallet.addInput(psbt, unspent.txId, unspent.vout, unspent.value);

psbt.addOutput({ value: sendAmount, address: wallet.address });

```

5. 签名交易
```js
// Sign with at least 2 of the 3 wallets.
// Verify that there is a matching leaf script
// (which includes the unspendable internalPubkey,
// so we verify that no one can key-spend it)
wallet3.verifyInputScript(psbt, 0);
wallet2.verifyInputScript(psbt, 0);
psbt.signInput(0, wallet3);
psbt.signInput(0, wallet2);

// Before finalizing, we need to add dummy signatures for all that did not sign.
// Any wallet can do this, wallet2 or wallet3 could be used.
wallet.addDummySigs(psbt);

// its just used to add dummy signature that have an empty Buffer
addDummySigs(psbt: bitcoin.Psbt) {
  const leafHash = tapleafHash({
    output: this.leafScript,
    version: this.leafVersion,
  });
  for (const input of psbt.data.inputs) {
    if (!input.tapScriptSig) continue;
    const signedPubkeys = input.tapScriptSig
      .filter(ts => ts.leafHash.equals(leafHash))
      .map(ts => ts.pubkey);
    for (const pubkey of this.pubkeys) {
      if (signedPubkeys.some(sPub => sPub.equals(pubkey))) continue;
      // Before finalizing, every key that did not sign must have an empty signature
      // in place where their signature would be.
      // In order to do this currently we need to construct a dummy signature manually.
      input.tapScriptSig.push({
        // This can be reused for each dummy signature
        leafHash,
        // This is the pubkey that didn't sign
        pubkey,
        // This must be an empty Buffer.
        signature: Buffer.from([]),
      });
    }
  }
}
```
这里需要注意
OP_CHECKSIGADD需要**完整的三个签名**，我们需要对未签名的公钥补一个无效签名，即一个字节的0x00

6. 提取广播
```js
psbt.finalizeAllInputs();
const tx = psbt.extractTransaction();
const rawTx = tx.toBuffer();
const hex = rawTx.toString('hex');

await regtestUtils.broadcast(hex);
```

OP_CHECKSIGADD交易示例，这笔交易里还同时包含了OP_CHECKSIG和OP_CHECKSIGVERIFY：https://mempool.space/zh/signet/tx/ceb126550481ecb69b45929b2b5869fd3975a707e6100b368d6cc15e4434ad9d

```js
OP_PUSHBYTES_32 9d65bad2d86e26bf1a907077312b849f89e5109a8574087a34953252af63940c
OP_CHECKSIGVERIFY
OP_PUSHBYTES_32 113c3a32a9d320b72190a04a020a0db3976ef36972673258e9a38a364f3dc3b0
OP_CHECKSIG
OP_PUSHBYTES_32 17921cf156ccb4e73d428f996ed11b245313e37e27c978ac4d2cc21eca4672e4
OP_CHECKSIGADD
OP_PUSHBYTES_32 3bb93dfc8b61887d771f3630e9a63e97cbafcfcc78556a474df83a31a0ef899c
OP_CHECKSIGADD
OP_PUSHBYTES_32 40afaf47c4ffa56de86410d8e47baa2bb6f04b604f4ea24323737ddc3fe092df
OP_CHECKSIGADD
OP_PUSHBYTES_32 49766ccd9e3cd94343e2040474a77fb37cdfd30530d05f9f1e96ae1e2102c86e
OP_CHECKSIGADD
OP_PUSHBYTES_32 76d1ae01f8fb6bf30108731c884cddcf57ef6eef2d9d9559e130894e0e40c62c
OP_CHECKSIGADD
OP_PUSHBYTES_32 79a71ffd71c503ef2e2f91bccfc8fcda7946f4653cef0d9f3dde20795ef3b9f0
OP_CHECKSIGADD
OP_PUSHBYTES_32 d21faf78c6751a0d38e6bd8028b907ff07e9a869a43fc837d6b3f8dff6119a36
OP_CHECKSIGADD
OP_PUSHBYTES_32 f5199efae3f28bb82476163a7e458c7ad445d9bffb0682d10d3bdb2cb41f8e8e
OP_CHECKSIGADD
OP_PUSHNUM_6
OP_NUMEQUAL
```