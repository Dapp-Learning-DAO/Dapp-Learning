# Elliptic Curve Cryptography

> 本文部分内容出自 [Andrea Corbellini](https://www.linkedin.com/in/andreacorbellini/) 的系列文章，搭配阅读原文体验更佳
> [Elliptic Curve Cryptography: a gentle introduction](https://andrea.corbellini.name/2015/05/17/elliptic-curve-cryptography-a-gentle-introduction/)

椭圆曲线密码学（英语：Elliptic Curve Cryptography，缩写：ECC）是一种基于椭圆曲线数学的公开密钥加密算法。椭圆曲线在密码学中的使用是在 1985 年由 Neal Koblitz 和 Victor Miller 分别独立提出的。

ECC 的主要优势是它相比 RSA 加密算法使用较小的密钥长度并提供相当等级的安全性[1]。ECC 的另一个优势是可以定义群之间的双线性映射，基于 Weil 对或是 Tate 对。

比特币采用了椭圆曲线签名算法来签署交易，我们来看看椭圆曲线加密的数学原理，看看在选定了私钥之后，如何运算出公钥。

<details>
<summary>建议预先掌握的知识点：</summary>

- Group (mathematics) 群, Subgroup 子群, Finite field 有限域
  - [Abstract Algebra: The definition of a Group](https://www.youtube.com/watch?v=QudbrUcVPxk&list=PLi01XoE8jYoi3SgnnGorR_XOW3IcK-TP6&index=3)
  - [Group Definition (expanded) - Abstract Algebra](https://www.youtube.com/watch?v=g7L_r6zw4-c&list=PLi01XoE8jYoi3SgnnGorR_XOW3IcK-TP6&index=2)
  - [Abstract Algebra: The definition of a Subgroup](https://www.youtube.com/watch?v=TJAQNlGvfjE&list=PLi01XoE8jYoi3SgnnGorR_XOW3IcK-TP6&index=5)
- [Euler's Totient Function](https://www.youtube.com/watch?v=NgZ33qr5WHM)
- [Extended Euclidean Algorithm](https://www.youtube.com/watch?v=6KmhCKxFWOs)

</details>
</br>

## Elliptic Curves

首先定义椭圆曲线方程，我们需要的是在曲线上的点的集合 (the set of points described by the equation)

<!-- $y^2 = x^3 + ax + b$ -->
<img src="https://render.githubusercontent.com/render/math?math=y^2 = x^3 %2B ax %2B b" />

![Different shapes for different elliptic curves ](https://andrea.corbellini.name/images/curves.png)

Different shapes for different elliptic curves (b = 1, -3 < a < 2)

![Types of singularities](https://andrea.corbellini.name/images/singularities.png)

Types of singularities: 左边是带奇点的曲线，右边是自相交的曲线，都不是有效的椭圆曲线

椭圆曲线关于 x 轴对称。我们还需要定义一个无穷远点作为 0 点 (symbol 0)

最终曲线定义如下

<!-- $\left\{ (x, y) \in \mathbb{R}^2\ |\ y^2 = x^3 + ax + b,\ 4 a^3 + 27 b^2 \ne 0 \right\}\ \cup\ \left\{ 0 \right\}$ -->
<img src="https://render.githubusercontent.com/render/math?math=\left\{ (x, y) \in \mathbb{R}^2\ |\ y^2 = x^3 %2B ax %2B b,\ 4 a^3 %2B 27 b^2 \ne 0 \right\}\ \cup\ \left\{ 0 \right\}" />

## The group law for elliptic curves

### Group

理解群的概念

群 G 是一个元素集合，我们给他定义了一个二元运算方法，“加法” +。

1. **closure**: 对于 G 中的元素 a 和 b, a + b 也是 G 中的元素;
2. **associativity**: (a+b)+c=a+(b+c);
3. **identity element**: 单位元 0 ， a+0=0+a;
4. **inverse**: 每个元素都有一个逆元，即对于 G 中的元素 a 都存在一个元素 b, a + b = 0;

我们附加了一条特性

5. **commutativity**: a+b=b+a (Abelian group 阿贝尔群)

### Geometric addition

我们在椭圆曲线上定义了一个群，是曲线上点的集合

- 元素是椭圆曲线上的点
- identity element 是无穷远的 0 点(point at infinity 0)
- 对于点 P ，inverse (逆元) 是关于 x 轴对称的点
- addition 加法的规则：一条直线与椭圆曲线相交的三个非 0 的点 P, Q, R 他们的和是 0 点，即 P+Q+R=0
  - P+Q=-R
  - -R 是 R 的逆元
  - 即 P+Q 等于 R 相对于 x 轴对称的点

![Draw the line through  and . The line intersects a third point . The point symmetric to it, , is the result of .](https://andrea.corbellini.name/images/point-addition.png)

P+Q=-R

直线与椭圆曲线相交有三种特殊情况

1. P=0 or Q=0. 我们不可能在 xy 坐标上标出 0 点(无穷远)，所以也无法画出这条线。但我们可以将 0 点定义为 identity element (单位元)，即 P+0=P and 0+Q=Q
2. P=-Q. P 和 Q 关于 x 轴对称，此时直线将于 x 轴垂直，与椭圆曲线没有第三个交点 R，则 Q 是 P 的逆元，即 P+Q=0
3. P=Q. Q 无限接近 P 点，直线是椭圆曲线的切线,P+Q=P+P=-R

![As the two points become closer together, the line passing through them becomes tangent to the curve.](https://andrea.corbellini.name/images/animation-point-doubling.gif)

可以到这里尝试自己修改参数，观察曲线和直线交点的变化 [HTML5/JavaScript visual tool](https://andrea.corbellini.name/ecc/interactive/reals-add.html)

## Algebraic addition

为了精确计算点的加法，我们需要把上述几何方法转换为代数算法。

已知 P,Q 的坐标，计算 R 点。

```math
P=(xP, yP)
Q=(xQ, yQ)
```

## xP!=xQ

首先考虑 xP != xQ 的情况，直线的斜率 m 为

<!-- $m = \frac{y_P - y_Q}{x_P - x_Q}$ -->
<img src="https://render.githubusercontent.com/render/math?math=m = \frac{y_P - y_Q}{x_P - x_Q}" />

联立直线和椭圆方程，则 R 的坐标可以如下计算 (?? xR 的公式推导还没有想明白 ??)

<!-- $x_R= m^2 - x_P - x_Q$ -->
<img src="https://render.githubusercontent.com/render/math?math=x_R= m^2 - x_P - x_Q" />

<!-- $y_R= y_P + m(x_R - x_P)$ -->
<img src="https://render.githubusercontent.com/render/math?math=y_R= y_P %2B m(x_R - x_P)" />

或者

<!-- $y_Q= y_P + m(x_R - x_Q)$ -->
<img src="https://render.githubusercontent.com/render/math?math=y_R= y_Q %2B m(x_R - x_Q)" />

计算出 R 点之后，进而得出关于 x 轴对称点 -R，即为 P+Q 的结果

(xP,yP) + (xQ,yQ) = (xR,-yR)

我们可以用实际的点去验证上述公式

- (1,2)+(3,4)=(-3,2)
- (-1,4)+(1，2)=(1,-2)

### xP=xQ

我们先将椭圆曲线方程改成 y 的一次方形式

<!-- $y_P = \pm \sqrt{x_P^3 + ax_P + b}$ -->
<img src="https://render.githubusercontent.com/render/math?math=y_P = \pm \sqrt{x_P^3 %2B ax_P %2B b}" />

当 P，Q 横坐标相同，直线为椭圆曲线的切线，我们将更改斜率 m 的定义为椭圆曲线的导函数

<!-- $m = \frac{3 x_P^2 + a}{2 y_P}$ -->
<img src="https://render.githubusercontent.com/render/math?math=m=\frac{3 x_P^2 %2B a}{2 y_P}" />

xR 和 yR 的公式保持不变，我们将 P=Q=(1,2) 代入公式验证

(1,2)+(1,2)=2(1,2)=(-1,-4)

## Scalar multiplication

上述加法运算中，当 P=Q 时，P+P=2P，我们可以将其定义为 **scalar multiplication** 标量乘法。

nP=P+P+...+P (n times)

如果 n 在二进制中有 k 位(If n has k binary digits)，其算法复杂度 O(2^k)，我们需要对其优化。

**double and add algorithm** 用一个例子解释该算法工作原理：假设 n=151,其二进制表示为 10010111

<!-- $151= 1 \cdot 2^7 + 0 \cdot 2^6 + 0 \cdot 2^5 + 1 \cdot 2^4 + 0 \cdot 2^3 + 1 \cdot 2^2 + 1 \cdot 2^1 + 1 \cdot 2^0$ -->
<img src="https://render.githubusercontent.com/render/math?math=151= 1 \cdot 2^7 %2B 0 \cdot 2^6 %2B 0 \cdot 2^5 %2B 1 \cdot 2^4 %2B 0 \cdot 2^3 %2B 1 \cdot 2^2 %2B 1 \cdot 2^1 %2B 1 \cdot 2^0" />

double and add algorithm 将要做的是：

- P, 即 2^0\*P
- P+P=2P, 即 2^1\*P
- 2P+2P=4P, 即 2^2\*P
- 4P+4P=8P, 即 2^3\*P
- 8P+8P=16P, 即 2^4\*P
- 151P = 2^4\*P + 2^2\*P + 2^1\*P + 2^0\*P

算法 python 实现

```python
def bits(n):
    """
    Generates the binary digits of n, starting
    from the least significant bit.

    bits(151) -> 1, 1, 1, 0, 1, 0, 0, 1
    """
    while n:
        yield n & 1
        n >>= 1

def double_and_add(n, x):
    """
    Returns the result of n * x, computed using
    the double and add algorithm.
    """
    result = 0
    addend = x

    for bit in bits(n):
        if bit == 1:
            result += addend
        addend *= 2

    return result
```

假定 翻倍 doubling 和 加法 adding 操作都是 O(1), 那么这个算法将是 O(log(n)) (如果我们考虑 n 的位数，将是 O(k))

## The field of integers modulo p

首先，有限域是具有有限个元素的集合。有限域的一个例子是模 p 的整数集合，其中 p 是素数。它通常表示为 Z/p、GF(p) 或 Fp。我们将使用后一种表示法。

在有限域中，我们有两种二元运算：addition(+), multiplication(·)。两种运算都符合 closed, associative and commutative 特性。

举例说明，对于 F23 (mod 23 的有限域)

- Addition: (18+9) mod 23 = 4
- Subtraction: (7-14) mod 23 = 16
- Multiplication: 4·7 mod 23 = 5
- Additive inverse: -5 mod 23 = 18
  - (5+(-5)) mod 23 = (5+18) mod 23 = 0
- Multiplicative inverse: 9^-1 mod 23 = 18
  - 9·9^-1 mod 23 = 9·18 mod 23 = 1

**p 必须是素数！**

整数模 4 的集合不是一个域：2 没有乘法逆元（即方程 2⋅x mod 4=1 没有解）。

### Division modulo p

在 Fp 中的除法模运算即为求出一个元素的乘法逆元，然后执行乘法运算。

x/y = x·y^-1

根据拓展欧几里得算法 [extended Euclidean algorithm](https://en.wikipedia.org/wiki/Extended_Euclidean_algorithm) , 求出一个元素的乘法逆元的复杂度将是 O(log(p)) (如果考虑二进制位数将是 O(k))。

给定 n 和 p，求 n 在 Fp 中的乘法逆元，即当 n · n^-1 mod p = 1 时，求 n^-1

上述条件可以改写为 n · x - p · y = 1, 其中 y 为 n // p (商) ， x % p 即为 n^-1 (x 有可能比 p 大，固结果还要取模)

Computing the multiplicative inverse Python implementation

- `extended_euclidean_algorithm(a, b)`
  - 根据拓展欧几里得算法，返回 GCD (最大公约数), x, y
  - 使用辗转相除法，当余数 r 为 0 时终止循环
  - 返回结果满足 a \* x + b \* y = GCD
- `inverse_of(n, p)` 求 n 在 Fp 中的乘法逆元
  - 当 gcd = 1 时，乘法逆元即为 x % p
  - 否则 n 在 Fp 中不存在乘法逆元

```python
def extended_euclidean_algorithm(a, b):
    """
    Returns a three-tuple (gcd, x, y) such that
    a * x + b * y == gcd, where gcd is the greatest
    common divisor of a and b.

    This function implements the extended Euclidean
    algorithm and runs in O(log b) in the worst case.
    """
    s, old_s = 0, 1
    t, old_t = 1, 0
    r, old_r = b, a

    while r != 0:
        quotient = old_r // r
        old_r, r = r, old_r - quotient * r
        old_s, s = s, old_s - quotient * s
        old_t, t = t, old_t - quotient * t

    return old_r, old_s, old_t


def inverse_of(n, p):
    """
    Returns the multiplicative inverse of
    n modulo p.

    This function returns an integer m such that
    (n * m) % p == 1.
    """
    gcd, x, y = extended_euclidean_algorithm(n, p)
    assert (n * x + p * y) % p == gcd

    if gcd != 1:
        # Either n is 0, or p is not a prime number.
        raise ValueError(
            '{} has no multiplicative inverse '
            'modulo {}'.format(n, p))
    else:
        return x % p
```

## Elliptic curves in Fp

对椭圆曲线取模，公式将变成如下形式

<!-- $\{(x, y) \in (\mathbb{F}_p)^2 | y^2 \equiv x^3 + ax + b \pmod{p}, 4a^3 + 27b^2 \ne 0\}\cup\{0\}$ -->
<img src="https://render.githubusercontent.com/render/math?math=\{(x, y) \in (\mathbb{F}_p)^2 | y^2 \equiv x^3 %2B ax %2B b \pmod{p}, 4a^3 %2B 27b^2 \ne 0\}\cup\{0\}" />

0 点仍然是无穷远点，a, b 是 Fp 中的整数。

![(x,y) in Fp^2](https://andrea.corbellini.name/images/elliptic-curves-mod-p.png)

(上图中 p = 19,97,127,487。可以对于每个 x 值，最多存在两个点，每个点关于 y=p/2 上下对称)

![singular curve](https://andrea.corbellini.name/images/singular-mod-p.png)

(y^2= x^3 (mod 29)) 不是一个有效的椭圆曲线，包含了 0 点 (0,0)

在有限域 Fp 中，椭圆曲线仍然形成一个阿贝尔群。

### Point addition

我们之前已经讨论过在椭圆曲线上 P+Q+R=0 的定义，三个点都在实属域 R 中。那么在有限域 Fp 中，将满足以下等式

<!-- $ax + by + c \equiv 0 \pmod{p}$ -->
<img src="https://render.githubusercontent.com/render/math?math=ax %2B by %2B c \equiv 0 \pmod{p}" />

![addition in Fp](https://andrea.corbellini.name/images/point-addition-mod-p.png)

(curve y^2=x^3-x+3 (mod 127), P=(16,20) and Q=(41,120))

Fp 中的加法属性

- Q + 0 = 0 + Q = Q (单位元的定义)
- 给定非零点 Q，其逆元 -Q 是横坐标相同，但纵坐标关于 y=p/2 横线对称的点，即 -Q=(2, -5 mod 29) = (2, 24)
- P+(-P)=0

### Algebraic sum

将上述图形方法转为代数算法来计算 P+Q=-R

直接将实数域的公式增加 mod p

<!-- $x_R= (m^2 - x_P - x_Q) mod p$ -->
<img src="https://render.githubusercontent.com/render/math?math=x_R= (m^2 - x_P - x_Q) mod p" />

<!-- $y_R= [y_P + m(x_R - x_P)] mod p$ -->
<img src="https://render.githubusercontent.com/render/math?math=y_R= [y_P %2B m(x_R - x_P)] mod p" />

or

<!-- $y_R= [y_P + m(x_R - x_P)] mod p$ -->
<img src="https://render.githubusercontent.com/render/math?math=y_R= [y_Q %2B m(x_R - x_Q)] mod p" />

对于斜率 m，当 xP != xQ

<!-- $m = (y_P - y_Q)*(x_P - x_Q)^{-1} mod p$ -->
<img src="https://render.githubusercontent.com/render/math?math=m = (y_P - y_Q)*(x_P - x_Q)^{-1} mod p" />

当 xP = xQ

<!-- $m = (3 x_P^2 + a)(2 y_P)^{-1} \bmod{p}$ -->
<img src="https://render.githubusercontent.com/render/math?math=m = (3 x_P^2 %2B a)(2 y_P)^{-1} \bmod{p}" />

### The order of an elliptic curve group

对于 Fp 的阶数 order (元素个数)，当 p 是一个很大的素数时，要计算 order 数量将会很困难， O(p)

### Scalar multiplication and cyclic subgroups

对于椭圆曲线 y^2=x^3+2x+3 (mod 97) 和点 P=(3,6)，P 只需要与自己相加 5 次即可回到初始点。

![just five distinct points](https://andrea.corbellini.name/images/cyclic-subgroup.png)

- 0P=0
- 1P=(3,6)
- 2P=(80,100)
- 3P=(80,87)
- 4P=(3,91)
- 5P=0
- ...

P 的倍数只有 5 个，且是循环出现的，于是我们可以重写一下结果：

- 5kP=0
- (5k+1)P=P
- (5k+2)P=2P
- (5k+3)P=3P
- (5k+4)P=4P

P 的倍数组成的集合是椭圆曲线在 Fp 有限域中的循环子群。 (the set of the multiples of is a cyclic subgroup of the group formed by the elliptic curve.)

在该循环子群中，点 P 为称作生成元 或 基点 (generator or base point)。

循环子群是 ECC 和其他密码系统的基础。

### Subgroup order

如何计算子群的阶数？

- order 阶数即为群中元素的个数，对于上述循环子群，order of P 即为满足 nP=0 的最小正整数。
- 根据拉格朗日定理 [Lagrange's theorem](<https://en.wikipedia.org/wiki/Lagrange%27s_theorem_(group_theory)>)， order of P 子群的阶数是父群的阶数的除数
  - 换言之，椭圆曲线包含 N 个点，其循环子群包含 n 个点，则 n 是 N 的除数

结合上述两条信息，计算子群阶数的步骤如下：

1. 计算椭圆曲线包含的元素个数 N 使用 [Schoof's algorithm](https://en.wikipedia.org/wiki/Schoof%27s_algorithm)
2. 找出所有 N 的除数
3. 对每个 N 的除数 n，计算 nP
4. 满足 nP=0 条件的最小的正整数，即为子群的阶数 order of the subgroup

举个例子，在 y^2=(x^3-x+3) mod 37 中，总的点个数 N = 42，可能的 order n=1,2,3,6,7,14,21,42. 给定点 P=（2,3）,我们可以尝试计算 P,2P,3P,6P,7P, 一直到 7P=0，因此由 P 点作为基点的循环子群，其阶数(order of P) n=7

## 优化点相加运算过程

已知比特币的私钥 x ，要运算公钥 X，就需要用到点相加定理。具体做法就是选定一个点 P，那么 `X=x*P`。x 是一个 32 字节的整数，所以很可能是一个非常大的数，但是运算 `x*P` 的时候我们可以找到优化的点相加的运算过程。

而对于 `x*P`，我们可以推导出这样的结论，对于任意的私钥 x，要运算出公钥 X，最多只需要进行 510 步的点相加运算，所以对于计算机来说并不是一个很大的计算任务。比特币对于 P 的取值是有明确规定的，在 secp256k1 曲线上， P 点的 x 坐标 和 y 坐标分别为：

x 坐标：
55066263022277343669578718895168534326250603453777594175500187360389116729240

y 坐标：
32670510020758816978083085130507043184471273380659243275938904335757337482424

x 和 P 以及椭圆曲线确定之后，就可以运算 X 了。X 是椭圆曲线上的一个点，这样比特币公钥就是这个点的 x 和 y 坐标值拼接起来的整数。
优化椭圆曲线模型
现在遗留的问题是由于 x 取值的可能性很多，那么 `x*P` 得到的点的 x 和 y 值很可能不能被保存成一个标准的 512 bit 的公钥，所以就要对我们的椭圆曲线模型做一下优化。

优化方案是把椭圆曲线定义在一个有限域内，目的是要确保只有整数点，并且每个点的横纵坐标值都不会过大。具体实现请看

- [ecc-secp256k1.py](./ecc_secp256k1.py)
- [elliptic.py](./elliptic.py)

> mac m1 芯片可能无法安装 fastecdsa , 可以使用下列命令安装，详见 [Cannot install in macOS BigSur (M1 chip)](https://github.com/AntonKueltz/fastecdsa/issues/74)

```sh
CFLAGS=-I/opt/homebrew/opt/gmp/include LDFLAGS=-L/opt/homebrew/opt/gmp/lib python3 -m pip install --no-binary :all: --no-use-pep517 fastecdsa
```

## 参考

- [Elliptic Curve Cryptography: a gentle introduction](https://andrea.corbellini.name/2015/05/17/elliptic-curve-cryptography-a-gentle-introduction/)
- [Elliptic Curve Cryptography: finite fields and discrete logarithms](https://andrea.corbellini.name/2015/05/23/elliptic-curve-cryptography-finite-fields-and-discrete-logarithms/)
- [Elliptic Curve Cryptography: ECDH and ECDSA](https://andrea.corbellini.name/2015/05/30/elliptic-curve-cryptography-ecdh-and-ecdsa/)
- [Elliptic Curve Cryptography: breaking security and a comparison with RSA](https://andrea.corbellini.name/2015/06/08/elliptic-curve-cryptography-breaking-security-and-a-comparison-with-rsa/)
- [ecdsa-math](https://happypeter.github.io/binfo/ecdsa-math.html)
- <https://hackernoon.com/what-is-the-math-behind-elliptic-curve-cryptography-f61b25253da3>
- <https://www.youtube.com/watch?v=iB3HcPgm_FI>
- <https://github.com/wobine/blackboard101/blob/master/EllipticCurvesPart4-PrivateKeyToPublicKey.py>
- <https://eng.paxos.com/blockchain-101-foundational-math>
- <https://eng.paxos.com/blockchain-101-elliptic-curve-cryptography>
