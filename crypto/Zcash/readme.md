# Zcash

## 原理介绍
ZCash是在Bitcoin上的改进，所以也是基于UTXO模型，zcash中用note代替。
note为ZCash的基本交易单位。一个交易的输入和输出都是数个note。
### 数据结构
以note=(PK, v, r)来表示note，PK为公钥(Public Key)、v是金额(Value)、r是序列号(Random Serial Number)。
PK为接收者地址，v是金额，r为随机数，用于作废note

ZCash的节点会包含两个集合，每个集合都包含:
- Note Commitment 
交易的输出，表示一张新的note被发出，一张有效的commitment即为一张note的存在证明，此commitment为hash(note)，因此可以确保他人不知道所有者、金额。
- Nullifier Commitment 
交易的输入，表示要将一张note花掉了，一个nullifier对应唯一的commitment，为了要知道是哪个commitment，nullifier为hash(r)。现在大家应该知道为什么需要序列号了吧！

### 交易流程
屏蔽交易(Shielding Transaction)。

Alice 想向Bob发送ZEC(ZCash所发的代币)， Alice可以控制PK1（她的公钥）而Bob可以控制PK2（他的公钥）。与比特币相比，Zcash的一个不同之处在于Alice生成一个零知识证明来证明她有权使用Note1。转账后note1会输出为note4和其他note（找零）。

过程如下：
1. Alice随机选择一个序列号(r) 并定义一个新的Note4。
2. 她将Note4 发送给Bob。
3. Alice 通过将Nullifier发送到所有节点来使Note1无效。
4. Alice 将新Note4的hash发送给所有节点
5. Alice 发布一个​​证明(proof)告诉节点，Note1的Hash存在于Hash集合中，sk1是PK1的私钥，而hash(r) 是Note1的Nullifier。



## 参考链接
- zcash readthedocs： https://zcash.readthedocs.io/en/latest/rtd_pages/basics.html
- 原理介绍： https://www.panewslab.com/zh/articledetails/95d38u443373.html
- ZEXE： https://mirror.xyz/kurtpan.eth/Y3r-STH3NLo4hY3P7vetL9hXRfvihUnNBvaTv0Kqezk
- zether: https://eprint.iacr.org/2019/191.pdf