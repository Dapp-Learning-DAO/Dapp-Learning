## OP_CHECKMULTISIG

`OP_CHECKMULTISIG` 是比特币脚本语言中的一个操作码（opcode），用于实现多重签名验证。在比特币交易中，`OP_CHECKMULTISIG` 允许指定多个公钥，并要求至少有一定数量（M）的签名来验证交易。此功能广泛应用于多重签名钱包和联合管理的比特币地址，旨在增强比特币网络的安全性和灵活性。

### 背景

1. **早期比特币设计**：
   - 比特币最初设计主要关注点是点对点的单一用户交易。
   - 简单的签名机制足以支持基本的比特币转账功能。

2. **安全需求增加**：
   - 随着比特币的普及，越来越多的用户和组织开始使用比特币。
   - 对于大额资金或共享账户，单一签名的安全性不足以抵御潜在风险。

3. **多重签名需求**：
   - 多重签名（multisig）技术允许多个签名者共同管理一个比特币地址，提高了安全性。
   - 特别适用于企业账户、家庭共享账户和其他需要联合管理的情境。

### 具体的 BIP

1. **BIP 11**：
   - 标题：`M-of-N Standard Transactions`
   - 提案作者：Gavin Andresen
   - 提出时间：2012 年 3 月
   - 内容：描述了多重签名交易的标准格式，即 M 个签名中的 N 个签名验证通过即可执行交易。

2. **BIP 16**：
   - 标题：`Pay to Script Hash`
   - 提案作者：Gavin Andresen
   - 提出时间：2012 年 1 月
   - 内容：定义了支付到脚本哈希（P2SH）的机制，使得复杂的脚本可以更简洁地在链上表示，从而增强了多重签名的可用性。

### 时间线

1. **2011 年至 2012 年初**：
   - 多重签名的需求逐渐显现，社区开始讨论如何实现更安全的交易机制。

2. **2012 年 1 月**：
   - Gavin Andresen 提出 BIP 16，描述了 P2SH 的机制，为多重签名交易的简化提供了基础。

3. **2012 年 3 月**：
   - Gavin Andresen 提出 BIP 11，明确了 M-of-N 多重签名交易的标准格式，具体描述了如何在比特币脚本中实现多重签名验证。

4. **2012 年 5 月**：
   - 比特币客户端（Bitcoin Core）集成了 P2SH 和多重签名功能，`OP_CHECKMULTISIG` 操作码开始被正式使用。

### 关键人物

1. **Gavin Andresen**：
   - 比特币基金会的首席科学家，最早提出并推动了 P2SH 和多重签名交易的标准化。
   - 他是 BIP 11 和 BIP 16 的主要作者，对 `OP_CHECKMULTISIG` 的引入和实施起到了关键作用。

2. **比特币开发社区**：
   - 包括许多开发者和贡献者，他们共同讨论、审查和改进了多重签名机制。
   - 社区的参与和支持确保了这些改进提案的顺利实施和推广。

### 工作原理

`OP_CHECKMULTISIG` 的基本原理是检查一组公钥和签名，确认至少有 M 个签名是有效的。具体来说，这个操作码会验证堆栈上的公钥和签名，并确保至少有 M 个签名与对应的公钥匹配。

### 操作步骤

1. **堆栈输入**：
    - 签名数量（N）
    - N 个签名
    - 公钥数量（M）
    - M 个公钥

2. **执行过程**：
    - 从堆栈中弹出签名数量（N）。
    - 弹出 N 个签名并存储。
    - 弹出公钥数量（M）。
    - 弹出 M 个公钥并存储。
    - 验证至少有 M 个签名能匹配对应的公钥。
    - 如果验证成功，脚本继续执行；否则，脚本失败。

### 示例脚本

假设我们有三个公钥，需要至少两个签名来验证交易，脚本如下：

```
2 <PubKey1> <PubKey2> <PubKey3> 3 OP_CHECKMULTISIG
```

在这个脚本中：
- `2` 表示需要两个有效签名。
- `<PubKey1> <PubKey2> <PubKey3>` 是三个公钥。
- `3` 表示总共有三个公钥。
- `OP_CHECKMULTISIG` 执行多重签名验证。

### 例子详解

假设 Alice、Bob 和 Charlie 共同管理一个地址，任何交易需要至少两人签名。我们生成一个多重签名地址，并创建一个 P2SH（Pay to Script Hash）交易。

1. **创建多重签名地址**：

   ```
   2 <AlicePubKey> <BobPubKey> <CharliePubKey> 3 OP_CHECKMULTISIG
   ```

2. **生成 P2SH 地址**：
   将上述脚本的哈希作为地址，这样可以简化交易脚本并提高安全性。

3. **花费多重签名地址中的资金**：
   - Alice 和 Bob 签名交易。
   - 将签名和原始脚本放入输入脚本中：

   ```
   0 <AliceSignature> <BobSignature> 2 <AlicePubKey> <BobPubKey> <CharliePubKey> 3 OP_CHECKMULTISIG
   ```

### 注意事项

- **漏洞**：早期版本的 `OP_CHECKMULTISIG` 有一个“off-by-one”漏洞，要求在签名数量前添加一个额外的 `OP_0`。
- **效率**：验证签名和公钥需要计算资源，在高频交易场景中需要考虑其效率。

