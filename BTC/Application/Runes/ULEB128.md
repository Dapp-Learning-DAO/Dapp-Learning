# 简介

ULEB128（Unsigned Little Endian Base 128）是一种编码方式，设计用于高效地表示无符号整数，尤其是在计算机科学和编程中。它采用变长编码方式，旨在减少存储和传输数据时的开销。

# 示例

## ULEB128 编码

ULEB128编码将无符号整数编码为一系列字节，其中每个字节除了最后一个字节外，最高位都被设置为1，表示还有更多的字节。
整数从其最低有效位到最高有效位进行编码，逐字节处理，每次处理7位。处理的过程中，将7位数据放入字节的低7位，若还有更多数据待处理，则设置高位为1，否则设置为0。这种编码方式保证了较小的数值占用较少的空间。
** 举例 **
假设要编码整数 300（二进制表示为 10, 0101100）：

- 第一个字节中，低7位为 0101100（十进制的 44），最高位设置为 1（表示还有数据），因此第一个字节为 10101100。
- 第二个字节仅包含剩余的 10，放在最低位，其余位填充为0，最高位为 0（表示这是最后一个字节），因此第二个字节为 00000010。
- 最终编码为 0xD4 0x02。

## ULEB128 解码

ULEB128 解码需要观察每个字节的最高位（也称为继续位），在 ULEB128 编码中，每个字节的最高位（第8位）用于指示是否还有更多的字节需要读取。

- 如果这一位是 1，表示后续还有至少一个字节是这个数的一部分。
- 如果这一位是 0，则表示这是最后一个字节。
  ** 举例 **
  假设要解码十六进制 **cfa433**
- 第一个字节 cf（二进制：11001111），数据位：1001111（二进制），十进制值为 79。
- 第二个字节 a4（二进制：10100100），数据位：0100100（二进制），十进制值为 36。
- 第三个字节 33（二进制：00110011），数据位：0110011（二进制），十进制值为 51。

相加得到 79 + 36 _ 128 + 51 _ 128^2 = 840271

## 在Runes中应用

## 蚀刻

### 数据结构

```js
type Etching = {
  divisibility?: U8;
  premine?: U128;
  rune?: Rune;
  spacers?: U32;
  symbol?: Symbol;
  terms?: Terms;
};

type Rune = u128;

type Terms = {
  amount?: U128;
  cap?: U128;
  height?: {
    start?: U64;
    end?: U64;
  };
  offset?: {
    start?: U64;
    end?: U64;
  };
};
```

### 示例

｜ DOG•GO•TO•THE•MOON 蚀刻交易
https://mempool.space/zh/tx/e79134080a83fe3e0e06ed6990c5a9b63b362313341745707a2bff7d788a1375

**1. Raw OP_RETURN**

```js
OP_RETURN
OP_PUSHNUM_13
OP_PUSHBYTES_33 02010487a1c3f0c0ebf7fb9d01010503d4040595e80706808084fea6dee1111601
```

**2. ULEB128解码**

```js
[
  { decimal: 2n, hex: '02' },
  { decimal: 1n, hex: '01' },
  { decimal: 4n, hex: '04' },
  { decimal: 11382812169668186247n, hex: '87a1c3f0c0ebf7fb9d01' },
  { decimal: 1n, hex: '01' },
  { decimal: 5n, hex: '05' },
  { decimal: 3n, hex: '03' },
  { decimal: 596n, hex: 'd404' },
  { decimal: 5n, hex: '05' },
  { decimal: 128021n, hex: '95e807' },
  { decimal: 6n, hex: '06' },
  { decimal: 10000000000000000n, hex: '808084fea6dee111' },
  { decimal: 22n, hex: '16' },
  { decimal: 1n, hex: '01' },
];
```

**3. 对照码表翻译**

```js
{
  "edicts": [],
  "etching": {
    "divisibility": "5",
    "premine": "10000000000000000",
    "rune": "11382812169668186247",
    "spacers": "596",
    "symbol": "128021",
    "turbo": false,
    "terms": null
  },
  "mint": null,
  "pointer": "1",
  "flags": "1",
}
```

## 铸造

### 数据结构

```js
type Mint = {
    block: U64;
    tx: U32;
}
```

### 示例

｜ GOLD•RUNE•STONE 铸造交易
https://mempool.space/zh/tx/b4da683f34fa2a159f887012a67a14e56dbbf8e38e2da991be45869413544e0b

**1. Raw OP_RETURN**

```js
OP_RETURN
OP_PUSHNUM_13
OP_PUSHBYTES_16 14cfa43314b80400cfa433b804e80700
```

**2. ULEB128解码**

```js
[
  { decimal: 20n, hex: '14' },
  { decimal: 840271n, hex: 'cfa433' },
  { decimal: 20n, hex: '14' },
  { decimal: 568n, hex: 'b804' },
  { decimal: 0n, hex: '00' },
  { decimal: 840271n, hex: 'cfa433' },
  { decimal: 568n, hex: 'b804' },
  { decimal: 1000n, hex: 'e807' },
  { decimal: 0n, hex: '00' },
];
```

**3. 对照码表翻译**

```js
{
  "edicts": [
    {
      "id": {
        "block": "840271",
        "tx": "568"
      },
      "amount": "1000",
      "output": "0"
    }
  ],
  "etching": null,
  "mint": {
    "block": "840271",
    "tx": "568"
  },
  "pointer": null
}
```

## 转账

### 数据结构

```js
type Mint = {
    block: U64;
    tx: U32;
}
```

### 示例

｜ DOG•GO•TO•THE•MOON 转移交易
https://mempool.space/zh/tx/966aff320562acd491458bded8fc9010590285aa3abd4801fe06192c242544ee

**1. Raw OP_RETURN**

```js
OP_RETURN
OP_PUSHNUM_13
OP_PUSHBYTES_21 160b00c0a2330380ea8ed51f0b00008094ebdc030d
```

**2. ULEB128解码**

```js
[
  { decimal: 22n, hex: '16' },
  { decimal: 11n, hex: '0b' },
  { decimal: 0n, hex: '00' },
  { decimal: 840000n, hex: 'c0a233' },
  { decimal: 3n, hex: '03' },
  { decimal: 8500000000n, hex: '80ea8ed51f' },
  { decimal: 11n, hex: '0b' },
  { decimal: 0n, hex: '00' },
  { decimal: 0n, hex: '00' },
  { decimal: 1000000000n, hex: '8094ebdc03' },
  { decimal: 13n, hex: '0d' },
];
```

**3. 对照码表翻译**

```js
{
  "edicts": [
    {
      "id": {
        "block": "840000",
        "tx": "3"
      },
      "amount": "8500000000",
      "output": "11"
    },
    {
      "id": {
        "block": "840000",
        "tx": "3"
      },
      "amount": "1000000000",
      "output": "13"
    }
  ],
  "pointer": "11"
}
```
