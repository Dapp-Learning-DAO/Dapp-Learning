## Library
库跟合约类似。且仅部署一次，然后通过EVM的delegatecall来复用代码。 所以代码执行的上下文是在调用合约里的，可以访问调用合约的storage。
使用libary， 可以把库合约看成父合约(base contracts),只不过不会显示的出现在继承关系中。
libary的internal函数对所有合约可见。
调用库合约internal函数，memory类型则通过引用传递，而不是拷贝的方式。
总而言之：
如果是internal的话，就是直接内联函数。如果是public/external，就需要部署library，然后合约通过delegatecall调用库合约（每次调用的成本就高很多）。

对于interal函数，

## 缩减合约大小技巧
**EIP170: 24.576 kb 的智能合约大小限制**
当您向合约中添加越来越多的功能时，在某个时候您会达到极限，并且在部署时会看到错误：

警告：合约代码大小超过 24576 字节（Spurious Dragon 分叉中引入的限制）。 这个合约可能无法在主网上部署。 请考虑启用优化器（其“运行”值较低！），关闭 revert 字符串，或使用库。

增加的原因： 防止DOS攻击
引入这一限制是为了防止拒绝服务 (DOS) 攻击。 任何对合约的调用从矿工费上来说都是相对便宜的。 然而，根据被调用合约代码的大小（从磁盘读取代码、预处理代码、将数据添加到 Merkle 证明），合约调用对以太坊节点的影响会不成比例地增加。 每当您出现这样的情况，攻击者只需要很少的资源就能给别人造成大量的工作，您就有可能遭受 DOS 攻击。

**优化办法**
较大影响：
1. 把合约分开；        
2. 使用库；
不要将库函数声明为内部函数，因为这些函数将在编译过程中直接被添加到合约中。 但是，如果您使用公共函数，那么这些函数事实上将在一个单独的库合约中。 可以考虑使用命令 using for，使库的使用更加方便；
3. 使用代理；
一个更先进的策略是代理系统。 库在后台使用 DELEGATECALL，它只是用调用合约的状态执行另一个合约的函数；

中等影响：
1. 在优化器中考虑一个低运行值：
您也可以更改优化器设置。 默认值为 200，表示它试图在一个函数被调用 200 次的情况下优化字节码。 如果您将其改为 1，相当于告诉优化器针对每个函数只运行一次的情况进行优化。 一个仅运行一次的优化函数意味着它对部署本身进行了优化。 请注意，这将会增加运行函数的 gas 成本，所以，您可能不想这样做。


##  Diamond Standard（EIP-2535）
https://dev.to/mudgen/ethereum-s-maximum-contract-size-limit-is-solved-with-the-diamond-standard-2189
todo



## 参考链接
- solidity教程： https://www.tryblockchain.org/solidity-libraries-%E5%BA%93.html
- 如何缩减合约以规避合约大小限制: https://ethereum.org/zh/developers/tutorials/downsizing-contracts-to-fight-the-contract-size-limit/
-  Diamond Standard： https://dev.to/mudgen/ethereum-s-maximum-contract-size-limit-is-solved-with-the-diamond-standard-2189
