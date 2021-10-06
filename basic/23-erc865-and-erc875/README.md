## 概要  
本样例主要介绍 ERC865, ERC875, EIP712, ERC777, ERC1155 这些合约功能及基本使用.

### ERC865 
要在以太坊区块链上执行任何交易, 您必须付费. 该费用将支付给矿工用于采矿交易, 将其放入区块并保护区块链.   
此费用以Gas（气体限额* Gas​​价格）计算, 并以 ETH 支付.   
这给新用户带来了一些摩擦:   
```js
1. 新用户必须了解以太坊的工作原理才能了解 gas 气价格和 gas 成本   
2. 他们必须获得必要的 ETH 以支付天然气   
``` 
这两点为采用内置令牌的DAPPS创造了不必要的障碍, 为此提出了 ERC865 标准.   
介绍了一个中间人第三方, 该第三方愿意以代币收取转移费, 并将以必要的费用将转移交易以太币转发给区块链. 使用加密签名可以保护此过程.  
- 测试脚本介绍   
test-ERC865.js 介绍了如何使用“无Gas”交易, 阐明了“无Gas”实际上意味着将Gas成本转移给其他人.      
使用此模式有很多好处, 因此, 它被广泛使用. 签名允许将交易 gas 成本从用户转移到服务提供商, 从而在许多情况下消除了相当大的障碍. 它还允许实现更高级的委派模式, 通常会对UX进行相当大的改进  

### ERC875
ERC875 和 ERC721 一样, 是非同质代币, 但具有不同的接口.   
ERC875 与 ERC721 有两个最大的不同之处:  
- 一次买卖中, ERC875 只需要一次交易, 因此只需要支付一次 gas.（通过magiclink的方式，实现了原子交易）  
- 多个代币可以在一次交易中进行买卖.（比如卖家需要10张票打包销售）
  
### EIP712  
EIP-712是一种更高级, 更安全的交易签名方法. 使用该标准不仅可以签署交易并且可以验证签名，而且可以将数据与签名一起传递到智能合约中,并且可以根据该数据验证签名以了解签名者是否是实际发送该签名的人要在交易中调用的数据.       
EIP-712提出了数据的标准结构和从结构化消息生成散列的定义过程, 然后使用此散列生成签名. 通过这种方式, 为发送交易生成的签名与为验证身份或任何其他目的生成的签名之间就有了明显的区别.  

### ERC777    
- 标准 ERC20 的存在一下问题 
1. ERC20 标准没办法在合约里记录是谁发过来多少币  
2. ERC20 标准没有一个转账通知机制, 很多ERC20代币误转到合约之后, 再也没有办法把币转移出来, 已经有大量的ERC20 因为这个原因被锁死, 如锁死的QTUM, 锁死的EOS   
3. ERC20 转账时, 无法携带额外的信息, 例如我们有一些客户希望让用户使用 ERC20 代币购买商品，因为转账没法携带额外的信息, 用户的代币转移过来, 不知道用户具体要购买哪件商品, 从而展加了线下额外的沟通成本  

- ERC777 作用   
ERC777很好的解决了这些问题, 同时ERC777 也兼容 ERC20 标准. ERC777 在 ERC20的基础上定义了 send(dest, value, data) 来转移代币, send函数额外的参数用来携带其他的信息. 

### ERC1155 (todo)

### EIP-2929（todo）
https://eips.ethereum.org/EIPS/eip-2929  

## 测试步骤 
- 安装依赖 
```
yarn
```

- 测试 ERC865 合约
```
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



## 参考链接
Props Token Contracts:  https://github.com/propsproject/props-token-distribution    
Metamask按照EIP-712规范签名完成委托和投票: https://learnblockchain.cn/article/1357    
为 DApp 编写 EIP712 签名: https://learnblockchain.cn/2019/04/24/token-EIP712  
链下 EIP2612 签名:  https://learnblockchain.cn/article/1496  
ERC875: https://medium.com/alphawallet/erc875-a-new-standard-for-non-fungible-tokens-and-cheap-atomic-swaps-93ab85b9e7f9  
ERC875-Example: https://github.com/AlphaWallet/ERC875-Example-Implementation   
EIP 库:  https://github.com/ethereum/EIPs/tree/master/assets   
EIP712知乎：https://www.zhihu.com/people/wang-da-chui-82-1/posts  
ERC777 样例代码: https://github.com/abcoathup/Simple777Token  
ERC777 示例教程: https://learnblockchain.cn/2019/09/27/erc777  