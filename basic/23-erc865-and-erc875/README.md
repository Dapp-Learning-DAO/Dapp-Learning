## 概要

本样例主要介绍 ERC865, ERC875, EIP712, ERC777, ERC1155 这些合约功能及基本使用.

### 1. ERC865

要在以太坊区块链上执行任何交易, 必须付费. 该费用将支付给矿工用于打包交易, 将其放入区块并保护区块链.此费用以 gas（gas limit * gas​​ price）计算, 并以 ETH 支付.

这给新用户带来了一些摩擦:

1. 新用户必须了解以太坊的工作原理才能了解 gas 价格和 gas 成本
2. 他们必须获得必要的 ETH 以支付 gas

这两点为 DApp 的使用创造了不必要的麻烦, 为此提出了 ERC865 标准.

介绍了一个中间人第三方, 该第三方愿意以代币收取转移费, 并将以必要的费用将转移交易以太币转发给区块链. 使用加密签名可以保护此过程.

- 测试脚本介绍
test-ERC865.js 介绍了如何使用 "无gas" 交易, 阐明了“无gas”实际上意味着将 gas 成本转移给其他人.
使用此模式有很多好处, 因此, 它被广泛使用. 签名允许将交易 gas 成本从用户转移到服务提供商, 从而在许多情况下消除了相当大的障碍. 它还允许实现更高级的委派模式, 通常需要对 UX 进行相当大的改进.

### 2. ERC875

ERC875 和 ERC721 一样, 是非同质代币, 但具有不同的接口.
ERC875 与 ERC721 有两个最大的不同之处:

- 一次买卖中, ERC875 只需要一次交易, 因此只需要支付一次 gas.（通过 magiclink 的方式，实现了原子交易）
- 多个代币可以在一次交易中进行买卖.（比如卖家需要10张票打包销售）

### 3. EIP712

EIP712是一种更高级, 更安全的交易签名方法. 使用该标准不仅可以签署交易并且可以验证签名，而且可以将数据与签名一起传递到智能合约中,并且可以根据该数据验证签名以了解签名者是否是实际发送该签名的人要在交易中调用的数据.
EIP712提出了数据的标准结构和从结构化消息生成散列的定义过程, 然后使用此散列生成签名. 通过这种方式, 为发送交易生成的签名与为验证身份或任何其他目的生成的签名之间就有了明显的区别.

### 4. ERC777

标准 ERC20 的存在一下问题

1. ERC20 标准没办法在合约里记录是谁发过来多少币
2. ERC20 标准没有一个转账通知机制, 很多ERC20代币误转到合约之后, 再也没有办法把币转移出来, 已经有大量的ERC20 因为这个原因被锁死, 如锁死的QTUM, 锁死的EOS
3. ERC20 转账时, 无法携带额外的信息, 例如我们有一些客户希望让用户使用 ERC20 代币购买商品，因为转账没法携带额外的信息, 用户的代币转移过来, 不知道用户具体要购买哪件商品, 从而展加了线下额外的沟通成本

ERC777 作用
ERC777很好的解决了这些问题, 同时ERC777 也兼容 ERC20 标准. ERC777 在 ERC20的基础上定义了 send(dest, value, data) 来转移代币, send函数额外的参数用来携带其他的信息.

### ERC1155

ERC1155 是游戏开发服务提供商 Enjin 发布的一个全新的代币标准, 旨在帮助游戏开发者节省资金, 促进原子交换, 以此来提升代币之间的交易效率. 它最大进步就是可以融合不同 token 进行打包处理.
由于现行的代币系统 ERC20 和 ERC721, 用户完成兑换交易需要经历四个独立的步骤, 操作繁琐耗时. 而如果采用 ERC1155 规则, 用户能够将他们想要交换的所有代币捆绑在一个合约中, 只需要一个批准步骤即可完成.


