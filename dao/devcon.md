官网：https://devcon.org/en/

今年 Devcon7 吸引全球 130 个国家共 12,500 名参与者参与，人数比上届多出一倍，也是史上规模最大的一届。

![1.png](./imgs/1.png)

## 历史介绍

![2.png](./imgs/2.png)

![3.png](./imgs/3.png)

### Devcon & Devconnect

EF举办的两场大会

https://devconnect.org/ 

## 形式和内容

![4.png](./imgs/4.png)

### 涵盖话题：

- **Core protocol**
- Cypherpunk and privacy
- **Usability**
- Real world Ethereum
- **Applied cryptography**
- Cryptoeconomics
- Coordination
- Developer experience
- Security
- **Layer 2S**

https://ef-events.notion.site/Devcon-Talks-Wishlist-e3db0d77dbb94bc4a11287761e149e1f

## 以太坊& L2

### Ethereum in 30 mins

https://www.youtube.com/watch?v=ei3tDRMjw6k

![5.png](./imgs/5.png)

![6.png](./imgs/6.png)

世界计算机， 以太坊客户端的多样性， 更少的质押量 orbit， 轻客户端

Cross layer2 operation

dydxV3 l2beat implement exit hatch

L2 cost  less than 1cent

Light client  **helios**

![7.png](./imgs/7.png)

![8.png](./imgs/8.png)

### This year in Ethereum

Josh Stark

https://www.youtube.com/watch?v=YyK8i2-0aPk&t=83s

![9.png](./imgs/9.png)

![10.png](./imgs/10.png)

![11.png](./imgs/11.png)

### 相关项目：

**Farcaster , Lens , Zora**

**Game: https://whitepaper.evefrontier.com/**

**ID: ENS ,ANON**

**Prediction: polymarket, augur, veil**

### 两个quest:

1. L2的stage阶段，跟L1对齐， 目前arbi ，op都已经stage1

https://l2beat.com/scaling/summary

1. Interoperability + UX

流动性碎片

### Beam chain (Justin Drake)

https://x.com/VitalikButerin/status/1741190491578810445/photo/1

回顾下eth2.0 roadmap

![12.png](./imgs/12.png)

Execution layer,  Data layer, consensus layer

**Redesign consensus layer**

![13.png](./imgs/13.png)

![14.png](./imgs/14.png)

![15.png](./imgs/15.png)

Pow ->pos -> zk

ZKEVM 可能因兼容编译器和工具链而被优先选择，但现在，**ZKVM**的潜力被更广泛地认可。

RISC V 指令集 。**risc0  sp1**  - > state transistion funciton

![16.png](./imgs/16.png)

### Pectra 升级

https://www.youtube.com/watch?v=ufIDBCgdGwY

By Christine Kim

以太坊的下一次升级

![17.png](./imgs/17.png)

![18.png](./imgs/18.png)

![19.png](./imgs/19.png)

![20.png](./imgs/20.png)

### Based rollup & preconfs

By Puffer labs Jason

https://www.youtube.com/watch?v=WiKPlNGrUzU

解决L2流动性碎片问题

![21.png](./imgs/21.png)

![22.png](./imgs/22.png)

Agree on one entity to sequence all the rollups. **L1-sequenced.**

![23.png](./imgs/23.png)

![24.png](./imgs/24.png)

问题：需要等待12S的区块确认时间（L1 block）

Pre-confs

![25.png](./imgs/25.png)

![26.png](./imgs/26.png)
![27.png](./imgs/27.png)

### Advancing OP Stack to ZK Rollup

https://www.youtube.com/watch?v=04Fis57TTHE

![28.png](./imgs/28.png)

### Agglayer

https://www.youtube.com/watch?v=asPJJDIQaWY

**Shared sequencer**

The Agglayer is a neutral, cross-chain settlement layer that unifies liquidity, users ,and

State of aggregated chains, and post finality to Ethereum.

实现多个 Optimistic Rollup 之间的原子跨链互操作性。通过共享排序器，整个系统能够统一处理多个 Rollup 的交易排序和状态根发布，确保原子性和条件执行。

具体实现逻辑需要通过三个组件：

1. **接受跨链操作的共享排序器**：接收和处理跨链交易请求；
2. **区块构建算法**：共享排序器负责构建包含跨链操作的区块，确保这些操作的原子性；
3. **共享欺诈证明**：在相关 Rollup 之间共享欺诈证明机制，以强制执行跨链操作。

![29.png](./imgs/29.png)
![30.png](./imgs/30.png)

### Chain Abstraction

onebalance

https://www.youtube.com/watch?v=9fH-de8v53g



https://www.erc7683.org/resources

![31.png](./imgs/31.png)

![32.png](./imgs/32.png)

https://vitalik.eth.limo/general/2024/12/03/wallets.html

![33.png](./imgs/33.png)

### Unichain

1.  Instant transactions (250 ms block times)

