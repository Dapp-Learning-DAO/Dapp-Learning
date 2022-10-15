
# 介绍

这个练习中，Prover向Verifier证明自己知道如下多项式的解：

$$ x^2 + 2x - 3 = 0$$

# 步骤1:确定电路
第一步是确定电路，电路的逻辑是根据输入x来计算输出，其中x是私有的：

```
pragma circom 2.0.0;


template PolyVerifier(a, b) {
    signal input x;
    signal output out;
    out <== a*x*x + b*x ;
}

component main = PolyVerifier(1, 2);
```

# 步骤2:电路编译
然后编译为R1CS：

```
circom poly.circom --r1cs --wasm --sym
```
如果我们打印，会发现约束被定义为axx + bx - out = 0的形式:
```
snarkjs r1cs print poly.r1cs poly.wasm
```


# 步骤3:创建见证

创建input.json，并调用wasm模块会运行电路文件运算一遍，得到见证文件witness.wtn，它包括了所有输入信号、中间信号、输出信号。
```
{
    "x": 1
}

```

```
node poly_js/generate_witness.js poly_js/poly.wasm input.json witness.wtns
```

# 步骤4:可信设置
采用groth16进行可信设置，目的是得到一个私有的.zkey用于生成证明，和一个公开的verification_key用于验证证明。可信设置分为两个阶段，这里模拟两个参与方对它们进行贡献。

```
# 初始化powersoftau仪式
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v 
# 为仪式阶段1注入随机数 。本例中模拟两个启动方，做两个贡献，这是第一个贡献
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v 
# 为仪式阶段2注入随机数 。本例中模拟两个启动方，做两个贡献，这是第二个贡献
snarkjs powersoftau contribute pot12_0001.ptau pot12_0002.ptau --name="Second contribution" -v 
# 定版，得到最终贡献的ptau
snarkjs powersoftau prepare phase2 pot12_0002.ptau pot12_final.ptau -v 
# 生成zkey 
snarkjs groth16 setup poly.r1cs pot12_final.ptau poly_0000.zkey 
# 为仪式阶段1注入随机数 。本例中模拟两个启动方，做两个贡献，这是第一个贡献
snarkjs zkey contribute poly_0000.zkey poly_0001.zkey --name="First contribution" -v
# 为仪式阶段2注入随机数 。本例中模拟两个启动方，做两个贡献，这是第二个贡献
snarkjs zkey contribute poly_0001.zkey poly_0002.zkey --name="First contribution" -v

# 随机数注入完成，导出验证key
snarkjs zkey export verificationkey poly_0002.zkey verification_key.json
```

# 步骤5:生成证明
接下来借助前面生成的zkey、见证和r1cs生成证明，证明包括public.json和proof.json，前者包括了全部的公开输入，和计算出来的输出
```
snarkjs groth16 prove poly_0002.zkey witness.wtns proof.json public.json
```

# 步骤6:验证证明
验证者可以使用verificaiton key，public.json，proof.json完成验证。验证了生成证明这个人，真的持有一个值x，满足$$ x^2 + 2x + 1 = 0$$。


```
snarkjs groth16 verify verification_key.json public.json proof.json
```
