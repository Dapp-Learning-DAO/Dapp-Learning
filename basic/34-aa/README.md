
# 简介
以太坊的账户中，分为两种：EOA账户和CA账户。

## EOA

EOA账户中由私钥→公钥→地址的方式生成。每个EOA账户的资产状态都记录于以太坊MPT树中，即保存了EOA→eth的记录项。当用户欲发送一笔交易更改自己的资产的时候，以太坊会把签名中的地址恢复出来，作为实际的地址。

这些意味着，基于私钥的钱包，和资产是强绑定关系，私钥丢失了，资产就没有了。也因此，才诞生了诸如助记词、私钥分片、硬件钱包、生物私钥等技术，旨在加强对私钥的保管能力。

## CA

CA账户通常由父账户+父账户nonce的哈希构成。CA账户对应一个合约，它作为合约的地址。和EOA账户一样，CA账户的资产状态也和EOA一样被记录着。那么如何更改CA账户的资产呢？一方面，其他用户可以CA账户转账，例如通过xxx.transfer函数。另一方面，储存在CA账户的资产，可以基于自定义的规则，去转账给他人（发起交易）。例如，以tornado cash为例，用户提取资产的前提是提交一个zk proof，证明自己之前存储过代币；再比如HTLC跨链中，转账的前提是要求输入一个哈希的原像；再比如，我们可以定义提交多个签名，才能解锁资产。

基于CA的这些特性，很容易想到，我们可以构造一个CA钱包。该钱包是一个智能合约，钱包的地址就是合约的地址；其他地址可以给这个钱包充值；我们也可以通过自定义的方式定制转出逻辑，可以多签，可以用不同的签名体系，可以社交恢复，甚至还可以支持这些逻辑的升级，换言之，合约的转账条件，完全是可编程的。

这些都意味着，基于CA构建的钱包，和私钥是弱绑定关系，不再是一对一的关系。换言之，我们将私钥的“操作资金“ 和 ”持有资金“这两件事分离开来：持有资金的是我，但是门的钥匙总是可以换。

这里写一个可社交恢复的钱包例子：

```
pragma solidity 0.8.13;


contract SocialRecoveryWallet{

    address private operator;
    address private friend;
    
    //Deposit 
    receive() external payable{}

    function sendTo(address payable to, uint256 amount) external {
        require(msg.sender == operator, "Not authorized");
        to.transfer(amount);
    } 

    //Social recover
    function recover(address newOperator) external {
        require(msg.sender == friend, "Only friend can operate");
        operator = newOperator;
    }
}
```

很简单，这里面操作资金的私钥即使丢失，可以通过另一个账户更换，这就是CA钱包不必强绑定于一个私钥的简单例子。

