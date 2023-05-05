
# 简介
did包含Issuer、Holder、Verifier三个角色，其中Issuer将声明Claim分发给Holder，Holder可向Verifier提供关于Claim上数据的证明，证明可带有隐私保护特性。

iden3提供了did的基础设施，而polygonId则基于iden3实现了完整的did流程，包括身份创建、Claim分发、数据的证明、Claim的撤销等。

polygonId曾经有一个测试网站，上面可以体验整个流程，目前似乎已不能访问，但可以参考[这篇笔记](https://www.notion.so/Iden3-784989e8163146b4ac2c6f9c2c81f867)的前两节，体验一下整个流程。


# 基本概念

## 技术概念
- Babyjubjub：一种椭圆曲线。对zk友好，基于该曲线的验签操作可以节省大量的约束，因为它基于一个特殊素数，而这个素数正好是zksnark使用的那个素数，也就意味着省去了繁杂的求模约束。

- Sparse Merkle Tree：稀疏默克尔树，这是一种特殊的merkle tree，它构建在一个“地址空间”之伤，它的每个叶子结点都位于某个“地址”，而这个"地址"里可以有数据，也可以没有数据，因此可以用来证明一个数据不存在,证明的方式是，为相应的叶子节点构建merkle proof，验证者用空值和merkle proof恢复出树根并比较即可。


## iden3概念
- Claim: 一个Claim记录了所属主体的数据。它上面有8个槽位，每个槽位占31字节。有些槽位记录了元数据信息，包括数据主体、Claim的到期时间等。其他槽位可以记录你想要的声明数据，取决于业务场景，比如你可以放姓名、年龄、职位等。注意，由于Claim记录了私有数据，它需要隐私地保存，通常用polygon钱包，或者专门的托管服务器。

- Tree：每一个iden3的用户都保存有三棵树，每一个树都是一个稀疏默克尔树。
    - Claims Tree ：保存用户的Claim。每当用户以Issuer角色分发出一张Claim，或者以Holder身份领取一张Claim，都会把Claims插入到树中。Claim的前4个槽位的哈希值，决定了将插入到树中的哪个叶子节点；换言之，Claim的前4个槽位的哈希值，唯一的决定了Claim的id。注意，由于Claims Tree保存了Claims，所以这棵树是私有的。
    - Revocation Tree：这棵树被用于撤销Claim。每个Claim都有一个特殊的id，称为Revocation Nonce。当Issuer需要撤销发出的Claim时，需要把这个Claim的Revocation Nonce存储到这棵树中；当Holder尝试证明Claim的有效性时，必须证明这个Claim没有被撤销，也就是提供Issuer的Revocation Tree中，对应null值的merkle proof。这棵树需要公开访问。
    - Roots Tree：每次Claim Tree被更新，新的树根就会存入这棵树中。

- 状态：一个用户，它下面的三棵树的树根，拼起来的哈希就是这个用户的状态。状态根，存储在区块链上。

# 运行原理

理解了上面的内容，我们来简单梳理一下整个iden3的运行原理。
## 初始化
初始情况下，用户使用BabyJubJub，生成一个密钥对，公钥被记录在一个特殊的Claim上，这个Claim唯一记录的信息就是公钥。这个Claim会插入到用户的Claims Tree中，而此时的树根凑出来的初始状态，将决定了用户的did。

用户可以自己决定是否将状态根同步上链，不上链，就无法完成整个流程。

## 发放
假设A、B、C三个用户都完成了初始化。此时A想给B分发一个Claim，表示B的身份信息。他构建好一个Claim，上面主要记录如下内容：
- 数据主体：B的did
- 声明信息：出生日期

A将这个Claim存放到自己的Claims Tree中，并将状态转移上链，通过zksnark证明自己状态转移的合法性，内容包括：
- 提供了正确的签名，所签署的哈希为（旧状态，新状态）
- 存储签名公钥的那个Claim，位于旧的Claims Tree中
- 旧的Claim树根，和其他两个树根，计算出的状态，和旧状态一致
- 发放的Claim位于新的Claims Tree中
- 新的Claim树根，和其他两个树根，计算出的状态，和新状态一致


A现在还需要把这个Claim传送给B。在此之前，需要解决一个问题，即确保只有B可以领取Claim，其他人不可以领取。为此，A需要执行额外的认证环节。A生成认证Json，上面包括如下信息：

- 数据主体：B的did
- 认证模式：也就是如何证明自己是B用户。例如，对什么数据做签名（通常是一个哈希值），采用什么手段证明自己（通常是zk），如果用zk，使用哪一个电路等。
- 回调url：B需要把自己的证明发送往这个回调url，认证成功后，会进行下载功能。

通常，这个json被封装在一个二维码中。
## 接收
B使用polygon钱包这类专用客户端，扫描二维码，获取里面的Json，然后根据json，构造证明，向里面的回调url发送证明后，下载得到Claim。

这个Claim也会存入B自己的Claims Tree中，并向区块链上同步自己的状态变更，附带的证明逻辑和前文A类似。

## 校验
B现在想向C证明，自己持有A发出的Claim，并证明自己年龄大于18岁。怎么做？

B根据电路，构建出一个zk证明，zk证明的私有输入包括：
- Claim
- AuthClaim
- Claim的Proof
- AuthClaim的Proof
- Claim的未撤销证明
- AuthClaim的未撤销证明
- 签名
- 待签署数据


公开输入包括：
- 状态根
- 常数18
- 当前日期

证明的逻辑大致包括：
- 先根据AuthClaim记录的公钥，验证签名
- 结合AuthClaim的proof，验证AuthClaim的有效性
    - 除了核对Claims Tree，还要验证AuthClaim未撤销，即用空数据和“未撤销证明”生成Revocation Tree的状态根，和输入的状态根对比
- 结合Claim的proof，验证Claim的有效性
    - 除了核对Claims Tree，还要验证Claim未撤销，即用空数据和“未撤销证明”生成Revocation Tree的状态根，和输入的状态根对比
- 验证Claim上记录的出生日期，加18，不超过当前日期。
- 
当然，还包括对公有输入的验证，比如对于状态根和合约记录的一致、当前日期是否正确等。

## 撤销

如果A想撤销这个Claim，只需把Claim的Revocation Nonce插入到自己的Revocation Tree中，并将新的状态根同步到链上。

这样，当B要基于这个Claim构造证明时，无法提供出“未撤销证明”，那么也就无法继续进行下去了。



# 参考资料
- https://www.notion.so/dapplearning/Iden3-784989e8163146b4ac2c6f9c2c81f867
- https://github.com/0xPolygonID/sh-id-platform
