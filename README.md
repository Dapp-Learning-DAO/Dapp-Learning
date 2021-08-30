中文 / [English](https://github.com/rebase-network/Dapp-Learning/blob/main/README-en.md)

<div align="center">
  <img src="./DappLearning-logo.svg" style="margin: 0 auto 40px;" width="380" />
  <!-- <h1>Dapp Learning</h1> -->
  <h4 align="center">
    区块链 Dapp 开发教程
  </h4>
  <p>通过实际项目一步一步学习区块链 Dapp 开发。</p>
</div>

## 序 - Preface

本项目适合有一定语言基础的开发者入门区块链 DAPP 开发，由浅到深了解和开发 **DeFi, NFT, DAO, CRYPTO** 项目。   

项目愿景是给**初级开发者**一个可执行且最简的区块链 **Dapp** 学习路线图，给**进阶开发者**一个可以交流和协作的平台。   

项目跟Rebase大学深度结合，成立学习小组进行任务分工然后一起研究主流dapp项目，每周进行技术分享，输出成果会作为视频上传B站的[Rebase账号](https://space.bilibili.com/382886213)。

项目秉持 [开源大学](https://shimo.im/docs/YTyKvk89dHWrKt86) 的理念，会以DAO治理形式管理此开源项目，贡献三次高质量PR即可成为PR审核者，并参与决议项目走向。后续会给所有PR贡献者发放nft作为纪念奖品。欢迎参与[gitcoin](https://gitcoin.co/grants/3414/dapp-learning-developer-group-1)捐赠。 


技术栈：

- `web3.js`
- `ethers.js (hardhat)`
- `web3.py (Brownie)`
- `Java` （可选）
- `rust` （可选）

教程分为 **基础任务** 和 **项目任务** 两部分，基础任务是熟悉和集成区块链开发所必需的基本工具组件(如ERC标准，oracle,graph)，项目任务是研究主流 DeFi, NFT, DAO 的典型项目让开发者深入真实项目开发。  

此教程仍在开发中，欢迎创建 PR 来创建更多的教程项目或完善已有的教程项目🤗。  

## 准备工作 - Preparatory Work

**阅读[《精通以太坊》](https://github.com/inoutcode/ethereum_book)理解 以太坊 和 智能合约 的基本原理**

- 以太坊原理书：<https://ethbook.abyteahead.com/howto.html>
- 以太坊开发工具汇总：<https://learnblockchain.cn/article/2006>
- solidity 学习：<https://www.bilibili.com/video/BV1St411a7Pk?p=1> 

**开发工具：**

- metamask（浏览器钱包插件）: <https://www.jianshu.com/p/b5b2c05e9090>
- infura（节点服务）: <https://infura.io/>
- alchemy（节点服务）: <https://dashboard.alchemyapi.io/>
- 测试均连接kovan测试网，kovan测试ETH申请: <https://faucet.kovan.network>,也可自由使用其他测试网络。
- 以太坊区块链浏览器: <https://kovan.etherscan.io>
- JSON-PRC接口: <https://eth.wiki/json-rpc/API>
- tenderly合约验证: <https://dashboard.tenderly.co/explorer>
- remix本地环境: <https://zhuanlan.zhihu.com/p/38309494>
- 代码美化工具: <https://www.cnblogs.com/kuronekonano/p/11794302.html>

**推荐阅读**
- 《主权个人》（Sovereign Individuals， 尚无中译本，可关注不懂经公众号阅读）
- 推荐了解奥地利学派，[Hayek生平介绍](https://mp.weixin.qq.com/s/p1UZdt5BAQVJ3kl_CniwKQ)    
- 系列文章：[给区块链爱好者的奥派经济学课](https://mp.weixin.qq.com/mp/appmsgalbum?__biz=MzU0ODk1MTE1MA==&action=getalbum&album_id=1986143111768489985&scene=173&from_msgid=2247484102&from_itemidx=1&count=3&nolastread=1#wechat_redirect)

**国外大学加密课程**
- [Defi Learning by Dan Boneh/Arthur Gervais/Andrew Miller/Christine Parlour/Dawn Song](https://defi-learning.org/)
- [Standford Online Course: CS 251 Bitcoin and Cryptocurrencies](https://cs251.stanford.edu/syllabus.html)
- [MIT Online Course: Blockchain and Money by Prof. Gary Gensler](https://ocw.mit.edu/courses/sloan-school-of-management/15-s12-blockchain-and-money-fall-2018/video-lectures/)

## 基础任务 - Basic Tasks

通过以下基础任务，了解开发 Dapp 的基本工具和开发知识。

01. [use web3.js deploy contract](basic/01-web3js-deploy/README.md)
02. [use web3.js create transaction](basic/02-web3js-transaction/README.md)
03. [use web3.js call ERC20 contract](basic/03-web3js-erc20/README.md)
04. [use truffle](basic/04-web3js-truffle/README.md)
05. [use ethers.js call ERC20 contract](basic/05-ethersjs-erc20/README.md)
06. [use waffle and ethers.js test contract](basic/06-ethersjs-waffle/README.md)
07. [use hardhat](basic/07-hardhat/README.md)
08. [graph](basic/08-hardhat-graph/README.md)
09. [react（metamask)](basic/09-hardhat-react/README.md)
10. [ERC721+ ERC1155 + ipfs](basic/10-hardhat-ipfs-erc721/README.md)
11. [react + express + hardhat](basic/11-react-express-hardhat/README.md)
12. [Crowdfund](basic/12-token-crowdfund/README.md)
13. [decentralized exchange](basic/13-decentralized-exchange/README.md)
14. [chainlink-api](basic/14-chainlink-price-feed/README.md)
15. [nft-blindbox-chainlink-vrf](basic/15-nft-blindbox-chainlink-vrf/readme.md)
16. [nft auction  & exchange](basic/16-nft-auction-exchange/README.md)
17. [wallet develop](basic/17-etherjs-wallet-develop/readme.md)
18. [web3.py](basic/18-web3py/README.md)
19. [brownie](basic/19-brownie/README.md)
20. [flash-loan](basic/20-flash-loan/readme.md)

21. [scaffold-Lender](basic/21-scaffold-lender/README.md)
22. [scaffold-zk](basic/22-scaffold-zk/readme.md)
23. [ERC865 & ERC875](basic/23-erc865-and-erc875/README.md)
24. [Upgradeable-contract](basic/24-upgradeable-contract/README.md)
25. [multi-sig-wallet](basic/25-multi-sig-wallet/readme.md)
26. [snapshot](basic/26-snapshot/README.md)
27. [Quadratic vote](basic/27-quadratic-vote/README.md)
28. [optimism layer2](basic/28-optimism-layer2/readme.md)
29. [matic layer2](basic/29-layer2-matic/readme.md)
30. [zksync layer2](basic/30-layer2-zksync/readme.md)
31. [duneanalytics & nansen](basic/31-dune-analytics-nansen/readme.md)
32. [chainlink-keeper](basic/32-chainlink-keeper/README.md)
33. [pooltogether](basic/33-pooltogether/README.md)
34. [subgraph](basic/34-subgraph/readme.md)
35. [Merkel-Patricia Tree(MPT)](basic/35-mpt/README.md)
36. [NFT Filecoin](basic/36-nft-filecoin/README.md)
37. [Charm.fi](https://github.com/charmfinance/alpha-vaults-contracts)
38. [Flashbots provider for ethers.js](https://github.com/flashbots/ethers-provider-flashbots-bundle)
39. [Ethlend](https://www.youtube.com/watch?v=Pi-Qva6Fg3I)
40. [Arbitrum](https://arbitrum.io/quickstart/)
41. [NFT farming](https://superfarm.com/farms)
42. [merkle-distributor airdrop](https://github.com/Uniswap/merkle-distributor/blob/master/contracts/MerkleDistributor.sol)  
 
43. [front running](https://github.com/Supercycled/cake_sniper)  
44. [JavaScript Cryptography](https://blog.sessionstack.com/how-javascript-works-cryptography-how-to-deal-with-man-in-the-middle-mitm-attacks-bf8fc6be546c)
45. [proxy contract](https://zhuanlan.zhihu.com/p/34690916)
46. [vyper](https://vyper.readthedocs.io/en/stable/)
47. [TWAMM: Time-Weighted Average Market Maker](https://www.paradigm.xyz/2021/07/twamm/) 
48. [state channel](https://ethereum.org/en/developers/docs/scaling/state-channels/)  
49. [sniper](https://github.com/Supercycled/cake_sniper.git)  
50. [solidity security](https://learnblockchain.cn/eth/dev/%E5%AE%89%E5%85%A8%E5%88%86%E6%9E%90.html)  
51. [alchemix](https://github.com/alchemix-finance/alchemix-protocol)  
52. [Governace](https://github.com/withtally/safeguard)  

欢迎提交 PR，[添加新的基础任务或者更新上面的任务](https://github.com/rebase-network/Dapp-Learning/issues/new)

## 进阶任务

  此部分针对有一定基础开发者，选取主流优质项目进行源码剖析和 code review。  
  可采用小组协作方式将项目部署至测试网，以此为基础在 Rebase 社区进行分享。大型defi项目新颖且内容庞大，我们建议分工协作方式进行，如一人看白皮书，一人负责前端，一人负责合约，一人负责数据展示。
  开发者可以在开发群里发起项目研究倡议，建立小组，进行协作。此部分建议以 submoudle 方式引入。

## DeFi 进阶

01. [UniswapV2](defi/Uniswap-V2/readme.md) 
02. [UniswapV3](defi/Uniswap-V3/readme.md)
03. [Compound](defi/Compound/readme.md) [👉 认领这个 Task](https://github.com/rebase-network/Dapp-Learning/issues/new)
04. Aave [👉 认领这个 Task](https://github.com/rebase-network/Dapp-Learning/issues/new)
05. [SNX](https://github.com/Synthetixio) [👉 认领这个 Task](https://github.com/rebase-network/Dapp-Learning/issues/new)
06. [Curve](defi/Curve/README.md) [👉 认领这个 Task](https://github.com/rebase-network/Dapp-Learning/issues/new)
07. [0x-protocol](defi/0x-protocal/README.md) [👉 认领这个 Task](https://github.com/rebase-network/Dapp-Learning/issues/new)
08. Bancor [👉 认领这个 Task](https://github.com/rebase-network/Dapp-Learning/issues/new)
09. YFI [👉 认领这个 Task](https://github.com/rebase-network/Dapp-Learning/issues/new)
10. AMPL [👉 认领这个 Task](https://github.com/rebase-network/Dapp-Learning/issues/new)
11. [Perpetual Protocol](https://www.chainnews.com/articles/163436212237.htm) [👉 认领这个 Task](https://github.com/rebase-network/Dapp-Learning/issues/new)  
12. [DODO](https://dodoex.github.io/docs/zh/docs/DODO-Economics-102) [👉 认领这个 Task](https://github.com/rebase-network/Dapp-Learning/issues/new)  

## NFT 进阶

- 01. [OpenSea](nft/opensea/readme.md) [👉 认领这个 Task](https://github.com/rebase-network/Dapp-Learning/issues/new)
- 02. [aavegotchi](https://aavegotchi.com/) [👉 认领这个 Task](https://github.com/rebase-network/Dapp-Learning/issues/new)
- 03. [Tools](https://mp.weixin.qq.com/s/DrLCx2L7PgjsAWoYnF8Ysw)
- 04. [NFT quick overview](https://andrewsteinwold.substack.com/p/-quick-overview-of-the-nft-ecosystem)

## DAO 进阶

- 01. [Aragon](dao/Aragon/readme.md)
- 02. Augur [👉 认领这个 Task](https://github.com/rebase-network/Dapp-Learning/issues/new)
- 03. [DAOHaus](https://daohaus.club/) 
- 04. [DAOstack](https://daostack.io/)  [👉 认领这个 Task](https://github.com/rebase-network/Dapp-Learning/issues/new)

## Crypto 进阶
- 01.[ECC](./crypto/ECC)
- 02.[PLONK](./crypto/PLONK)
- 03.[tornado](https://medium.com/taipei-ethereum-meetup/tornado-cash-%E5%AF%A6%E4%BE%8B%E8%A7%A3%E6%9E%90-eb84db35de04)
[👉 认领这个 Task](https://github.com/rebase-network/Dapp-Learning/issues/new)

## 如何参与
- 提交一次PR或 关注公众号 「Rebase社区」并贡献一次技术分享，然后添加Maintainer微信yanyanho126申请入群,或直接联系Harry(微信号:ljyxxzj)进群。
- 原则上每周一次开发者沟通会议
- 采用集市开发方式，任何人都可以提交PR，一个链接，一个文档修改均可，无须task完成100%再提交，开发者会一起帮忙完善项目
- script脚本目录下测试案例保证能在kovan网调试成功，test目录下测试案例连本地节点调试成功
- 每个项目readme请加上参考链接这一目录，附上任务的相关参考资料
- solidity 建议0.6以上版本

刚入手项目，可以有四种方式切入：

1. 可以优化之前的项目代码和readme
2. 可以认领未完成任务卡（下方有链接的都是未完成任务卡，完成的任务卡请将参考链接放入对应项目readme下）
3. 可以自由新增任务卡（需附上参考链接）
4. 进阶项目（DEFI，DAO，NFT，CRYPTO）可以在群里发起开发倡议，小组一起研究  

## DAO组织管理项目
  1. 贡献过1次PR（或技术分享）以上可以进入开发者群；  
  2. 贡献过3次高质量PR（或参与3个task的完成）即可给予PR审核者的权限；
  3. PR审核者可以发起学习小组；
  4. PR审核者可以发起提案，决定项目发展规划，获取多数PR审核者同意即可通过提案；
  5. PR审核者须两周内至少一次PR，否则移除PR审核者权限，降为普通开发者，可以提PR重新加入。

## 小组学习
  进阶任务如defi，dao, nft项目研究，采用小组学习模式，有以下要求。
 1. 提交1次PR以上的开发者方可参与小组学习；
 2. 小组组员需分工明确，每周周例会进行成果分享；
 3. 原则上小组的子任务研究不超过3个人。  

 小组学习输出成果（参考）：    
 白皮书/合约/前端/graph： 部署，文档和rebase视频分享

## 常见问题
  测试币申请，安装和使用问题，请参考链接[常见问题](./TROUBLE_SHOOTING.md)  

## 合约参考库及致敬相关项目

- 经典合约库 - <https://github.com/OpenZeppelin/openzeppelin-contracts>
- 合约安全库 - <https://github.com/ConsenSys/smart-contract-best-practices>
- Dapp 脚手架 - <https://github.com/austintgriffith/scaffold-eth>
- 合约教程 - <https://github.com/HQ20/contracts>
- 区块链教程 - <https://learnblockchain.cn/>
- 密码学课程 - <https://live.csdn.net/list/Kevin_M_00>
- DeFi 教程 - <https://github.com/OffcierCia/DeFi-Developer-Road-Map>
- Solidity 入门教程 - <https://github.com/liushooter/learn-blockchain/tree/master/learning-solidity-2018>
- Awesome Solidity - <https://github.com/bkrem/awesome-solidity>

## 社区捐助

欢迎感兴趣的小伙伴参与共建，开源项目维护不易，我们欢迎捐助。  
gitcoin grant: [grant](https://gitcoin.co/grants/3414/dapp-learning-developer-group-1)    

捐助地址：  
- 通过以太坊主网：[0x1F7b953113f4dFcBF56a1688529CC812865840e1](https://etherscan.io/address/0x1F7b953113f4dFcBF56a1688529CC812865840e1)
- 通过 Polygon: [0x1F7b953113f4dFcBF56a1688529CC812865840e1](https://polygonscan.com/address/0x1F7b953113f4dFcBF56a1688529CC812865840e1)
- 通过 zkSync: [0x1F7b953113f4dFcBF56a1688529CC812865840e1](https://zkscan.io/explorer/accounts/0x1F7b953113f4dFcBF56a1688529CC812865840e1)

捐助资金管理：我们会用多签钱包管理资金（会将资金从主网转入matic网络，在matic网络实现多签钱包管理），并定期按 PR 提交记录分配资金给开发者。同时项目会给PR贡献者发放nft作为纪念奖品，以DAO治理形式管理此开源项目。
