## circom 与 snarkjs

本章节, 我们将讲解如何使用 circom 和 snarkjs 创建一个零知识 zkSnark 电路, 并展示如何创建证明并在以太坊上进行链外和链上验证。


## 测试步骤

### 链外证明

* **tip**:  
如果直接运行命令例如`circom circuit.circom --r1cs --wasm --sym`报错 
  - 可以添加前缀`./node_modules/.bin/` -> `./node_modules/.bin/circom circuit.circom --r1cs --wasm --sym`
  - 或使用`npx` -> `npx circom circuit.circom --r1cs --wasm --sym`

- 安装依赖

```sh
yarn
```

- 创建 circuit.circom 文件
  文件内容如下

```circom
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
 snarkjs r1cs print circuit.r1cs circuit.sym
```

- 可信设置
##### 第一阶段: 获取`ptau`文件

1. **创建一个新的 `powers of tau ceremony`** (获取`tau`力量的仪式)
```
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
```
- new 之后的第一个参数是指您希望使用的曲线类型。(目前，可用的有 bn128 和 bls12-381。)
- 第二个参数是表明以 2 几次幂来作为电路的最大约束值：在本示例中，值为 12 也就是 2 ^ 12 = 4096。(目前可选的最大值是28, 即 2 ^ 28, ≈ 2.68 亿)

2. **为仪式提供贡献** 
```
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v
```
  - 使用 `contribute` 指令可以通过提供新的贡献来获取一个 `ptau` 文件
  - 系统将提示您输入一些随机文本作为额外的熵源
  - `ptau` 文件包含了到目前为止发生的一切发起的挑战和回应的历史记录, 而 `contribute` 会根据这个文件作为输入( `pot12_0000.ptau` ), 结合新贡献者所执行的计算, 来返回一个新的副本文件 (pot12_0001.ptau)
  - `name`没有限制, 只是作为一个参考, 当你验证文件时, 他会被打印出来

3. **再次提供贡献**
```
snarkjs powersoftau contribute pot12_0001.ptau pot12_0002.ptau --name="Second contribution" -v -e="some random text"
```
  - 通过 `-e` 我们可以跳过系统提示, 直接输入随机文本
```sh
snarkjs plonk setup circuit.r1cs pot12_final.ptau circuit_final.zkey
```

4. **验证当前的协议**
```
snarkjs powersoftau verify pot12_0002.ptau
```
如果一切顺利, 你可以在最后一行看到
```
[INFO]  snarkJS: Powers Of tau file OK!
```

5. **添加/应用随机信标**
```
snarkjs powersoftau beacon pot12_0002.ptau pot12_beacon.ptau 0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f 10 -n="Final Beacon"
```

- `beacon` 命令会创建一个`ptau`文件，这里我们需要提供的贡献将会是随机信标的形式。
- 我们需要使用`随机信标`来完成可信设置(`the trusted setup`)的第 1 阶段, [详见](https://github.com/iden3/snarkjs#6-apply-a-random-beacon)。
- **注意: 即便如此, 也会存在**[安全隐患](https://eprint.iacr.org/2017/1050)

6. **准备第二阶段**
执行完这一步后, 我们可以开始进行第二阶段, 也就是电路部分的计算以及验证
```
snarkjs powersoftau prepare phase2 pot12_beacon.ptau pot12_final.ptau -v
```
**在此开始之前, 别忘了再进行一次文件的确认**
```
snarkjs powersoftau verify pot12_final.ptau
```
##### 第二阶段
1. 为电路进行**可信设置**
```
snarkjs plonk setup circuit.r1cs pot12_final.ptau circuit_final.zkey
```
  **Tip:** 目前，snarkjs 支持 2 种证明系统：`groth16` 和 `PLONK`, 我们这里使用 `PLONK` 因为:
    - `groth16` 需要每条电路上都有一个受信仪式
    - `PLONK` 不需要, 它只要有一个广义上的 `powers of tau ceremony` 就足够了

2. 导出验证密钥
```
snarkjs zkey export verificationkey circuit_final.zkey verification_key.json
```

----
##### 至此一切就绪, 接下来我们开始: 
- 计算witness，需要创建`input.json`
```json
{"a": 3, "b": 11}
```
指定a,b的值。此步可以得出电路所有中间变量, 可以看到新增加了一个`witness.wtns`文件.

```sh
snarkjs calculatewitness --wasm circuit.wasm --input input.json
```


- 生成证明，根据`witness.wtns`生成证明。

```sh
snarkjs plonk prove circuit_final.zkey witness.wtns proof.json public.json
```
执行后会生成 `proof.json` 和 `public.json`。`proof.json`包含实际证明，而`public.json`包含公共输入和输出的值。



- 验证证明

```sh
snarkjs plonk verify verification_key.json public.json proof.json
```
执行完之后, 我们可以看到
```
[INFO]  snarkJS: OK!
```
也可以新建一个public-invalid.json。 
```
snarkjs plonk verify verification_key.json public-invalid.json proof.json
```
得到警告
```
[WARN]  snarkJS: Invalid Proof
```

### 链上证明(Proving on-chain)

- 生成 Solidity 的证明合约

  ```sh
  snarkjs zkey export solidityverifier circuit_final.zkey verifier.sol
  ```

- 生成调用的参数/模拟验证调用
  ```
  snarkjs zkesc public.json proof.json
  ```
  或者
  ```sh
  snarkjs zkey export soliditycalldata public.json proof.json
  ```

- 发布证明 
  可以复制 verifier.sol 代码到 remix 进行部署


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
- 零知识证明的可信设置是否值得担心?: https://www.sohu.com/a/468233201_100105055
- Diving into the zk-SNARKs Setup Phase: https://medium.com/qed-it/diving-into-the-snarks-setup-phase-b7660242a0d7
- scaffold-eth-zk: https://github.com/scaffold-eth/scaffold-eth-examples/tree/zk-voting-example