# RLP-黄皮书


这是一种对任意结构的二进制数据（字节数组）进行编码的序列化方法。

我们定义可能的结构集 $\mathbb{T}$

$$
\mathbb{T}  \equiv  \mathbb{L} \uplus \mathbb{B} \\
\mathbb{L}  \equiv  \{ \mathbf{t}: \mathbf{t} = ( \mathbf{t}[0], \mathbf{t}[1], ... ) \; \wedge \; \forall n < \lVert \mathbf{t} \rVert : \mathbf{t}[n] \in \mathbb{T} \} \\
\mathbb{B}  \equiv  \{ \mathbf{b}: \mathbf{b} = ( \mathbf{b}[0], \mathbf{b}[1], ... ) \; \wedge \; \forall n < \lVert \mathbf{b} \rVert : \mathbf{b}[n] \in \mathbb{O} \}
$$

其中 $\mathbb{O}$ 是（8位）字节的集合。因此 $\mathbb{B}$ 是所有字节序列的集合（也就是所谓的字节数组，如果想象成一棵树，就是一片叶子）， $\mathbb{L}$ 是所有不是单一叶子的树状（子）结构的集合（如果想象成一棵树，就是一个分支节点）， $\mathbb{T}$ 是所有字节数组和这种结构序列的集合。不相交的 $uplus$ 只用来区分空字节数组 $()\in\mathbb{B}$ 和空列表 $()\in\mathbb{L}$，它们的编码方式不同，定义如下；

我们通过两个子函数将 RLP 函数定义为 $\mathtt{RLP}$ ，第一个函数处理值为字节数组时 bytes array 的实例，第二个函数处理值为 list 实例。

$$
\mathtt{RLP}(\mathbf{x}) \equiv \begin{cases} R_{\mathrm{b}}(\mathbf{x}) & \text{if} \quad \mathbf{x} \in \mathbb{B} \\ R_{\mathrm{l}}(\mathbf{x}) & \text{otherwise} \end{cases}
$$

## bytes array:

如果要序列化的值是一个字节数组 bytes array，RLP序列化采取如下三种形式之一：

1. 如果字节数组只包含一个单一的字节，并且这个单一的字节小于 128(0x80)，那么输入就正好等于输出。
   
   首字节的范围是[0x00, 0x7f]
2. 如果字节数组包含少于56个字节，那么输出等于输入加上前缀为输入字节数组长度加128（0x80）的字节。
   
   首字节的范围是[0x80,0xb7]
3. 否则，输出等于输入，只要它包含少于 $2^{64}$ 的字节，前缀为最小长度的字节阵列，当解释为大端整数时，等于输入字节阵列的长度，它本身前缀为忠实编码该长度值所需的字节数加183。
   
   首字节的范围是 [0xb8, 0xbf]

含有 ${2^{64}}$ 或更多字节的字节数组不能被编码。这一限制确保了字节数组编码的第一个字节总是低于 192(0xC0)，因此它可以很容易地与 $\mathbb{L}$ 中的序列编码区分开来。

形式上，我们定义 $R_{\mathrm{b}}$:

$$
R_{\mathrm{b}}(\mathbf{x})  \equiv \begin{cases}
\mathbf{x}  & \text{if} \quad \lVert \mathbf{x} \rVert = 1 \wedge \mathbf{x}[0] < 128 \\
(128 + \lVert \mathbf{x} \rVert) \cdot \mathbf{x}  &\text{else if} \quad \lVert \mathbf{x} \rVert < 56 \\
\big(183 + \big\lVert \mathtt{BE}(\lVert \mathbf{x} \rVert) \big\rVert \big) \cdot \mathtt{BE}(\lVert \mathbf{x} \rVert) \cdot \mathbf{x} &\text{else if} \quad \lVert \mathbf{x} \rVert < 2^{64} \\
\varnothing  &\text{otherwise}
\end{cases} \\
\mathtt{BE}(x)  \equiv  (b_0, b_1, ...): b_0 \neq 0 \wedge x = \sum_{n = 0}^{\lVert \mathbf{b} \rVert - 1} b_n \cdot 256^{\lVert \mathbf{b} \rVert - 1 - n} \\
(x_1, ..., x_n) \cdot (y_1, ..., y_m)  =  (x_1, ..., x_n, y_1, ..., y_m)
$$

因此 $\mathtt{BE}$ 是将非负整数值扩展为最小长度的大 -endian 字节数组的函数，点运算符执行序列连接。

## list:

如果要序列化的值是一个其他项目的序列，那么RLP序列化有两种形式之一：

1. 如果所包含的每一项进行序列化串联后的长度小于56字节，那么输出等于是输入加上前缀，前缀等于该字节数组的长度加上192。
   
   首字节的范围是 [0xc0,0xf7]
2. 否则，如果一个列表的总有效载荷超过 55 字节，RLP编码由一个值为0xf7的单字节加上二进制形式的有效载荷的长度（字节）组成，然后是有效载荷的长度，接着是项目的RLP编码的连接值
   
   首字节的范围是 [0xf8,0xff]

那些串联的序列项目包含 $2^{64}$ 或更多字节的序列不能被编码。这一限制确保了编码的第一个字节不超过 255（否则它就不是一个字节）。

因此，我们以正式定义 $R_{\mathrm{l}}$:

