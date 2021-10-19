# zksync

[主页](https://github.com/matter-labs/zksync)

## 基本架构

zkSync 的基本组成有：

- zkSync smart contract：部署在以太坊网络上的 Solidity 智能合约，用于管理用户 balances 并验证 zkSync network 操作的正确性。

- Prover application：为 a worker application，用于创建 a proof for an executed block。  
  Prover application 会从 Server application 中获取有效的 jobs，当有新的区块时，Server application 将提供 a witness（input data to generate a proof），然后 Prover application 开始工作。当 proof 生成后，Prover application 会将该 proof 报告给 Server application，Server application 再将该 proof 发布给 zkSync 智能合约。

- Prover application 可看成是 on-demand worker，当 Server application 负载很高时，允许有多个 Prover applications，当没有交易输入时则没有 Prover application。
生成 proof 是非常消耗资源的工作，因此，运行 Prover application 的机器应具有现代 CPU 和大量的 RAM。

- Server application：运行 zkSync 网络的节点。
Server application 的职能主要有：  
1）监测智能合约上的 onchain operations（如存款）  
2）接收交易  
3）生成 zkSync 上的区块  
4）为 executed blocks 发起 proof 生成申请  
5）将数据发布到 zkSync smart contract  

## 参考链接

https://zhuanlan.zhihu.com/p/363029544

https://www.jianshu.com/u/ac3aed07477e

https://zhuanlan.zhihu.com/p/343212894

https://mp.weixin.qq.com/s/TxZ5W9rx6OF8qB4ZU9XrKA
