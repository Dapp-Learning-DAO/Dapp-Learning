## SNAPSHOT

- Snapshot is a off-chain, gasless, multi-governance community polling dashboard.
- Decentralized society, we need make decisions also, so you can try snapshot.
- Gasless
- Offchain
- Multi joined
- When I test the https://snapshot.org/ website...meet 502 error...

## 概述

- Snapshot 是一个为 ERC20 代币提供社区提案投票的聚合治理平台，由 Balancer 团队开发在今年 8 月推出。
- 作为一个 off-chain 的治理工具，用户使用 Snapshot 进行签名投票和社区提案而无需要消耗 GAS 费。
- 不同于 Aragon 的从创建到治理全覆盖，Snapshot 目前仅提供提案和投票这两项功能，它更倾向于是一个治理投票的平台型工具，而不是一个提供搭建、治理投票、质押、链上法庭等复杂功能的平台。
- 用户绑定钱包中的**相应代币数量决定投票权重**，根据以太坊区块快照，提案和投票是存储在 IPFS 上的签名消息。
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/40-snapshot/snapshot.png?raw=true" /></center>

## 创建空间并发起提案
Snapshot中的空间也就是各个项目进行提案的场所，下面对创建空间以及发起提案的流程进行简单介绍。(更详细的信息请看[官方文档](https://docs.snapshot.org/))
1. 注册一个ENS域名  
Snapshot虽然是一个链下治理平台，但必须拥有ENS域名才能创建空间。

2. 将ENS域名链接到Snapshot  
首先点击创建空间，然后输入你的域名得到ipfs的记录地址，最后在ENS中添加该记录。
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/40-snapshot/create_a_space.png?raw=true" /></center>
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/40-snapshot/get_record.png?raw=true" /></center>
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/40-snapshot/add_record.png?raw=true" /></center>

3. 设置你的空间  
添加ENS记录是一个链上操作过程，等待交易确认后才可以进行Snapshot空间的设置。  
下面是进行Snapshot空间设置的页面，包括Profile填写项目基本信息，Strategie选择投票策略等等设置选项，此外还可以通过添加Plugins为提案增加新特性。最后记得点击保存来提交修改。
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/40-snapshot/setting_page1.png?raw=true" /></center>
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/40-snapshot/setting_page2.png?raw=true" /></center>
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/40-snapshot/setting_page3.png?raw=true" /></center>

4. 发起提案  
以刚刚创建的空间为例，首先搜索到该空间，然后点击加入，如果满足该空间设置的要求就可以发起提案了。发起一个提案主要就是填写提案内容、设置选项、设置起始和结束日期。
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/40-snapshot/search.png?raw=true" /></center>
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/40-snapshot/space.png?raw=true" /></center>
<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/40-snapshot/new_proposal.png?raw=true" /></center>

## 其他

- Snapshot 并不反对其他项目复制代码、另起炉灶。Curve 就 fork 了 Snapshot 的代码新建了一个专有的治理网站（https://signal.curve.fi/#/curve）。
- 因此国内如果不熟悉英语和习惯的，可以魔改，我准备空了魔改一个，不依赖于代币数量，依赖其他更合理，更避免资本掌控社区的一些机制。

## 参考链接

- [官方文档](https://docs.snapshot.org/)
- https://www.chainnews.com/articles/389308842491.htm
- https://www.theblockbeats.com/news/19570
- [Twitter](https://twitter.com/SnapshotLabs)
- [Discord](https://discord.com/invite/yHrYMzyyY9)
- https://commonwealth.im/uniswap/proposals
