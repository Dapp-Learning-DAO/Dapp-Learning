# BTC地址

在比特币系统中，随着技术的发展和用户需求的变化，钱包现在支持多种不同类型的地址格式，每种格式都对应不同的技术标准和特点。这些地址格式包括传统的P2PKH（以1开头），P2SH（以3开头），以及更加现代的SegWit地址（通常以bc1q或bc1p开头）。进行交易时，我们需要为收款者创建一个交易输出，这个输出指定了收款方的地址和交易的金额。

# BTC地址到交易完成

下面以P2PKH（Pay-to-Public-Key-Hash）为例介绍从比特币收款地址到交易构建的详细步骤：

1. 收款地址的获取和格式
   收款方提供一个P2PKH类型的比特币地址，这种地址通常以数字1开始，例如 1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2。这个地址是经过编码的，通常使用Base58Check编码，其中包含了收款方的公钥哈希（public key hash）。

2. Base58Check解码
   当付款方接收到一个比特币地址后，他们会使用Base58Check解码来提取地址中的公钥哈希。Base58Check编码不仅帮助减少字符混淆（移除了容易混淆的字符如0（零）、O（大写字母O）、I（大写字母i）和l（小写字母L）），还内嵌了一个错误检测机制。

3. 构建锁定脚本（ScriptPubKey）
   解码过程提取出的公钥哈希接着用来构建一个所谓的锁定脚本（ScriptPubKey），这个脚本是交易输出的一部分。对于P2PKH地址，锁定脚本的格式通常如下：

```js
OP_DUP OP_HASH160 <Public Key Hash> OP_EQUALVERIFY OP_CHECKSIG
```

4. 构建交易
   付款方将锁定脚本放置在新的交易输出中，并指定转账金额。这个输出现在会被添加到新的交易中。除此之外，交易还需要包含至少一个输入（来自付款方的一个或多个以前的交易输出），这些输入提供了足够的资金来覆盖转账金额和网络矿工费。

5. 签名和广播交易
   一旦交易构建完毕，付款方需要用他们的私钥对交易进行签名，证明他们有权使用指定的输入资金。完成签名后，交易将被广播到比特币网络，网络的矿工们开始验证这个交易的合法性，如果合法，最终将其加入到区块链中，完成资金的转移。

# 常见支付方式

| 支付方式 | 全称                    | 地址前缀 | 脚本类型 | 主要特点                                        | 示例地址      |
|----------|-------------------------|----------|----------|-------------------------------------------------|---------------|
| [P2PKH](./P2PKH.md)    | Pay-to-Public-Key-Hash  | 1        | P2PKH    | 最常用，公钥哈希方式，隐私性好，地址以 "1" 开头 | 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa |
| [P2SH](./P2SH-P2PKH.md)     | Pay-to-Script-Hash      | 3        | P2SH    | 支付到脚本的哈希值，支持复杂的脚本，地址以 "3" 开头 | 3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy |
| [P2WPKH](./P2WPKH.md)   | Pay-to-Witness-Public-Key-Hash | bc1q    | P2WPKH  | 使用隔离见证（SegWit），更低交易费用，地址以 "bc1q" 开头 | bc1qar0srrr7xf6h4g1ks7zft6wz7x4n7pkjkcn6lq |
| P2WSH    | Pay-to-Witness-Script-Hash   | bc1q    | P2WSH   | 使用隔离见证，支持复杂脚本，地址以 "bc1q" 开头 | bc1qrp33g0q0s6fphxtww9g4ndzsd74ny3rps6m74dxg7mjsg5c0z9rhdj |
| [P2TR](./P2TR.md)     | Pay-to-Taproot          | bc1p    | P2TR    | 使用 Taproot 功能，优化脚本执行和隐私，地址以 "bc1p" 开头 | bc1p4gr63h6fp9hrkwpf4sjwx4s34a5w6b6ptfhl5k7vph3ykq6s5h7gx5m |


