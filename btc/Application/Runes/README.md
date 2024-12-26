# 背景
## Ordinals
Ordinals 最早由 Casey (@rodarmor) 在2022年12月发布，该协议允许在比特币的最小单位聪上铭刻数据，包含文本、图片、音频、视频等数据信息，进而把NFT引入到比特币生态。而我们一直说的比特币铭文也是一段通过采用Ordinals 协议铭刻(Inscribe)在聪(Satoshis)上的元数据。

## BRC-20
BRC-20 是由匿名开发者 @domodata 于2023年3月8日推出，是基于刚介绍的 Ordinals协议推出的协议。该协议通过将代币的名称、数量等信息用特定的 JSON 格式写入聪(Satoshi)中以实现代币的部署Deploy、铸造Mint和转账Transfer的功能。仿照以太坊 ERC-20 代币标准使用 BRC-20 命名，相当于基于 Ordinals 协议的代币发行协议。详细介绍参考 [BRC-20 协议](../BRC-20/README.md)。

## Runes
2023年9月1日 Casey 公开反对BRC20协议，并希望可以停止铸造 BRC-20。在9月26日，Casey Rodarmor 重新开发了一个名为 Runes 的协议作为 BRC-20 的替代品。该协议是一个基于 UTXO 的、能使比特币使用者具有使用良好体验的可替代代币协议。Casey 认为改良过后，能够降低制造大量垃圾 UTXO 现象的符文，是比先前实验性的 BRC-20 协议更好、更轻量简洁的资产发行方案。至少目前 BRC -20 的流行已经创造了大量的“垃圾”UTXO 。


# Runes协议介绍
符文协议允许比特币交易蚀刻、铸造和转移比特币原生数字商品。

## 符文石（RuneStone）
> 符文协议消息，称为符文石，存储在比特币交易输出中。 在区块 840,000（比特币第四次减半） 上激活, 早期区块中的符文石将被忽略。

符文石输出的脚本以`OP_RETURN`开头，然后是 `OP_13`，最后是零个或多个数据推送。这些推送的数据被串联起来并解码为128位整数序列，最后解析为符石，相关编解码逻辑见[ULEB128](./ULEB128.md)。
一笔交易最多可以拥有一颗符文石。符文石可以蚀刻一个新的符文或者铸造一个现有的符文，并将符文从交易的输入传输到其输出。
```js
struct Runestone {
  edicts: Vec<Edict>,
  etching: Option<Etching>,
  mint: Option<RuneId>,
  pointer: Option<u32>,
}
```
- `edicts`：标识符文的转移信息，用于符文转账。
- `etching`：标识符文的蚀刻信息，通过蚀刻创建新符文。
- `mint`：存储符文 ID，用于符文铸造。
- `pointer`：标识未分配的符文的默认转移位置，不设置则将剩余的未分配符文将转移到交易的第一个非OP_RETURN输出。

### 符文（Rune）
符文由 ID 标识，ID 包含蚀刻符文的区块以及该区块内蚀刻交易的索引，以文本形式表示为BLOCK:TX。例如，第 500 个区块的第 20 笔交易中铸造的符文 ID 为500:20。

### 蚀刻（Etching）
符文石中包含的蚀刻信息用于创建新符文
```js
struct Etching {
  divisibility: Option<u8>,
  premine: Option<u128>,
  rune: Option<Rune>,
  spacers: Option<u32>,
  symbol: Option<char>,
  terms: Option<Terms>,
}

struct Rune(u128);

struct Terms {
  amount: Option<u128>,
  cap: Option<u128>,
  height: (Option<u64>, Option<u64>),
  offset: (Option<u64>, Option<u64>),
}
```
- `divisibility`：符文精度，标识符文数量中小数点后允许的位数。
- `premine`：为自己分配被蚀刻的符文数量，用于预挖。
- `rune`：符文名称，由字母 A 到 Z 组成，例如UNCOMMONGOODS。
- `spacers`：符文分隔符，位域的第 N 个字段（从最低有效位开始）确定是否应在从符文名称左侧开始的第 N 个和第 N+1 个字符之间显示间隔符，举例如下 

| Spacers | Display  |
|---------|----------|
| 0b1     | A•AAA    |
| 0b11    | A•A•AA   |
| 0b10    | AA•AA    |
| 0b111   | A•A•A•A  |

- `symbol`：符文货币符号的 Unicode 代码点，显示在该符文的金额之后。如果符文没有货币符号，¤则应使用通用货币字符。
- `terms`：符文条款，铸币时需要满足的条件。
  - `amount`: 每个铸币交易收到的符文数量
  - `cap`: 允许的铸造次数
  - `height`: 铸造的起始和结束绝对区块高度
  - `offset`: 相对于符文被蚀刻的块的起始和结束块高度

### 铸造
符文石中包含的mint信息用于铸造符文，铸币数量将添加到交易输入中未分配的符文中。这些符文可以使用Edict进行转移，否则将转移到第一个非OP_RETURN输出或由字段指定的输出Pointer。

### 转账
符文石中包含的edict信息用于转移符文，符文石可以包含任意数量的法令，这些edict是按顺序处理的。
```js
struct Edict {
  id: RuneId,
  amount: u128,
  output: u32,
}
```
- id：符文id。
- amount：符文转移数量。
- output：符文输出位置，对应vout的下标。

转移规则：
1. 优先处理符文石的edict，将输入中对应的符文转移到输出的output位置的UTXO上
2. 如果有剩余的符文则会均匀分配到输出上
3. 如果未分配的符文数量不能被非OP_RETURN输出的数量整除，多余的符文会分配给第一个非OP_RETURN的输出

如果符石中的任何edict的符文ID的block=0且tx>0，或者output大于交易输出的数量，则该符石是纪念碑。纪念碑中的法令不会被处理，所有输入的符文都会被烧毁。

## 纪念碑（Cenotaphs）
符石可能因多种原因而格式错误，包括符石中的非推送数据操作码OP_RETURN、无效的变体或无法识别的符石字段。畸形的符文石被称为**纪念碑**。

输入到纪念碑交易中的符文会被烧毁。在带有纪念碑的交易中蚀刻的符文被设置为不可铸造。带有纪念碑的交易中的铸币计入铸币上限，但铸造的符文会被烧毁。

纪念碑是一种升级机制，允许符文被赋予新的语义，从而改变符文的创建和传输方式，同时不会误导未升级的客户端这些符文的位置，因为未升级的客户端会看到这些符文已被烧毁。