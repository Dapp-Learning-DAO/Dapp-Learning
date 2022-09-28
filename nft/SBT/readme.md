# SBT


 ## DID
本质上是一种URI（统一资源标识符）：唯一识别一个资源；

DIDs 允许用户使用开放的标准生成自己的 ID，并将相关身份信息存储到区块链这样的可信存储平台上而不是某个互联网巨头的服务器里。DIDs 可以去唯一标记一个信息资源，提供了一种关于身份的良好载体
问题： 严重依赖现有中心化机构去颁发各种身份凭证




 ## SBT
 SBT，Soulbond Token（灵魂绑定通证），顾名思义，就是绑定于用户账户或钱包的 Token，一旦生成则不可交易。SBT 可以用来代表承诺、资格、从属关系等，其作用类似于履历表，由用户对应的相关方账户进行发行，作为相应社会关系的一种证明。


 一个账户（地址）可以理解为一个灵魂，一个灵魂可以拥有多个SBT。
 SBT对应着一系列的关系，成员资格和证书等等。
 个人或者阻止都可以向其他灵魂发行SBT。进而形成“灵魂网络”。

 - 声誉系统
 - web3信用贷
 - SBT社区恢复
 - 灵魂空投
 - 灵魂治理


 
 ## 技术实现
 -  EIP-4973 Account-bound Tokens
 - EIP-5114（https://eips.ethereum.org/EIPS/eip-5114.）
 - ERC721S
 -  EIP-3525
 一种理想的半匀质化通证，同时具有 ERC-20 的数量能力和 ERC-721 的描述能力。
 具体解决方案是在保留 ERC-721 的_tokenID 基础上引入基于 ERC-20 的_value 的数量操作，同时增加一个全新的参数 slot 来表达分类概念，以及一个对应的 Slot Metadata 来帮助实现其业务层面的类别逻辑。
 https://mirror.xyz/0x07599B7E947A4F6240F826F41768F76149F490D5/VemGGAWbWtxW_G-89Pblgidi5Nx9pPvDySKnfnX83zs
 
 - EIP-5114



 ### ZK-SBT
  参考项目: https://github.com/enricobottazzi/ZK-SBT


### 账户抽象
EIP4377 
https://web3caff.com/zh/archives/26165

EIP-2938
https://medium.com/infinitism/erc-4337-account-abstraction-without-ethereum-protocol-changes-d75c9d94dc4a


## 参考链接
- [vitalik文章](https://vitalik.ca/general/2022/01/26/soulbound.html)
- [ Decentralized Society: Finding Web3's Soul ](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4105763)
- [SBT综述](https://mirror.xyz/0x07599B7E947A4F6240F826F41768F76149F490D5/fbYA4BbpB8zxbFqO2FpyLEFprXMqhSfQQQIo_lU8LGE)
- [DID总结文章1]（https://docs.qq.com/doc/DVGJFUWN6RGRZdWJo）
- [DID总结文章2]（https://docs.qq.com/doc/DVEFDQ2FISWVRa0RX）
