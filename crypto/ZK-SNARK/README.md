# ZK-SNARK

## 原理介绍
 #### 多项式
 1. 多项式有一个非常好的特性，就是如果我们有两个阶为 d 的不相等多项式，他们相交的点数不会超过 d。
 这也是为什么如果一个 prover 声称他知道一些 verifier 也知道的多项式（无论多项式的阶数有多大）时，他们就可以按照一个简单的协议去验证：
证明1:
 - verifier 选择一个随机值 x 并在本地计算多项式结果
 - verifier 将 x 值给到 prover，并让他计算相关的多项式结果
 - prover 代入 x 到多项式计算并将结果给到 verifier
 - verifier 检查本地的计算结果和 prover 的计算结果是否相等，如果相等那就说明 prover 的陈述具有较高的可信度
我们把 x 的取值范围定在 1 到 10⁷⁷, 那么计算结果不同的点的数量，就有 10⁷⁷ – d 个。因而 x 偶然“撞到”这 d 个结果相同的点中任意一个的概率就等于（可以认为是几乎不可能）：${\frac{d}{10^{77}} }

**预备知识**
多项式的「知识」就是多项式的系数。所谓「知道」多项式就是指「知道」多项式的系数。

**Schwatz-Zippel 定理**
我们不可能找到共享连续段的两条不相等曲线，也就是任何多项式在任意点的计算结果都可以看做是其唯一身份的表示。也就是说只要能证明多项式上的某个随机点就可以证明这个多项式（只有在知道了多项式，才能算出这个点对于的值），这个性质是我们下面所有证明的核心。


2. 

证明2：
不暴露知道多项式p(x)，那就要证明
存在一些多项式 h(x) 能够使得 t(x) 与之相乘后等于 p(x)，由此得出， p(x) 中包含 t(x)，所以 p(x) 的根中也包含 t(x) 的所有根，这也就是我们要证明的东西。
证明2:
- verifier 挑选一个随机值 r, 计算 t = t(r) (即，求值) ，然后将 r 发送给 prover。
- prover 计算 h(x) =p(x) / t(x) ，并对 p(r) 和 h(r) 进行求值，将计算结果 p, h 提供给 verifier。
- verifier 验证 p= t⋅h，如果多项式相等，就意味着 t(x) 是 p(x) 的因式。

3. 问题，prover可能并不知到p(x),存在问题：
prover 知道了 t(r)，他就可以反过来任意构造一个可以整除 t(r) 的 p(r)
prover 知道了点(r,t(r) · h(r)) 的值，就可以构造经过这一点的任意多项式，同样满足校验
协议并没有对 prover 的多项式阶数进行约束
 所以要隐藏r, 采用同同态加密。获得多项式在一些未知数 x 处的加密计算结果。
 Verifier
证明3：
Verifier:
- 取一个随机数 s ，也就是秘密值
- 指数 i 取值为 0，1，…，d 时分别计算对 s 求幂的加密结果，即：E(s^i) = g^{s^i}
- 代入 s 计算未加密的目标多项式： t(s)
将对 s 求幂的加密结果提供给 prover：E(s^0)，E(s^1)，......, E(s^d);
Prover: 
- 计算多项式 h(x) = p(x)/t(x)
- 获取加密值序列E(S^i), 以及 系数Ci; 计算E(p(s))， 以及E(h(s))；
- 将结果 g^p和 g^h提供给 verifier；

Verifier：
- 最后一步是 verifier 去校验 p = t(s) ·h：  g^{p} = (g^{h})^{t(s)} => g^{p} = g^{t(s)·h}

尽管这个协议中 prover 的灵活性有限，他依然可以在实际不使用 verifier 所提供的加密值进行计算，而是通过其它的方式来伪造证明。

4. 为了限制” prover 只能用 verifier 提供的加密的 s 进行计算，因而 prover 只能将系数 c 赋给 verifier 提供的多项式。
verifier 提供加密值 g^{s^0} ,g^{s^1} ,…,g^{s^d} 和他们的变换 g^{αs^0}  ,g^{αs^1} ,…,g^{αs^d} 
证明4:
额外验证(g^p)^α = g^p'即可
 
 

 5. 在零知识 性质上也还依然存在一个很明显的缺陷：即理论上多项式参数 cᵢ 是一个很广的取值范围内的值，实际上这个范围可能很有限（比如前面例子中的 6），这就意味着 verifier 可以在有限范围的系数组合中进行暴力破解，最终计算出一个与 prover 的答案相等的结果。
