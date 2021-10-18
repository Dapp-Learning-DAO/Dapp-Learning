## 源起

前几天群里有讨论 Uniswap V3 中询价的处理，简单翻了下代码，发现与 Uniswap V2 相比，V3 变化真的很大～

其中 [v3-periphery](https://github.com/Uniswap/v3-periphery/tree/main/contracts/libraries) 目录下的 `Path.sol` 用于编码交易对路径，主要是为了节省 gas

我正好在写套利机器人，优化多多益善；于是尝试复用，并做了进一步的优化

这里简单记录下

## 原理

交易的 intrinsic 成本计算如下

``` go
// go-ethereum/core/state_transition.go

// IntrinsicGas computes the 'intrinsic gas' for a message with the given data.
func IntrinsicGas(data []byte, accessList types.AccessList, isContractCreation bool, isHomestead, isEIP2028 bool) (uint64, error) {
	// Set the starting gas for the raw transaction
	var gas uint64
	// Bump the required gas by the amount of transactional data
	if len(data) > 0 {
		// Zero and non-zero bytes are priced differently
		var nz uint64
		for _, byt := range data {
			if byt != 0 {
				nz++
			}
		}
		// Make sure we don't exceed uint64 for all data combinations
        nonZeroGas = params.TxDataNonZeroGasEIP2028
		if (math.MaxUint64-gas)/nonZeroGas < nz {
			return 0, ErrGasUintOverflow
		}
		gas += nz * nonZeroGas

		z := uint64(len(data)) - nz
		if (math.MaxUint64-gas)/params.TxDataZeroGas < z {
			return 0, ErrGasUintOverflow
		}
		gas += z * params.TxDataZeroGas
	}
	return gas, nil
}
```

其中，`TxDataZeroGas` 为 4，`TxDataNonZeroGasEIP2028` 为 16，即 input data 的空字节和非空字节，gas 分别为 4 wei 和 16 wei

为了节省 gas，我们需要尽量减少 input data

## 编码

很不幸的是，在 solidity 中，数据编码几乎未考虑 gas 优化，一切以简单为前提

比如，我们需要传递 pair 与 fee 的 `tuple` 到合约，假设数据为：

| pair | fee |
| -: | -: |
| 0x55542f696a3fEcaE1C937Bd2e777B130587cFD2d | 500 |
| 0x9D7076AD0F7fDc5F0F249e97721D36a448d24906 | 3000 |
| 0x6CE15889C141C09Ecf76a57795E91214A1f97648 | 10000 |
| 0xdfc647c079757bac4f7776cc876746119Ac451ea | 10000 |

// 这里数据仅做例子，没有实际意义

对应函数的原型，非常影响 gas

### 原始编码

函数原型为

``` js
function flashArbs(address[] calldata pool, uint24[] calldata fee) external;
```

数据编码为

``` js
0000000000000000000000000000000000000000000000000000000000000040 // pool.offset
00000000000000000000000000000000000000000000000000000000000000e0 // fee.offset
0000000000000000000000000000000000000000000000000000000000000004 // pool.length
00000000000000000000000055542f696a3fecae1c937bd2e777b130587cfd2d // pool[0]
0000000000000000000000009d7076ad0f7fdc5f0f249e97721d36a448d24906 // pool[1]
0000000000000000000000006ce15889c141c09ecf76a57795e91214a1f97648 // pool[2]
000000000000000000000000dfc647c079757bac4f7776cc876746119ac451ea // pool[3]
0000000000000000000000000000000000000000000000000000000000000004 // fee.length
00000000000000000000000000000000000000000000000000000000000001f4 // fee[0]
0000000000000000000000000000000000000000000000000000000000000bb8 // fee[1]
0000000000000000000000000000000000000000000000000000000000002710 // fee[2]
0000000000000000000000000000000000000000000000000000000000002710 // fee[3]
```

编码过程参考 [Formal Specification of the Encoding](https://docs.soliditylang.org/en/v0.8.9/abi-spec.html#mapping-solidity-to-abi-types])，这里不做赘述

消耗 gas 为 292 * 4 + 92 * 16 = 2640

### 简单优化

上面例子中，可以看到两个数组分别有自己的 offset 和 length，额外消耗了 gas

容易想到，我们可以将 pool 和 fee 组织为结构体，以结构体数组的形式传递参数

函数原型为

``` js
struct PoolTier {
    address pool;
    uint24 fee;
}

function flashArbs(PoolTier[] calldata input) external;
```

数据编码为

``` js
0000000000000000000000000000000000000000000000000000000000000020 // input.offset
0000000000000000000000000000000000000000000000000000000000000004 // input.length
00000000000000000000000055542f696a3fecae1c937bd2e777b130587cfd2d // input[0]
00000000000000000000000000000000000000000000000000000000000001f4
0000000000000000000000009d7076ad0f7fdc5f0f249e97721d36a448d24906 // input[1]
0000000000000000000000000000000000000000000000000000000000000bb8
0000000000000000000000006ce15889c141c09ecf76a57795e91214a1f97648 // input[2]
0000000000000000000000000000000000000000000000000000000000002710
000000000000000000000000dfc647c079757bac4f7776cc876746119ac451ea // input[3]
0000000000000000000000000000000000000000000000000000000000002710
```

消耗 gas 为 230 * 4 + 90 * 16 = 2360

节省 gas 为 280

## Uniswap V3 优化

从上面两个例子可以看到，solidity 编码的最大问题在于 padding，即 32 字节对齐，导致引入了非常多无效的空字节

上述例子中 gas 为 2360，而空字节消耗了 230 * 4 = 920，无效数据占比为 ~ 40%

为了进一步优化，考虑到 pool 和 fee 都为定长类型，可以直接拼接而不做 padding，在实际使用时才做解码

函数原型为

``` js
function flashArbs(bytes calldata input) external;
```

数据编码为

``` js
0000000000000000000000000000000000000000000000000000000000000020
000000000000000000000000000000000000000000000000000000000000005c
55542f696a3fecae1c937bd2e777b130587cfd2d0001f4
9d7076ad0f7fdc5f0f249e97721d36a448d24906000bb8
6ce15889c141c09ecf76a57795e91214a1f97648002710
dfc647c079757bac4f7776cc876746119ac451ea002710
00000000 // padding
```

消耗 gas 为 66 * 4 + 90 * 16 = 1704，无效数据占比降至 ～ 15%

这也是 Uniswap V3 的优化方式

## 优化

实际上，我们继续优化，使得有效载荷为 100%

函数原型为

``` js
function flashArbs() external;
```

数据编码为

``` js
55542f696a3fecae1c937bd2e777b130587cfd2d0001f4
9d7076ad0f7fdc5f0f249e97721d36a448d24906000bb8
6ce15889c141c09ecf76a57795e91214a1f97648002710
dfc647c079757bac4f7776cc876746119ac451ea002710
```

是不是有点奇怪，函数原型中没有参数，那么参数从哪里获取呢？

实际上，我的方式是抛弃 solidity 编码，直接使用 assembly 来解析数据，代码如下

``` js
bytes memory input;
assembly {
    let calldata_len := calldatasize()
    let input_len := sub(calldata_len, 4)

    input := mload(0x40)
    mstore(input, input_len)

    let input_data := add(input, 0x20)
    calldatacopy(input_data, 4, input_len)

    let free := add(input_data, input_len)
    let free_round := and(add(free, 31), not(31))
    mstore(0x40, free_round)
}
```

这里稍微解释下：

首先通过 `calldatasize` 得到调用数据的长度，减去 function selector 的 4 字节，得到的 `input_len` 即为参数长度

然后通过 0x40 获得空闲指针，拷贝参数到 memory

最后将参数长度按 32 字节向上取整，修改空闲指针

### 题外

不要觉得上面的 assembly 本身消耗了 gas，导致优化效果减少

要知道，即使按 Uniswap V3 传 bytes 参数的方式，也是需要拷贝数据到 memory，过程是一样的

如果考究一些，我们甚至可以跳过 solidity 编译后的某些 opcode

比如上面例子中，我并不检查 input_len 的长度是否大于0，因为我不需要

而 solidity 编译后的操作码，势必包括种种边界检查

换句话说，这种方式不仅优化了数据 gas，还稍微优化了一些 opcode

## 到此为止？

实际上，上面的优化有个小问题，在于 memory 中消耗了 32 字节用于保存 input 的长度，而这个长度，在整个生命周期中是固定的

我选择将它转移到栈上，只是使用时稍微麻烦一些，不像 bytes 方便～

，即

``` js
uint input;
uint input_len;
assembly {
    let calldata_len := calldatasize()
    input_len := sub(calldata_len, 4)

    input := mload(0x40)
    calldatacopy(input, 4, input_len)

    let free := add(input, input_len)
    let free_round := and(add(free, 31), not(31))
    mstore(0x40, free_round)
}
```

## 实测

我用大概 100 多条套利路径，对 Uniswap V3 编码方式，以及进一步优化方式，分别跑了自动化测试，平均下来一笔交易可以优化 2000 gas 左右

比预期的优化大了很多，具体原因未查


