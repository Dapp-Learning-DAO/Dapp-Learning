# Rebase Courses

本项目适合零基础开发者入门区块链 DAPP 开发，了解和开发 **DeFi, NFT, Dao** 项目。  

  主要工具是 web3.js（hardhat), web3.py (Brownie) ，我们选取主流技术和项目作为研究对象，可以认领待完成的任务或者自由添加自己感兴趣的项目。  
  项目分基础组件任务卡和项目任务卡，组件任务卡是基本工具组件的了解和集成，项目任务卡是主流 DeFi, NFT, DAO 的典型项目。  


## 基础知识

**建议开发者先阅读[《精通以太坊》](https://github.com/inoutcode/ethereum_book)**   

- 以太坊原理书：https://ethbook.abyteahead.com/howto.html  
- 以太坊开发工具汇总：https://learnblockchain.cn/article/2006  

## 必备工具清单  
开发前请安装和了解以下工具：  
- metamask（浏览器钱包插件）: https://www.jianshu.com/p/b5b2c05e9090  
导出私钥放到各项目的sk.txt文件里  
- infura（节点服务）: https://infura.io/  
- 测试均连接kovan测试网，kovan测试ETH申请: https://faucet.kovan.network  
- etherscan: 以太坊区块链浏览器: https://kovan.etherscan.io  
- JSON-PRC接口: https://eth.wiki/json-rpc/API  
- tenderly合约验证 https://dashboard.tenderly.co/explorer  


## 合约参考库及相关项目
- **https://github.com/liushooter/learn-blockchain/tree/master/learning-solidity-2018**  
（shooter大佬的项目，适合入门solidity）
  
- **https://github.com/OpenZeppelin/openzeppelin-contracts**   
  (经典合约库)
- **https://github.com/austintgriffith/scaffold-eth**  
(向此神级项目致敬)
- **https://github.com/HQ20/contracts**  


## 基础课程列表(可自由添加任务卡)
**添加任务卡时请附上相关参考链接**
- Day-1 web3j-deploy 
- Day-2 web3j-transaction 
- Day-3 web3j-erc20
- Day-4 web3j-truffle
- Day-5 ethersjs-erc20
- Day-6 ethersjs-waffle
- Day-7 hardhat  
- Day-8 graph  
- Day-9 react（metamask)  
- Day-10  ERC721+ ERC1155 + ipfs  
- Day-11 react + express + hardhat  

- Day-12 scaffold-ETH  
  https://github.com/austintgriffith/scaffold-eth  

- Day-13 simple Exchange & auction  

- Day-14 chainlink-api  
https://mp.weixin.qq.com/s/h0uTWY7vzd-CMdr1pE7_YQ  

- Day-15 nft-blindbox-chainlink-vrf  
https://learnblockchain.cn/article/1776  

- Day-16 pooltogether  
 https://pooltogether.com/ 

- Day-17 Crowdfund  

- Day-18 web3.py  
https://web3py.readthedocs.io/en/stable/quickstart.html  

- Day-19 brownie 
https://github.com/eth-brownie/brownie 

- Day-20 scaffold-flash-loan  

- Day-21 scaffold-Lender  
https://github.com/austintgriffith/scaffold-eth/tree/defi-rtokens  
https://github.com/austintgriffith/scaffold-eth/tree/unifactory  
https://github.com/austintgriffith/scaffold-eth/tree/clr-dev  
https://medium.com/dapphub/introducing-ds-math-an-innovative-safe-math-library-d58bc88313da  

- Day-22 scaffold-zk  
  https://blog.iden3.io/circom-snarkjs-plonk.html

- Day-23 snapshot  
https://www.chainnews.com/articles/038258049958.htm    
https://snapshot.org/#/  

- Day-24 vyper  

- Day-25 multi-sig-wallet  
https://zhuanlan.zhihu.com/p/337823524  

- Day-26 wallet develop  
https://learnblockchain.cn/2019/04/11/wallet-dev-guide/#ethers.js  

- Day-27 Quadratic vote  
https://www.chainnews.com/zh-hant/articles/460460084917.htm  

- Day-28 optimism layer2  
https://community.optimism.io/docs/developers/integration.html#step-1-compiling-contracts   
https://medium.com/plasma-group/ethereum-smart-contracts-in-l2-optimistic-rollup-2c1cef2ec537  

- Day-29 matic layer2  
  https://cloud.tencent.com/developer/article/1828250?from=article.detail.1794419

- Day-30 nft Filecoin     
  https://www.bilibili.com/video/BV1j5411w7MH?p=1&share_medium=iphone&share_plat=ios&share_source=WEIXIN&share_tag=s_i&timestamp=1622515696&unique_k=RWDVRu&share_times=2

## 进阶课程(可自由添加项目卡)
 此部分针对有一定基础开发者，选取主流优质项目进行源码剖析和code view。可采用小组协作方式将项目部署至测试网，以此为基础在Rebase社区进行分享。 
 此部分建议以submoudle方式引入。
## DeFi 进阶
### Learn-DEFI-XXX   

- P1 Uniswap  
https://medium.com/@austin_48503/%EF%B8%8F-minimum-viable-exchange-d84f30bd0c90   
V3 https://learnblockchain.cn/article/2357  

- P2 Compound  

- P3 Aave  
  https://azfuller20.medium.com/lend-with-aave-v2-20bacceedade    
  https://github.com/austintgriffith/scaffold-eth/blob/lender-swap/packages/hardhat/contracts/AavEth.sol  

- P4 SNX  
https://github.com/Synthetixio  

- P5 Curve  

- P6 0x-protocol  
https://blog.0xproject.com/  

- P7 Bancor  

- P8 YFI  


## NFT 进阶

### Learn-NFT-XXX   
- OpenSea


## DAO 进阶 
### Learn-DAO-XXX  
- Aragon  
   https://www.subdao.network/  

## Crypto 进阶
### Learn-Crypto-XXX 
  
  
## 如何参与

- 关注公众号 「Rebase社区」，回复「Rebase Courses」获得 Maintainer @yanyanho 联系方式
- 参与项目的开发者务必保证能够至少每两周提交一个PR
- 原则上每周一次开发者沟通会议
- script脚本目录下测试案例保证能在kovan网调试成功，test目录下测试案例连本地节点调试成功 
- 每个项目readme请加上参考链接这一目录，附上任务的相关参考资料
- solidity 建议0.6以上版本  