$$
R_{\mathrm{l}}(\mathbf{x})  \equiv  \begin{cases}
(192 + \lVert s(\mathbf{x}) \rVert) \cdot s(\mathbf{x})  \qquad\qquad\qquad\qquad\qquad\text{if} \quad s(\mathbf{x}) \neq \varnothing \wedge \lVert s(\mathbf{x}) \rVert < 56 \\
\big(247 + \big\lVert \mathtt{BE}(\lVert s(\mathbf{x}) \rVert) \big\rVert \big) \cdot \mathtt{BE}(\lVert s(\mathbf{x}) \rVert) \cdot s(\mathbf{x}) \qquad \text{else if} \quad s(\mathbf{x}) \neq \varnothing \wedge \lVert s(\mathbf{x}) \rVert < 2^{64} \\
\varnothing  \qquad\qquad\qquad\qquad\qquad\qquad\qquad\qquad\qquad\text{otherwise}
\end{cases} \\
$$

$$
s(\mathbf{x})  \equiv  \begin{cases}
\mathtt{RLP}(\mathbf{x}[0]) \cdot \mathtt{RLP}(\mathbf{x}[1]) \cdot ... & \text{if} \quad \forall i: \mathtt{RLP}(\mathbf{x}[i]) \neq \varnothing \\
\varnothing & \text{otherwise}
\end{cases}
$$

如果RLP被用来编码一个标量，只针对一个非负整数（在 $\mathbb{N}$ 中，或者在 $\mathbb{N}_x$ 中，对于任何 $x$），它必须被编码为最短的字节数组，其大面值解释为标量。因此，某个非负整数 $i$ 的 RLP 被定义为。

$$
\mathtt{RLP}(i : i \in \mathbb{N}) \equiv \mathtt{RLP}(\mathtt{BE}(i))
$$

在解释 RLP 数据时，如果预期的片段被解码为标量，并且在字节序列中发现了前导零，客户需要将其视为非正则，并以其他无效的 RLP 数据的方式处理它，完全否定它。

对于有符号或浮点值，没有特定的标准编码格式。

如下是 RLP 编码的 python 代码实现：

```python
def rlp_encode(input):
    if isinstance(input,str):
        if len(input) == 1 and ord(input) < 0x80: return input
        else: return encode_length(len(input), 0x80) + input
    elif isinstance(input,list):
        output = ''
        for item in input: output += rlp_encode(item)
        return encode_length(len(output), 0xc0) + output

def encode_length(L,offset):
    if L < 56:
         return chr(L + offset)
    elif L < 256**8:
         BL = to_binary(L)
         return chr(len(BL) + offset + 55) + BL
    else:
         raise Exception("input too long")

def to_binary(x):
    if x == 0:
        return ''
    else:
        return to_binary(int(x / 256)) + chr(x % 256)
```

例子：

1. `“dog”` => RLP编码： 属于bytes array, "dog" = 0x646f67, 长度为3, 即 $\lVert \mathbf{x} \rVert = 3$，适用 $(128 + \lVert \mathbf{x} \rVert) \cdot \mathbf{x}$ 为：131·X=>0x83646f67
2. 列表`["cat","dog"]` => 属于list, "cat" = 0x636174, "dog" = 0x646f67,  $s(\mathbf{x})$ =0x8363617483646f67, 适用192 +  $\lVert s(\mathbf{x}) \rVert) \cdot s(\mathbf{x})$ 方程，为：(192+8)·s(x) = 0xc88363617483646f67
3. 空字符串 => 0x80 :question:为什么是0x80呢, 0x80确实也能表示空字符串， 因为长度为0，值也为0
4. 数值0 => 0x80 :question:0x80确实也能表示0， 因为长度为1，值为0. len(0x00) == 0x01?
5. 编码后的数值0 `\x00` => 0x00
6. 编码后的数值15 `\x0f` => 0x0f , 属于bytes array, 长度为1， 适用 $\mathbf{x}$ =0x0f
7. 编码后的数值1024 `\x0400` =>  属于bytes array, 长度为2， 为0x820400
8. 编码嵌套的list：`[ [], [[]], [ [], [[]] ] ]` => 属于list，长度小于56，适用于 $(192 + \lVert s(\mathbf{x}) \rVert) \cdot s(\mathbf{x})$ ,
   
   对于item0: [] => RLP编码为(192+0) = 0xC0
   
   对于item1: `[[]]` => (192+1)·0xC0 => 0xC1C0
   
   对于item2: `[[],[[]]]` => (192+3)·(0xC0C1C0)=>0xC3C0C1C0
   
   故整体为 0xC7C0C1C0C3C0C1C0
9. 长字符串`"Lorem ipsum dolor sit amet, consectetur adipisicing elit"` => `0x4c6f72656d20697073756d20646f6c6f722073697420616d65742c20636f6e7365637465747572206164697069736963696e6720656c6974` 长度为112, 属于bytes array, 适用于 $\big(183 + \big\lVert \mathtt{BE}(\lVert \mathbf{x} \rVert) \big\rVert \big) \cdot \mathtt{BE}(\lVert \mathbf{x} \rVert) \cdot \mathbf{x}$ 故 (183+1)·(0x38)·(0x4c..) =>  `0xB8384c6f72656d20697073756d20646f6c6f722073697420616d65742c20636f6e7365637465747572206164697069736963696e6720656c6974`