我们再看一个gnosis safe（[https://github.com/safe-global/safe-contracts/blob/main/contracts/GnosisSafe.sol](https://github.com/safe-global/safe-contracts/blob/main/contracts/GnosisSafe.sol)）开发的多签钱包，它要求多个私钥的签名才能够完成资金解锁操作。它的流程大致如下：

- 钱包创建的时候，输入一些参数，包括要求至少几个签名才能挪用资金
- 挪用资金的时候，传入要执行的交易，还有对应数目的签名
- 合约验证签名，验证通过后，根据交易内容，完成交易
- 可通过ERC20，或者原生eth的形式支付gas，以作为交易执行的燃料。

可以看到，自定义的逻辑，确实可以派生出形形色色的钱包。而AA标准基于这些先前的想法，它的要点如下：

- 提出一个框架，容纳各个CA钱包。
- 从用户角度来看，AA鼓励用户把资产充到这些钱包里，而不是充到EOA地址里。这样，私钥即使丢失，但是钱包账户还在。
- 从开发者角度来看。框架聚焦于常用的必要check、gas结算，对于开发者，更多聚焦在钱包本身的逻辑，包括多签、社交恢复、自定义代币结算gas、逻辑升级等。


注意：CA和AA，都不是指你不需要私钥了，而是指弱化了私钥的重要性，没有私钥，不一定代表资产就不能操作了（例如社交恢复）；有私钥，也不代表一定能操作资产（例如多签）

# EIP4337
    
## 基本结构
    
理解了上述内容，理解AA的基本原理就容易了。AA的设计中，代码细节很复杂，但是整体框架很简单。
    
早期的账户抽象中，需要改动共识层。现在的EIP-4337提案中，只需对rpc层新增功能，就可以支持合约钱包。
    
![Untitled](https://eips.ethereum.org/assets/eip-4337/image1.png)
    
它包括几类角色：
- 用户
- Bundler
- 合约钱包
    
具体而言，用户提交UserOperation，Bundler负责打包，构建成以太坊交易，然后去调用钱包，钱包将去调用业务合约。从费用的角度来看，Bundler会支付以太坊矿工的gas费，而合约钱包将支付gas费用给Bundler，作为对打包服务的工资。这个支付几乎在合约调用的第一时间内支付给Bundler。
    
每个UserOperation里记录的字段表达了“要调用钱包合约的哪个函数”。简化地来看，大致包括这些东西：


```
address sender // 钱包合约地址
uint256 nonce // 钱包发起过的交易数量
bytes initData //如果钱包不存在，则创建钱包，这是钱包的创建代码
bytes calldata //要调用函数的数据。如果钱包需要调用其他合约，则在calldata里封装目标合约地址、调用calldata等信息
bytes signatures //签名数据。为了防止重放攻击，它还需要纳入chainId，entrypoint合约地址
```

此外，调用者还需要像常规的交易一样，指定gas price、gas limit，来为合约的验证、执行提供燃料。其中gas price采用类似EIP-1559的方式，由max priority fee和max fee计算得来；gas limit则拆为两部分，一部分是验证时愿意提供的最大gas 数目，一部分是用于执行合约的最大gas数目；还有一部分是提供给bundler多少gas作为奖励。

```
uint256 verificationGasLimit; //验证用的最大gas
uin256 callGasLimit; //执行用的最大gas
uint256 maxPriorityFeePerGas; //每个gas中
uint256 maxFeePerGas;//每个gas最高支付的价格。如果高于baseFee + maxPriorityFee则多出部分会退回，反之取实际价格为maxFeePerGas
uint256 preVerificationGas;//支付给bundler多少
uint256 paymasterAndData;//代付机制，可设置为他人支付多少
```

要注意的是，verficationGas和callGas这部分的费用是bundler来出的，收益仍归矿工所有。preverificationGas则表达支付多少gas给bundler，是用户出的，收益归bundler所有。这部分费用是采用”预付+扣款“机制扣除：任何人都可以通过EntryPoint的depositTo函数，为钱包地址充值，这些充值就是所谓“预付款”，后续燃料的扣除，都是从这里扣费的。剩余的费用，随时可以提取出来。

## 详细解释

### 合约结构
    
EIP-4337设计遵循如下架构：
    
![Untitled](https://miro.medium.com/max/1122/0*iZUtwChqWHYclWd-.png)
    
Bundler调用Entry point合约，该合约由官方提供，作为Boundler调用的人口，封装了和安全性、费用相关的逻辑。所有钱包合约都由EntryPoint调用。调用具体的Wallet合约，包括必要的检测、gas预付款等，随后调用Wallet的主体逻辑（也就是根据用户传入的操作，执行对应的转账，所谓的自定义逻辑如多签等逻辑就发生在这里）。最后完成一些收尾工作，包括多余gas费的退款。
    

# 如何开发
在本demo中，实现了一个合约钱包，并将合约钱包整合到AA中去。
TBD


# 参考资料


[EIP-4337](https://eips.ethereum.org/EIPS/eip-4337)
[EIP-4337 Implementation](https://github.com/eth-infinitism/account-abstraction)
[EIP-4377 Intro](https://medium.com/infinitism/erc-4337-account-abstraction-without-ethereum-protocol-changes-d75c9d94dc4a)
[Argent](https://github.com/argentlabs/argent-contracts)

