## plonkish and halo2
中文文档：https://trapdoor-tech.github.io/halo2-book-chinese/index.html
实操demo: https://trapdoor-tech.github.io/halo2-book-chinese/user/simple-example.html 
trapdoor bilibili: 

PSE：
Halo 2 - with PSE, Present by CC Liang： https://www.youtube.com/watch?v=ihPcnctm4q4&t=12s
plookup:
系统性课程0xparc: https://learn.0xparc.org/circom/
tutorial: https://github.com/icemelon/halo2-tutorial/

halo2 tutorial& gitbook: https://erroldrummond.gitbook.io/halo2-tutorial/

## 基本概念

Halo2: ultraPlonk + 嵌套均摊技术
three components: 
arithmetisation , polynomial commitment scheme(inner product argument), accumulation scheme(recursion)

plonk -> TurboPlonk(with custom constraints) -> UltraPlonk(lookup table)
**vanilla plonk**: 
ql*Xa + qr*Xb +qm*XaXb+qo*Xc=0
**TurboPLONK(GW19)**: 
each wire(column is encoded as a Lagrange polynomial)

**UltraPLONK**
lookup table
qlookup*a0+(1-qlookup)
三个特性：
 1. 采用plonk约束系统
 2. 采用lookup table
 3. 支持custom gate
 4. 模块化设计（多项式承诺方案采用KZG）

advice: private ,witness
instance: public input ,output 
fixed: lookup 
selector: bool value ,to control the  custom gate wheather turn on or off

loopup arguments:
 - useful for range check and bitwise operations
 

### 编程
- configure
 1. 申请 advice, instance , fixed , columns
 2. 定义custom gate
 3. 定义lookup关系式
- synthesize()
 1. 分配region;
 2. 给region中的变量赋值

Three steps to implement a circuit
- 1. define a config struct that includes the columns used in circuit
- 2. define a chip struct that configures the constraints in the circuit and providers assignment functions

- 3. deine a circuit struct that implements the circuit trait and instantiates a circuit
instance that will be fed into  the prover



## 参考链接
- PPT：  https://docs.google.com/presentation/d/1H2BziGitl16ARRgBwIZV5sYD_Xj16Zw0PfTRBl0_CxM/edit#slide=id.g132fa596714_0_0
- Halo2 Learning Group Homespace: https://0xparc.notion.site/Halo2-Learning-Group-Homespace-32b6c45eeaa84c3baa01015da98f3ab4
- 星想法halo2: https://space.bilibili.com/596457384 
- AppliedZKP zkEVM Circuit Code: A Guide: https://hackernoon.com/appliedzkp-zkevm-circuit-code-a-guide
- rust-zk 库： https://github.com/orgs/arkworks-rs/repositories?type=all