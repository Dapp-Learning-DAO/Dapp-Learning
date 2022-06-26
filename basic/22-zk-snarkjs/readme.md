## circom 与 snarkjs

本章节, 我们将讲解如何使用 circom 和 snarkjs 创建一个零知识 zkSnark 电路, 并展示如何创建证明并在以太坊上进行链外和链上验证


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
   signal private input a;
   signal private input b;
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
 snarkjs  info -r circuit.r1cs
```

PS: 查看 snarkjs 的具体命令参数可使用 npx snarkjs --help

- 打印电路的约束

```sh
 snarkjs printconstraints -r circuit.r1cs -s circuit.sym
```

- 可信设置，生成proving key & verification key。 执行后可以看到有两个新文件proving_key.json 和 verification_key.json.

```sh
snarkjs setup -r circuit.r1cs
```

- 计算witness，需要创建input.json 
```json
{"a": 3, "b": 11}
```
制定a,b的值。此步可以得出电路所有中间变量, 可以看到witness.json.

```sh
snarkjs calculatewitness --wasm circuit.wasm --input input.json
```


- 生成证明，根据witness.json和 procing_key.json生成证明。

```sh
snarkjs proof --witness witness.json --provingkey proving_key.json
```
执行后会生成proof.json 和 public.json。public.json包含公开输入和输出



- 验证证明

```sh
snarkjs verify --verificationkey verification_key.json --proof proof.json --public public.json
```
可以看到可以OK。
也可以新建一个public-invalid.json。 
```
snarkjs verify --verificationkey verification_key.json --proof proof.json --public public-invalid.json
```
可以看到invalid.

### 链上证明(Proving on-chain)

- 生成 Solidity 的证明合约

```sh
snarkjs generateverifier --verificationkey verification_key.json --verifier verifier.sol
```
会有Pairings and Verifier 两个合约，关注Verifier即可。

- 发布证明 
  可以复制 verifier.sol 代码到 remix 进行部署

- 生成调用的参数

```sh
snarkjs generatecall --proof proof.json --public public.json
```

- 进行合约调用
  将命令的输出复制到 Remix 中的 verifyProof 方法的 parameters 字段中，点击 call 调用 verifyProof  
  如果一切正常，方法应该返回 true  
  如果仅更改参数中的任何位，则可以检查结果返回 false




  ## circom语法
  1. <-- assigns a value to a signal without adding a constraint.
  2.  Whereas === adds a constraint without assigning a value.
  3. <== both assigns a value to a signal and adds a contraint。Which means it’s just the combination of === and <--.
## 参考资料

- 创建第一个零知识 snark 电路: https://learnblockchain.cn/article/1078   
- 参考文档：https://blog.iden3.io/first-zk-proof.html 
- circom2 doc: https://docs.circom.io/circom-language/basic-operators/
- snarkjs: https://github.com/iden3/snarkjs
- 深入浅出零知识证明之zk-SNARKs： https://www.yuque.com/u428635/scg32w/edmn74
- ZK Jargon Decoder: https://nmohnblatt.github.io/zk-jargon-decoder/foreword.html
- CTN rollup分享：https://www.bilibili.com/video/BV1oL4y1h7iE?p=1&share_medium=android&share_plat=android&share_session_id=9d2f7c31-a4dc-46a5-a2d9-4d6d0ebc3997&share_source=WEIXIN&share_tag=s_i&timestamp=1653798331&unique_k=921Lj1L&vd_source=3c62940e414c68a7f639c5737b9fd3d1
- zkRollup tutorial: https://keen-noyce-c29dfa.netlify.app/#16