## 链上交易
### P2SH-P2MS
链上交易：https://mempool.space/zh/tx/45f862a3c72b659406c38f606e2bcc73145241c3bf5c42ded4d4737af8d401ad
```js
// ScriptSig
<empty>
OP_0
OP_PUSHBYTES_71 3044022018a750079fc75b68f5208f86b146821d5f3acb41f68195f8b4cbf1012cba2cbb02200c3ddd0dc271342f62222603356dd7c713cf387718e57ec2644f7811295d03ea01
OP_PUSHBYTES_72 30450221009a5914969675238ddfb9c1475d2888b3a5a507c6d13c35ac13a6f97a5c3dec97022055587f56408ba7abdc48d637d3eb03a3c29f05d7c22df9a20fd4bea739a00b2601
OP_PUSHDATA1 52210231d0ed51696dff4a25015f2a8330d07b81761eda22cae558da1086b5d084e1922102e142c9123d48ce4c0b32403b19403e41129f1d37de852d9bbc95165af6960e3b2102207620c770dc24eb02edc6fba51b70fd0c04a2772842d808188b835a8f73832853ae

// P2SH redeem script
OP_PUSHNUM_2
OP_PUSHBYTES_33 0231d0ed51696dff4a25015f2a8330d07b81761eda22cae558da1086b5d084e192
OP_PUSHBYTES_33 02e142c9123d48ce4c0b32403b19403e41129f1d37de852d9bbc95165af6960e3b
OP_PUSHBYTES_33 02207620c770dc24eb02edc6fba51b70fd0c04a2772842d808188b835a8f738328
OP_PUSHNUM_3
OP_CHECKMULTISIG
```

### P2WSH-P2MS
链上交易：https://mempool.space/zh/tx/a085e629f5932e729f54f174c936f015a10bb7935db66d5803e81dbff0ee15cc
```js
// Witness
<empty>
304402204f63983ae7cdb18fc3b75d4acc8e74d35816d4a8660d4296da4c0f6a0206fdd90220347e8317c686aa3785905eb1ff1cf32c4ce7ef019678fdd9ad00cfceedd74c2e01
30440220055d4a41afa73ef449b18add7748b054eec768a8350c5095b4f622546eb55a3f022073cea484b99331cc8ae1ebf6b1698d07b560ad01ee63e3a4a739684a0408aec601
52210279d1f38c1c80d47cb00ddbbe2915a60d5706e1ef66056a169150f083b288eb952102cb7d02b654f8616bfc5ab017b7a3ec9092e466381af0f552b7efcd8d920453672103c96d495bfdd5ba4145e3e046fee45e84a8a48ad05bd8dbb395c011a32cf9f88053ae

// P2WSH witness script
OP_PUSHNUM_2
OP_PUSHBYTES_33 0279d1f38c1c80d47cb00ddbbe2915a60d5706e1ef66056a169150f083b288eb95
OP_PUSHBYTES_33 02cb7d02b654f8616bfc5ab017b7a3ec9092e466381af0f552b7efcd8d92045367
OP_PUSHBYTES_33 03c96d495bfdd5ba4145e3e046fee45e84a8a48ad05bd8dbb395c011a32cf9f880
OP_PUSHNUM_3
OP_CHECKMULTISIG
```

### P2TR-P2MS

## 代码示例

完整的示例可以在[bitcoinjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib/)里找到，这里逐步拆解分析。

### P2SH-P2MS

示例代码参考[bitcoinjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/transactions.spec.ts#L204-L250)。


1. **构建锁定脚本**：
  以上面的示例脚本为例：

  ```javascript
  2 <AlicePubKey> <BobPubKey> <CharliePubKey> 3 OP_CHECKMULTISIG

  const output = bscript.compile(
    ([] as Stack).concat(
      OP_INT_BASE + a.m,
      a.pubkeys,
      OP_INT_BASE + o.n,
      OPS.OP_CHECKMULTISIG,
    )
  );

  // 其中
  m = 2;
  pubkeys = [<AlicePubKey>, <BobPubKey>, <CharliePubKey>];
  n = 3;
  ```

2. **签名过程**：

  ```javascript
  const multisig = createPayment('p2sh-p2ms(2 of 4)');
  const inputData1 = await getInputData(2e4, multisig.payment, false, 'p2sh');

  const psbt = new bitcoin.Psbt({ network: regtest })
    .addInput(inputData1)
    .addOutput({
      address: regtestUtils.RANDOM_ADDRESS,
      value: 1e4,
    })
    .signInput(0, multisig.keys[0])
    .signInput(0, multisig.keys[2]);
  ```

  签名之后会得到签名信息，多签对应多个元素的签名数组：

  ```javascript
  const partialSig = [
    {
      pubkey: AlicePubKey,
      signature: bscript.signature.encode(Alice.sign(hash), sighashType),
    },
    {
      pubkey: BobPubKey,
      signature: bscript.signature.encode(Bob.sign(hash), sighashType),
    },
  ];
  ```

3. **排序签名**：

  ```javascript
  function getSortedSigs(script: Buffer, partialSig: PartialSig[]): Buffer[] {
    const p2ms = payments.p2ms({ output: script });
    // for each pubkey in order of p2ms script
    return p2ms
      .pubkeys!.map(pk => {
        // filter partialSig array by pubkey being equal
        return (
          partialSig.filter(ps => {
            return ps.pubkey.equals(pk);
          })[0] || {}
        ).signature;
        // Any pubkey without a match will return undefined
        // this last filter removes all the undefined items in the array.
      })
      .filter(v => !!v);
  }
  ```

4. **构建解锁脚本**：

  ```javascript
  bscript.compile(([OPS.OP_0] as Stack).concat(a.signatures))
  ```

  