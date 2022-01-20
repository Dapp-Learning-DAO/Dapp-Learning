## circom 与 snarkjs

本章节, 我们将讲解如何使用 circom 和 snarkjs 创建一个零知识 zkSnark 电路, 并展示如何创建证明并在以太坊上进行链外和链上验证

## 电路使用步骤

libsnark 使用步骤：

1. 将待证明的命题表达为 R1CS
2. 使用生成算法 G 为该命题生成公共参数
3. 使用证明生成算法生成 R1CS 可满足的证明
4. 使用验证算法来验证证明

## 测试步骤

### 链外证明

- 安装依赖

```sh
yarn
```

- 创建 circuit.circom 文件
  文件内容如下

```circom
pragma circom 2.0.0;

/*This circuit template multiplies in1 and in2.*/

template Multiplier2 () {

   // Declaration of signals.
   signal input a;
   signal input b;
   signal output c;

   // Statements.
   c <== a * b;
}

component main = Multiplier2();
```

- 编译电路

```sh
circom circuit.circom --r1cs --wasm --sym
```

- 显示电路的信息

```sh
npx snarkjs r1cs info circuit.r1cs
```

PS: 查看 snarkjs 的具体命令参数可使用 npx snarkjs --help

- 打印电路的约束

```sh
npx snarkjs r1cs print circuit.r1cs circuit.sym
```

- 下载 tau ceremony 文件

```sh
wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_10.ptau
```

- 生成 zkey 文件

```sh
npx snarkjs zkey new circuit.r1cs powersOfTau28_hez_final_10.ptau circuit_0000.zkey
```

- 增加 out contribution，随机输入一段文本，比如'123'

```sh
npx snarkjs zkey contribute circuit_0000.zkey circuit_final.zkey
```

- 导出证明 key

```sh
npx snarkjs zkey export verificationkey circuit_final.zkey verification_key.json
```

- 创建 input.json 文件, 文件内容如下

```json
{"a": 3, "b": 11}
```

- 计算见证

```sh
node ./circuit_js/generate_witness.js ./circuit_js/circuit.wasm input.json witness.wtns
```

- 导出 witness.wtns 见证文件为 json 格式

```sh
npx snarkjs wtns export json witness.wtns witness.json
```

- 创建证明

```sh
npx snarkjs groth16 prove circuit_final.zkey witness.wtns proof.json public.json
```

- 验证证明

```sh
npx snarkjs groth16 verify verification_key.json public.json proof.json
```

### 链上证明

- 生成 Solidity 的证明

```sh
npx snarkjs zkey export solidityverifier circuit_final.zkey verifier.sol
```

- 发布证明
  可以复制 verifier.sol 代码到 remix 进行部署

- 生成调用的参数

```sh
npx snarkjs zkey export soliditycalldata public.json proof.json
```

- 进行调用
  将命令的输出复制到 Remix 中的 verifyProof 方法的 parameters 字段中，点击 call 调用 verifyProof  
  如果一切正常，方法应该返回 true  
  如果仅更改参数中的任何位，则可以检查结果返回 false

## 参考资料

- 创建第一个零知识 snark 电路: https://learnblockchain.cn/article/1078   
- circom2 doc:https://docs.circom.io/circom-language/basic-operators/
