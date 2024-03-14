# Bitcoin

> **CRYPTO IS HARD, DO NOT TRUST ANYONE, VERIFY YOURSELF !!!**

(prodromes)=
## Prodromes

正如开头引用的那句话，加密货币里面涉及到的知识太多了，而且经过十多年的发展，
所需要学习的知识也很多，不过，随着慢慢的接触，渐渐发现其最底层的原理和基础
是大同小异的。因此，为了深入研究，需要从加密货币的鼻祖进行研究。

同时因为大部分人接触 bitcoin 只是了解了一下其工作机制，大部分人还是只炒币，
并没有深入去解析 bitcoin 的具体实现和代码，加之区块链目前越来越火，技术和
资料也日新月异，bitcoin的资料其实都比较老了（相对区块链来说），所以在这里
记录下我的一些学习记录。

本文只是个人对于 bitcoin 的理解，对于加密算法的具体原理和实现，个人暂时还
没有研究到那个地步，只能说有时间在慢慢去看文章读博客去理解。毕竟我也只接触
crypto 不到一年的时间。如果其中有任何错误的话，可以尽情指正。大家都只是海边
捡贝壳的小孩而已。

> P.S. 本文只是技术分析介绍，对于投资理财不做任何推荐担保。投资有风险，
> 入市需谨慎，对于市场和生活要常怀敬畏之心。

## Keys, Addresses, Wallets

