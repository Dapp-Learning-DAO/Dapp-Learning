# SBT

## DID
DID（去中心化身份）本质上是一种URI（统一资源标识符），用于唯一识别一个资源。DIDs允许用户使用开放的标准生成自己的ID，并将相关身份信息存储在区块链等可信存储平台上，而不是某个互联网巨头的服务器上。DIDs能够唯一标记信息资源，提供了一种关于身份的良好载体。然而，DID的实现仍严重依赖于现有中心化机构来颁发各种身份凭证。

## SBT
SBT（Soulbound Token，灵魂绑定通证）顾名思义，是绑定于用户账户或钱包的Token，一旦生成则不可交易。SBT可以用来代表承诺、资格、从属关系等，其作用类似于履历表，由用户对应的相关方账户进行发行，作为相应社会关系的证明。

一个账户（地址）可以理解为一个灵魂，而一个灵魂可以拥有多个SBT。SBT对应着一系列的关系、成员资格和证书等。个人或组织都可以向其他灵魂发行SBT，从而形成“灵魂网络”。

- **声誉系统**
- **Web3信用贷**
- **SBT社区恢复**
- **灵魂空投**
- **灵魂治理**

## 技术实现
- **EIP-4973**: Account-bound Tokens
- **EIP-5114**: [EIP-5114](https://eips.ethereum.org/EIPS/eip-5114)
- **ERC721S**
- **EIP-3525**: 一种理想的半均质化通证，具有ERC-20的数量能力和ERC-721的描述能力。具体解决方案是在保留ERC-721的_tokenID基础上，引入基于ERC-20的_value数量操作，同时增加全新参数slot以表达分类概念，以及相应的Slot Metadata以帮助实现其业务层面的类别逻辑。[了解更多](https://mirror.xyz/0x07599B7E947A4F6240F826F41768F76149F490D5/VemGGAWbWtxW_G-89Pblgidi5Nx9pPvDySKnfnX83zs)

### ZK-SBT
参考项目: [ZK-SBT GitHub](https://github.com/enricobottazzi/ZK-SBT)

### 账户抽象
- **EIP-4377**: [EIP-4377](https://web3caff.com/zh/archives/26165)
- **EIP-2938**: [EIP-2938](https://medium.com/infinitism/erc-4337-account-abstraction-without-ethereum-protocol-changes-d75c9d94dc4a)

## 更多资料
### 研究论文与技术文档
- **Soulbound Tokens: A Comprehensive Overview**: 深入探讨SBT的概念、设计和应用场景，提供详细的技术架构和实现方案。
- **Decentralized Identity: Principles and Practices**: 探讨去中心化身份的基本原则、最佳实践及技术实现。
- **ZK-SBT: Using Zero-Knowledge Proofs in Soulbound Tokens**: 介绍零知识证明技术在SBT中的应用，提升用户隐私保护和身份验证的安全性。

### 开源项目
- **SBT Protocol Implementations**: GitHub上与SBT相关的开源项目，探索不同团队如何实现SBT，包括合约、应用和工具库。
- **DID Libraries and Frameworks**: 流行的去中心化身份库（如DIDKit、Identity.com），提供实现DID的API和工具。

### 在线课程与讲座
- **Web3 & Decentralized Identity Courses**: 在线教育平台（如Coursera、edX）提供的Web3和去中心化身份课程，帮助开发者和企业理解和应用这些新技术。
- **YouTube讲座**: 有关SBT和DID的讲座和研讨会，邀请行业专家分享经验和见解。

### 社区与论坛
- **Web3社群**: 加入Discord或Telegram的Web3社区，参与讨论，获取实时更新和新想法。
- **Stack Exchange & Reddit**: 提问和分享与SBT和DID相关的经验和见解，是获取帮助和知识的好地方。

## 应用实例
- **去中心化金融（DeFi）**: 在DeFi平台中，SBT可以用作信用评级的基础，提升借贷的透明度和安全性。
- **社交网络**: 用户可以通过SBT证明自己的社交身份和历史，在去中心化社交平台上建立信任。
- **身份认证**: 利用DID和SBT的结合，企业可以验证用户身份，并为他们颁发具有法律效力的数字证书。

## 未来发展
- **标准化**: SBT和DID的发展仍处于早期阶段，未来可能会有更多标准化的工作，以促进不同平台和协议之间的互操作性。
- **法律与合规**: 随着SBT和DID的普及，相关法律法规的制定将成为重点，确保用户隐私和数据安全。
- **技术创新**: 随着区块链和加密技术的进步，新的解决方案将不断涌现，以增强SBT和DID的功能和应用场景。

## 参考链接
- [Vitalik文章](https://vitalik.eth.limo/general/2022/01/26/soulbound.html)
- [Decentralized Society: Finding Web3's Soul](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4105763)
- [SBT综述](https://mirror.xyz/0x07599B7E947A4F6240F826F41768F76149F490D5/fbYA4BbpB8zxbFqO2FpyLEFprXMqhSfQQQIo_lU8LGE)
- [DID总结文章1](https://docs.qq.com/doc/DVGJFUWN6RGRZdWJo)
- [DID总结文章2](https://docs.qq.com/doc/DVEFDQ2FISWVRa0RX)
