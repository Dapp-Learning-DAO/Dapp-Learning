## InstaDapp 是什么  
Instadapp 是 DeFi 的中间件平台，是一个面向用户的去中心化资产管理协议，提供了针对 MakerDAO, Compound, AAVE , Uniswap 等协议 的高效的资产管理功能，其目标是简化 DeFi 的复杂性，最终成为 DeFi 的统一前端。

## InstaDapp 的两个产品  
针对不同的用户群体，推出了两个不同的产品，分别是 InstaDapp Lite  和 InstaDapp Pro.

个人感觉，这两个产品主要的区别在 分险系数 、用户对 Defi 认知度的水平 （ 或用户操作的频率 ）

### [InstaDapp Lite](https://lite.instadapp.io/)   

<img src=./pictures/instaDapp1.png width=50% />

低分险 ( 相对于 InstaDapp Pro ），不频繁操作的用户或是对 Defi 认知水平较低的可以选择这个产品。

根据 [官方文档](https://lite.guides.instadapp.io/getting-started/what-is-instadapp-lite) 的介绍，InstaDapp Lite 有如下特点：

1） POS 奖励放大

Lite 只有一个主要收益策略，那就是通过在 [Lido](https://lido.fi/) 上 stake ETH 赚取收益。就算用户 Deposit Dai, Lite 也会把 Dai 转换为 stETH。“POS 奖励放大” 其实也就是通过集中散户的资金，在 Lido 中达到较高的占比，从而获取更高的收益。

另一个次要收益策略是把 stETH 放到 Compound、AAVE 等借贷协议中进行放贷来赚取双重收益。

<img src=./pictures/instaDapp2.png width=50% />   

2） 简化 DeFi 策略

利用 DSA （ DeFi Smart Accounts, 后面 InstaDapp Pro 会详细介绍 ） 账户简化和各个 Defi 协议的操作

3） 最小化交易和节省 Gas 成本

这个也是利用了 DSA 的便利性     

### [InstaDapp Pro](https://defi.instadapp.io/)    

针对这个产品，用户有更多的操作空间，可以利用不同的策略进行杠杆、再融资和转移头寸，同时通过自动化实现回报最大化。

当然这些要求用户具有更加专业的 Defi 知识，能自己控制识别其中的风险。

Pro 页面提供了 Simulation 功能，用户可以在正式使用前，进行模拟操作，熟悉掌握 Pro 的用法

<img src=./pictures/instaDapp3.png width=50% />  

1） Pro 目前在 Ethereum Mainnet 上集成了 Maker、Compound、Aave V2、Aave V3、Uniswap V3、Liquity、Savings Dai、Morpho、Morpho V3、Spark 这些协议，在其他 L2 上集成的协议较少。比如 Polygon 上， 就只集成了 Aave V2、Aave V3、Compound V3、Uniswap V3

2） 对于用户的账户资金，可以进行如下操作：

- 资产跨链 （ 集成 [Hop.Exchange](http://Hop.Exchange) 实现 ）
- 资产交易 （ swap )
- Deposit、Withdraw

3）对于用户的杠杆、头寸的操作，Pro 定义为 Strategies，总共有如下 Strategies:

- Refinance ， 比如把 Aave V2 的仓位转移到 到 Morpho
- Leverage / Max mining，最大化杠杆，比如在 Aave 中存入 ETH, 借出 Dai 后再转换为 ETH, 然后在存入 Aave 中，这样循环操作
- Unwind / Deleverage，降低杠杆，比如 withdraw Aave 中的 ETH 用来偿还从 Aave 中借出的 Dai
- Collateral Swap， 抵押品转换，例如 withdraw 部分 Aave 中的抵押品 ( ETH )，然后把这部分的 ETH 换成 USDT 后在存入到 Aave 中
- Debt Swap, 债务转换，比如已经从 Aave 中借出 10 Dai, 那么现在再从 Aave 中借出 5 USDT，把这 5 USDT 转换为 Dai, 偿还 Aave 中的 Dai, 那么最后用户就从 10 Dai 的债务变为 5 Dai、5 USDT 的债务
- Deposit & Borrow , 存入和借款，就是在一笔交易中完成存入和借款的操作
- Payback & Withdraw, 偿还和提取，在一笔交易中完成债务偿还和取款的操作

总结，从上面我们可以看到，Pro 的这些 Strategies 其实就是组合了多笔操作，把原先用户需要 2 -3 笔交易才能完成的操作合并为 1 笔交易，同时操作的主要对象还是当前仓位对应的 Defi

## InstaDapp  架构

对于 Lite 和 Pro 都是采用同一套架构，其中主要分为了 3 个角色

- Dapp
    
    和 DeFi Smart Layer (DSL)  交互的 Dap，包括 InstaDapp、其他 Dapp 、Wallet ( 如 Metamask 等 )
    
- DeFi Smart Layer (DSL)
    
    DeFi 智能层，也是  InstaDapp 的核心逻辑层，这一层又可以细分为 3 个部分
    
    - Authority: 只有授权的地址才可以操作 **Smart Accounts ，使用 Smart Accounts 中的资金进行操作**
    - Defi Smart Accounts ( DSA )**：智能账户层 ( 其实就是 solidity 合约 ）。**InstaDapp **单独创建一个 solidity 合约作为用户的 Account ，优势在于 InstaDapp 可以在合约中插件式组合各种操作，从而在一笔交易中完成复杂的操作，而这是原生的 address 无法完成的**
    - Connectors:  连接器层。**Smart Accounts  没有直接和各个 Defi 协议进行交易，而是通过 Connector 进行操作，实现了账户和操作分离的架构。各个开发者或是项目方可以通过实现特定的 Connector ，完美的接入 InstaDapp 中**
        
        
        各个链各个 Defi Protocol 对应的 connector 对应官网如下：https://docs.instadapp.io/connectors/mainnet/aave-v2
        
- Defi Protocol
    
    协议层，对应的就是各个 Defi 协议
    

    <img src=./pictures/instaDapp4.png width=50% />   

    参考来源：https://blog.instadapp.io/introducing-defi-smart-layer/

## Defi Smart Layer 实现

下面将分析 Defi Smart Layer 的具体实现逻辑。

### 创建 Smart  Account

从 Defi Smart Layer 的结构中可以看到，用户必须要有一个 Smart Account 才能和各个 Defi 进行交互。而且当用户初次进入 InstaDapp Pro 的时候，会强制要求用户创建一个 DSA

<img src=./pictures/instaDapp5.png width=50% />   

创建 Smart Account 的具体过程如下：

- 用户调用 InstaIndex 合约的 build 接口

```
function build(
        address _owner,
        uint accountVersion,
        address _origin
    ) public returns (address _account) {
        require(accountVersion != 0 && accountVersion <= versionCount, "not-valid-account");
        _account = createClone(accountVersion);  // 通过 clone 的 方式生成 Smart Account
        ListInterface(list).init(_account);
        AccountInterface(_account).enable(_owner);
        emit LogAccountCreated(msg.sender, _owner, _account, _origin);
    }
```

 InstaIndex 合约实现可参考：https://polygonscan.com/address/0xa9b99766e6c676cf1975c0d3166f96c0848ff5ad#code

- InstaIndex 在 build 接口内部通过 clone 的方式生成 Smart Account

```
function createClone(uint version) internal returns (address result) {
        bytes20 targetBytes = bytes20(account[version]);
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            let clone := mload(0x40)
            mstore(clone, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
            mstore(add(clone, 0x14), targetBytes)
            mstore(add(clone, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
            result := create(0, clone, 0x37)
```

Smart Account 合约实现可参考： https://polygonscan.com/address/0x51cbc90528bf960a6d5728306f0e9fae3cce38ed#code

至此，Smart Account 就创建完成

### Smart Account 的 delegate

Smart Account 内部代码很简洁，所有过来的用户调用最终通过 delegate 的方式调用到真正的业务合约，这里的 delegate 的目标地址为 implementation 地址

```
contract InstaAccountV2 {

    AccountImplementations public immutable implementations;

    constructor(address _implementations) {
        implementations = AccountImplementations(_implementations);
    }

	...................

    function _fallback(bytes4 _sig) internal {
        address _implementation = implementations.getImplementation(_sig);
        require(_implementation != address(0), "InstaAccountV2: Not able to find _implementation");
        _delegate(_implementation);
    }

		fallback () external payable {
        _fallback(msg.sig);
    }

}
```

- _delegate 具体实现如下

```
function _delegate(address implementation) internal {
        // solhint-disable-next-line no-inline-assembly
        assembly {
            // Copy msg.data. We take full control of memory in this inline assembly
            // block because it will not return to Solidity code. We overwrite the
            // Solidity scratch pad at memory position 0.
            calldatacopy(0, 0, calldatasize())

            // Call the implementation.
            // out and outsize are 0 because we don't know the size yet.
            let result := delegatecall(gas(), implementation, 0, calldatasize(), 0, 0)

            // Copy the returned data.
            returndatacopy(0, 0, returndatasize())

            switch result
            // delegatecall returns 0 on error.
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }
```

Smart Account 处理流程图：

<img src=./pictures/instaDapp6.png width=50% />  

### Implementation 的实现

从如下 Smart Account 的 fallback 接口中可以看到，根据用户的 sig， 可以选择不同的 implementation 实现，这里以其中的一个实现 InstaImplementationM1 为例进行分析

```
function _fallback(bytes4 _sig) internal {
        address _implementation = implementations.getImplementation(_sig);
        require(_implementation != address(0), "InstaAccountV2: Not able to find _implementation");
        _delegate(_implementation);
    }
```

InstaImplementationM1 合约实现可参考：

https://etherscan.io/address/0x8a3462a50e1a9fe8c9e7d9023cacbd9a98d90021

- cast 调用

InstaImplementationM1 中的入口只有一个，那就 cast 接口。

cast 处理过程如下：

- 根据传入的 _targetNames ( 这个参数是个数组 ）获取对应的 connectors ( 返回的 connectors 也是个数组 ），connectors 在代码中对应为 _targets
- 然后对每个 _target 调用 spell ，其实就是 delegate call

```solidity
    function cast(
        string[] calldata _targetNames,
        bytes[] calldata _datas,
        address _origin
    )
    external
    payable 
    returns (bytes32) // Dummy return to fix instaIndex buildWithCast function
    {   
		    ..............

        string[] memory eventNames = new string[](_length);
        bytes[] memory eventParams = new bytes[](_length);

        (bool isOk, address[] memory _targets) = ConnectorsInterface(connectorsM1).isConnectors(_targetNames);

        require(isOk, "1: not-connector");

        for (uint i = 0; i < _length; i++) {
            bytes memory response = spell(_targets[i], _datas[i]);
            (eventNames[i], eventParams[i]) = decodeEvent(response);
        }

        ..............
    }
```

- 如下查看 spell 代码，可以发现里面使用的就是 delegate call 到 connector

```
function spell(address _target, bytes memory _data) internal returns (bytes memory response) {
        require(_target != address(0), "target-invalid");
        assembly {
            let succeeded := delegatecall(gas(), _target, add(_data, 0x20), mload(_data), 0, 0)
            let size := returndatasize()
            
            response := mload(0x40)
            mstore(0x40, add(response, and(add(add(size, 0x20), 0x1f), not(0x1f))))
            mstore(response, size)
            returndatacopy(add(response, 0x20), 0, size)

            switch iszero(succeeded)
                case 1 {
                    // throw if delegatecall failed
                    returndatacopy(0x00, 0x00, size)
                    revert(0x00, size)
                }
        }
    }
```

- connector 中就是和具体的 Defi protocol 交互的逻辑，比如 Aave, Uniswap, Compound

ConnectV2AaveV2Polygon **可参考如下：**

https://polygonscan.com/address/0x14272cf069a5ce1b97c9999b8c368cf3704acd0b#code

### Smart Account 整体调用流程

总结起来，Smart Account 调用的整体流程如下图

<img src=./pictures/instaDapp7.png width=50% />  

### Smart Account 调用实例

下面以在 InstaDapp Pro 上，对 Aave V2 的仓位进行 Leverage / Max mining 为例进行复盘分析

<img src=./pictures/instaDapp8.png width=50% />   

- 交易如下

传入的参数 _targetNames 中，存在三个元素

<img src=./pictures/instaDapp9.png width=50% />   

重放交易，可以看到其中具体的跳转

<img src=./pictures/instaDapp10.png width=50% />  

交易分析工具： https://dashboard.tenderly.co/

### Authority 角色赋权

Defi Smart Layer 中的一个重要角色就是 Authority ( user )

一个  Smart Account 可以有多个 Authorities

<img src=./pictures/instaDapp11.png width=50% /> 

Authority 的管理涉及到两个合约，InstaList 和 InstaIndex ，这两个合约记录了 Smart Account 和各个 Authority 的对应关系

**InstaList 合约代码：** https://polygonscan.com/address/0x839c2D3aDe63DF5b0b8F3E57D5e145057Ab41556#code

**InstaIndex 合约代码：** https://polygonscan.com/address/0xa9b99766e6c676cf1975c0d3166f96c0848ff5ad#code

- 初次创建 Smart Account 时添加 Authority

在前文中讲到，在创建 Smart Account 的时候，需要调用 InstaIndex 的 build 接口。在这个接口中，会把 user 添加到新创建的 Smart Account 的 Authority 里面，

```solidity
function build(
        address _owner,
        uint accountVersion,
        address _origin
    ) public returns (address _account) {
        require(accountVersion != 0 && accountVersion <= versionCount, "not-valid-account");
        _account = createClone(accountVersion);
        ListInterface(list).init(_account);
        AccountInterface(_account).enable(_owner); // 添加 owner 为 Authority
        emit LogAccountCreated(msg.sender, _owner, _account, _origin);
    }
```

- 添加其他 Authority

在界面手工添加另一个 Authority， 在交易参数中，可以看到 _targetNames 传入的参数值为 AUTHORITY-A

<img src=./pictures/instaDapp12.png width=50% /> 

重放这笔交易，可以看到最终时调用的 InstaList 的 addAuth

<img src=./pictures/instaDapp13.png width=50% /> 

最后吐糟下，官方的 repo 的只需要看 dsa-contract 这个 repo 就可以了

官方的 doc 文档确实最新的，所以最好是直接对着 doc 文档，然后发笔交易进行 debug