在 crypto 中，有了 private key，才能打开 crypto 的大
门。所以对于自己的 private key，一定不要大意，失去了这
个 key，就会被 crypo 拒之门外。这里推荐看一下
[区块链黑暗深林自救手册](https://github.com/slowmist/Blockchain-dark-forest-selfguard-handbook)。
不求完全理解或者按照其中的每一个步骤去做，但是在 crypto
这种新兴的产业中，你心中需要有这么一根弦。不要觉得安全事小，
或者觉得资产比较小，没人会在意，但是有“积少成多”这么一个
说法，所以，涉及到自己的财产，收起内心的傲慢。正如
《三体》中所说的：“弱小和无知不是生存的障碍，傲慢才是。”

那么，接下来就开始进入 bitcoin 的世界，开始了解在 bitcoin
中私钥和公钥以及钱包地址的生成吧。

### Keys / Addresses

首先， bitcoin 或者说整个 crypto 中，账号的生成使用的加密算法都
是一致的，使用的都是[椭圆曲线加密](https://en.wikipedia.org/wiki/Elliptic-curve_cryptography)
。确切到 bitcoin 就是使用了 C 语言优化过的 secp256k1 库。因为
密码学涉及的知识点较多，同时也比较复杂，个人还没完全搞明白，所以就
不再这里献丑，感兴趣的可以自行拓展阅读。反正这些加密算法的特点就是
无法逆向运算，即不同通过公钥来反推出私钥，而且碰撞域小，基本上是
公钥与私钥一一对应的，确保了每个地址的唯一性。虽然说从理论上来计算
可以计算出具有相同公钥的私钥，但是以目前的计算水品，需要的时间太久，
所以可以忽略不计。

> 注：最近看文章有看到 ECDSA 被人破了，然后又出现了改进版的 EdDSA。
> 文章链接为：https://medium.com/asecuritysite-when-bob-met-alice/whats-the-difference-between-ecdsa-and-eddsa-e3a16ee0c966

刚开始玩 bitcoin 时，尤其是从 Ethereum 转过来时，会有一点比较不好
接受的，就是 bitcoin 中通用的是其钱包地址，而 Ethereum 的直接是
公钥。下面来介绍下 bitcoin 中公钥、私钥以及地址之间的关系。

这三者的关系如下：

Private Key - Elliptic Curve Multiplication -> Public Key
Public Key - Hashing Function -> Address

Private Key 通过椭圆曲线加密得到 Public Key，然后 Public Key
通过 Hashing Function 得到地址。因为这些加密算法都是单向不可逆，
且碰撞域很小，所以不需要保存 Public Key，都可以通过 Private Key
直接计算出来。

那么 Private Key 又是什么呢？其实就是一个随机数，这个随机数的大小
是 256 位，即 Private Key 的范围是 (0, 2^256)。这里的随机数不能
使用一些伪随机数生成器生成，这样很容易被人破解，因为椭圆曲线原本是有
两个变量，无法直接求解，如果随机数是个确定的值，那么就能直接通过公
式将另一个变量求解出来，从而将你的公私钥给破解。Sony 的 PS3 就是因为
用于签名的随机数是固定的，结果被人给破解了。具体的可以参考知乎文章：
[一文读懂 ECDSSA 算法如何保护数据](https://zhuanlan.zhihu.com/p/97953640)

那为什么 bitcoin 不直接使用公钥呢？很简单，因为公钥中会包含 0 O l 1
这些容易混淆的字符，有时很难将其区分，而转账时地址一旦输错，是不能追回
的，同时也为了将公钥的更多一些。所以就需要将公钥，确切的说是公钥的 hash
值进行 [Base58Check](https://en.bitcoin.it/wiki/Base58Check_encoding)
编码。这个编码是可以解码的，即可以通过地址算出公钥的哈希值，所以在 tx 中
的 pubkey script 是发送方通过接收方的地址算出其 pubkey hash，然后
放到 pubkey script 中。

以下是 bitcoin 从私钥到地址的详细步骤：

0 - 生成个随机数的 ECDSA 值
```
18e14a7b6a307f426a94f8114701e7c8e774e7f9a47e2c2035db29a206321725
```
1 - 将上面生成的 ECDSA 值使用 ECC 加密生成公钥
```
0250863ad64a87ae8a2fe83c1af1a8403cb53f53e486d8511dad8a04887e5b2352
```
2 - 对公钥使用 SHA-256 进行 hash，得到一个哈希值
```
0b7c28c9b7290c98d7438e70b3d3f7c848fbd7d1dc194ff83f4f7cc9b1378e98
```
3 - 对上面的 SHA-256 的哈希值 使用 RIPEMD-160 进行 hash，得到另一个哈希值
```
f54a5851e9372b87810a8e60cdd2e7cfd80b6e31
```
4 - 在上面的哈希值前添加一个版本的字段（一个字节），其中 0x00 表示主网
```
00f54a5851e9372b87810a8e60cdd2e7cfd80b6e31
```

到这一步其实基本已经完成了需要信息的生成，但是还需要对公钥的哈希进行编码，下面
就是对这个哈希值的 Bass58Check 的编码

5 - 对第 4 步中所得到的结果使用 SHA-256 进行 hash，得到一个哈希值
```
ad3c854da227c7e99c4abfad4ea41d71311160df2e415e713318c70d67c6b41c
```
6 - 对上一步的哈希值在进行一次 SHA-256 的 hash，得到另一个哈希值
```
c7f18fe8fcbed6396741e58ad259b5cb16b7fd7f041904147ba1dcffabf747fd
```
7 - 取上一步结果的前四个字节，作为地址的校验码（checksum）
```
c7f18fe8
```
8 - 将上一步得到的 checksum 追加到第 4 步的结果的末尾
```
00 f54a5851e9372b87810a8e60cdd2e7cfd80b6e31 c7f18fe8
```
这里我故意将三个不同的字段用空格分隔开来，实际情况中是没有空格的。

9 - 将上一步的结果使用 Base58Check 编码成一个 base58 格式的字符串，就得到地址了
```
1PMycacnJaSqwwJqjawXBErnLsZ7RkXUAs
```

从地址到 pubkey hash 就是上面第 8 步到第 9 步的逆操作，通过 Base58Check
对地址进行解码，然后去掉解码后字符串的前面一个字节和末尾的四个字节，就得到了
其 pubkey hash。

下面表格是不同版本对应的值（第四步中的版本字段），以及 Base58Check 编码的结果：

| Type                                      | Version prefix (hex) | Base58 result prefix |
| :---------------------------------------: | :------------------: | :------------------: |
| Bitcoin Address                           | 0x00                 | 1                    |
| Pay-to-Script-Hash Address                | 0x05                 | 3                    |
| Bech32 pubkey hash or script hash         | N/A                  | bc1                  |
| Bech32 testnet pubkey hash or script hash | N/A                  | tb1                  |
| Bitcoin Testnet Address                   | 0x6F                 | m or n               |
| Private Key WIF                           | 0x80                 | 5, K, or L           |
| BIP-38 Encrypted Private Key              | 0x0142               | 6P                   |
| BIP-32 Extended Public Key                | 0x0488B21E           | xpub                 |

所以，别人给你看他的账号时，注意看其钱包地址的前缀，不要被骗了，因为有测试网能
够手动生成区块，这个在下面 Transaction 一节中的**实例**中会演示。好像上面又
翻车了， version prefix 新的 BIP 不止一个字节，不过这些都是更新过来的，
基本的原理没差的。

Okay，到这里其实就可以自己去写代码来生成 bitcoin 的地址了。

上面的表格只显示了一些用的通用的地址格式，具体详细的参考 [List of address prefixes][address-prefix]。
这里在补充一下几个通用的地址的区别：

* 1：比较老的地址格式，对应的 tx 中的 script 使用的是 p2pkh，
  因为这个类型的 tx 的 script 比较大，即 tx 比较大，所以对应
  的 tx fee 也会比较高一点。
* 3：使用最广泛的，相比于 **1**，支持的功能也多一点，而且这类
  地址也常使用多签（multisig），同时也可以使用 segwit 格式
  的 tx 中。即这个地址即可以发 p2pkh 的 tx，也可以发 segwit
  的 tx。
* bc1：Bech32，即对应的 tx 中的 script 使用的是 p2wpkh，即
  segwit，目前最新的格式，主要是减小了 tx 的大小，降低了 tx
  fee。但正是因为比较新，所以支持的钱包并不是很多，用户量也不
  多，目前正在增长中。

还要补充一点就是，segwit 有 native segwit 和 non-native
segwit 之分。其实两者的差别很简单，native segwit 就是纯粹
的 segwit 协议，而 non-native segwit 就是地址使用的是
Bech32 格式的地址，但是 tx 中的 script 是嵌套了 segwit
的 p2sh（aka. p2wpkh-in-p2sh）。总的来说 segwit 是未来
的趋势，即最后的 tx 都将更新到 native segwit 的协议，而
non-native segwit 是为了兼容老协议的一个中间过渡版本。

> 至于 segwit 的地址格式为什么叫 Bech32，原因是因为它的
> 编码算法是 [Bech32][bech32]（[BIP-0173][bip-0173]
> 里给出的）

至于 BIP32/BIP38，是关于通过同一个 seed 派生出多个钱包地址
的一个标准。

[bech32]: https://en.bitcoin.it/wiki/Bech32
[bip-0173]: https://en.bitcoin.it/wiki/BIP_0173
[address-prefix]: https://en.bitcoin.it/wiki/List_of_address_prefixes

### Wallets

相比于 Ethereum，bitcoin 的钱包稍微特殊一点，因为有些钱包是需
要同步节点的，不过这个也没办法，毕竟他没有余额这一概念，每次查询
余额都是去计算一下该账号的 vin 和 vout。

钱包的种类也比较多，这个只能说是分类方式不同，这里就做个简短的介绍。

如果按其功能来说，有三种：

* Full-Service Wallets
* Signing-Only Wallets
* Distributing-Only wallets

这个分类就是字面意思，通俗易懂，没啥好介绍的。Distributing-Only
是只在网上分发pubkey（其实是pubkey hash 的 Base58 地址）。

按是否联网，可以分为两种：

* Online Wallets
* Offline Wallets

按钱包的构成又分为:

* Software Wallets
* Hardware Wallets

其中 Hardware Wallets 大部分是 Signin-Only Wallets。

如果玩的比较多的话，那么就一定会接触到 WIF，Wallet Import
Format 的缩写，就是为了降低复制私钥出错的可能，就有了 WIF，
WIF 也是用 Base58Check 对私钥进行编码。和 Keys / Address
中编码 pubkey hash 的步骤一致，就是 version prefix 不同
而已，具体对应关系都在上节中末尾的表格中写明了。

## Transaction

Transaction，通常缩写成 tx，本文之后统一使用 tx 表示 transaction。
那么什么是 tx 呢？其实 tx 在金融或者跟确切点来说 —— 银行中用的最多，
因为 tx 的字面意思就是交易记录。而 bitcoin 作为分布式的账本，其记录
的就是 tx。所以了解 tx 或者说看懂 tx 是一个懂行的 crypto 的必备知识，
毕竟要想确认自己的转账是否成功，最可靠的办法就是去浏览器（区块链的浏览器）
上查看对应的 tx。而对于技术来说，不但要看懂 tx，还要知道 tx 是怎么构造
的，即根据自己的需求定制一个 tx。

### UTXO

在讲 tx 之前，首先要介绍一下 bitcoin 记账的独特机制，一般的银行账户来说，会
有一个账户余额的概念，而对于 bitcoin 来说，根本就没有账户余额这一说，而是采用
一种简单的记账机制，即 Unspent Transaction Output（UTXO）。对于每个 tx
来说，都至少要有一个 Input 和 一个 Output，而每个 Input 是来自上一个 Output，
每个 Output 都等待着下一个 Input 来消费，而这些 Output 就叫做 UTXO。例如，
你有 1 btc（10^8 satoshi），那么就意味着你在等待一个或多个 UTXO。那么最初的
UTXO 来自那里呢？当然是矿工了，因为每当矿工挖到了一个 block，就会被奖励对应的
btc，而这些奖励是矿工的 Input，这也就变成了矿工们的 UTXOs 了。

### Transaction Struct

介绍了 UTXO，那么就直接介绍一下 tx 的具体的结构。

每个 tx 有六部分组成：

* `version`：4 个字节（uint32_t），表示当前的版本，数字越大，版本越新，当前都
  是 1 或 2，2 表示该 tx 符合 [BIP-68](https://github.com/bitcoin/bips/blob/master/bip-0068.mediawiki#specification)。
* `tx_in count`：可变大小（uint），表示当前 tx 中包含的 input 个数，即下面
  `tx_in` 数组中 txid 的个数。
* `tx_in`：tx 的输入，数组，具体介绍见 {ref}`tx-input`
* `tx_out count`：可变大小（uint)，表示当前 tx 中包含的 output 个数，即
  下面 `tx_out` 数组中元素的个数
* `tx_out`：tx 的输出，数组，具体介绍见 {ref}`tx-output`
* `lock_time`：UTXO 的锁定时间或区块（uint_32_t），用来表示这个 tx 中的
  UTXO 多久或哪个区块后可以被消费（优先级没有 `tx_in` 中 `sequence` 的高）

### TxIn: A Transaction Input (Non-Coinbase)

* `previous_output`：36 字节，上一个 UTXO，或者说是之前的 `tx_out` 中的一个
  元素，又被称为 `outpoint`，其结构见下一节 Outpoint。
* `script bytes`：签名脚本的大小（即签名脚本是多少个字节）
* `signature script`：char[]，满足 `outpoint` 中的公钥脚本（`pb_script`）
* `sequence`：4 字节，默认为 `0xffffffff`，这个值是用来禁用 `locktime`，
  如果需要启用 `locktime`，但因为目前 `sequence` 并没有什么用途，所以启用
  `locktime` 需要将 `sequence` 设为 `0`，即 `0x00000000`。对于 `locktime`
  启用时的解析如下：
  - 如果 `< 500,000,000`，则 `blocktime` 被解析为 block height，即多少个
    区块后这个 utxo 才能被使用。
  - 如果 `>= 500,000,000`，则被解析为 Unix epoch time[^unix-epoch-time]，
    即锁定到某个确切的时间节点，改时间节点后这个 utxo 才能被使用。

[^unix-epoch-time]: 从1970-01-01T00:00UTC距离现在多少秒，计算机计算时间的方法。

### Outpoint

* `hash`：32 字节，char[32]，包含本次 input 所花费的 utxo 的 tx 的哈希值，
  这个哈希值是正常得到哈希值相反的字节序（小端对齐，little-endian）
* `index`：4 字节，uint32_t，所需要话费的 utxo 在 tx 中位置，即 utxo 在
  `vout`/`tx_out` 数组中的索引/位置。

### TxOut: A Transaction Output

* `value`：8 字节，int64_t，允许其他人花费的 satoshi，这里的 satoshi 总量
  不能超过 input 中的总量
* `pk_script bytes`：uint，`pk_script` 的大小，`pk_script` 最多不能超过
  10,000 字节，即 `pk_script bytes` 最大为 14 位，2 字节。
* `pk_script`：定义这个 utxo 是谁可以用的，只有这个脚本执行成功的人才能使用
  这个 utxo，通俗点就是转给谁的。

### 实例

Talk is cheap，所以下面是一个 pay-to-pubkey-hash[^scripts] 的 tx：

[^scripts]: 比特币有几种脚本语言，这个不是最新的，是比较老的，但也还有在用。

```
01000000 ................................... Version

01 ......................................... Number of inputs
|
| 7b1eabe0209b1fe794124575ef807057
| c77ada2138ae4fa8d6c4de0398a14f3f ......... Outpoint TXID
| 00000000 ................................. Outpoint index number
|
| 49 ....................................... Bytes in sig. script: 73
| | 48 ..................................... Push 72 bytes as data
| | | 30450221008949f0cb400094ad2b5eb3
| | | 99d59d01c14d73d8fe6e96df1a7150de
| | | b388ab8935022079656090d7f6bac4c9
| | | a94e0aad311a4268e082a725f8aeae05
| | | 73fb12ff866a5f01 ..................... [Secp256k1][secp256k1] signature
|
| ffffffff ................................. Sequence number: UINT32_MAX

01 ......................................... Number of outputs
| f0ca052a01000000 ......................... Satoshis (49.99990000 BTC)
|
| 19 ....................................... Bytes in pubkey script: 25
| | 76 ..................................... OP_DUP
| | a9 ..................................... OP_HASH160
| | 14 ..................................... Push 20 bytes as data
| | | cbc20a7664f2f69e5355aa427045bc15
| | | e7c6c772 ............................. PubKey hash
| | 88 ..................................... OP_EQUALVERIFY
| | ac ..................................... OP_CHECKSIG

00000000 ................................... locktime: 0 (a block height)
```

这是官方提供的转账金额为 49.9999000 BTC 的 tx。

下面让我们使用本地的测试网来自己手动发起一个 tx，然后看看这个 tx 的数据。
首先，在自己的 pc 或服务器上安装好 bitcoin 的 node，具体操作步骤，参考
[bitcoin-on-pi][btc-on-pi]。安装好后，先创建三个钱包，一个是矿工的钱包，另外
两个分别是 Alice 和 Bob[^cryptocouple] （加密学中通用的 Alice 和 Bob）。

[btc-on-pi]: https://oneforalone.github.io/raspberry/bitcoin-on-pi.html
[^cryptocouple]: http://cryptocouple.com/

注：这里在配置文件需要在 `bitcoin.conf` 中添加 `txindex=1` 这个配置，
然后重启 bitcoind，不然 `getrawtransaction` 命令用不了[^txindex]。

[^txindex]: https://bitcoin.stackexchange.com/questions/90608/cant-get-the-tx-with-gettransaction-or-getrawtransaction-methods

```bash
$ bitcoin-cli -named createwallet wallet_name="miner" \
    avoid_reuse=true load_on_startup=true

$ bitcoin-cli -named createwallet wallet_name="alice" \
    avoid_reuse=true load_on_startup=true

$ bitcoin-cli -named createwallet wallet_name="bob" \
    avoid_reuse=true load_on_startup=true

```

然后分别在钱包中创建一个新地址：

```bash
$ bitcoin-cli -rpcwallet=miner getnewaddress
bcrt1q6xhr6gpxvlnv2n2gjhu03psa20w9rschxktjfv
$ bitcoin-cli -rpcwallet=alice getnewaddress
bcrt1qxwv2hwwh7dsyrxdu4g86vwysexnq87c3mmnw0f
$ bitcoin-cli -rpcwallet=bob getnewaddress
bcrt1q94rqgutjhjhtct6n3l6evpgccrn0mjt9v7qn5h
```

生成地址后挖 101 个块给 miner，这个 101 是有讲究的，因为 bitcoin
miner 挖出来的块需要 100 个区块确认后才可以消费，不然 miner 的
balance 不会改变，依旧为 0。如果你想给 miner 中多放点钱，那就多
挖一些，反正不能少于 101，就是因为这个困扰了我好几天。

```bash
$ bitcoin-cli generatetoaddress 101 bcrt1q6xhr6gpxvlnv2n2gjhu03psa20w9rschxktjfv
# check the balance of the miner wallet
$ bitcoin-cli -rpcwallet=miner getbalance
50.00000000
# transfer 25 btc to alice from miner
$ bitcoin-cli -rpcwallet=miner -named sendtoaddress \
    address=bcrt1qxwv2hwwh7dsyrxdu4g86vwysexnq87c3mmnw0f \
    amount=25 fee_rate=100
87546021539c56063eeb30e5e28e041f55aeaaee04c6f53f881e88192aaf753d # transaction hash/txid
# generate a block to confirm a tx
$ bitcoin-cli generatetoaddress 1 bcrt1q6xhr6gpxvlnv2n2gjhu03psa20w9rschxktjfv
[
  "4731e661205d634c327380ae5d9de9f52da05d236e1985ea9c079694ed488c3a"
]
$ bitcoin-cli -rpcwallet=alice getbalance
25.00000000
# transfer 10 btc to bob from alice
$ bitcoin-cli -rpcwallet=alice -named sendtoaddress \
    address=bcrt1q94rqgutjhjhtct6n3l6evpgccrn0mjt9v7qn5h \
    amount=10 fee_rate=100
c47bc10dc069bbd2bb669b3bb954564cc75c5c0f184dba896bde33415ee7e359
# generate a block again to confirm the tx
$ bitcoin-cli generatetoaddress 1 bcrt1q6xhr6gpxvlnv2n2gjhu03psa20w9rschxktjfv
[
  "0216b94f03c4d37dd07ca356afecee74e488f13f24b6af7e5badec095ae8e6fd"
]
# check the balance to verify the tx
$ bitcoin-cli -rpcwallet=bob getbalance
10.00000000
```

通过以上步骤，miner 向 alice 转了 25 btc，然后 alice 像 bob 转了 10 btc。
那么现在来看下 alice 转给 bob 的那条 tx，
`c47bc10dc069bbd2bb669b3bb954564cc75c5c0f184dba896bde33415ee7e359`：

```bash
$ bitcoin-cli getrawtransaction c47bc10dc069bbd2bb669b3bb954564cc75c5c0f184dba896bde33415ee7e359
020000000001013d75af2a19881e883ff5c604eeaaae551f048ee2e530eb3e06569c53216054870100000000fdffffff0200ca9a3b000000001600142d46047172bcaebc2f538ff5960518c0e6fdc965ecf76759000000001600148eede2516b0ff9e902440a95225e39d6d98fad330247304402205faa35a19c56faa2c78f40bf84918ee53117e789c9bb27a37c8c36b0b70d713402205855358e1379e225742110fcdfed064b80e1443c1df3e8c7f77a1c12a3c97211012102ccc59184de0b0e5318308ca755b7af3eef3c62a41c1d802d3a0f1e92c87b529166000000
```

把这个 tx 用 `decoderawtransaction` 来解析一下这个 tx。

```
bitcoin-cli decoderawtransaction 020000000001013d75af2a19881e883ff5c604eeaaae551f048ee2e530eb3e06569c53216054870100000000fdffffff0200ca9a3b000000001600142d46047172bcaebc2f538ff5960518c0e6fdc965ecf76759000000001600148eede2516b0ff9e902440a95225e39d6d98fad330247304402205faa35a19c56faa2c78f40bf84918ee53117e789c9bb27a37c8c36b0b70d713402205855358e1379e225742110fcdfed064b80e1443c1df3e8c7f77a1c12a3c97211012102ccc59184de0b0e5318308ca755b7af3eef3c62a41c1d802d3a0f1e92c87b529166000000
{
  "txid": "c47bc10dc069bbd2bb669b3bb954564cc75c5c0f184dba896bde33415ee7e359",
  "hash": "b7311840269d702779a59014cf21afaaffa5cba8c7ef981d930136bc9e229110",
  "version": 2,
  "size": 222,
  "vsize": 141,
  "weight": 561,
  "locktime": 102,
  "vin": [
    {
      "txid": "87546021539c56063eeb30e5e28e041f55aeaaee04c6f53f881e88192aaf753d",
      "vout": 1,
      "scriptSig": {
        "asm": "",
        "hex": ""
      },
      "txinwitness": [
        "304402205faa35a19c56faa2c78f40bf84918ee53117e789c9bb27a37c8c36b0b70d713402205855358e1379e225742110fcdfed064b80e1443c1df3e8c7f77a1c12a3c9721101",
        "02ccc59184de0b0e5318308ca755b7af3eef3c62a41c1d802d3a0f1e92c87b5291"
      ],
      "sequence": 4294967293
    }
  ],
  "vout": [
    {
      "value": 10.00000000,
      "n": 0,
      "scriptPubKey": {
        "asm": "0 2d46047172bcaebc2f538ff5960518c0e6fdc965",
        "desc": "addr(bcrt1q94rqgutjhjhtct6n3l6evpgccrn0mjt9v7qn5h)#n8l7wa0p",
        "hex": "00142d46047172bcaebc2f538ff5960518c0e6fdc965",
        "address": "bcrt1q94rqgutjhjhtct6n3l6evpgccrn0mjt9v7qn5h",
        "type": "witness_v0_keyhash"
      }
    },
    {
      "value": 14.99985900,
      "n": 1,
      "scriptPubKey": {
        "asm": "0 8eede2516b0ff9e902440a95225e39d6d98fad33",
        "desc": "addr(bcrt1q3mk7y5ttplu7jqjyp22jyh3e6mvcltfncm3ptx)#thq7jlj5",
        "hex": "00148eede2516b0ff9e902440a95225e39d6d98fad33",
        "address": "bcrt1q3mk7y5ttplu7jqjyp22jyh3e6mvcltfncm3ptx",
        "type": "witness_v0_keyhash"
      }
    }
  ]
}
```

好吧，研究一个小时发现翻车了，这个 tx 是比较新的，使用的是 segwit
的脚本语言，这个下一节中会讲解。但是不管怎么样，最基础的没有变，也
就是要做个微调，总之今天就是要将这个 tx 解析出来，以下是解析的结果：

```
02000000 ................................... Version
00 ......................................... Marker, segwit format
01 ......................................... Flag, segwit format
01 ......................................... Number of Inputs: 1, tx_in counts
|
|                                            Txln/vin:
|                                            Outpoint:
| 3d75af2a19881e883ff5c604eeaaae55
| 1f048ee2e530eb3e06569c5321605487 ......... Oupoint TXID
| 01000000 ................................. Outpoint index number: 1
|
| 0 ........................................ Number of bytes in the signature script
| 0 ........................................ Signature Script
| fdffffff ................................. Sequence Number, 4294967293(0xfffffffd)
|
|                                            TxOut/vout

02 ......................................... Number of outputs: 2, tx_out counts
| 00ca9a3b00000000 ......................... Satoshis (10.00000000 BTC)
|
| 16 ....................................... Bytes in redeem script: 22
| | 00 ..................................... Nothing
| | 14 ..................................... Push 20 bytes as data
| | | 2d46047172bcaebc2f53
| | | 8ff5960518c0e6fdc965 ................. Redeem script, big-endian
|
| ecf7675900000000 ......................... Satoshis (14.99985900 BTC)
|
| 16 ....................................... Bytes in redeem script: 22
| | 00 ..................................... Nothing
| | 14 ..................................... Push 20 bytes as data
| | | 8eede2516b0ff9e90244
| | | 0a95225e39d6d98fad33 ................. Redeem Script, big-endian
|
|                                            Witness

02 ......................................... Number of witness: 2, size of witness
|
| 47 ....................................... Bytes in witness script: 71
| | 304402205faa35a19c56faa2c78f40bf
| | 84918ee53117e789c9bb27a37c8c36b0
| | b70d713402205855358e1379e2257421
| | 10fcdfed064b80e1443c1df3e8c7f77a
| | 1c12a3c9721101 ......................... SegWit, big-endian
|
| 21 ....................................... Bytes in witness script: 33
| | 02ccc59184de0b0e5318308ca755b7af
| | 3eef3c62a41c1d802d3a0f1e92c87b5291 ..... SegWit, big-endian

|                                            nLockTime
66000000 ................................... locktime:  102 (a block height)
```

就先到这里吧，这里提一下解析中的一个问题，就是明明接受者（bob），
只提供了其地址，那为什么发送者 alice 能够获取到 bob 的 pubkey
hash 呢？这里不要陷入误区，从 private key 到 public key，
再到 address 是不可逆的，但是 address 到 pubkey hash 是可逆的，
具体的流程在 Keys / Addresses 一节中.

### Optional: Coinbase Input

TxIn 是分两种，一种就是正常的转账，还有一种就是 utxo 的源头，
爆块的到的奖励，这个一般是矿工比较关注的。

Coinbase Input 的结构如下：

* hash：32 字节，char[32]，null，全为 0
* index：4 字节，uint32_t，0xffffffff
* script bytes：可变大小，uint，script 的大小，最大为 100
* height：最长 4 字节，script 中前多少个字节表示高度。
* coinbase script：最长 100 - 4 = 96 个字节，任意数据
* sequence：4 字节，uint32_t，sequence number

官方给给出的示例：

```
01000000 .............................. Version

01 .................................... Number of inputs
| 00000000000000000000000000000000
| 00000000000000000000000000000000 ...  Previous outpoint TXID
| ffffffff ............................ Previous outpoint index
|
| 29 .................................. Bytes in coinbase
| |
| | 03 ................................ Bytes in height
| | | 4e0105 .......................... Height: 328014
| |
| | 062f503253482f0472d35454085fffed
| | f2400000f90f54696d65202620486561
| | 6c74682021 ........................ Arbitrary data
| 00000000 ............................ Sequence

01 .................................... Output count
| 2c37449500000000 .................... Satoshis (25.04275756 BTC)
| 1976a914a09be8040cbf399926aeb1f4
| 70c37d1341f3b46588ac ................ P2PKH script
| 00000000 ............................ Locktime
```

## Scripting

bitcoin 中也有类似 ethereum 的合约语言，但是因为不支持循环，
不具备图灵完备，所以就不被看作是编程语言，但确实是可以使用 bitcoin
中的脚本语言创建合约的，但写 bitcoin 的合约有点像写汇编，汇编
的难度相信大家都是清楚的。但是 bitcoin 发展到现在，其脚本语言有
以下几种：

* Pay To Public Key Hash (P2PKH)
* Pay To Script Hash (P2SH)
* Multisig
* Pubkey
* Null Data

使用时要在 tx 的 vin 里面要有 Signature script, vout 里面
要有 p2pkh/p2sh/multisig/pubkey。vin 中的 Signature script
是证明上个 tx 中的 vout 是给你的，而 vout 里面的 script 是为了
指定谁可以使用。下面开始分别介绍。


### Pay To Public Key Hash (P2PKH)

P2PKH 在 bitcoin 中使用最广泛，是用来确认 utxo 是不是属于
你的。其格式为：

```
Pubkey script: OP_DUP OP_HASH160 <PubKeyHash> OP_EQUALVERIFY OP_CHECKSIG
Signature script: <sig> <pubkey>
```

具体是怎么验证的在下面的 P2PKH Script Validation 中讲解。

### Pay To Script Hash (P2SH)

P2SH 是为了改进 Pubkey script，因为 pubkey script 比较
复杂，而且也没有统一的标准，所以被 [BIP70](https://github.com/bitcoin/bips/blob/master/bip-0070.mediawiki)
弃用了。转而使用 P2SH。

P2SH 的机制是这样的：接收方需要用自己的公钥生成一个赎回脚本（Redeem
Script），然后再将这个赎回脚本的 hash 给发送方，发送方会在 tx
中的 output/vout 中插入这个 hash。如果接受方需要使用这个 utxo，
那么需要在他发送的 tx 的 input/vin 中提供他的 redeem script
和其 private key 对 redeem script 的签名。这个 redeem script
的 hash 和 pubkey hash 一样，同样可以编码成 Base58 的格式，
可以减小 script 的大小。

其格式为：

```
Pubkey script: OP_HASH160 <Hash 160(redeemScript)> OP_EQUAL
Signature script: <sig> [sig] [sig...] <redeemScript>
```

### P2PKH Script Validation

这里介绍一下 P2PKH 是怎么进行验证的，以下面的 pubkey script 和
signature script 为例。

假设 A 给 B 进行一笔转账，tx 中的 vout 的 pubkey script 为：

```
OP_DUP OP_HASH160 <PubkeyHash> OP_EQUALVERIFY OP_CHECKSIG
```

当 B 给 C 进行一笔转账是，tx 中的 vin 的 Signature script 为：

```
<Sig> <PubKey> OP_DUP OP_HASH160 <PubkeyHash> OP_EQUALVERIFY OP_CHECKSIG
```

其实 Signature Script 就是在 pubkey script 前面添加了签名和
公钥。

执行的是 Signature script，步骤如下：

1. 将签名 `<Sig>` 添加到一个空栈中，再将 `<Pubkey>` 压入这个栈
2. 执行 `OP_DUP`，将栈顶的元素复制一份然后压入栈中，这是这个栈的
   元素就有 `<Sig>`、`<Pubkey>`、`<Pubkey>`。
3. 执行 `OP_HASH160`，将栈顶的数据取出然后进行 hash，再将结果
   压入栈，即将 `<Pubkey>` 进行 hash，然后将得到的 hash 值压
   入栈。这是栈中的元素为：`<Sig>`、`<Pubkey>`、`<PubkeyHash>`
4. 将 `<PubkeyHash>` 压入栈，这个 pubkey hash 是 A 通过解码
   B 的钱包地址（Base58）得到的 B 的 pubkey hash。这时栈内的
   元素为：`<Sig>`、`<Pubkey>`、`<PubkeyHash>`、`<PubkeyHash>`
5. 执行 `OP_EQUALVERIFY`，等价于 `OP_EQUAL` + `OP_VERIFY`，
   `OP_EQUAL` 指令是将栈顶的两个元素取出，进行比较，然后将比较的
   结果压入栈顶，如果这两个元素相等，则将 1 压入栈，反之则将 0 压
   入栈。这部操作就是比较 B 所提供的 pubkey 计算出来的 hash 和
   通过其地址解码出来的 pubkey hash 是否相等。`OP_VERIFY` 是
   检查栈顶元素的值，如果为 0，则立即终止执行这条 tx，否则将栈顶
   元素（1）弹出。这部是检查上一步的结果，根据结果来决定 tx 是否
   继续执行。执行到这一步，这个栈内的元素：`<Sig>`、`<Pubkey>`
6. 执行 `OP_CHECKSIG`，检查 B 所提供的签名是否和已经验证过了的
   pubkey 的匹配，如果匹配的话，则将 true（1） 压入栈顶，否则
   将 false（0）压入栈顶。

最后就是去检查这个栈顶的元素值，如果为 false 的话就表明这个 tx 是
个无效的 tx，否则就是有效。这样就能有效的验证花费 utxo 的人是不是
真正的收款人。因为只有拥有 B 地址的私钥才能给出这些信息。

### Multisig

 p2pkh 的格式为：

```
Pubkey script: <m> <A pubkey> [B pubkey] [C pubkey...] <n> OP_CHECKMULTISIG
Signature script: OP_0 <A sig> [B sig] [C sig...]
```

其中 `m` 表示的是需要多少人的签名才是用时，`n` 是共有多少个
pubkey 可以参与签名。比如说总共有 3 个人，只要 2 个人签名
这个 utxo 就可以被花费，那么 `m` 就是 2，`n` 就是 3。

p2sh 的格式为：

```
Pubkey script: OP_HASH160 <Hash160(redeemScript)> OP_EQUAL
Redeem script: <OP_2> <A pubkey> <B pubkey> <C pubkey> <OP_3> OP_CHECKMULTISIG
Signature script: OP_0 <A sig> <C sig> <redeemScript>
```

### Pubkey

和 p2pkh 类似，但是没有 p2pkh 安全，所以被弃用了，其格式为：

```
Pubkey script: <pubkey> OP_CHECKSIG
Signature script: <sig>
```

### Null Data

格式为：

```
Pubkey Script: OP_RETURN <0 to 40 bytes of data>
(Null data scripts cannot be spent, so there's no signature script.)
```

null data 主要是可以将任意数据添加到链上，这些数据不会添加到 utxo
的数据库中，而是添加到链上。就相当于付点 tx fee，就可以将数据存在
bitcoin 的链上（目前来说太贵了，如果真要存数据为什么不用其他的链呢？）
所以总的来说也没什么用，估计设计时是想做存储吧。

### Pay to Witness Public Key Hash (P2WPKH)

SegWit，或者说 Segregated Witness，是个 2017 添加到 bitcoin
中的协议，用来提高 tx 的吞吐量。但这个并不是 bitcoin 的原创，而
是 Litecoin（Litecoin 一开始是 copy bitcoin 的源代码，只是
改了名字而已）实现的。

那么 SegWit 是怎么提高 tx 的吞吐的呢？segwit 是通过对 vin 进行
签名，然后替代 scriptSig，因为签名的数据可以做的比短，同时 segwit
script 是放到 vin 的外面，也就以为这 vin 中的每个元素都不需要
scriptSig，这样的话 vin 中可以存放更多的数据，从而达到减小 tx
的大小，这样同样大小的 block 就能容纳更多的 tx。

例如一个 P2PKH 是这样的：

```
DUP HASH160 <PubkeyHash> EQUALVERIFY CHECKSIG
```

而 P2WPKH 是这样的：

```
0 <PubkeyHash>
```

`0` 表示的是 segwit 的版本，这个版本值让后续的升级提供了可能。

同时 segwit 的校验算法的复杂度为 O(n)，而 hashing 的复杂度为
O(n^2)。与之相关的 BIP 有：

* [BIP-141][bip-141]：Segregated Witness 的定义
* [BIP-143][bip-143]：V0 版本中 tx 签名的校验
* [BIP-144][bip-144]：Witness 在网络中传输的格式
* [BIP-145][bip-145]：Segwit 的 getblocktemplate 更新（挖矿）
* [BIP-173][bip-173]：v0-16 版本的 witness 的 Base32 格式

[bip-141]: https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki
[bip-143]: https://github.com/bitcoin/bips/blob/master/bip-0143.mediawiki
[bip-144]: https://github.com/bitcoin/bips/blob/master/bip-0144.mediawiki
[bip-145]: https://github.com/bitcoin/bips/blob/master/bip-0145.mediawiki
[bip-173]: https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki

### P2TR
Taproot 是 Bitcoin 的一次大升级，在区块 709632 处（2021 年 11 月 12 日）被激活。Taproot Output 是版本为 1 的隔离见证 Output，这类 Output 称为 Pay-to-Taproot (P2TR)。
版本为 0 的隔离见证 Output 有两类（在 BIP141 中定义）：
- Pay-to-Witness-Public-Key-Hash (P2WPKH)
- Pay-to-Witness-Script-Hash (P2WSH)

两类版本为 0 的隔离见证 Output 其 scriptPubKey 字段是不同的（不同点参见表 1），所以我们很容易区分某个 Output 到底是 P2WPKH 还是 P2WSH。
版本为 1 隔离见证 Output（即 P2TR），统一了这两种形式，也就是说它们的 Output 的 scriptPubKey 字段是一样的，这样有更好的隐私。

如下为P2WPKH/P2WSH/P2TR 的 scriptPubKey 字段及花费它们时的 Witness 字段

| Type                | scriptPubKey                         | Witness                         |
|---------------------|--------------------------------------|---------------------------------|
| P2WPKH              | 0x0014{20-byte-key-hash}             | \<signature> \<pubkey>            |
| P2WSH               | 0x0020{32-byte-hash}                 | ......                          |
| P2TR (Key Path)     | 0x5120{32-byte-tweaked-public-key}   | <schnorr-signature>             |
| P2TR (Script Path)  | 0x5120{32-byte-tweaked-public-key}   | ...... \<script> \<control-block> |  

 
从表中可以看到创建一个 P2TR (Key Path) Output 时，要比创建 P2WPKH Output 要多占用更大的空间，因为 P2TR (Key Path) 的 scriptPubKey 直接含有 tweaked public key（32 字节），而 P2WPKH 则是公钥哈希（20 字节）。也就是说， 往 P2TR 转账比往 P2WPKH 地址转账要贵一点点。  
不过， 花费 P2TR (Key Path) 比花费 P2WPKH 要省更多的费用， 原因有二：花费 P2TR (Key Path) 的 Witness 中不再包含公钥了；P2TR (Key Path) 采用的 schnorr 签名比 P2WPKH 采用的 DER 格式的 ECDSA 签名要更小。  

综合考虑创建 Output 和花费 Output 两方面，P2TR (Key Path) 比 P2WPKH 更省费用，同时隐私性更好

## Block

讲完 tx 和 script，就可以好好讲一下 bitcoin 中的 block 了。

block 通常分两个部分，一个是 block header，另一个就是 txes。

block headers 六个字段：

* Version：4 字节，版本号
* Previous Block Hash： 32 字节，上一个区块的 hash
* Merkle Root：32 字节，区块中所有的 txes 的 hash
* Time： 4 字节，Unix epoch timestamp，挖块的时间
* Bits： 4 字节，这个字段就是 PoW 的难度，shortened version of the Target
* Nonce：4 字节，miner 就是修改这个字段来找到 target

这些字段都是小段对齐的。

## Terminology

[bitcoin glossary](https://developer.bitcoin.org/glossary.html)

## Reference

1. https://bitcoin.org/bitcoin.pdf
2. https://developer.bitcoin.org/devguide/transactions.html
3. https://developer.bitcoin.org/reference/transactions.html
4. https://github.com/bitcoinbook/bitcoinbook
5. https://bitcoincore.org/en/segwit_wallet_dev/#transaction-serialization
6. https://bitcoin.stackexchange.com/questions/8250/what-is-relation-between-scriptsig-and-scriptpubkey
7. [Bitcoin Wiki: Addresses](https://en.bitcoin.it/wiki/Technical_background_of_version_1_Bitcoin_addresses)
8. trapdoor: https://cointelegraphcn.com/news/taproot
9. bitcoinops: https://bitcoinops.org/en/newsletters/
10. bitcoinops中文版: https://github.com/PrimitivesLane/Publications/tree/main/bitcoinops_zh
11. btcstudy: https://www.btcstudy.org/
