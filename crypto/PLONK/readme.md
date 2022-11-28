# PLONK zksnark算法

数学基础：https://learnblockchain.cn/article/2801
电路介绍：https://blog.csdn.net/adijeshen/article/details/123332665 

## 视频介绍
kevin： https://mp.weixin.qq.com/mp/appmsgalbum?action=getalbum&__biz=MzA5NzI4MzkyNA==&scene=1&album_id=1664071313331650562&count=3#wechat_redirect 


##  Schwartz-Zippel 定理
 Schwartz-Zippel 辅助定理，即不同的多项式在大多数点的求值是不同的，因此只要检查少量的点，其实就可验证证明者使用的多项式是否正确。

 多项式在很大的集合中随机选取参数，恰好多项式值等于0的概率几乎为0
## KZG承诺

预备知识：

由Kate，Zaverucha和Goldberg发表的多项式承诺方案；
在一个多项式承诺方案中，证明者计算一个多项式的承诺（commitment）, 并可以在多项式的任意一个点进行打开（opening）：该承诺方案能证明多项式在特定位置的值与指定的数值一致。
https://dankradfeist.de/ethereum/2021/10/13/kate-polynomial-commitments-mandarin.html

多项式承诺
在不泄露多项式f(x)的情况下，使验证者确信对于某个z, f(z) 是正确的计算结果。
(1) 首先需要计算多项式承诺，为f(s)*G1 ，其中为s可信设置密秘选取的值，G为椭圆曲线基点；

(2) 为了验证f(z)， 证明者需要计算：
Q(x)=[f(x)-f(z)]/(x-z)
然后将Q(x), f(z)的承诺发给验证者

(3) 验证者验证：
e(f(x)*G1 - G1*f(z), G2) = e(Q(x)*G1, xG2-zG2);
e(f(x)*G1 - G1*f(z), G2) = e(G1, G2)^(f(x)-f(z));
e(Q(x)*G1 , xG2-zG2) = e(G1, G2)^[(x-z)*Q(x)];

## 原理

gorth16: https://mp.weixin.qq.com/s?__biz=MzIxNjkwODE5NQ==&mid=2247484672&idx=1&sn=a41bc8436703e8e2bab9ad16634956e5&chksm=9780adcca0f724dadb06f670a9b783c6d50426354e408b3b7a7d7f5d21dddc061c7cc9aa19ac&cur_album_id=1432629901374636033&scene=189#wechat_redirect
gorth16 setup时候依赖电路结构

1. 门约束
Ql*a+Qr*b+Qo*c+Qm * ab + Qc=0
2. 复制约束



**plonk vs groth16** 
plonk: plinkish, universal setup , larger proof 
can be imoroved with custom gate

## 代码
源码最小实现：https://github.com/fabrizio-m/TyPLONK


## 参考链接
-  V神文章： https://vitalik.ca/general/2019/09/22/plonk.html
-  Plonk零知识证明方案： https://www.jianshu.com/p/889b7e09ae9a 
-  PLONK（零知识证明）最终版原文解读系列： https://blog.csdn.net/guoyihaoguoyihao/article/details/104715756?spm=1001.2014.3001.5502
- PLONK代码解析：https://blog.csdn.net/mutourend/article/details/113803758?
- Bulletproofs、Sigma protocol、Halo2等ZK方案小结: https://blog.csdn.net/mutourend/article/details/126751659
- http://www.cxyzjd.com/article/weixin_43179764/112861106
 
- https://www.zeroknowledgeblog.com/
 
- https://medium.com/aztec-protocol/- aztecs-zk-zk-rollup-looking-behind-the-cryptocurtain-2b8af1fca619
 
- Plonk零知识证明方案: https://www.jianshu.com/p/889b7e09ae9a
 
- Plonk Unrolled For Ethereum: https://github.com/matter-labs/- proof_system_info_v1.0/blob/master/PlonkUnrolledForEthereum.pdf
 
- On PLONK and plookup: https://research.metastate.dev/- on-plonk-and-plookup/
 
- PLONK by Hand: https://research.metastate.dev/plonk-by-hand-part-1/