### EIP2929

 EIP2929 它的核心内容是: SLOAD 的 gas 开支从 800 增加到 2100, CALL 的 gas 开支 (包含STATICCALL 、 DELEGATECALL和其他操作码) 以及外部合约查询 (BALANCE、EXTCODESIZE 等) 从 700 增加到 2600, 但这种状况仅会在地址和存储 slot 在买卖里首次被拜访时发生. 这样做的意图是进一步进步对 DoS 进犯的抵挡能力: 早期的研究显示, 以太坊协议现在最大的 DoS 漏洞在存储拜访, 并且是有可能能够创立一些区块对很多账户作简略重复的拜访, 处理时刻可能长达 80 秒. 解决办法是一个简略的快速修复: 使这些操作继续更长的时刻 (存储拜访需求磁盘拜访) 以耗费更多的 gas, 最终 DoS 问题会被削弱大约 3 倍. 与此同时, 客户端团队进行了一些超卓的工作——实现磁盘存储缓存、削减存储加载所需的数据库查询次数、以及更长远地堵住这个漏洞.

## 测试步骤

- 安装依赖

```bash
yarn
```

- 配置环境变量
把 .env.example 复制为 .env 文件, 然后在其中填入 PRIVATE_KEY, PRIVATE_KEY_ALICE, INFURA_ID

- 测试 ERC865 合约

```bash
npx hardhat test test/test-ERC865.js
```

- 测试 EIP712 合约

```
npx hardhat test test/test-EIP712.js
```

- 测试 ERC777 合约
这里使用 rinkeby 测试网进行测试, 如果使用其他的测试网, 执行测试命令时指定对应的测试网络即可.

因为合约部署时需要花费点时间, 可能出现超时的情况, 所以这里单独进行合约部署后再进行测试.

```ts
// 部署 ERC777Token 合约
npx hardhat run scripts/deploy-ERC777Token.js --network rinkeby

// 部署 ERC777Sendder 合约
npx hardhat run scripts/deploy-ERC777Sender.js --network rinkeby

// 测试 ERC777Sendder 合约
npx hardhat test test/test-ERC777Sender.js --network rinkeby
```

- 测试 ERC1155 合约

```
npx hardhat test test/test-ERC1155.js
```

## 参考链接

- https://github.com/propsproject/props-token-distribution
- https://learnblockchain.cn/article/1357
- https://learnblockchain.cn/2019/04/24/token-EIP712
- https://learnblockchain.cn/article/1496
- https://medium.com/alphawallet/- erc875-a-new-standard-for-non-fungible-tokens-and-cheap-atomic-swaps-93ab85b9e7f9
- https://github.com/AlphaWallet/ERC875-Example-Implementation
- https://github.com/ethereum/EIPs/tree/master/assets
- EIP712知乎：https://www.zhihu.com/people/wang-da-chui-82-1/posts
- EIP712: https://learnblockchain.cn/2019/04/24/token-EIP712
- Props Token Contracts:  https://github.com/propsproject/props-token-distribution
- Metamask按照EIP712规范签名完成委托和投票: https://learnblockchain.cn/article/1357
- 为 DApp 编写 EIP712 签名: https://learnblockchain.cn/2019/04/24/token-EIP712
- 链下 EIP2612 签名:  https://learnblockchain.cn/article/1496
- ERC875: https://medium.com/alphawallet/- erc875-a-new-standard-for-non-fungible-tokens-and-cheap-atomic-swaps-93ab85b9e7f9
- ERC875-Example: https://github.com/AlphaWallet/ERC875-Example-Implementation
- EIP 库:  https://github.com/ethereum/EIPs/tree/master/assets
- EIP712知乎：https://www.zhihu.com/people/wang-da-chui-82-1/posts
- ERC777 样例代码: https://github.com/abcoathup/Simple777Token
- ERC777 示例教程: https://learnblockchain.cn/2019/09/27/erc777
- 什么是ERC777代币，以及它与ERC20代币的不同之处: https://zhuanlan.zhihu.com/p/87279316
- ERC1155 科普: https://www.chainnews.com/articles/385928537973.htm
- ERC1155 样例代码:  https://github.com/enjin/erc-1155
- EIP2929 介绍: https://eips.ethereum.org/EIPS/eip-2929

