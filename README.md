[中文](https://github.com/Dapp-Learning-DAO/Dapp-Learning/blob/main/README-CN.md) / English  
<div align="center">
  <img src="./DappLearning-logo.svg" style="margin: 0 auto 40px;" width="380" />
  <!-- <h1>Dapp Learning</h1> -->
  <h4 align="center">
    Definitive Guide for Decentralized-app(Dapp) Development on Blockchain
  </h4>
  <p>Step-by-step Dapp practice through actual projects.</p>
</div>

## Preface

We are designed for developers to step into blockchain DAPP development, where they can learn **DeFi, NFT, DAO, CRYPTO** projects. We hope we could not only give **junior developers** a feasible and easy-to-use blockchain **DAPP** learning roadmap, but also present **advanced developers** with a platform for communication and cooperation.

We, incubated from [dapp learning open source university](https://docs.qq.com/doc/DQ3hWeVVXQ3JPbXFS),  are a decentralized learning group to study the mainstream DAPP projects together and share thoughts every week. The weekly sharing will be recorded and uploaded to  [Youtube](https://www.youtube.com/c/DappLearning/videos).

We adhere to the concept of [open source university](https://docs.qq.com/doc/DQ3hWeVVXQ3JPbXFS) and follow DAO's governance. Currently, we are sponsored by [Ethereum foundation](https://esp.ethereum.foundation/en/), and accept grants in [gitcoin](https://gitcoin.co/grants/3414/dapp-learning-developer-group-1). All the funds will be awarded to whoever makes valuable contributions to us. Please follow us on Twitter [@Dapp_Learning](https://twitter.com/Dapp_Learning) or WeChat Official Account [Welcome to Dapp-Learning](https://mp.weixin.qq.com/s/79eRMtB_yz8G6H8_saCeLw) to keep track of our latest progress.

We need more builders to help make our community grow - contributors are welcomed from all backgrounds! Feel free to send us pull requests to set up new tutorials and improve our tutorial projects - just fix the minor typos are helpful to us 🤗.

Join our developer community by submitting PR or sharing at [dapp learning university](https://docs.qq.com/doc/DQ3hWeVVXQ3JPbXFS). Once you submit three PRs, you will be promoted to a pull request reviewer who could participate in our Dao's governance. For more **project management rules**, please see [how new members participate and project governance rules](https://github.com/Dapp-Learning-DAO/Dapp-Learning/blob/main/docs/dao.md). Welcome to join us if you share the same value. 

<details>
<summary>Official links</summary>

- [Github](https://github.com/Dapp-Learning-DAO/Dapp-Learning)
- [Twitter](https://twitter.com/Dapp_Learning)
- [discord](https://discord.gg/cRYNYXqPeR)
- [Youtube](https://www.youtube.com/channel/UCdJKZVxO55N3n2BQYXMDAcQ)
- Wechat Official Account: Dapp Learning
- [Bilibili](https://space.bilibili.com/382886213)
- [notion](https://dapp-learning.notion.site/Dapp-Learning-Homepage-79545c9d4ffe4e77a8cbc1c55e77b551)
- [Sharing Meeting](https://www.notion.so/18d05e02771f4a38970d152e3ee30ff9)
- [Gitcoin](https://gitcoin.co/grants/3414/dapp-learning-developer-group-1)
- [Project Fund Management](https://polygon.gnosis-safe.io/app/#/safes/0x2A6D09B3b11E5455a37F907f2ec885E0Be704779/balances)
- [linktr](https://linktr.ee/dapplearning)

</details>

<details>
<summary>Technology Stack: </summary>

- `web3.js`
- `ethers.js (Hardhat)`
- `web3.py (Brownie)`
- `Java` (Optional)
- `Rust` (Optional)
- `Go` (Optional)

</details>

## Project structure
The project is divided into two parts: **Basic task** and **Project task**
- **Basic task**
Basic tools to familiarize and integrate blockchain development (e.g. ERC standard, Oracle, GRAPH, IPFS)
- **Project task**
Case studies of the mainstream DeFi, NFT, Dao and other crypto projects to enlighten developers to deep dive into dapp development. We will organzie study groups to discuss and study project together.

## Preparatory Work
**Ramp up**
- Developers new to dapp development are strongly encoraged to learn the basics of Ethereum and Solidity before embarking on formal development.
You can refer to [basic knowledge preparation](./docs/basic-knowledge.md) to ramp up.

**Development tool**
- Sharp tools make good work. Familiarize yourself with basic development tools.
Refer to [recommended development tools](./docs/develop-tools.md) to view the current mainstream blockchain development tools.

**Recommended reading**
We have collected a list of classic blockchain-related books to help developers know underlying philosophy behind blockchain.
- *Sovereign Individuals*, Follow public account[Unknown Scripture](https://mp.weixin.qq.com/mp/homepage?__biz=MzU4NDQwMTc3MQ==&hid=7&sn=124258360d0a530008a41ea32e7c2bf2&scene=1&devicetype=android-29&version=28000b3b&lang=en&nettype=WIFI&ascene=7&session_us=gh_353f7f41a447&wx_header=1).
- *The Austrian School of Thought* is recommended,[Hayek Life introduction](https://mp.weixin.qq.com/s/p1UZdt5BAQVJ3kl_CniwKQ).
- Series articles [Austrian economics school of thought for blockchain enthusiasts](https://mp.weixin.qq.com/mp/appmsgalbum?__biz=MzU0ODk1MTE1MA==&action=getalbum&album_id=1986143111768489985&scene=173&from_msgid=2247484102&from_itemidx=1&count=3&nolastread=1#wechat_redirect)
- *[Political Economy](https://www.marxists.org/subject/economy/index.htm)*

At the same time, feel free to keep expanding this [book list](./docs/books.md).

**Encryption course**

We have collected some crypto courses from top universities and the Ethereum community to help developers systematically understand blockchain and cryptocurrencies.
- [MIT Online Course: Blockchain and Money by Prof. Gary Gensler](https://ocw.mit.edu/courses/sloan-school-of-management/15-s12-blockchain-and-money-fall-2018/video-lectures/)
- [Berkeley Online Course:](https://berkeley-defi.github.io/f21)   [Defi Learning](https://defi-learning.org/)
- [Standford Online Course: CS 251 Bitcoin and Cryptocurrencies](https://cs251.stanford.edu/syllabus.html)

We have also organized a translation group to translate MIT course 'blockchain and money' into Chinese, and upload all the chinese note-taking on our WeChat Official Account [Welcome to Dapp-Learning](https://mp.weixin.qq.com/s/79eRMtB_yz8G6H8_saCeLw)

If you have other high-quality course recommendations, we hope you can make a suggestion and add it in our course repo: [Recommendations for cryptographic courses](./docs/crypto-course.md).

## Basic Tasks

Understand the basic tools and development knowledge of developing DAPP through the following basic tasks.
For DAPP architecture, please refer to the article--[the difference between Web2.0 and Web3.0 applications from the architectural dimension](https://zhuanlan.zhihu.com/p/414635679?utm_source=wechat_session&utm_medium=social&utm_oi=778564687968092160&s_r=0).
Learn and run the first 20 tasks locally and upgrade to focus on **project tasks**
You are welcome to PR improvements to existing tutorial projects or to create more tutorial projects

⬜ Task Not Start
⌛ Task Processing
✅ Task Finish

01. [deploy contract with web3.js](basic/01-web3js-deploy) ✅
02. [create transaction with web3.js](basic/02-web3js-transaction) ✅
03. [call ERC20 contract with web3.js](basic/03-web3js-erc20) ✅
04. [truffle](basic/04-web3js-truffle) ✅
05. [call ERC20 contract with ethers.js](basic/05-ethersjs-erc20) ✅
06. [test contract with waffle and ethers.js](basic/06-ethersjs-waffle) ✅
07. [hardhat](basic/07-hardhat) ✅
08. [graph](basic/08-hardhat-graph) ✅
09. [react（metamask)](basic/09-hardhat-react) ✅
10. [ERC721+ ERC1155 + ipfs](basic/10-hardhat-ipfs-erc721) ✅
11. [react + express + hardhat](basic/11-react-express-hardhat) ✅
12. [Crowdfund](basic/12-token-crowdfund) ✅
13. [decentralized exchange](basic/13-decentralized-exchange) ✅
14. [chainlink-api](basic/14-chainlink-price-feed) ✅
15. [nft-blindbox-chainlink-vrf](basic/15-nft-blindbox-chainlink-vrf) ✅
16. [nft auction & exchange](basic/16-nft-auction-exchange) ✅
17. [wallet development](basic/17-etherjs-wallet-develop) ✅
18. [web3.py](basic/18-web3py) ✅
19. [brownie](basic/19-brownie) ✅
20. [flash-loan](basic/20-flash-loan) ✅
21. [aave-uni-lender](basic/21-aave-uni-loan) ✅
22. [zk-snarkjs](basic/22-zk-snarkjs) ✅
23. [ERC865 & ERC875](basic/23-erc865-and-erc875) ✅
24. [Upgradeable-contract](basic/24-upgradeable-contract) ✅
25. [multi-sig-wallet](basic/25-multi-sig-wallet) ✅
26. [Quadratic vote & Gitcoin](basic/26-quadratic-vote%26gitcoin) ✅
27. [Arbitrum layer2](basic/27-Arbitrum-layer2) ✅
28. [Optimism layer2](basic/28-optimism-layer2) ✅
29. [Polygon(matic) layer2](basic/29-Polygon(matic)-layer2) ✅
30. [zksync layer2](basic/30-zksync-layer2) ✅
31. [StarkNet](basic/31-starkNet-layer2) ⌛
32. [chainlink-keeper](basic/32-chainlink-keeper) ✅
33. [pooltogether](basic/33-pooltogether) ⌛
34. [subgraph](basic/34-subgraph) ⬜
35. [duneanalytics & nansen](basic/35-dune-analytics-nansen) ⬜
36. [NFT FileCoin](basic/36-nft-ipfs) ✅
37. [Charm.fi](basic/37-charm.fi) ✅
38. [Flashbots provider with ethers.js](basic/38-Flashbots-and-Eden) ⬜
39. [Multicall](basic/39-Multicall) ✅
40. [snapshot](basic/40-snapshot) ⌛
41. [NFT farming](https://superfarm.com/farms) ⬜
42. [merkle-distributor airdrop](basic/42-merkle-distributor-airdrop)  ✅
43. [front running](https://github.com/Supercycled/cake_sniper)  ⬜
44. [JavaScript Cryptography](https://blog.sessionstack.com/how-javascript-works-cryptography-how-to-deal-with-man-in-the-middle-mitm-attacks-bf8fc6be546c) ✅
45. [LP Dividend](https://github.com/sushiswap/sushiswap) ⬜
46. [NFT Floor Perps](https://www.paradigm.xyz/2021/08/floor-perps/) ⬜
47. [TWAMM: Time-Weighted Average Market Maker](https://www.paradigm.xyz/2021/07/twamm/) ⬜
48. [state channel](https://ethereum.org/en/developers/docs/scaling/state-channels/)  ⬜
49. [sniper](https://github.com/Supercycled/cake_sniper.git) ⬜
50. [solidity security](basic/50-solidity-security)  ✅
51. [NYM](https://myz1237.substack.com/p/nymwhitepaper?r=uaq4w&utm_campaign=post&utm_medium=web&utm_source=) ⬜
52. [Governace](https://github.com/withtally/safeguard)  ⬜
53. [Freelancer's Smart Contract](basic/53-freelancer) ✅
54. [Cryptovoxels](https://zhuanlan.zhihu.com/p/379249411) ⬜
55. [PBFT](https://medium.com/loom-network-chinese/%E4%BA%86%E8%A7%A3%E5%8C%BA%E5%9D%97%E9%93%BE%E7%9A%84%E5%9F%BA%E6%9C%AC-%E7%AC%AC%E4%B8%80%E9%83%A8%E5%88%86-%E6%8B%9C%E5%8D%A0%E5%BA%AD%E5%AE%B9%E9%94%99-byzantine-fault-tolerance-8a1912c311ba) ⬜
56. [IDO](https://github.com/gnosis/ido-contracts) ⬜
57. [Orbit model](https://github.com/orbit-love/orbit-model) ⬜
58. [Ethereum Virtual Machine Opcodes](basic/58-EVM/readme.md) ⌛
59. [web3.0 dapp](basic/59-web3-dapp) ⌛
60. [Referral Code](https://developers.thundercore.com/docs/referral-contract/) ⬜
61. [ENS](basic/61-ENS) ✅
62. [Tenderly](https://dashboard.tenderly.co/explorer)
63. [HTLC-crosschain](basic/63-htlc-crosschain) ✅
64. [Web3-Rust](https://github.com/tomusdrw/rust-web3) ⬜
65. [ZK-NFT](https://github.com/kevinz917/zk-NFT)
66. [Kleros](https://kleros.io/)
67. [Go-Ethereum Code Analysis](basic/67-Go-Ethereum-Code-Analysis/readme.md)
68. [Config discord with Collab.land](basic/68-config-discord-with-Collab.land)  ✅
69. [Decentralized OTC](https://github.com/DOTCPro)
70. [Arweave file upload with Bundlr Client](basic/70-arweave-file-upload-with-bundlr/README.md)
71. [Foundry](basic/71-foundry/README.md)
72. [Unlock protocol](https://docs.unlock-protocol.com/unlock/developers/unlock-platform)
73. [onchainNFT](https://github.com/Park-City-Utah/onChainNFT)
74. [erc20-meta-token](https://github.com/0xsequence/erc20-meta-token) 
75. [golang-dapp](basic/75-golang-dapp) ✅
76. [Thirdweb](https://portal.thirdweb.com/)  

Welcome to submit pull request,[Add a new basic task or update the above task](https://github.com/Dapp-Learning-DAO/Dapp-Learning/issues/new)

## Advanced task

**The preparatory work**:
  For developers with a certain foundation, this part selects mainstream high-quality projects for source code analysis and code review.
  
  The project can be deployed to the test network and shared with the community as a basis. Large DEFI projects are complicated so we suggest to establish a study group to cooperate, ie. one for white paper, one for the front end, one for the contract, and one for data presentation.
  
  Developers can initiate project research topic, form groups, and collaborate within the development community. This section is recommended as a submodule.

## DeFi advanced tasks
The DEFI bibles will set you up with a good fundamental understandings of the DEFI system.  
  [How to DeFi](https://store.coingecko.com/collections/frontpage/products/how-to-defi-beginner)     
  [How to DeFi:Advanced](https://store.coingecko.com/collections/frontpage/products/how-to-defi-advanced)   
 
**DEFI Learning roadmap：**    
Trading -> Lending -> Derivatives

You can refer to our study group's learning roadmap, which is better with the video.

- Trading: uniV1(task13) -> uniV2 -> uniV3 -> CurveV1 -> CurveV2
- Lending: Aave -> Compound -> Liquity -> Euler
- Derivatives: SNX -> YFI -> Perpetual

01. [UniswapV2](defi/Uniswap-V2/readme.md) ✅
02. [UniswapV3](defi/Uniswap-V3/readme.md) ✅
03. [Curve](defi/Curve/README.md) ⌛
04. [Compound](defi/Compound/readme.md) ✅
05. [Aave](https://docs.aave.com/portal/)  ✅
06. [Liquity](defi/Liquity/readme.md) ⌛
07. [Euler](defi/Euler/readme.md) ⌛
08. [SNX](https://github.com/Synthetixio) [👉 Pick up this Task](https://github.com/Dapp-Learning-DAO/Dapp-Learning/issues/new)
09. [YFI](https://yearn.finance/) [👉 Pick up this Task](https://github.com/Dapp-Learning-DAO/Dapp-Learning/issues/new)
10. [Perpetual Protocol](https://www.chainnews.com/articles/163436212237.htm) [👉 Pick up this Task](https://github.com/Dapp-Learning-DAO/Dapp-Learning/issues/new)
11. [Sushi](https://docs.sushi.com/) ✅  
12. [OPYN](https://v2.opyn.co/)⌛
13. [Alchemix](https://github.com/alchemix-finance/alchemix-protocol) ✅
14. [AMPL](https://roninchow.gitbook.io/ampleforth-cn/technology) [👉 Pick up this Task](https://github.com/Dapp-Learning-DAO/Dapp-Learning/issues/new)
15. [RAI](https://www.youtube.com/watch?v=ADK91Zw4sJA&list=PL-GxJch-YeZerVVV8dY8qU2VkJfbnSfdN&index=3)
16. [DYDX](https://dydx.exchange/)[👉 Pick up this Task](https://github.com/Dapp-Learning-DAO/Dapp-Learning/issues/new)
17. [INDEX](https://mp.weixin.qq.com/s/PXOY3G6AIbhzRUptjYoWIw)[👉 Pick up this Task](https://github.com/Dapp-Learning-DAO/Dapp-Learning/issues/new)
18. [DODO Trading API](https://dodoex.github.io/docs/zh/docs/tradeApi) [👉 Pick up this Task](https://github.com/Dapp-Learning-DAO/Dapp-Learning/issues/new)
19. [MakerDao](https://zhuanlan.zhihu.com/p/41889079)[👉 Pick up this task](https://github.com/Dapp-Learning-DAO/Dapp-Learning/issues/new)
20. [0x-protocol](defi/0x-protocal/README.md) [👉 Pick up this Task](https://github.com/Dapp-Learning-DAO/Dapp-Learning/issues/new)
21. [Bancor](https://bancor.network/) [👉 Pick up this Task](https://github.com/Dapp-Learning-DAO/Dapp-Learning/issues/new)
22. [Set](https://www.tokensets.com/)
23. [Dhedge](https://docs.dhedge.org/dhedge-protocol/managing-on-v2)
24. [Element](https://app.element.fi/fixedrates)

## NFT advanced tasks

- 01. [OpenSea](nft/opensea/readme.md) [👉 Claim this Task](https://github.com/Dapp-Learning-DAO/Dapp-Learning/issues/new)
- 02. [aavegotchi](https://aavegotchi.com/) [👉 Claim this Task](https://github.com/Dapp-Learning-DAO/Dapp-Learning/issues/new)
- 03. [Loot NFT Distribute](nft/loot-nft/README.md)
- 04. [Rarible](https://docs.rarible.org/overview/union/)
- 05. [Zora](https://docs.zora.co/)
- 06. [Alchemy](https://www.alchemy.com/nft-api)

## DAO advanced tasks

- 01. [Aragon](dao/Aragon/readme.md)
- 02. Augur [👉 Pick up this task](https://github.com/Dapp-Learning-DAO/Dapp-Learning/issues/new)
- 03. [DAOHaus](https://daohaus.club/)
- 04. [DAOstack](https://daostack.io/)  [👉 Pick up this task](https://github.com/Dapp-Learning-DAO/Dapp-Learning/issues/new)
- 05. [Gnosis](https://github.com/gnosis)[👉 Pick up this task](https://github.com/Dapp-Learning-DAO/Dapp-Learning/issues/new) 

## Crypto advanced tasks
Please read the book first:
[《Graphic encryption technology》](https://book.douban.com/subject/26822106/)
Item list:
- 01.[ECC](./crypto/ECC)
- 02.[PLONK](./crypto/PLONK)
- 03.[tornado](https://medium.com/taipei-ethereum-meetup/tornado-cash-%E5%AF%A6%E4%BE%8B%E8%A7%A3%E6%9E%90-eb84db35de04)
- 04.[zk_snark](https://arxiv.org/pdf/1906.07221.pdf)
[👉 Claim this task](https://github.com/Dapp-Learning-DAO/Dapp-Learning/issues/new)  
- 05.[js crypto](https://github.com/fireship-io/node-crypto-examples)
  [👉 Claim this Task](https://github.com/Dapp-Learning-DAO/Dapp-Learning/issues/new)
- 06.[MINA](https://minaprotocol.com/)
- 07.[ZETH](https://github.com/clearmatics/zeth)


## Smart Contract Security
1. Common safety tools
- [Slither](https://github.com/crytic/slither)
- [Mythril](https://github.com/ConsenSys/mythril)
- [Securify](https://github.com/eth-sri/securify2)
2. CTF Training camp
 - [Ethernaut](https://ethernaut.openzeppelin.com/)
 - [Damn-Vulnerable-Defi](https://github.com/OpenZeppelin/damn-vulnerable-defi/blob/master/contracts/DamnValuableToken.sol)
 - [Paradigm-ctf](https://github.com/paradigm-operations/paradigm-ctf-2021)
 - [Smart Contract CTF](https://blockchain-ctf.securityinnovation.com)
3. Safe development practices
 - [Safety development practice of Solidity](https://github.com/slowmist/Knowledge-Base/blob/master/solidity-security-comprehensive-list-of-known-attack-vectors-and-common-anti-patterns-chinese.md)
4. Integration of learning resources
 - [Awesome Blockchain Security](https://github.com/xxxeyJ/Awesome-Blockchain-Security)  
 - [Immunefi 学习资源](https://immunefi.com/learn/)  

 ## Cryptocurrency Jobs Websites
Feel like a career in the crypto industry? The following websites fyi:
 - https://cryptocurrencyjobs.co/
 - https://angel.co/jobs
 - https://www.paradigm.xyz/opportunities/

## Project Ecology
Dapp-learning has a series of derivative projects and joint maintenance projects. Refer to [related projects](./docs/relative-projects.md),Learn more about the ecology of the Dapp-Learning project.

## Guide to Contribution
Intereted in participating? Check out this doc and find out how you can be a member of us: [How to contribute](./docs/dao.md).

## Frequently Asked Questions (FAQ)
Please refer to [this link](./docs/TROUBLE_SHOOTING.md) to get some answers on how to set up dev environment, how to use the project, and how to get tokens for testing etc.

## Donation Wanted
Open-sourced projects are not easy to maintain so we'd love for all kinds of donations. Dapp Learning team follow DAO's governance and all donations would be allocated to our community members as crypto rewards and/or NFTs based on their quality of contributions.

We have a Gitcoin campaign to sustain the Dapp-Learning efforts:
- Gitcoin grant address: [Dapp-Learning gitcoin grant](https://gitcoin.co/grants/3414/dapp-learning-developer-group-1)

Direct donation to our dev team's fund is also appreciated:
- Ethereum main network/zkSync/Arbitrum：
0x1F7b953113f4dFcBF56a1688529CC812865840e1

**We also have created multi-signature wallets on polygon, managed by our core contributors**
- Polygon [Multiple signature wallets](https://polygon.gnosis-safe.io/app/#/safes/0x2A6D09B3b11E5455a37F907f2ec885E0Be704779 ): 0x2A6D09B3b11E5455a37F907f2ec885E0Be704779

## Ethereum Foundation-sponsored projects
This project is sponsored by Ethereum foundation. Follow us on Twitter [@Dapp_Learning](https://twitter.com/Dapp_Learning) to get the latest updates.
Sponsorship grants are managed under a multi-sign-up wallet by core contributor team; the fund is available to all contributors for their stellar additions to the project. We look forward to see your contributions soon.
![ESP02](./docs/imgs/ESP-02.jpg)

## Cooperative partner


<br>
<div align="left">
  <a href="https://rebase.network/">
    <img align="top" src="./docs/imgs/partners/rebase-logo.png" />
  </a>
  &nbsp;&nbsp;
  &nbsp;&nbsp;
  <a href="https://www.hiblock.net/">
    <img align="top" src="./docs/imgs/partners/Hiblock-logo.png" />
  </a>
  &nbsp;&nbsp;
  &nbsp;&nbsp;
  <a href="https://learnblockchain.cn/">
    <img align="top" src="./docs/imgs/partners/learnblockchain-logo.png" />
  </a>
  &nbsp;&nbsp;
  &nbsp;&nbsp;
  <a href="https://www.ethereum.cn/">
    <img align="top" src="./docs/imgs/partners/ECN-logo.png" />
  </a>
</div>
<br>
<div align="left">
  &nbsp;&nbsp;
  &nbsp;&nbsp;
  <a href="https://thublockchain.org/">
    <img align="top" src="./docs/imgs/partners/THUBA-logo.png" />
  </a>
  &nbsp;&nbsp;
  &nbsp;&nbsp;
  &nbsp;&nbsp;
  <a>
    <img align="top" src="./docs/imgs/partners/PKU-logo.png" />
  </a>
  &nbsp;&nbsp;
  &nbsp;&nbsp;
  <a href="https://btcu.tech/">
    <img align="top" src="./docs/imgs/partners/BTCU-logo.png" />
  </a>
</div>
<br>
<br>

## Sponsor partner

Shout out to the following organizations for their unconditional donations to us/the open source project.

<br>
<div align="left">
  <a href="https://snzholding.com/">
    <img align="top" src="./docs/imgs/sponsor-partners/SNZ-logo.png" />
  </a>
  &nbsp;&nbsp;
  &nbsp;&nbsp;
  <a href="https://www.nervos.org/">
    <img align="top" src="./docs/imgs/sponsor-partners/nervos-logo.png" />
  </a>
  &nbsp;&nbsp;
  &nbsp;&nbsp;
  <a href="https://web3q.io/home.w3q/">
    <img align="top" src="./docs/imgs/sponsor-partners/Web3Q-logo.png" />
  </a>
  &nbsp;&nbsp;
  &nbsp;&nbsp;
  <a href="https://t.me/planckeropencommunity/">
    <img align="top" src="./docs/imgs/sponsor-partners/plancker-logo.png" />
  </a>
</div>
<div align="left">
  <a href="https://degate.com/">
    <img align="top" src="./docs/imgs/sponsor-partners/Degate-logo.png" />
  </a>
  &nbsp;&nbsp;
  &nbsp;&nbsp;
</div>
<br>

## Contributors

<div align="center">
  <h4 align="center">
    Thanks to the contributors of Dapp Learning
  </h4>
  <a href = "https://github.com/Dapp-Learning-DAO/Dapp-Learning/graphs/contributors">
    <img src = "https://contrib.rocks/image?repo=Dapp-Learning-DAO/Dapp-Learning&max=200"/>
  </a>
</div>

