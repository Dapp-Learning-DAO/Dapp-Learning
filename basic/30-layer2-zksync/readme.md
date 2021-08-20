# zksync
[主页](https://github.com/matter-labs/zksync)

## 基本架构

 zkSync的基本组成有：

 zkSync smart contract：部署在以太坊网络上的Solidity智能合约，用于管理用户balances并验证zkSync network操作的正确性。

 Prover application：为a worker application，用于创建a proof for an executed block。
 Prover application会从Server application中获取有效的jobs，当有新的区块时，Server application将提供a witness（input data to generate a proof），然后Prover application 开始工作。当proof生成后，Prover application会将该proof报告给Server application，Server application再将该proof发布给zkSync智能合约。

 Prover application可看成是on-demand worker，当Server application负载很高时，允许有多个Prover applications，当没有交易输入时则没有Prover application。
 生成proof是非常消耗资源的工作，因此，运行Prover application的机器应具有现代CPU和大量的RAM。

 Server application：运行zkSync网络的节点。

 Server application的职能主要有：
 1）监测智能合约上的onchain operations（如存款）
 2）接收交易
 3）生成zkSync上的区块
 4）为executed blocks发起proof生成申请
 5）将数据发布到zkSync smart contract


## 参考链接

https://zhuanlan.zhihu.com/p/363029544

https://www.jianshu.com/u/ac3aed07477e

https://zhuanlan.zhihu.com/p/343212894

https://mp.weixin.qq.com/s/TxZ5W9rx6OF8qB4ZU9XrKA
