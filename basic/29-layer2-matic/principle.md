# Polygon

[matic官方文档](https://docs.matic.network/docs/develop/getting-started)

## 原理
Currently, developers can use Plasma for specific state transitions for which Plasma predicates have been written such as ERC20, ERC721, asset swaps or other custom predicates. For arbitrary state transitions, they can use PoS. Or both! This is made possible by Matic's hybrid construction.
POS chain
Plasma chain （Plasma Bridge）

A bridge is basically a set of contracts that help in moving assets from the root chain to the child chain. 
However, there are certain restrictions on the child token and there is a 7-day withdrawal period associated with all exits/withdraws from Matic to Ethereum on the Plasma bridge
7天延迟从matic撤回主网

The PoS Bridge is more flexible and features faster withdrawals.
pos更快
secured by a robust set of external validators.

两部分 主链/ 子链

L1- L2 交互
1 状态同步  验证着周期提供所有交易的hash到主链， 检查点用于验证发生在matic上的任何交易，
2
马蹄的验证者需要持续监控链上合约 称为状态发送者  




## 参考链接

https://www.yuque.com/docs/share/8e737364-c380-418e-af21-0f07095fe900

使用教程: https://cloud.tencent.com/developer/article/1828250

hardhat: https://docs.matic.network/docs/develop/hardhat/

https://medium.com/pinata/how-to-create-layer-2-nfts-with-polygon-and-ipfs-aef998ff8ef2
