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

function encodeBech32m(hrp, data) {
  const combined = data.concat(createChecksum(hrp, data));
  let result = hrp + '1';
  for (let datum of combined) {
    result += valueToChar(datum);
  }
  return result;
}

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

const hrp = 'bc';
const data = [15, 2, 20, 3, 5, 18]; // 随机示例数据
const encoded = encodeBech32m(hrp, data);
console.log('Encoded:', encoded);

const decoded = decodeBech32m(encoded);
console.log('Decoded:', decoded);
