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

> [!NOTE]
> javascript的poseidon，得出的哈希数据，默认情况下和go sdk、circomlib生成的不一致，这是因为javascript的poseidon哈希没有进行montgomery格式转换。可以参考test/test.js中的goodPoseidon，它得到的哈希值是正确的。

## build电路

build电路，是指生成如下内容：
- wasm：生成电路的wasm文件，以用于计算见证。
- zkey：所谓prooving key，proover使用它来生成证明。注意，它是公开的，不是秘密的！
- vkey：所谓verification key，verifier使用它来验证证明。它也是公开的。
- 合约：可以生成一个Verifier合约。

### 生成wasm
```
circom circuit.circom --r1cs --wasm --sym

```
### 生成zkey、vkey
以groth16为例。生成zkey(circuit_final.zkey)和vkey(verification_key.json)：
```
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v
snarkjs groth16 setup circuit.r1cs pot12_final.ptau circuit_0000.zkey
snarkjs zkey contribute circuit_0000.zkey circuit_final.zkey --name="First contribution" -v
snarkjs zkey export verificationkey circuit_final.zkey verification_key.json

```


> [!NOTE]
> 这个过程中，会让用户输入随机分量。这是因为，groth16 的可信设置，是共同协商出一个随机数 $g^s$，第i个贡献者自己准备一个随机数 $s_i$, 然后对前 i-1 个贡献者产出的数据（记为 $r_{i-1}$） $g^{s1s2..s_{i-1}}$ 进行计算： $r_i = r_{i-1}^{si} = g^{s1s2...si}$。直到所有贡献者都贡献完毕，就得到了 $g^s$。如果任何一个用户删除了自己的随机分量，那么即使剩余用户合谋，那么也需要极大算力去暴力猜测缺失的分量。


### 导出合约
导出合约(verifier.sol)：
```
snarkjs zkey export solidityverifier circuit_final.zkey verifier.sol
```

在示例中，已经在artifact目录存放了这些内容。

## 编写dapp（以合约作为verifier为例）
编写dapp通常包括两个内容：创建业务合约、调用合约。

### 创建业务合约
首先我们创建一个业务合约My.sol，它只有在哈希验证通过后，才执行某个逻辑。它继承了Verifier合约，因此也继承了verifyProof函数。可参考[contracts]目录。

可以编译它们得到abi和bin。示例中，已经将abi和bin放在了artifact目录。

> [!NOTE]
> 注意，zk证明分为 pa、pb、pc、publicSignals 几个部分，把他们交给 verifyProof 即可，如果该函数为 true，则意味着验证通过。
> 
> 注意，还需要验证 publicSignals 的业务意义。另外，注意本例子中，publicSignals[0] 是输出信号 out，publicSignals[1] 才是 dataHash。


### 调用业务合约
这里面我们使用ethers（v5版本）去调用业务合约。其中，snarkjs用于生成证明。

在[scripts]中，我们：
- 部署My合约
- 生成zk证明，以在不披露data的情况下，证明我们持有dataHash的poseidon原像
- 调用合约的execute函数。合约会验证如下内容后抛出Execute事件：
    - 用户存在满足特定约束的一组输入
    - 其中的dataHash和链上记录的一致

用户可以在另一个终端启动一个本地节点(例如yarn hardhat node)，然后运行call_contract.js:

```
cd scripts
node call_contract.js
```

如果打印出success，则为成功。读者还可以去修改代码，例如修改publicSignals的值，那么会导致交易失败。
---
**Note**

注意，不管约束多复杂，证明都是常数时间，这也是zksnark的威力。

此外，注意构造proof中pb的方式。
---
