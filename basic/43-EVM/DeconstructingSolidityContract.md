# Deconstructing a Solidity Contract

by Openzeppelin

1. Introduction [https://blog.openzeppelin.com/deconstructing-a-solidity-contract-part-i-introduction-832efd2d7737/](https://blog.openzeppelin.com/deconstructing-a-solidity-contract-part-i-introduction-832efd2d7737/)
2. Creation vs. Runtime [https://blog.openzeppelin.com/deconstructing-a-solidity-contract-part-i-introduction-832efd2d7737/](https://blog.openzeppelin.com/deconstructing-a-solidity-contract-part-i-introduction-832efd2d7737/)
3. The Function Selector [https://blog.zeppelin.solutions/deconstructing-a-solidity-contract-part-iii-the-function-selector-6a9b6886ea49](https://blog.zeppelin.solutions/deconstructing-a-solidity-contract-part-iii-the-function-selector-6a9b6886ea49)
4. Function Wrappers [https://blog.zeppelin.solutions/deconstructing-a-solidity-contract-part-iv-function-wrappers-d8e46672b0ed](https://blog.zeppelin.solutions/deconstructing-a-solidity-contract-part-iv-function-wrappers-d8e46672b0ed)
5. Function Bodies [https://blog.zeppelin.solutions/deconstructing-a-solidity-contract-part-v-function-bodies-2d19d4bef8be](https://blog.zeppelin.solutions/deconstructing-a-solidity-contract-part-v-function-bodies-2d19d4bef8be)
6. The Metadata Hash [https://blog.zeppelin.solutions/deconstructing-a-solidity-contract-part-vi-the-swarm-hash-70f069e22aef](https://blog.zeppelin.solutions/deconstructing-a-solidity-contract-part-vi-the-swarm-hash-70f069e22aef)

![opcode 结构分解，点击链接看大图 [https://gists.rawgit.com/ajsantander/23c032ec7a722890feed94d93dff574a/raw/a453b28077e9669d5b51f2dc6d93b539a76834b8/BasicToken.svg](https://www.notion.so/23c032ec7a722890feed94d93dff574a)](https://gists.rawgit.com/ajsantander/23c032ec7a722890feed94d93dff574a/raw/a453b28077e9669d5b51f2dc6d93b539a76834b8/BasicToken.svg)

opcode 结构分解，点击链接看大图 [https://gists.rawgit.com/ajsantander/23c032ec7a722890feed94d93dff574a/raw/a453b28077e9669d5b51f2dc6d93b539a76834b8/BasicToken.svg](https://www.notion.so/23c032ec7a722890feed94d93dff574a)

## Introduction

compile tips:

- **make sure *Enable Optimization* is selected**
- solidity **version:0.4.24+commit.e67f0147.Emscripten.clang**
- 设置上述两点后仍然编码有些不一致，实现了的同学可以来补充细节

```solidity
pragma solidity ^0.4.24;

contract BasicToken {

  uint256 totalSupply_;
  mapping(address => uint256) balances;

  constructor(uint256 _initialSupply) public {
    totalSupply_ = _initialSupply;
    balances[msg.sender] = _initialSupply;
  }

  function totalSupply() public view returns (uint256) {
    return totalSupply_;
  }

  function transfer(address _to, uint256 _value) public returns (bool) {
    require(_to != address(0));
    require(_value <= balances[msg.sender]);
    balances[msg.sender] = balances[msg.sender] – _value;
    balances[_to] = balances[_to] + _value;
    return true;
  }

  function balanceOf(address _owner) public view returns (uint256) {
    return balances[_owner];
  }
}
```

```jsx
088 PUSH1 0x04
|  |     |
|  |     Hex value for push.
|  Opcode.
Instruction number.
```

opcode file [https://gist.github.com/ajsantander/60bd8d6f88725663f89a67a7c51672c7](https://www.notion.so/60bd8d6f88725663f89a67a7c51672c7)

<aside>
💡 Instruction number. 编号是opcode所在的byte序号，88就是该opcode被存放在第88个字节。大部分opcode都只占用1byte，除了PUSH。`PUSH1` 表示向stack推入一个uint8数值，后紧跟其要操作的数值，即 0x04。0x04实际上也占用了1byte，于是下一行的opcode Instruction number 将会是090，中间间隔1。以此类推，`PUSH2`会间隔2个byte，`PUSH3`将是3个byte...

</aside>

## **Creation vs. Runtime**

let’s focus on the `JUMP`, `JUMPI`, `JUMPDEST`, `RETURN`, and `STOP` opcodes, and **ignore all others**.Whenever we find an opcode that is not one of these, we will ignore it and skip to the next instruction, pretending that nothing intervened.

### **opcode 执行规则**

`JUMP`, `JUMPI`, `JUMPDEST`, `RETURN`, and `STOP`：

- It does so top down with no exceptions
  - 自上而下顺序执行，没有其他入口
- It can jump
  - `JUMP` 和 `JUMPDEST` 配对使用，即，jump + stack 的值，跳转到相应编号的 opcode，该目标 opcode 必须是 `JUMPDEST`
  - `JUMPI` is exactly the same, but there must not be a “0” in the second position of the stack, otherwise there will be no jump.
    - this is a conditional jump.
    - 当 stack 1 值为 1，跳转到以 stack 0 的值为编号 (Instruction number) 的 opcode，为 0 则不跳转，继续执行下一条
    - 此时 stack 0 为 0x10 , stack 1 为 0x01, 即需要跳转到编号 16 的 opcode
- `STOP` completely halts execution of the contract
- `RETURN` halts execution too, but returns data from a portion of the EVM’s memory, which is handy.

The control flow of this contract will always end at instructions 15 or 68. The remaining 497 instructions (70 to 566) which, as we saw, will never be reached by the execution flow, are precisely the code that will be part of the deployed contract.

If you open the [deconstruction diagram](https://www.notion.so/23c032ec7a722890feed94d93dff574a), you should see how we’ve just made our first split: we’ve differentiated creation-time vs. runtime code.

[Figure 1. Deconstruction of the creation-time EVM bytecode of BasicToken.sol.](https://lh4.googleusercontent.com/H5-5mHxayCSR3zS1hgyy8UEC31y7n3d4ZOo6nf0-ZZ9Oz6idygz4o5_US6_MJejxDzTWg7bl9NOSiz_JuZIxmjH036Awhy2xD2RvLACuXHsqL06NV0goug8Z7O2F3ta7pDBlr-Le)

Figure 1. Deconstruction of the creation-time EVM bytecode of BasicToken.sol.

The creation code gets executed in a transaction, which returns a copy of the runtime code, which is the actual code of the contract. As we will see, the constructor is part of the creation code, and not part of the runtime code. **The contract’s constructor is part of the creation code; it will not be present in the contract’s code once it is deployed**.

`PUSH1` simply pushes one byte onto the top of the stack, and `MSTORE` grabs the two last items from the stack and stores one of them in memory:

```jsx
mstore(0x40, 0x80)
		   |     |
		   |     What to store.
		   Where to store.
(in memory)
```

`CALLVALUE`, `DUP1`, `ISZERO`, `PUSH2`, and `REVERT`.

- `CALLVALUE` 将创建合约交易的 value(wei) 推入栈顶
- `DUP1` duplicates the first element on the stack
- `ISZERO` pushes a 1 to the stack if the topmost value of the stack is zero
- `PUSH1`,`PUSH2` ... 1 推入一个 byte(8bit), 2 (16bit), 以此类推
- `REVERT` halts execution

```jsx
005 CALLVALUE  // push transaction's value(wei) into stack
006 DUP1
007 ISZERO
008 PUSH2 0010
011 JUMPI  // if check
012 PUSH1 00  // -> false
014 DUP1
015 REVERT
016 JUMPDEST  // -> true
```

In Solidity, we could write this chunk of assembly like this:

```jsx
if (msg.value != 0) revert();
```

这一句不是我们的代码，是编译器注入的，因为我们的 constructor 不是 payable，所以不能接受 eth

```jsx
017 POP  // 清除stack
018 PUSH1 40
020 MLOAD  // mload(0x40) 读取0x40插槽，详见下方
021 PUSH1 20
023 DUP1
024 PUSH2 0217
027 DUP4
028 CODECOPY  // 接受三个参数，从合约bytecode中复制编码到目标区域.这里是在code末尾复制初始化参数到memory中
029 DUP2
030 ADD
031 PUSH1 40
033 SWAP1
034 DUP2
035 MSTORE  // 上面几个opcode的作用是将zero slot中的指针向后偏移32byte，以便写入新的变量（偏移之前指向的是0x80,即初始化参数存储的地方）
036 SWAP1
037 MLOAD  // 将memory中的10000（初始化参数）提取到stack中，以便接下来的运算
```

> **Layout in Mmeory** [https://docs.soliditylang.org/en/latest/internals/layout_in_memory.html](https://docs.soliditylang.org/en/latest/internals/layout_in_memory.html)

Solidity reserves four 32-byte slots, with specific byte ranges (inclusive of endpoints) being used as follows:

- `0x00` - `0x3f` (64 bytes): scratch space for hashing methods
- `0x40` - `0x5f` (32 bytes): currently allocated memory size (aka. free memory pointer)
- `0x60` - `0x7f` (32 bytes): zero slot

这四个类别的插槽（总共 4 个插槽，每个插槽 32byte or 256bit）是 solidity 的保留插槽；

The zero slot is used as initial value for dynamic memory arrays and should never be written to (the free memory pointer points to `0x80` initially).

<aside>
💡 **注意在remix的debug视图中，Memory编号是按照bit的个数标注，且每16byte做一次换行；例如0x0,0x10 组成了第一个插槽**（0x0-0x0f 16byte + 0x10-0x1f 16byte）

</aside>

free memory 的值将从 0x80 插槽开始存储。

编号 020 的 opcode，相当于 mload(0x40)，这里的入参 0x40 是 offset 设为 64byte 的意思，即从 0x40 位开始向后读取 32 位，即 0x40-0x5f 这个 256 位区域。

`CODECOPY` (destOffset, offset, length) memory[destOffset:destOffset+length] = address(this).code[offset:offset+length] 从合约代码复制到内存

```jsx
038 PUSH1 00
040 DUP2
041 DUP2
042 SSTORE  // 存储10000到storage
043 CALLER
044 DUP2
045 MSTORE
046 PUSH1 01
048 PUSH1 20
050 MSTORE
051 SWAP2
052 SWAP1
053 SWAP2
054 SHA3
055 SSTORE

// excutes the constructor code
totalSupply_ = _initialSupply;
balances[msg.sender] =  _initialSupply;
```

> **Layout of State Variables in Storage** [https://docs.soliditylang.org/en/v0.4.24/miscellaneous.html#layout-of-state-variables-in-storage](https://docs.soliditylang.org/en/v0.4.24/miscellaneous.html#layout-of-state-variables-in-storage)

Statically-sized variables (everything except mapping and dynamically-sized array types) are laid out contiguously in storage starting from position `0`. Multiple items that need less than 32 bytes are packed into a single storage slot if possible, according to the following rules:

- The first item in a storage slot is stored lower-order aligned.
- Elementary types use only that many bytes that are necessary to store them.
- If an elementary type does not fit the remaining part of a storage slot, it is moved to the next storage slot.
- Structs and array data always start a new slot and occupy whole slots (but items inside a struct or array are packed tightly according to these rules).

构造函数执行完后，return 合约代码部分的 bytecode。

## **The Function Selector**

已部署合约的 bytecode

```jsx
608060405234801561001057600080fd5b5060405160208061021783398101604090815290516000818155338152600160205291909120556101d1806100466000396000f3006080604052600436106100565763ffffffff7c010000000000000000000000000000000000000000000000000000000060003504166318160ddd811461005b57806370a0823114610082578063a9059cbb146100b0575b600080fd5b34801561006757600080fd5b506100706100f5565b60408051918252519081900360200190f35b34801561008e57600080fd5b5061007073ffffffffffffffffffffffffffffffffffffffff600435166100fb565b3480156100bc57600080fd5b506100e173ffffffffffffffffffffffffffffffffffffffff60043516602435610123565b604080519115158252519081900360200190f35b60005490565b73ffffffffffffffffffffffffffffffffffffffff1660009081526001602052604090205490565b600073ffffffffffffffffffffffffffffffffffffffff8316151561014757600080fd5b3360009081526001602052604090205482111561016357600080fd5b503360009081526001602081905260408083208054859003905573ffffffffffffffffffffffffffffffffffffffff85168352909120805483019055929150505600a165627a7a72305820a5d999f4459642872a29be93a490575d345e40fc91a7cccb2cf29c88bcdaf3be0029
```

调用 totalSupply() 方法，进行 debug

```jsx
000 PUSH1 80
002 PUSH1 40
004 MSTORE
```

```jsx
005 PUSH1 04
007 CALLDATASIZE
008 LT  // a < b CALLDATASIZE < 0x04
009 PUSH2 0056
012 JUMPI   // 条件跳转，如果 LT判断为true，则跳转到086，正常情况会继续往下走
...
086 JUMPDEST
087 PUSH1 00
089 DUP1
090 REVERT  // 调用被revert
```

> **Application Binary Interface Specification** [https://docs.soliditylang.org/en/v0.8.9/abi-spec.html#application-binary-interface-specification](https://docs.soliditylang.org/en/v0.8.9/abi-spec.html#application-binary-interface-specification)

由于 totalSupply() 没有入参，calldata 只包含 4byte 的 selectId，这里检查 calldata 是否大于 4，如果大于，则会跳转到 089 ，进入 revert 逻辑.你也可以传入空的 calldata，这里判断可以通过，但由于合约中不存在空的 function selector, 且没有 [fallback function](https://solidity.readthedocs.io/en/v0.4.24/contracts.html?highlight=fallback%20function#fallback-function) ，于是程序会直接终止。

calldata 数据可以在 remix 的 calldata 面板查看，此时是 0x18160ddd, `keccak256("totalSupply()")`截取前 4 个 byte。

调用 balanceOf(address), calldata 将会是这样

`0x70a082310000000000000000000000005b38da6a701c568545dcfcb03fcb875f56beddc4`

`0x70a08231` 是 balanceOf(address) 的 selectId，后面是入参，因为地址是 20byte，但入参使用总是使用 32-byte words 或者 slots，所以前面要补零。

判断 calldata 长度将不能超过 0x24 ，即 4(selectId) + 32(one parameter) = 36

```jsx
013 PUSH4 FFFFFFFF
018 PUSH29 0100000000000000000000000000000000000000000000000000000000
048 PUSH1 00
050 CALLDATALOAD  // calldataload(0) 从calldata中复制32byte数据
051 DIV // 用除法截取前4byte
052 AND // 按位与 0xFFFFFFFF 保证selectId有8bit
```

![Figure 3. The function selector.](https://i1.wp.com/miro.medium.com/max/700/1*IgrF4NZNL4UNpnTKn33S1A.png?resize=700%2C299&ssl=1)

Figure 3. The function selector.

013-090 是读取 calldata 中的 function selector，然后遍历匹配方法的 id，跳转到对应 opcode 的过程。如果所有 selectId 都不匹配，则进入 fallback function，因为本合约灭有 fallback function，调用会直接 revert。

![Figure 4. The function selector and a contract’s runtime code main entry point.](https://i1.wp.com/miro.medium.com/max/700/1*H1f1__xgVIBWNIw0l3RDmw.png?resize=700%2C359&ssl=1)

Figure 4. The function selector and a contract’s runtime code main entry point.

## **Function Wrappers**

### totalSupply()

step back to instruction 91, which is where the function selector leaves us because the function id matched `totalSupply` (`0x18160ddd`).

![Figure 2. The non-payable check structure.](https://i2.wp.com/miro.medium.com/max/547/1*UjV04YS6oqNzXGqOOAuM8w.png?resize=547%2C285&ssl=1)

Figure 2. The non-payable check structure.

检查 callvalue 是否为 0，non-payable check.

```jsx
245 JUMPDEST
246 PUSH1 00
248 SLOAD  // sload(0) 从storage的slot0中取出 totalSupply_ 变量的值 存入memory
249 SWAP1
250 JUMP
```

![Figure 5. An uint256 memory returner structure.](https://i1.wp.com/miro.medium.com/max/700/1*If4PBiS27dTEb8pdy7JDPA.png?resize=700%2C232&ssl=1)

Figure 5. An uint256 memory returner structure.

将 memory 中 totalSupply\_的值 return：

1. 113-116 读取 memory zero slot 的值，即一个指向空闲变量的指针
2. 117-119 将 totalSupply\_的值写入空闲变量
3. 120-124 计算 RETURN 的 offset
4. 125-129 计算 RETURN 的 length，并 return 数据

`RETURN` return memory[offset:offset+length]

### balanceOf(address)

![Figure 8. balanceOf’s blue wrapper jumps back to totalSupply’s yellow wrapper.](https://i0.wp.com/miro.medium.com/max/700/1*5vsSykojVf-77bXtVqV7Kw.png?resize=700%2C691&ssl=1)

Figure 8. balanceOf’s blue wrapper jumps back to totalSupply’s yellow wrapper.

balanceOf(address) 中复用了 totalSupply()的 uint256 memory returner 部分的 opcode.

<aside>
💡 opcode的复用是因为我们在编译时开启了 Enable optimization 选项，如果没有勾选，则不会观察到这种情况。

</aside>

```jsx
142 JUMPDEST
143 POP
144 PUSH2 0070
147 PUSH20 ffffffffffffffffffffffffffffffffffffffff  // 提取address入参的bitmask
168 PUSH1 04  // CALLDATALOAD offset 跳过selectId
170 CALLDATALOAD
171 AND  // 提取20byte的address入参
172 PUSH2 00FB
173 JUMP   // 跳转到 251
```

![https://i0.wp.com/miro.medium.com/max/700/1*Ry_p_sHfRENGIz_G04nWcA.jpeg?w=840&ssl=1](https://i0.wp.com/miro.medium.com/max/700/1*Ry_p_sHfRENGIz_G04nWcA.jpeg?w=840&ssl=1)

## **Function Bodies**

```jsx
251 JUMPDEST
252 PUSH20 ffffffffffffffffffffffffffffffffffffffff
273 AND
274 PUSH1 00
276 SWAP1
277 DUP2
278 MSTORE  // 将address入参存入 memory 0x0
279 PUSH1 01
281 PUSH1 20
283 MSTORE  // 将数值1存入 memory 0x20
284 PUSH1 40  // length 0x40 = 64
286 SWAP1
287 SHA3  // hash = keccak256(memory[offset:offset+length])
288 SLOAD // 上一步的hash就是key value = storage[key]
289 SWAP1
290 JUMP  // 跳转 112
112 ... // 复用了totalSupply()的 uint256 memory returner 部分的opcode.
```

![https://i0.wp.com/miro.medium.com/max/700/1*qfAR0q1D4PDIzBGmzTlV_A.png?resize=700%2C239&ssl=1](https://i0.wp.com/miro.medium.com/max/700/1*qfAR0q1D4PDIzBGmzTlV_A.png?resize=700%2C239&ssl=1)

### **Metadata Hash**

![Figure 1: The metadata hash can be found in the last few opcodes of the runtime bytecode of a contract.](https://i2.wp.com/miro.medium.com/max/695/1*07vt6obMDNLssCWZj5DNKA.png?resize=695%2C556&ssl=1)

Figure 1: The metadata hash can be found in the last few opcodes of the runtime bytecode of a contract.

> **Encoding of the Metadata Hash in the Bytecode** [https://docs.soliditylang.org/en/v0.8.9/metadata.html#encoding-of-the-metadata-hash-in-the-bytecode](https://docs.soliditylang.org/en/v0.8.9/metadata.html#encoding-of-the-metadata-hash-in-the-bytecode)

[https://miro.medium.com/max/700/0\*jvtyB5uFIQLAKkkl](https://miro.medium.com/max/700/0*jvtyB5uFIQLAKkkl)

This hash can be used in [Swarm](https://swarm-guide.readthedocs.io/en/latest/introduction.html) as a lookup URL to find the contract’s metadata. Swarm is basically a decentralized storage system, similar to [IPFS](https://ipfs.io/). The idea here is that some platform like [Etherscan](https://etherscan.io/) identifies this structure in the bytecode and provides the location of the bytecode’s metadata within a decentralized storage system. A user can query such metadata and use it as a means to prove that the bytecode being seen is in fact the product of a given Solidity source code, with a certain version and precise configuration of the Solidity compiler in a deterministic manner. This hash is a digital signature of sorts, that ties together a piece of compiled bytecode with its origins. If you wanted to verify that the bytecode is legit, you would have to hash the metadata yourself and verify that you get the same hash.

And that’s not all, the metadata hash can be used by wallet applications to fetch the contract’s metadata, extract it’s source, recompile it with the compiler settings used originally, verify that the produced bytecode matches the contract’s bytecode, then fetch the contract’s JSON ABI and look at the [NATSPEC](https://github.com/ethereum/wiki/wiki/Ethereum-Natural-Specification-Format) documentation of the function being called.
