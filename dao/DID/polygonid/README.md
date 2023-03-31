
# 简介
iden3提供了did的基础设施，而polygonId则基于iden3实现了完整的did流程，包括

这里面会把iden3/polygonId放在一起来说。

# 基本概念

## 技术术语
- Babyjubjub：一种椭圆曲线。对zk友好，基于该曲线的验签操作可以节省大量的约束，因为它基于一个特殊素数，而这个素数正好是zksnark使用的那个素数，也就意味着省去了繁杂的求模约束。

- Sparse Merkle Tree：稀疏默克尔树，这是一种特殊的merkle tree，但是它的叶子结点是一个“地址”，而这个"地址"里可以有元素，也可以没有元素，因此可以用来证明一个数据不存在。



## iden3术语

- Claim: 
- tree


# 如何使用




# 参考资料
- https://www.notion.so/dapplearning/Iden3-784989e8163146b4ac2c6f9c2c81f867
- https://github.com/0xPolygonID/sh-id-platform
