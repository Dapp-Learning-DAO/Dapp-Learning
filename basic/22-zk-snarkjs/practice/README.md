# 简介
这一章节介绍从实战的角度如何开发zk应用。

# 必备组件

- circom：用于编译circom文件，将其转换为wasm
- circomlib：包含常用circom逻辑，例如哈希、merkle等
- circomlibjs：用于生成circomlib电路的输出，例如计算poseidon哈希值
- circom_tester：用于测试电路，主要是给定输入，计算见证。
- snarkjs：生成证明、验证证明等。

也可以在[这里](https://docs.circom.io/ )浏览开发zksnark应用所需组件库。


# 开发zk应用的过程
典型过程包括：确定需求——>开发电路——>测试电路——>build电路——>编写dapp。

## 确定需求
首先需要理解电路证明了什么。通常，给定一组输入，电路用于描述这些输入之间的关系。例如给定一个哈希电路，它有两个输入：dataHash, data。在这个例子中，电路是用于证明data和dataHash之间存在哈希关系，即hash(data) == dataHash。

## 开发电路
开发电路，需要使用circom语言。可以参考[circuits](./circuits)目录，了解一个典型的circom程序模板。

在这个过程中，你可能需要第三方circom，可以添加circomlib:
```
yarn add circomlib
```
它会自动将circom电路下载到node_modules，随后即可引入依赖：
```
include "../node_modules/circomlib/circuits/poseidon.circom";
```


## 测试电路
测试电路，需要用户构造输入，然后计算电路的见证。见证就是指基于输入信息，顺着电路构造出的所有中间信号，和最终的输出信号。

需要引入circom_tester:
```
yarn add circom_tester
```
由于我们需要预先生成dataHash作为输入，因此也需要circomlibjs：
```
yarn add circomlibjs
```
当然还有chai和mocha:
```
yarn add chai 
yarn add mocha
```

用户可以在[test](./test)中查看具体的测试案例。

执行测试：

```
yarn mocha test/test.js
```
---
**NOTE**

javascript的poseidon，得出的哈希数据，默认情况下和go sdk、circomlib生成的不一致，这是因为javascript的poseidon哈希没有进行montgomery格式转换。可以参考test/test.js中的goodPoseidon，它得到的哈希值是正确的。
---

## build电路

build电路，是指生成如下内容：
- zkey：所谓prooving key，proover使用它来生成证明。注意，它是公开的，不是秘密的！
- vkey：所谓verification key，verifier使用它来验证证明。它也是公开的。
- 合约：可以生成一个Verifier合约。

这里不会介绍可信设置等内容，只需执行下面的命令：
```
circom circuit.circom --r1cs --wasm --sym

```


