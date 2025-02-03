# Bech32m

`Bech32m` 是一种新的编码格式，用于比特币地址。它是 `Bech32` 格式的修改版本，主要用于支持 SegWit v1+ 的比特币地址（例如 Taproot 地址）。`Bech32m` 是为了解决原始 `Bech32` 编码中发现的一个错误而被提出和实现的。

## 简介

### 背景

`Bech32` 格式最初是在 [BIP 173](https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki) 中提出的，用于编码 SegWit（隔离见证）地址，这种格式的地址以 `bc1` 开头。然而，当 `Bech32` 用于新的 SegWit 版本时（即版本1及以上），由于错误检测机制存在问题，导致部分无效地址不会被正确地检测出来。

### Bech32m 的改进

为了解决这个问题，[BIP 350](https://github.com/bitcoin/bips/blob/master/bip-0350.mediawiki) 提出了 `Bech32m`，这是一个修改后的 `Bech32` 格式。它引入了一个新的校验和算法，提高了错误检测的能力，特别是适用于 SegWit v1 及更高版本的地址。这确保了编码的健壮性和安全性，尤其是在处理高版本的 SegWit 地址时。

### Bech32 与 Bech32m 的区别

主要区别在于校验和的计算方式。`Bech32` 使用的是一个固定的常数，而 `Bech32m` 使用了一个不同的常数来计算校验和。这一改变使得 `Bech32m` 能够更有效地捕捉到一些特定的错误，这些错误在原始的 `Bech32` 格式中可能无法检测到。

| 特性                 | Bech32m                      | Bech32                           | Base58                         |
| -------------------- | ---------------------------- | -------------------------------- | ------------------------------ |
| **描述**             | 改进的 SegWit 地址格式       | SegWit 地址格式                  | 传统的比特币地址格式           |
| **BIP**              | BIP 350                      | BIP 173                          | 无特定BIP，但参考 BIP 13/16    |
| **错误检测**         | 改进的错误检测能力           | 强错误检测能力                   | 较弱的错误检测能力             |
| **字符集**           | 32字符集，不包括易混淆字符   | 32字符集，不包括易混淆字符       | 58字符集                       |
| **地址前缀**         | `bc1p`                       | `bc1`                            | `1` 或 `3`                     |
| **用途**             | 支持 SegWit v1+ (如 Taproot) | 支持 SegWit v0 (P2WPKH 和 P2WSH) | 非 SegWit 和 SegWit P2SH       |
| **校验和算法**       | 修改的贝奇校验和算法         | 贝奇校验和算法                   | Base58Check                    |
| **可读性和可扫描性** | 同 Bech32                    | 更优的可读性和较低的打字错误率   | 较低的可读性和较高的打字错误率 |
| **推广程度**         | Taproot更新后推广            | SegWit 地址的标准格式            | 比特币早期广泛使用             |

### 格式和使用

- **格式**：`Bech32m` 地址的格式与 `Bech32` 相似，地址以 `bc1` 开头，随后是一个版本指示符，然后是编码的数据。
- **使用**：自从 Bitcoin Core 0.21.1 版本开始支持 `Bech32m` 格式后，它被用于 Taproot 地址（即以 `bc1p` 开头的地址）。

## 编解码

在 JavaScript 中，使用 `bech32` 库来处理 `Bech32m` 的编码和解码同样非常直接。首先，你需要安装 `bech32` 库，它支持在 Node.js 环境中执行 `Bech32` 和 `Bech32m` 相关操作。

### 安装 `bech32` 库

在你的 Node.js 项目中，你可以通过 npm 或 yarn 来安装这个库：

```bash
npm install bech32
# 或者
yarn add bech32
```

### 编码示例

下面是如何将一组数据编码为 `Bech32m` 格式的示例：

```javascript
const bech32 = require('bech32');

function encodeBech32m(data, hrp = 'bc') {
  // 将数据从8位字节数组转换为5位数组
  const words = bech32.toWords(Buffer.from(data));

  // 使用 bech32m 规范进行编码
  return bech32.encode(hrp, words, bech32.encodings.BECH32M);
}

// 示例数据
const data = [0x01, 0x02, 0x03, 0x04, 0x05];

// 编码
const encoded = encodeBech32m(data);
console.log('Encoded Bech32m:', encoded);
```

### 解码示例

接下来是如何解码 `Bech32m` 格式的数据：

```javascript
function decodeBech32m(bech32mStr) {
  const decoded = bech32.decode(bech32mStr, bech32.encodings.BECH32M);

  // 将5位数组转换回8位字节
  const bytes = Buffer.from(bech32.fromWords(decoded.words));

  return {
    hrp: decoded.prefix,
    data: bytes,
  };
}

// 使用上面的编码结果进行解码
const decoded = decodeBech32m(encoded);
console.log('Decoded data:', decoded.data);
```

## 编解码步骤

为了更深入理解 `Bech32m` 的编解码过程，让我们详细探讨其背后的数学和逻辑步骤。这种编码方式旨在提供更强的错误检测能力，并针对地址等用途进行优化。

### 核心组件和步骤

`Bech32m` 编解码涉及以下核心组件：

1. **人类可读部分 (HRP)**：明确标识相关数据或网络的简短字符序列。
2. **数据部分**：包括实际有效载荷和错误检测代码。
3. **校验和算法**：生成和验证整个字符串的完整性。

### 编码过程

#### 1. 数据准备

将需要编码的数据（如公钥哈希）转换成一系列5位的数值，这是因为 `Bech32m` 的字符集能够表示从0到31的值，相比于完整的8位二进制表示，这种方式允许数据更有效地匹配到字符集。

**转换方法**：使用转换函数（如 `toWords`），将每个字节按位重新组合，从8位分组转换成5位分组。

#### 2. 计算校验和

`Bech32m` 使用一种多项式校验和算法，以确保传输的数据在传播过程中没有发生错误。这一算法基于BCH码，具体步骤如下：

- **多项式定义**：使用特定的生成多项式进行计算，该多项式在设计时就考虑了捕获常见传输错误的需求。
- **校验和的生成**：将HRP和数据部分一起，通过多项式算法生成一个32位的校验和。

#### 3. 结合数据

将转换后的数据与校验和结合，准备进行字符映射。

#### 4. 字符映射

使用 `Bech32m` 指定的字符集将数值转换为对应的字符，生成最终的编码字符串。字符集是一组32个字符，每个字符对应一个从0到31的值。

### 解码过程

解码是编码的逆过程，主要包括以下步骤：

#### 1. 分离和验证

将输入的 `Bech32m` 字符串分解为HRP、数据部分和校验和。验证校验和以确认数据在传输过程中未被篡改或错误输入。

#### 2. 字符到数值的映射

将接收到的字符序列映射回相应的5位数值序列。

#### 3. 数据恢复

使用相同的位转换逻辑（反向操作 `fromWords`），将5位数值序列还原为原始的8位字节序列。

#### 4. 最终输出

提取数据，剔除校验和，返回原始数据和HRP。

## 拆解实现

### 1. 基础组件

首先，我们需要实现一些基础函数，包括多项式校验和计算和数据转换。

#### 多项式校验和

`Bech32m` 使用的多项式为 `x^5 + x^4 + x^3 + x^2 + 1`，我们需要一个函数来计算校验和：

```javascript
const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

// 将字符转换为数值
function charToValue(char) {
  const index = CHARSET.indexOf(char);
  if (index === -1) {
    throw new Error('Invalid character');
  }
  return index;
}

// 将数值转换为字符
function valueToChar(value) {
  return CHARSET[value];
}

// 多项式模数计算 Bech32 校验和
function polymod(values) {
  let checksum = 1;
  for (let value of values) {
    const top = checksum >> 25;
    checksum = ((checksum & 0x1ffffff) << 5) ^ value;
    for (let i = 0; i < 5; i++) {
      if ((top >> i) & 1) {
        checksum ^= (0x3b6a57b2 >> (5 * i)) & 0x1ffffff;
      }
    }
  }
  return checksum;
}

// 扩展人类可读部分（HRP, Human-Readable Part）以帮助计算校验和
function hrpExpand(hrp) {
  const ret = [];
  // 先将每个字符转换为其ASCII码除以32的余数
  for (let i = 0; i < hrp.length; i++) {
    ret.push(hrp.charCodeAt(i) >> 5);
  }
  // 添加分隔符
  ret.push(0);
  // 再将每个字符转换为其ASCII码的低5位
  for (let i = 0; i < hrp.length; i++) {
    ret.push(hrp.charCodeAt(i) & 31);
  }
  return ret;
}

// 计算校验和的最终值（Bech32m）
function createChecksum(hrp, data) {
  const values = hrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0]);
  const polymodValue = polymod(values) ^ 0x2bc830a3; // Bech32m 标识多项式
  let result = [];
  for (let i = 0; i < 6; ++i) {
    result.push((polymodValue >> (5 * (5 - i))) & 31);
  }
  return result;
}

// 验证校验和
function verifyChecksum(hrp, data) {
  const expandedHrp = hrpExpand(hrp);
  const values = expandedHrp.concat(data);
  return polymod(values) === 0x2bc830a3; // 对于 Bech32, 有效校验和会返回1, 对于 Bech32m 需要验证不同的常量
}
```

#### 数据转换

使用5比特群（bits）的数据表示方式进行转换：

```javascript
function convertBits(data, fromBits, toBits, pad = true) {
  let acc = 0;
  let bits = 0;
  const ret = [];
  const maxv = (1 << toBits) - 1;
  for (let i = 0; i < data.length; ++i) {
    let value = data[i];
    if (value < 0 || value >> fromBits !== 0) {
      return null;
    }
    acc = (acc << fromBits) | value;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      ret.push((acc >> bits) & maxv);
    }
  }
  if (pad) {
    if (bits > 0) {
      ret.push((acc << (toBits - bits)) & maxv);
    }
  } else if (bits >= fromBits || (acc << (toBits - bits)) & maxv) {
    return null;
  }
  return ret;
}
```

### 2. 编码和解码实现

接下来，使用上述基础组件实现编码和解码函数：

#### 编码函数

```javascript
function encodeBech32m(hrp, data) {
  const combined = data.concat(createChecksum(hrp, data));
  let result = hrp + '1';
  for (let datum of combined) {
    result += valueToChar(datum);
  }
  return result;
}
```

#### 解码函数

```javascript
function decodeBech32m(bech32mStr) {
  const pos = bech32mStr.lastIndexOf('1');
  const hrp = bech32mStr.slice(0, pos);
  const data = [];
  for (let i = pos + 1; i < bech32mStr.length; ++i) {
    data.push(charToValue(bech32mStr[i]));
  }
  if (!verifyChecksum(hrp, data)) {
    throw new Error('Invalid checksum');
  }
  return { hrp, data: data.slice(0, data.length - 6) };
}
```

### 3. 示例使用

```javascript
const hrp = 'bc';
const data = [15, 2, 20, 3, 5, 18]; // 随机示例数据
const encoded = encodeBech32m(hrp, data);
console.log('Encoded:', encoded);

const decoded = decodeBech32m(encoded);
console.log('Decoded:', decoded);
```

这种方式将手动实现 `Bech32m` 编解码过程，展示了如何从基本原理开始构建此功能。

## 在BTC中的应用

#### SegWit 地址支持

- **SegWit v0 地址**：使用 `Bech32` 编码，这些地址以 `bc1q` 开头。
- **SegWit v1+ 地址（包括 Taproot）**：使用 `Bech32m` 编码，这些地址以 `bc1p` 开头。

#### 优点

1. **更低的交易费用**：SegWit 地址允许比特币交易以更低的费用进行，因为它们更有效地利用区块空间。
2. **增强的错误检测能力**：`Bech32m` 改进了校验和算法，提供了更强的错误检测能力，减少了地址输入错误的风险。
3. **更好的用户体验**：地址全小写，易于手工抄写和阅读，减少了错误输入的机会。

#### Taproot 与 `Bech32m`

Taproot 是比特币的一个重要升级，它引入了 Schnorr 签名和 Merklized Abstract Syntax Trees (MAST)，增强了隐私、扩展性和效率。`Bech32m` 是支持 Taproot 地址的推荐编码方式，因为 Taproot 主要使用 SegWit v1。这种新的地址格式使得利用 Taproot 所提供的所有优势变得更加高效和安全。

`Bech32m` 格式的引入是比特币协议持续进化的一部分，它不仅提高了地址的错误校验能力，还通过支持如 Taproot 这样的先进特性，推动了整个网络向前发展。对于用户和开发者而言，了解并适应这种新的地址格式是非常重要的，它将帮助他们最大化比特币的潜力。
