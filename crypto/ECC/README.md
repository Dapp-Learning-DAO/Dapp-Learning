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
4. **inverse**: 每个元素都有一个逆元素，即对于 G 中的元素 a 都存在一个元素 b, a + b = 0;

我们附加了一条特性

5. **commutativity**: a+b=b+a (Abelian group 阿贝尔群)

### Geometric addition

我们在椭圆曲线上定义了一个群，是曲线上点的集合

- 元素是椭圆曲线上的点
- identity element 是无穷远的 0 点(point at infinity 0)
- 对于点 P ，inverse (逆元素) 是关于 x 轴对称的点
- addition 加法的规则：一条直线与椭圆曲线相交的三个非 0 的点 P, Q, R 他们的和是 0 点，即 P+Q+R=0
  - P+Q=-R
  - -R 是 R 的逆元素
  - 即 P+Q 等于 R 相对于 x 轴对称的点

![Draw the line through  and . The line intersects a third point . The point symmetric to it, , is the result of .](https://andrea.corbellini.name/images/point-addition.png)

P+Q=-R

直线与椭圆曲线相交有三种特殊情况

1. P=0 or Q=0. 我们不可能在 xy 坐标上标出 0 点(无穷远)，所以也无法画出这条线。但我们可以将 0 点定义为 identity element (单位元)，即 P+0=P and 0+Q=Q
2. P=-Q. P 和 Q 关于 x 轴对称，此时直线将于 x 轴垂直，与椭圆曲线没有第三个交点 R，则 Q 是 P 的逆元素，即 P+Q=0
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

假定 翻倍 doubling 和 加法 adding 操作都是 O(1), 那么这个算法将是 O(log(n)) (如果我们考虑n的位数，将是 O(k))

## The field of integers modulo p

## 椭圆曲线的点相加定理

由方程 y² = x³+ax+b 所描述的曲线就叫做椭圆曲线 ，椭圆曲线相对于 x 轴对称，随着 a、b 取值的不同，方程对应不同的曲线。比特币使用的曲线方程是 y² = x³+7，这条曲线被命名为 secp256k1。

下面就描述一下什么是椭圆曲线的点相加定理。

## 优化点相加运算过程

已知比特币的私钥 x ，要运算公钥 X，就需要用到点相加定理。具体做法就是选定一个点 P，那么 `X=x*P`。x 是一个 32 字节的整数，所以很可能是一个非常大的数，但是运算 `x*P` 的时候我们可以找到优化的点相加的运算过程。

例如，我们要运算 `10*P` ，直观上我们会认为要进行 9 次点相加运算，但是实际上只需要 4 次，这是因为点相加满足 `n*P+r*P = (n+r)*P` 。所以，运算 `10*P` 的最快方式是分解为下面四步：

```math
P+P = 2*P
2*P+2*P = 4*P
4*P+4*P = 8*P
2*P+8*P = 10*P
```

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