1. Reduced cost and further decentralization
2. Cross-chain liquidity ( [ERC7683](https://www.erc7683.org/))

### ENS：

ENS的跨链互操作性

https://app.devcon.org/schedule/VBSW3N

https://www.youtube.com/watch?v=e_QBTQGMxPs

### BASE

### Linea

## AA：

从 ERC4377 到 ERC7702

EIP-7702通过结合ERC-4337、EIP-3074和EIP-5003的优点。EIP-7702与现有ERC-4337基础设施完全兼容

- **ERC-4337 - 智能合约账户：**允许智能合约作为用户账户运行，使开发人员能够构建复杂的交易逻辑和用户体验改进。但它缺乏将**EOA转换为智能合约账户的本地支持**，没有向后兼容性，使交易成本高昂。
- **EIP-3074 - AUTH和AUTHCALL：**通过引入两个新的操作码AUTH和AUTHCALL增强EOA功能，使其临时充当智能合约账户。然而，它需要硬分叉并依赖调用者，导致集中化风险。
- **EIP-5003 - AUTHUSURP：**引入AUTHUSURP操作码，用于**永久迁移EOA到智能合约账户**。通过部署智能合约代码到EIP-3074授权地址并撤销原私钥访问实现。



1. 初始设定，在一个 [4337](https://learnblockchain.cn/article/5768) 钱包中，该钱包由一个 Enternal Ownered Account（EOA） 和一个 Contract Account（CA）组成。
2. 在钱包端，当 EOA 或者任何其他签名方案（在以太坊之外的公链）发起交易时，EOA 签名生成 `UserOperation`（一种伪交易类型，提供所有交易信息，包括calldata、sender, gas, maxFeePerGas, maxPriorityFee,signature, nonce等）。
3. 钱包将 `UserOperation` 传到专用的 UserOperation mempool，Bundler（矿工或可以通过bundle市场向矿工发送交易的用户）可以监听该 menpool，并创建 bundle transactions，一个bundle transactions 可以包含多个 `UserOperation` 传到 Entry Point 合约的 `handleOps` 接口。
4. Miner 将 bundle transaction 打包出块。
5. Entry Point 有以下两个验证和执行的循环阶段。

### Native Account Abstraction in Pectra

https://www.youtube.com/watch?v=FYanFF-yU6w

enshrinement of ERC-4337's account

![34.png](./imgs/34.png)

### From MPC Wallets to Smart Contract Accounts

https://www.youtube.com/watch?v=Yr0AS9QifjU&t=320s 

![35.png](./imgs/35.png)

![36.png](./imgs/36.png)

![37.png](./imgs/37.png)

### Passkeys : the good, the bad, the ugly

https://www.youtube.com/watch?v=TEjNSr8jjUI

Coinbase smartwallet: https://www.coinbase.com/wallet/smart-wallet

## 应用密码学

ZKP , MPC , FHE

### Building Consumer Apps with ZK, MPC, and FHE (panel)

https://www.youtube.com/watch?v=UPXYzWS7ZJ4&t=12s

### Programmable Cryptography and Ethereum：

gubsheep:

https://www.youtube.com/watch?v=UWPg_AmWtlw

How can we compute together


![38.png](./imgs/38.png)

![39.png](./imgs/39.png)

![40.png](./imgs/40.png)

![41.png](./imgs/41.png)

去中心化社交，

去中心化推特：**farcaster, Bluesky， Nostr**

How to build decentralize  facebook？

![42.png](./imgs/42.png)


可验证计算： ZKVM : **risc0, sp1,  jolt, nexus**

Programming in private state:  homomorphic Encryption   openFHE /phantom-zone

Non-interactivity: obfuscation and functional encryption.

### IO

https://www.youtube.com/live/-HAh09a5Qec?t=3398s

不可区分混淆 (iO)

https://cronokirby.com/posts/2022/05/explaining-yaos-garbled-circuits/

iO 可以加密（或混淆）程序，使得混淆后的程序执行与原始程序完全相同的功能，且不会泄露有关其内部结构的任何信息

V神文章[How obfuscation can help Ethereum](https://ethresear.ch/t/how-obfuscation-can-help-ethereum/7380)

- Barry Whitehat、 Jamajaya Mall 和Vitalik Buterin的进一步演示说明了可以使用 iO 构造的实际应用。


### MPC Tooling or How to create MPC apps

https://www.youtube.com/watch?v=eKpcf1JMNak



![43.png](./imgs/43.png)

MPC-ML，coSnarks, MPC stats
![44.png](./imgs/44.png)


MPC-framework: https://github.com/voltrevo/mpc-framework

2PC for lover: https://voltrevo.github.io/2pc-is-for-lovers/


### The combination of ZKP +/- MPC +/- FHE：

https://www.youtube.com/watch?v=Tq7CVqDE_P4&t=293s

ZKP+MPC 外包计算

![45.png](./imgs/45.png)

MPC+FHE

![46.png](./imgs/46.png)

ZKP+FHE

![47.png](./imgs/47.png)

### zkemail

https://www.youtube.com/watch?v=YvzdNMpynZM

![48.png](./imgs/48.png)

电子邮件协议使用 DKIM 来保证完整性。这种验证方法可以防止电子邮件被欺骗。DKIM 采用 RSA 密钥对。

![49.png](./imgs/49.png)

![50.png](./imgs/50.png)

One natural route is a 2-of-3 using zk-email on their email address, a key stored locally on the user's device (which could be a passkey), and a backup key held by the provider. As a user becomes more experienced, or accrues more assets, at some point they should be prompted to add more guardians.

https://vitalik.eth.limo/general/2024/12/03/wallets.html

### Tlsnotary

https://www.youtube.com/watch?v=bI6U17Km9HU&t=1308s

![48.png](./imgs/48.png)

![49.png](./imgs/49.png)

TLSNotary solves this by adding a Verifier to the TLS connection using secure Multi-Party Computation (MPC). MPC provides cryptographic guarantees, allowing the Verifier to authenticate the TLS transcript without requiring external trust or revealing the complete data to anyone. TLSNotary can sign (aka notarize) data and make it portable in a privacy preserving way.



TLSNotary 13年就出现的技术，由PSE重新开发

https://bitcointalk.org/index.php?topic=173220.0

参考链接：

https://www.alchemy.com/overviews/what-is-account-abstraction

https://mp.weixin.qq.com/s/WYnqC5rOslmp3KgLcP_1fw

https://www.aicoin.com/en/article/343839

https://vitalik.eth.limo/general/2024/10/14/futures1.html