就是 prover 选择一个随机值 δ ，并用它对证明中的值进行求幂。
 加上一个delta， 
 g^δ⋅p=g δ⋅t(s)h
 g^{δαp} = g^{δp'}
′
6. 改成非交互式的，防止verifier和prover串通，以及verifier存储问题
我们使用的同态加密并不支持两个秘密值相乘，这一点对 t(s) 和 h 的加密值相乘以及 p 和 α 的加密值相乘的验证都很重要。

配对操作（双线性映射）是一个数学结构，表示为函数 e(g,g)，它给定一个数据集中的两个加密的输入（即 ga, gb ），可以将他们确定性地映射到另一组不同的输出数据集上的它们的乘积，即 e(ga, gb) = e(g, g)ab：

7. 最终版
把 CRS 分成两组（ i 为 0，1,…,d ）：

proving key（也被称为 evaluation key）：(g^{s^i},g^{αs^i})
verification key：(g^{t(s)},g^α)

有了verification key，verifier 就可以处理从 prover 那里得到的加密多项式的值 g^p，g^h ，g^{p'}

在加密空间中校验 p = t·h：

e(g^p,g^1) = e(g^t,g^h)
校验多项式的限制：

e(g^p,g^α) = e(g^{p'},g)
​


## paper

paper pdf files store at here: <https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/tree/main/papers/5-Crypto/ZK-SNARK/>

paper list:

- A Taxonomy of Circuit Languages
- How to Make SNARKs
- MEV
- Security of ZK Friendly Hash Functions
- SNARKs from Hash Functions
- Verifiable Delay Functions
- Why and How zk-SNARK Works: Definitive Explanation
- zksnark 在 Zcash 中的作用
- zkSNARKs from Polynomial Commitments

## zk hardware
reference：
1. Paradigm：https://www.paradigm.xyz/2022/04/zk-hardware
2. Paradigm cite的paper：https://www.microsoft.com/en-us/research/publication/pipezk-accelerating-zero-knowledge-proof-with-a-pipelined-architecture/
3. Justin Drake talk: https://www.youtube.com/watch?v=ffXgxvlCBvo

## reference

- 安比实验室 SECBIT blog zk-SNARK 系列文章
  - [从零开始学习 zk-SNARK（一）——多项式的性质与证明](https://secbit.io/blog/2019/12/25/learn-zk-snark-from-zero-part-one/)
  - [从零开始学习 zk-SNARK（二）——多项式的非交互式零知识证明](https://secbit.io/blog/2020/01/01/learn-zk-snark-from-zero-part-two/)
  - [从零开始学习 zk-SNARK（三）——从程序到多项式的构造](https://secbit.io/blog/2020/01/08/learn-zk-snark-from-zero-part-three/)
  - [从零开始学习 zk-SNARK（四）——多项式的约束](https://secbit.io/blog/2020/01/15/learn-zk-snark-from-zero-part-four/)
  - [从零开始学习 zk-SNARK（五）——Pinocchio 协议](https://secbit.io/blog/2020/01/22/learn-zk-snark-from-zero-part-five/)
  
  - [Star Li 零知识证明 - zkSNARK入门](https://mp.weixin.qq.com/s/vO6-34W1qUFdLWRM0QjZXQ)
  - [星辰实验室-zk文档](https://drive.google.com/file/d/1A5EtvJaNz17fgSbgBfgKWYY6OBX6PDrT/view?usp=sharing)
  - [星辰实验室-zkPPT](https://drive.google.com/file/d/1pP8HdRSflWo93xYaIpfUSkhtNICS0hDr/view?usp=sharing)
  - [入门视频](https://www.youtube.com/watch?v=lGogdTnD4SE)
  - [CTN zkdapp实战](https://www.bilibili.com/video/BV1oL4y1h7iE?p=1&share_medium=android&share_plat=android&share_session_id=9d2f7c31-a4dc-46a5-a2d9-4d6d0ebc3997&share_source=WEIXIN&share_tag=s_i&timestamp=1653798331&unique_k=921Lj1L)
  - [Awesome-ZK-kurtpan](https://kurtpan666.github.io/ktpzkp22.html)
  - [0xparc -ZK学习资料](https://learn.0xparc.org/)
  - [tss-教程](https://github.com/ZenGo-X/awesome-tss)
  - [devcon What to know about Zero Knowledge](https://www.youtube.com/watch?v=hBupNf1igbY&t=1370s)