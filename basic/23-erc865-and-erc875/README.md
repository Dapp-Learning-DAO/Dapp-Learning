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

关于EIP712的签名与验证签名参考 [签名与验证签名](./Sign&Verify.md)

### 4. ERC777

标准 ERC20 的存在以下问题

1. ERC20 标准没办法在合约里记录是谁发过来多少币
2. ERC20 标准没有一个转账通知机制, 很多ERC20代币误转到合约之后, 再也没有办法把币转移出来, 已经有大量的ERC20 因为这个原因被锁死, 如锁死的QTUM, 锁死的EOS
3. ERC20 转账时, 无法携带额外的信息, 例如我们有一些客户希望让用户使用 ERC20 代币购买商品，因为转账没法携带额外的信息, 用户的代币转移过来, 不知道用户具体要购买哪件商品, 从而展加了线下额外的沟通成本

ERC777 作用
ERC777很好的解决了这些问题, 同时ERC777 也兼容 ERC20 标准. ERC777 在 ERC20的基础上定义了 send(dest, value, data) 来转移代币, send函数额外的参数用来携带其他的信息.

### 5. ERC1155

ERC1155 是游戏开发服务提供商 Enjin 发布的一个全新的代币标准, 旨在帮助游戏开发者节省资金, 促进原子交换, 以此来提升代币之间的交易效率. 它最大进步就是可以融合不同 token 进行打包处理.
由于现行的代币系统 ERC20 和 ERC721, 用户完成兑换交易需要经历四个独立的步骤, 操作繁琐耗时. 而如果采用 ERC1155 规则, 用户能够将他们想要交换的所有代币捆绑在一个合约中, 只需要一个批准步骤即可完成.


### 6. EIP2929

EIP2929属于柏林分叉，其核心内容是: SLOAD 的 gas 开支从 800 增加到 2100, CALL 的 gas 开支 (包含STATICCALL 、 DELEGATECALL和其他操作码) 以及外部合约查询 (BALANCE、EXTCODESIZE 等) 从 700 增加到 2600。这种状况仅会在地址和存储 slot 在交易里首次被访问时发生。这样做的意图是进一步提高对 DoS攻击 的抵挡能力: 早期的研究显示, 以太坊目前最大的 DoS 漏洞在存储访问, 攻击者可以以较低的gas创立一些区块，它们对许多用户地址进行重复访问, 处理时刻可能长达 80 秒。 解决办法很简单: 使这些执行时间较长的存储访问操作（它们需要磁盘IO）耗费更多的 gas, 最终 DoS 问题会被削弱约 3 倍. 与此同时, 客户端团队进行了一些超卓的工作——实现磁盘存储缓存、削减存储加载所需的数据库查询次数、以及更长远地堵住这个漏洞.

### 7. ERC1820
一个智能合约会包含一些函数。我们在编译一个智能合约时，这些函数将在编译的时候嵌入到合约binary中，并随合约一起部署到链上。这是一种静态的绑定关系：函数在编译期绑定到合约，而且只能限定绑定到合约账户；这种绑定关系不可改变。因此，一旦合约部署，你也无法升级你的函数了。

有时，你可能需要动态绑定关系，比如我想为我的代币设置接收钩子函数，而且也可以随时更换、升级我的钩子。而且，显然我希望我的钩子也能够绑定到EOA上，而不仅仅是合约上。

这时候就需要ERC1820了。ERC1820可以动态地为某个地址（EOA 或合约）绑定一个函数。这种方式极大的提升了合约开发的灵活性，比如你可以随时为你的合约添加或者移除一个函数；甚至你可以给一个EOA来增加一个函数实现！

从技术角度来讲，ERC1820是一个注册表，内部记录了这样一个映射关系：Interface->Method->Implementation。其中：

- InterfaceContract：目标地址，可以是EOA，也可以是合约。
- Method：函数签名的256位哈希值。例如keccak256("set(uint256)")
- Implementaion：实现合约。

有了这一层关系，就相当于说Interface地址绑定了函数Method；当调用Interface账户的Method功能时，可委派给Implementation合约来实现。

ERC1820注册表的部署也有一些讲究。

ERC1820的合约地址，在任何链上都是唯一的，即
```
0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24
```

如果想生成一个固定的地址，我们可能通常会考虑到CREATE2等思路。这里介绍ERC1820采用的无密钥部署的方法。首先要了解两个基本知识：

- 1） 合约地址的生成机制。每个合约地址是由部署者账户和其nonce决定的。
- 2） 在以太坊的签名校验体系中，通过签名v，r，s来恢复出地址，作为交易的sender。如果我们把交易的签名修改，则这笔交易仍然合法。尽管如此，攻击者仍然无法以受害者的身份来伪造有害交易。如果要这么做，攻击者需要不断调整签名以尝试恢复出受害者的地址，而这需要付出极大的成本（VRS共65字节，即520位，比暴力枚举私钥还困难）。

在ERC1820的部署方式中，部署的交易的creater是没有私钥的。通常我们签名交易，是通过私钥来构建交易的签名；但在无私钥部署方法中，构建好交易后，签名直接设置了一个特殊的VRS，它将还原出一个特殊的地址来，而没有人知道这个地址的私钥是什么。具体来说：

- 1） 构建部署交易，也称为根交易
- 2） 将根交易的签名部分设置成一个特定的值：
```
	a. v: 27
	b. r: 0x1820182018201820182018201820182018201820182018201820182018201820
	c. s: 0x1820182018201820182018201820182018201820182018201820182018201820
```
- 3） 通过vrs还原出地址：0xa990077c3205cbdf861e17fa532eeb069ce9ff96 
- 4） 向这个地址转账资金(0.08 ether)。
- 5） 将这笔交易广播到网络中。

通过这种方式，不论什么链，将生成一样的地址，因为我们设置好VRS后将确定性的生成出来creator地址，它的nonce是0，因此部署合约的地址也是固定的了。

对应代码请参考test/test-ERC1155.js。

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

- 测试部署 ERC1820合约

```
npx hardhat test test/test-ERC1820.js
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

