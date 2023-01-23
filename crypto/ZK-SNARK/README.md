# zk-SNARKs

## 预备知识

### 多项式

多项式有一个非常好的特性，就是如果我们有两个阶为 d 的不相等多项式，他们相交的点数不会超过 d。

多项式的「知识」就是多项式的系数。所谓「知道」多项式就是指「知道」多项式的系数。

#### Schwatz-Zippel 定理

我们不可能找到共享连续段的两条不相等曲线，也就是任何多项式在任意点的计算结果都可以看做是其唯一身份的表示。也就是说只要能证明多项式上的某个随机点就可以证明这个多项式（只有在知道了多项式，才能算出这个点对于的值），这个性质是我们下面所有证明的核心。

### Elliptic Curve Cryptography

椭圆加密曲线，我们需要利用它进行加密运算。

- [ECC README.md](../ECC/README.md)

### Pairing Function

Pairing 是可以使两个加密值相乘，并映射到另一个域的 mapping 过程(因为 KEA 的加密值之间不能进行运算)；

Pairing 是 zk-SNARKs 中的重要运算工具，主要用于约束 prover 使用合法的多项式变量和项来进行证明过程；

(建议先跳过底层原理，先理解 Pairing 运算特性即可开始学习 zk-SNARKs)

- [Pairing function WIKI](https://en.wikipedia.org/wiki/Pairing_function)
- [Exploring Elliptic Curve Pairings](https://medium.com/@VitalikButerin/exploring-elliptic-curve-pairings-c73c1864e627)
- [**Pairings For Beginners** by Craig Costello](https://static1.squarespace.com/static/5fdbb09f31d71c1227082339/t/5ff394720493bd28278889c6/1609798774687/PairingsForBeginners.pdf)

## FFT 快速傅立叶变换

- FFT 基础： <https://zhuanlan.zhihu.com/p/347091298?utm_campaign=shareopn&utm_medium=social&utm_oi=51691969839104&utm_psn=1581595683488063489&utm_source=wechat_session>

## zk-SNARK 原理介绍

### 初始版本

基于 Schwatz-Zippel 定理， 如果一个 prover 声称他知道一些 verifier 也知道的多项式（无论多项式的阶数有多大）时，他们就可以按照一个简单的协议去验证。

- verifier 选择一个随机值 x 并在本地计算多项式结果
- verifier 将 x 值给到 prover，并让他计算相关的多项式结果
- prover 代入 x 到多项式计算并将结果给到 verifier
- verifier 检查本地的计算结果和 prover 的计算结果是否相等，如果相等那就说明 prover 的陈述具有较高的可信度

> 我们把 x 的取值范围定在 1 到 10⁷⁷, 那么计算结果不同的点的数量，就有 10⁷⁷ – d 个。因而 x 偶然“撞到”这 d 个结果相同的点中任意一个的概率就等于（可以认为是几乎不可能） $\frac{d}{10^{77}}$

### 商式 h(X) 保持"ZeroKnowledge"

在不暴露多项式 p(x) 的系数的情况下给出令人信服的证明，也就是所谓的零知识 "Zero Knowledge".

我们可以证明，存在一个多项式 h(x) 能够使得 t(x) 与之相乘后等于 p(x)，由此得出， p(x) 中包含 t(x)，所以 p(x) 的根中也包含 t(x) 的所有根，即找出一个 h(x) 使得 `p(x)=t(x)h(x)`.

- verifier 挑选一个随机值 s, 计算 t = t(s) (即，求值) ，然后将 s 发送给 prover。
- prover 计算 h(x) =p(x) / t(x) ，并对 p(s) 和 h(s) 进行求值，将计算结果 p, h 提供给 verifier。
- verifier 验证 p= t⋅h，如果多项式相等，就意味着 t(x) 是 p(x) 的因式。

### 同态加密防止 prover 作弊

存在的问题

- prover 可能并不知道 p(x) 的系数，但是 prover 知道了 t(s)，他就可以反过来任意构造一个可以整除 t(s) 的非法多项式 p‘(s)
- prover 知道了点(s, t(s) · h(s)) 的值，就可以构造经过这一点的任意多项式，同样满足校验
- 协议并没有对 prover 的多项式阶数进行约束

所以要采用同同态加密隐藏秘密值 s :

Verifier:

- 取一个随机秘密值 s
- 指数 i 取值为 0，1，…，d 时分别计算对 s 求幂的加密结果，即: $E(s^i) = g^{s^i}$
- 代入 s 计算未加密的目标多项式 t(s), 将对 s 求幂的加密结果提供给 prover

  $E(s^0)，E(s^1)，......, E(s^d)$

Prover:

- 计算多项式 h(x) = p(x)/t(x)
- 获取加密值序列 $E(s^i)$, 以及系数 $C_i$ , 计算 E(p(s))， 以及 E(h(s))；
- 将结果 $g^p, g^h$ 提供给 verifier；

Verifier:

- 最后一步是 verifier 在加密域去校验 p = t(s) · h

  $g^{p} = (g^{h})^{t(s)} => g^{p} = g^{t(s)·h}$

### 约束 s

尽管这个协议中 prover 的灵活性有限，他依然可以在实际不使用 verifier 所提供的加密值进行计算，而是通过其它的方式来伪造证明。

为了限制 prover 只能用 verifier 提供的加密的 s 进行计算，需要让 prover 只能将系数 c 赋给 verifier 提供的多项式，所以我们将 s 各个次幂的值放到加密域，并使用 KEA 来约束，让 prover 无法知晓各个项的值。

verifier 提供加密值 $g^{s^0} ,g^{s^1} ,…,g^{s^d}$ 和他们的 α-shift 偏移值 $g^{αs^0} ,g^{αs^1} ,…,g^{αs^d}$

在最后 Verifier 的流程增加一步：

- ...验证(g^p)^α = g^p'即可

### 防止"知识"被暴力破解

在零知识 性质上也还依然存在一个很明显的缺陷：即理论上多项式参数 cᵢ 是一个很广的取值范围内的值，实际上这个范围可能很有限（比如前面例子中的 6），这就意味着 verifier 可以在有限范围的系数组合中进行暴力破解，最终计算出一个与 prover 的答案相等的结果。

prover 选择一个随机值 δ 作为偏移量，将知识在加密域上进行偏移，这样即能保持 "ZeroKnowledge"，也能为 Verifier 提供有效验证

$$
g^{\delta} \cdot p=g {\delta} \cdot t(s)h \\
g^{\delta αp} = g^{\delta p'}
$$

### 非交互式

目前我们的协议是交互式的，必须由 prover 和 verifier 产生互动，才能完成流程，存在下列问题：

- verifier 和 prover 串通作恶
- 每次产生的 proof 都需要长期存储，且期间可能存在私钥泄漏的风险

我们使用的同态加密并不支持两个秘密值相乘，这一点对 t(s) 和 h 的加密值相乘以及 p 和 α 的加密值相乘的验证都很重要。

Pairing 配对操作（双线性映射）是一个数学结构，表示为函数 e(g,g)，它给定一个数据集中的两个加密的输入（即
$ g^a, g^b $
），可以将他们确定性地映射到另一组不同的输出数据集上的它们的乘积，即

$e(g^a, g^b) = e(g, g)^{ab}$

### 简化的 zk-SNARKs 流程

- proving key(也被称为 evaluation key)
  $g^{s^i},g^{\alpha s^i}$

- verification key $g^{t(s)},g^α$

有了 verification key，verifier 就可以处理从 prover 那里得到的加密多项式的值 $g^p，g^h ，g^{p'}$

- 在加密空间中校验 p = t·h </br>
  $e(g^p,g^1) = e(g^t,g^h)$

- 校验多项式的限制 </br>
  $e(g^p,g^α) = e(g^{p'},g)$

### 完整的 zk-SNARKs 流程

- Setup

  - 选择一个生成元 g 和加密 pairing 函数 e

  - 对于函数 f(u)=y ，含有 n 个变量，其中有 m 个输入/输出变量，将其转换成 dgree 为 d，项数 n+1 的 QAP $(\{ l_i(x), r_i(x), o_i(x) \}_{i \in \{0,...,n\}}, t(x))$

  - 选取随机值 $s, \rho_l, \rho_r, \alpha_l, \alpha_r, \alpha_o, \beta, \gamma$

  - 设置
    $\rho_o=\rho_l \cdot \rho_r, \space g_l=g^{\rho_l}, g_r=g^{\rho_r}, g_o=g^{\rho_o}$

  - Proving key:

$$(\{ g^{s^k} \}_{k \in [d]}, \{ g_l^{l_i(s)}, g_r^{r_i(s)}, g_r^{o_i(s)} \}_{i \in \{0,...,n\}},$$

$$\{ g_l^{\alpha_l l_i(s)}, g_r^{\alpha_r r_i(s)}, g_o^{\alpha_o o_i(s)}, g_l^{\beta l_i(s)}, g_r^{\beta r_i(s)}, g_o^{\beta o_i(s)} \}_{i \in \{m+1,...,n\}},$$

$${\color{red} g_l^{t(s)}, g_r^{t(s)}, g_o^{t(s)}, g_l^{\alpha_l t(s)}, g_r^{\alpha_r t(s)}, g_o^{\alpha_o t(s)}, g_l^{\beta t(s)}, g_r^{\beta t(s)}, g_o^{\beta t(s)}} ) $$

- Verification key:

  $(g^1, g_o^{t(s)}, \{g_l^{l_i(s)}, g_r^{r_i(s)}, g_o^{o_i(s)}\}_{i \in \{0,...,m\}}, g^{\alpha_l}, g^{\alpha_r}, g^{\alpha_o}, g^{\gamma}, g^{\beta \gamma})$

- Proving

  - 根据 f(u) , 赋值计算过程中的中间变量
    $\{v_i\}_{m+1,..,n}$

  - 赋值操作数函数
    $$L(x)=l_o(x)+ \sum_{i=1}^{n}{v_i \cdot l_i(x)}$$

    R(x), O(x) 同样操作

  - 选取秘密值
    $\delta_l, \delta_r, \delta_o$

  - 计算
    $h(x)=\frac{L(x)R(x)-O(x)}{t(x)} \color{red} + \delta_r L(x) + \delta_l R(x) + \delta_l \delta_r t(x) - \delta_o$

  - 将多项式赋值到加密域，并应用 δ-shift 偏移，使其变成”zero knowledge”, 无法被 Verifier 破解

    $$g_l^{L_p(s)}={\color{red}(g_l^{t(s)})^{\delta_l}} \cdot \prod_{i=m+1}^{n}{(g_l^{l_i(s)})^{v_i}}$$

    $g_r^{R_p(s)}, g_o^{O_p(s)}$ 同样操作

  - 应用 α-shift 生成操作数一致性证明

    $$g_l^{L_p'(s)} = {\color{red} (g_l^{\alpha_l t(s)})^{\delta_l}} \cdot \prod_{i=m+1}^{n}{(g_l^{\alpha_l l_i(s)})^{v_i}}$$

    $g_r^{R_p(s)}, g_o^{O_p(s)}$ 同样操作

  - 应用 β 生成变量一致性证明

    $$g^{Z(s)}={\color{red} (g_l^{\beta t(s)})^{\delta_l} (g_r^{\beta t(s)})^{\delta_r} (g_o^{\beta t(s)})^{\delta_o}} \cdot \prod_{i=m+1}^{n}{(g_l^{\beta l_i(s)} g_r^{\beta r_i(s) g_o^{\beta o_i(s)}})^{v_i}}$$

  - Proof

    $$(g_l^{L_p(s)}, g_r^{R_p(s)}, g_o^{O_p(s)}, g^{h(s)}, g_l^{L_p'(s)}, g_r^{R_p'(s)}, g_o^{O_p'(s)}, g^{Z(s)})$$

- Verification

  - 解析 proof

  - 赋值 输入/输出 部分的多项式变量，计算加密域的

    $$g_l^{L_v(s)} = g_l^{l_0(s)} \cdot \prod_{i=1}^{m}{(g_l^{l_i(s)})^{v_i}}$$

    $g_r^{R_v(s)}, g_o^{O_v(s)}$ 同样操作

  - 通过 pairing 验证变量多项式约束
    $e(g_l^{L_p}, g^{\alpha_l})=e(g_l^{L_p'},g), \space g_r^{R_p}, g_o^{O_v(s)}$ 同样操作
  - 验证变量值的一致性
    $e(g_l^{L_p}, g_r^{R_p}, g_o^{O_p}, g^{\beta \gamma}) = e(g^Z, g^{\gamma})$
  - 验证结果合法性(h 不存在余数)

    $e(g_l^{L_p},g_l^{L_v(s)}, g_r^{R_p}, g_r^{R_v(s)}) = e(g_o^{t(s)}, g^h) \cdot e(g_o^{O_p} g_o^{O_v(s)}, g)$

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

1. Paradigm：<https://www.paradigm.xyz/2022/04/zk-hardware>
2. Paradigm cite 的 paper：<https://www.microsoft.com/en-us/research/publication/pipezk-accelerating-zero-knowledge-proof-with-a-pipelined-architecture/>
3. Justin Drake talk: <https://www.youtube.com/watch?v=ffXgxvlCBvo>

## Reference

- **Why and How zk-SNARK Works** by Makym

  - original articles

    - [Why and How zk-SNARK Works 1: Introduction & the Medium of a Proof](https://medium.com/@imolfar/why-and-how-zk-snark-works-1-introduction-the-medium-of-a-proof-d946e931160)
    - [Why and How zk-SNARK Works 2: Proving Knowledge of a Polynomial](https://medium.com/@imolfar/why-and-how-zk-snark-works-2-proving-knowledge-of-a-polynomial-f817760e2805)
    - [Why and How zk-SNARK Works 3: Non-interactivity & Distributed Setup](https://medium.com/@imolfar/why-and-how-zk-snark-works-3-non-interactivity-distributed-setup-c0310c0e5d1c)
    - [Why and How zk-SNARK Works 4: General-Purpose Computation](https://medium.com/@imolfar/why-and-how-zk-snark-works-4-general-purpose-computation-dcdc8081ee42)
    - [Why and How zk-SNARK Works 5: Variable Polynomials](https://medium.com/@imolfar/why-and-how-zk-snark-works-5-variable-polynomials-3b4e06859e30)
    - [Why and How zk-SNARK Works 6: Verifiable Computation Protocol](https://medium.com/@imolfar/why-and-how-zk-snark-works-6-verifiable-computation-protocol-1aa19f95a5cc)
    - [Why and How zk-SNARK Works 7: Constraints and Public Inputs](https://medium.com/@imolfar/why-and-how-zk-snark-works-7-constraints-and-public-inputs-e95f6596dd1c)
    - [Why and How zk-SNARK Works 8: Zero-Knowledge Computation](https://medium.com/@imolfar/why-and-how-zk-snark-works-8-zero-knowledge-computation-f120339c2c55)

  - [Scroll 翻译版本](https://mp.weixin.qq.com/mp/appmsgalbum?__biz=MzkyMTQxNTg0MQ==&action=getalbum&album_id=2695488884776058880&scene=173&from_msgid=2247485331&from_itemidx=1&count=3&nolastread=1#wechat_redirect)

  - 安比实验室 SECBIT 翻译版本

    - [从零开始学习 zk-SNARK（一）——多项式的性质与证明](https://secbit.io/blog/2019/12/25/learn-zk-snark-from-zero-part-one/)
    - [从零开始学习 zk-SNARK（二）——多项式的非交互式零知识证明](https://secbit.io/blog/2020/01/01/learn-zk-snark-from-zero-part-two/)
    - [从零开始学习 zk-SNARK（三）——从程序到多项式的构造](https://secbit.io/blog/2020/01/08/learn-zk-snark-from-zero-part-three/)
    - [从零开始学习 zk-SNARK（四）——多项式的约束](https://secbit.io/blog/2020/01/15/learn-zk-snark-from-zero-part-four/)
    - [从零开始学习 zk-SNARK（五）——Pinocchio 协议](https://secbit.io/blog/2020/01/22/learn-zk-snark-from-zero-part-five/)

- Vitalik's blog

  - [Quadratic Arithmetic Programs: from Zero to Hero](https://medium.com/@VitalikButerin/quadratic-arithmetic-programs-from-zero-to-hero-f6d558cea649)
  - [Exploring Elliptic Curve Pairings](https://medium.com/@VitalikButerin/exploring-elliptic-curve-pairings-c73c1864e627)
  - [Zk-SNARKs: Under the Hood](https://medium.com/@VitalikButerin/zk-snarks-under-the-hood-b33151a013f6)

- [Star Li 零知识证明 - zkSNARK 入门](https://mp.weixin.qq.com/s/vO6-34W1qUFdLWRM0QjZXQ)
- [星辰实验室-zk 文档](https://drive.google.com/file/d/1A5EtvJaNz17fgSbgBfgKWYY6OBX6PDrT/view?usp=sharing)
- [星辰实验室-zkPPT](https://drive.google.com/file/d/1pP8HdRSflWo93xYaIpfUSkhtNICS0hDr/view?usp=sharing)
- [入门视频](https://www.youtube.com/watch?v=lGogdTnD4SE)
- [CTN zkdapp 实战](https://www.bilibili.com/video/BV1oL4y1h7iE?p=1&share_medium=android&share_plat=android&share_session_id=9d2f7c31-a4dc-46a5-a2d9-4d6d0ebc3997&share_source=WEIXIN&share_tag=s_i&timestamp=1653798331&unique_k=921Lj1L)
- [Awesome-ZK-kurtpan](https://kurtpan666.github.io/ktpzkp22.html)
- [0xparc -ZK 学习资料](https://learn.0xparc.org/)
- [tss-教程](https://github.com/ZenGo-X/awesome-tss)
- [devcon What to know about Zero Knowledge](https://www.youtube.com/watch?v=hBupNf1igbY&t=1370s)
- [zkdoc](https://github.com/a16z/zkdocs)
