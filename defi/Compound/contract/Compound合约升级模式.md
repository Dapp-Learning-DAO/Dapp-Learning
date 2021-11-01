# **合约升级模式-以compound为例**

![CompoundFinanceGuide.jpg](https://img.learnblockchain.cn/attachments/2021/08/bp4bGfJT610613d7ee0ee.jpg)

> 本文为原创文章，如需转载请联系作者。

在keegan小钢的文章：https://learnblockchain.cn/article/2618 提到了compound的合约升级模式，但是它并未详细的说明compound到底是怎样实现合约升级的，以及与openzepplin的合约升级对比，有什么优势。借助本篇文章，我们就详细讨论下compound的合约升级是如何实现，以及它的优缺点。

本文的参考链接如下：https://blog.openzeppelin.com/the-state-of-smart-contract-upgrades/

## **为什么需要合约升级**

合约升级的需求来自于项目方，通常是程序员，而不是终端的用户。升级既被用作在出现漏洞时实施修复的保障，也被用作通过逐步增加新功能来迭代开发系统的手段。然而，以太坊合约本身的特质，即一旦部署将不可更改的特质，实施合约升级会引入技术上的复杂性，且降低了合约的去中心化程度。

## **什么是智能合约升级**

智能合约升级是一种可以任意改变地址中执行的代码的行为，同时保留了存储和余额。

### **使用策略模式迭代功能**

策略模式是改变合同中负责特定功能的部分代码的一个简单方法。你不需要在合约中实现一个函数来处理一个特定的任务，而是调用一个单独的合约来处理这个任务-通过切换该合约的实现，你可以有效地在不同的策略之间切换。

以compound为例：

它有不同的RateModel实现来计算利率，而且它的CToken合约可以在它们之间切换。直到这种变化仅用于系统的利率计算部分，就可以轻易的推出hot-fix来修复利率实现模型中的bug等。

下面我们结合代码一起看一下，compound是如何使用策略模式来切换不同的利率模型实现的

```
//ctoken.sol
function initialize(ComptrollerInterface comptroller_,
                        InterestRateModel interestRateModel_,
                        uint initialExchangeRateMantissa_,
                        string memory name_,
                        string memory symbol_,
                        uint8 decimals_) public {
    require(msg.sender == admin, "only admin may initialize the market");
    require(accrualBlockNumber == 0 && borrowIndex == 0, "market may only be initialized once");
    //设置利率模型
    err = _setInterestRateModelFresh(interestRateModel_);
    require(err == uint(Error.NO_ERROR), "setting interest rate model failed");
}
```

首先是cToken.sol中的初始化方法initialize接受一个类型为InterestRateModel的合约地址作为参数，然后InterestRateModel实质上是一个接口合约，其需要实现如下两个方法：

```
function getBorrowRate(uint cash, uint borrows, uint reserves) external view returns (uint);
function getSupplyRate(uint cash, uint borrows, uint reserves, uint reserveFactorMantissa) external view returns (uint);
```

然后是WhitePaperInterestRateModel和JumpRateModel，JumpRateModelV2等都继承该接口，并实现接口中定义的两个方法即可。

```
contract WhitePaperInterestRateModel is InterestRateModel {
 //第一步：计算利用率：u=borrows/(cash+borrows-reserves)
 function utilizationRate(uint cash, uint borrows, uint reserves) public pure returns (uint) {
        // Utilization rate is 0 when there are no borrows
        if (borrows == 0) {
            return 0;
        }
        return borrows.mul(1e18).div(cash.add(borrows).sub(reserves));
    }
    //第二步：计算贷款利率：y=0.025+x*0.2 => 0.2(multiplierPerBlock), 0.025(baseRatePerBlock)
    function getBorrowRate(uint cash, uint borrows, uint reserves) public view returns (uint) {
        uint ur = utilizationRate(cash, borrows, reserves);
        return ur.mul(multiplierPerBlock).div(1e18).add(baseRatePerBlock);
    }
    //第三步：计算存款利率：z=x*y*(1-reserveFactorMantissa), 部分贷款的利息会按照reserveFactorMantissa存入保证金中，故能够结算给存款的利率要扣除这部分进入保证金的利息
    function getSupplyRate(uint cash, uint borrows, uint reserves, uint reserveFactorMantissa) public view returns (uint) {
        uint oneMinusReserveFactor = uint(1e18).sub(reserveFactorMantissa);
        uint borrowRate = getBorrowRate(cash, borrows, reserves);
        uint rateToPool = borrowRate.mul(oneMinusReserveFactor).div(1e18);
        return utilizationRate(cash, borrows, reserves).mul(rateToPool).div(1e18);
    }
}
```

然后是JumpRateModel，其也继承自InterestRateModel，并实现了InterestRateModel中定义的两个方法。与whitePaper不同的是，其计算贷款利率和存款利率时，增加了一个“拐点”，当利用率小于“拐点”时，单位块的利率multiplierPerBlock为一个较小值，当大于拐点时，multiplierPerBlock为一个较大的值。

```
contract JumpRateModel is InterestRateModel {
    function getBorrowRate(uint cash, uint borrows, uint reserves) public view returns (uint) {
  int util = utilizationRate(cash,borrows,reserves);
  if (util < kink) {
   return util.mul(multiplierPerBlock).div(1e18).add(baseRatePerBlock);
  } else {
   uint normalRate = kink.mul(multiplierPerBlock).div(1ee18).add(baseRatePerBlock);
   uint excessUtil = util.sub(kink);
   return excessUtil.mul(jumpMultiplierPerBlock).div(1e18).add(normalRate);
  }
 }
}
```

## **合约升级的模式**

![img](https://i1.wp.com/blog.openzeppelin.com/wp-content/uploads/2020/09/graph-01.png?resize=840%2C252&ssl=1)img
由于代理合约proxy使用了delegatecall关键字，它将远程合约Impl的代码逻辑进行调用，同时保存自己的储存和账户余额。并保留了原始的msg.sender， 让用户总是只和代理合约Proxy交互，而对具体的实现逻辑合约视而不见。则实现合约的升级也变得非常的直接，通过改变代理合约Proxy中的实现合约Impl的地址，从而可以实现合约升级。而因为用户交互的始终都是代理合约Proxy，用户的状态也都保存在代理合约中，故无需特殊处理用户的状态迁移等操作。

![img](https://i0.wp.com/blog.openzeppelin.com/wp-content/uploads/2020/09/graph-02.png?resize=840%2C420&ssl=1)img
这种模式有另一个好处，即多个代理合约可以同时使用同一个远程逻辑合约

![img](https://i2.wp.com/blog.openzeppelin.com/wp-content/uploads/2020/09/graph-03.png?resize=840%2C420&ssl=1)img
我们需要定义合约的升级逻辑是如何实现的，而不同的合约升级逻辑就为不同的合约升级模式打开了大门

### **合于升级管理函数**

最简单的一种方式是在Proxy代理合约中，增加一个管理函数，让管理员来设置逻辑实现合约的地址。compound中也使用了这一模式，在unicontroller合约中，它添加了 转移Proxy所有权的函数，其impl合约需要接受转移，以防止意外地升级到无效的合同。

```
contract Unitroller is UnitrollerAdminStorage, ComptrollerErrorReporter {
 address public admin;
    address public pendingAdmin;
    address public comptrollerImplementation;
    address public pendingComptrollerImplementation;
    
 constructor(address _admin) {
  admin = _admin;
 }
    //设置逻辑合约地址
 function _setPendingImplementation(address newPendingImplementation) public returns (uint){
  require(msg.sender == admin);
  pendingComptrollerImplementation = newPendingImplementation;
        return uint(Error.NO_ERROR);
 }
    //逻辑合约地址接受作为该proxy的逻辑合约
    function _acceptImplementation() public returns (uint) {
        require(msg.sender==pendingComptrollerImplementation && pendingComptrollerImplementation!=address(0));
        comptrollerImplementation = pendingComptrollerImplementation;
        pendingComptrollerImplementation = address(0);
        return uint(Error.NO_ERROR);
    }
    //设置admin地址
    function _setPendingAdmin(address newPendingAdmin) public returns (uint) {
     require(msg.sender == admin);
        pendingAdmin = newPendingAdmin;
        return uint(Error.NO_ERROR);
    }
    //admin地址接受作为该proxy的admin
    function _acceptAdmin() public returns (uint) {
     require(msg.sender == pendingAdmin && pendingAdmin != address(0));
        admin = pendingAdmin;
        return uint(Error.NO_ERROR);
    }
 fallback() external payable {
  assembly{
   let to := sload(0x02)
   let ptr := mload(0x40)
   let in_size := calldatasize()
   calldatacopy(ptr,0,in_size)
   switch delegatecall(gas(),to,ptr,in_size,0,0)
    case 0 {
     revert(0,0)
    }
    case 1 {
     returndatacopy(ptr,0,returndatasize())
     return(ptr,returndatasize())
    }   
  }
 }
}
```

这种模式的好处是，所有与升级有关的逻辑都包含在代理合约中，逻辑实现合约不需要任何特殊的逻辑来作为代理的目标。

### **合于升级管理函数的弊端-函数选择器冲突**

由于solidity中所有的函数调用都是通过函数选择器调用，即calldata的前4个bytes。函数选择器：

由于4个bytes容量不大，因此可以发生selector碰撞事故，即两个签名不同的函数最终可能有相同的选择器：

```
function collate_propagate_storage(bytes16) external { }  
=> 42966c684c869f2e2e56c232c00c827b4e8fcd1119259bd54a90d765bf17bbd6 => 42966c68
function burn(uint256) external { } 
=> 42966c689b5afe9b9b3f8a7103b2a19980d59629bfd6a20a60972312ed41d836 => 42966c68
```

这可能导致管理员无意中把代理升级到一个随机的地址，同时试图调用实现提供的一个完全不同的功能。

即, 如下所示，如果用户想要调用impl合约中的collate_propagate_storage函数，其事实上会改为调用proxy合约中的burn函数，这不是用户的预期行为。比如：用户通过proxy代理调用impl中的malicious函数，其在内部会进一步调用collate_propagate_storage函数。

```
//proxy contract
contract adminUpgradeableProxy{
 address public admin;
 address public impl;
 constrctor(address _admin, address _impl) {}
 fallback() external payable{}
 function changeImpl(address _impl) {}
 function burn(uint256 u) external {
  //somelogic here
 }
 
}
//impl contract
contract impl{
 address public admin;
 address public impl;
 function collate_propagate_storage(bytes16) internal { 
     //another logic
    }  
    function malicious() external{
        collate_propagate_storage(bytes16);
    }
}
```

上面这个例子其实不正确，因为internal函数在solidity编译过程中，并不会生成函数选择器，其只会是一个jump而已。可以参考如下的代码实现：

```js
/**
 *Submitted for verification at Etherscan.io on 2018-05-11
*/

pragma solidity ^0.4.23;

contract Proxy {
  
    function proxyOwner() public view returns (address);

    function setProxyOwner(address _owner) public returns (address);

    function implementation() public view returns (address);

    function setImplementation(address _implementation) internal returns (address);

    function upgrade(address _implementation) public {
        require(msg.sender == proxyOwner());
        setImplementation(_implementation);
    }

    function () payable public {
        address _impl = implementation();

        assembly {
            calldatacopy(0, 0, calldatasize)
            let result := delegatecall(gas, _impl, 0, calldatasize, 0, 0)
            returndatacopy(0, 0, returndatasize)

            switch result
            case 0 { revert(0, returndatasize) }
            default { return(0, returndatasize) }
        }
    }
}


contract UnstructuredStorageProxy is Proxy {

    bytes32 private constant proxyOwnerSlot = keccak256("proxyOwnerSlot");
    bytes32 private constant implementationSlot = keccak256("implementationSlot");

    constructor(address _implementation) public {
        setAddress(proxyOwnerSlot, msg.sender);
        setImplementation(_implementation);
    }

    function proxyOwner() public view returns (address) {
        return readAddress(proxyOwnerSlot);
    }

    function setProxyOwner(address _owner) public returns (address) {
        require(msg.sender == proxyOwner());
        setAddress(proxyOwnerSlot, _owner);
    }

    function implementation() public view returns (address) {
        return readAddress(implementationSlot);
    }

    function setImplementation(address _implementation) internal returns (address) {
        setAddress(implementationSlot, _implementation);
    }

    function readAddress(bytes32 _slot) internal view returns (address value) {
        bytes32 s = _slot;
        assembly {
            value := sload(s)
        }
    }

    function setAddress(bytes32 _slot, address _address) internal {
        bytes32 s = _slot;
        assembly {
            sstore(s, _address)
        }
    }

}

contract ACL {
    
    address private role5999294130779334338;

    address private role7123909213907581092;

    address private role8972381298910001230;

    function getACLRole5999294130779334338() public view returns (address) {
        return role5999294130779334338;
    }

    function getACLRole8972381298910001230() public view returns (address) {
        return role8972381298910001230;
    }

    function getACLRole7123909213907581092() public view returns (address) {
        return role7123909213907581092;
    }

    function setACLRole7123909213907581092(address _role) public {
        role7123909213907581092 = _role;
    }

    function setACLRole8972381298910001230(address _role) public {
        require(msg.sender == role7123909213907581092);
        role8972381298910001230 = _role;
    }

    function setACLRole5999294130779334338(address _role) public {
        require(msg.sender == role8972381298910001230);
        role5999294130779334338 = _role;
    }
    
}


contract Vault {

    ACL private acl;

    function setACL(ACL _upgradeableAcl) public {
        require(acl == address(0));
        acl = _upgradeableAcl;
    }

    function () public payable {
    }
    
    function balance() public view returns (uint256) {
        return address(this).balance;
    }

    function withdraw() public payable {
        require(balance() > msg.value);
        require(msg.value > balance() - msg.value);
        require(msg.sender == acl.getACLRole8972381298910001230());
        acl.getACLRole5999294130779334338().transfer(balance());
    }
}
```

具体的分析文章，请见我的另一篇博文，有针对性的分析。

### **透明代理合约**

为了解决升级管理函数中提到的函数选择器碰撞问题，openzeplin提出了透明代理合约。即在fallback函数和proxy中的其他函数中添加一个路由，以此确定合约的正确调用。确保用户只能够调用代理合约中的fallback函数，而admin不能够调用代理合约中的fallback函数，用户在调用到代理合约的其他函数时，会被自动转向到fallback函数中去。

```
//proxy contract
contract adminUpgradeableProxy{
 address public admin;
 address public impl;
 constrctor(address _admin, address _impl) {}
 fallback() external payable{
  require(msg.sender != admin);
 }
 function owner() public {
        if (msg.sender != admin) {
            fallback();
        }
        require(msg.sender == admin);
        return proxy.owner();
    }
    function upgradeTo(address _impl) public {
        if (msg.sender != admin) {
            fallback();
        }
        require(msg.sender == admin);
        impl = _impl;
    }
}
// impl contract
contract impl{
    address public admin;
 address public impl;
    function owner() public {
        return erc20.owner();
    }
    function transfer() public {
        erc20.transfer();
    }
}
```

| msg.sender    | owner()               | upgradeto()    | transfer()             |
| --------------- | ----------------------- | ---------------- | ------------------------ |
| Admin         | returns proxy.owner() | upgrades proxy | reverts                |
| Other account | returns erc20.owner() | reverts        | sends erc20.transfer() |

很多合约都使用透明代理合约，如[dYdX](https://github.com/dydxprotocol/perpetual/blob/99962cc62caed2376596da357a13f5c3d0ea5e59/contracts/protocol/PerpetualProxy.sol), [PoolTogether](https://github.com/pooltogether/pooltogether-pool-contracts/tree/6b7eba5c610a61e4e44f8df95fdf3d1d2f1e0fa5/.openzeppelin), [USDC](https://github.com/centrehq/centre-tokens/tree/b42cf04b31639b8b05d53fea9995954d5f3659d9/contracts/upgradeability), [Paxos](https://github.com/paxosglobal/pax-contracts/tree/2650b8049f2f1fe53ebb3f5a0979241c4da9f1a5#upgradeability-proxy), [AZTEC](https://github.com/AztecProtocol/AZTEC/blob/cb78ba3ee32ad82234ac0fbed046333eb7f233cf/packages/protocol/contracts/AccountRegistry/AccountRegistryManager.sol#L62-L66), and [Unlock](https://github.com/unlock-protocol/unlock/blob/5d3ed7519e3fe3c75ef7220468d7a8ae716db194/smart-contracts/contracts/Unlock.sol#L30)等。然而，这种合约升级模式有一个缺陷是：每一次调用时，都有一个sload的操作，因为要求msg.sender != admin。这提高了操作的gas费用。

### **UUPS通用可升级代理合约**

EIP1822定义了一个通用的可升级代理合约标准，UUPS。与透明代理合约不同，其合约升级逻辑放在了Impl实现合约侧，而不是代理合约侧。UUPS也使用delegatecall
![image20210801110817854.png](https://img.learnblockchain.cn/attachments/2021/08/A3Dn65uI610613efebc6f.png)

简单来讲，UUPS的设计思想是：在proxy合约中，将impl的地址固定的存储在一个slot插槽中。在impl方面，设计一个可代理合约UUPSProxiable，其主要作用是更新该slot插槽中的impl地址的值。然后，所有的impl合约都继承自UUPSProxiable 合约。

```
contract UUPSProxy{
    constructor(bytes memory constructData, address contractLogic) public {
        assembly { // solium-disable-line
            sstore(0xc5f16f0fcc639fa48a6947836d9850f504798523bf8c9a3a87d5876cf622bcf7, contractLogic)
        }
        (bool success,) = contractLogic.delegatecall(constructData); 
        require(success, "Construction failed");
    }
	fallback() external payable{
        //0xc5f16f0fcc639fa48a6947836d9850f504798523bf8c9a3a87d5876cf622bcf7
		bytes32 slot = keccak256("PROXIABLE");
		assembly{
			let to := sload(0xc5f16f0fcc639fa48a6947836d9850f504798523bf8c9a3a87d5876cf622bcf7)
			let in_offset := mload(0x40)
			let in_size := calldatasize()	
            		calldatacopy(in_offset, 0, in_size)
			switch delegatecall(gas(),to,in_offset,in_size,0,0)
			case 0 {
				returndatacopy(in_offset, 0, returndatasize())
				revert(in_offset, returndatasize())
			}
			case 1 {
				returndatacopy(in_offset,0,returndatasize())
				return(in_offset, returndatasize())
			}
		}
	}
}
contract UUPSProxiable{
	function updateCodeAddress(address _impl) internal {
		require(keccak256("PROXIABLE") == UUPSProxiable(_impl).proxiableUUID());
		assembly{
			sstore(0xc5f16f0fcc639fa48a6947836d9850f504798523bf8c9a3a87d5876cf622bcf7, _impl)
		}
	}
	function proxiableUUID() public pure returns (bytes32) {
		return keccak256("PROXIABLE");
	}
}
contract UUPSImpl is UUPSProxiable{
    ...
}
```

该种设计有如下优点：

首先，通过在逻辑实现合约上定义所有函数，它可以依靠 Solidity 编译器来检查任何函数选择器的冲突。此外，代理的大小要小得多，使部署成本更低。它还在每次调用中减少从存储中的读取，增加了更少的开销。

这种模式有一个主要的缺点：

如果代理合约proxy被升级到一个不能实现可升级功能的实现，即没有继承UUPSProxiable合约，它就会被锁定在那个实现上，不再可能改变它。一些开发者倾向于保持可升级逻辑的不可变性，以防止这些问题，而这样做的最佳位置是在代理本身。

### **代理存储冲突和非结构化存储**

在所有的代理模式变体中，代理合约proxy至少需要一个状态变量来保存执行合约地址。默认情况下，Solidity在智能合约存储中按顺序存储变量：第一个声明的变量到零号槽，下一个到一号槽，以此类推（映射和动态大小的数组是这个规则的例外）。这意味着，在接下来的代理合约中，其实现地址将被保存到存储槽0。

然而，若逻辑合约impl也有一个全局变量同样位于存储槽0，则调用impl.slot_0其实质是修改了proxy合约的slot_0的值，从而发生了impl合约和proxy合约的储存冲突。

```
contract Proxy{
 address public owner;
 address public impl;
 fallback() external payable{}
 function updateTo(address _impl) external {}
}
contract Impl{
 uint256 public value_0;
 uint256 public value_1;
 function modify() public {
  value_0 = 0; // 由于是delegatecall, 此时的owner会被设置为0；
 }
}
```

最简单的解决存储冲突是在Impl合约中，添加与代理合约一样的全局变量，并保证添加的位置和顺序。即

```
contract Impl{
 address public owner;
 address public impl;
 uint256 public value_0;
 uint256 public value_1;
 function modify() public {
  value_0 = 0; // 此时就不会与owner冲突
 }
}
```

但是这样做的缺点也很明显：添加了多余的不需要的全局变量。并且降低了重复利用率，且容易遗忘出错。

为了解决这个问题，Openzepplin提出了非结构化存储的解决方案，即设定一个固定的slot用于存储impl地址，与合约中的其他全局变量顺序无关。

在EIP-1967中，该固定的slot地址被标准化为：

逻辑合约地址：0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc

```
bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)
```

信标合约地址：0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50

```
bytes32(uint256(keccak256('eip1967.proxy.beacon')) - 1)
```

Admin地址：0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103

```
bytes32(uint256(keccak256('eip1967.proxy.admin')) - 1)
```

这使得像Etherscan这样的浏览器可以很容易地识别这些代理（因为任何在这个非常具体的插槽中具有类似地址值的合同都很可能是一个代理），并解析出逻辑合约地址。

### **Append-only的存储合约**

不同版本的实现合约Impl中，如何保证全局变量的存储插槽不被破坏？使用append-only 存储合约。

合约升级带来了另一个关于存储的挑战，不是在代理proxy和impl之间，而是在两个不同版本的impl之间。让我们假设我们有以下部署在代理后面的实现impl：

```
contract OwnedBox_V1 {
    address owner;
    uint256 number;
    function setValue(uint256 newValue) public {
        require(msg.sender == owner);
        number = newValue;
    }
}
contract OwnedBox_V2 {
    uint256 number;
    address owner;
…
}
```

这显示了智能合约升级的一个主要限制：虽然可以任意改变合约的代码，但只能对其状态变量做与存储兼容的改变。诸如**重新排序变量** 、**插入新的变量** 、**改变变量的类型** 、甚至**改变合约的继承链** 等操作都有可能破坏存储。**唯一安全的改变是将状态变量追加到任何现有的变量之后。**

一个解决该问题的开发实践是使用append-only的储存合约。在该种模式下，状态存储在单独的存储合约中，并且只能追加，不允许删除。Impl合约则继承该存储合约，以便于使用相应的状态。然后，每次需要增加一个新的状态变量时，都可以扩展存储合约。Solidity保证变量在存储中的排列取决于继承链的顺序，所以从合约中扩展来添加一个新的变量可以确保它被附加在现有变量之后。作为一个例子，Compound使用这种模式来改变他们的Comptroller合约。

```
contract UnitrollerAdminStorage {
 address public admin;
    address public pendingAdmin;
    address public comptrollerImplementation;
    address public pendingComptrollerImplementation;
}
contract ComptrollerV1Storage is UnitrollerAdminStorage {
    PriceOracle public oracle;
    uint public closeFactorMantissa;
    uint public liquidationIncentiveMantissa;
    uint public maxAssests;
    mapping(address => CToken[]) public accountAssets;
}
contract ComptrollerV2Storage is ComptrollerV1Storage {
    struct Market{
        bool isListed;
        uint collateralFactorMantissa;
        mapping(address => bool) accountMembership;
        bool isComped;
    }
    mapping(address => Market) public markets;
    address public pauseGuardian;
    bool public _mintGuardianPaused;
    bool public _borrowGuardianPaused;
    bool public transferGuardianPaused;
    bool public seizeGuardianPaused;
    mapping(address => bool) public mintGuardianPaused;
    mapping(address => bool) public borrowGuardianPaused;
}
contract ComptrollerV3Storage is ComptrollerV2Storage {
    struct CompMarketState{
        uint224 index;
        uint32 block;
    }
    CToken[] public allMarkets;
    uint public compRate;
    mapping(address => uint) public compSpeeds;
    mapping(address => CompMarketState) public compSupplyState;
    mapping(address => CompMarketState) public compBorrowState;
    mapping(address => mapping(address => uint)) public compSupplierIndex;
 mapping(address => mapping(address => uint)) public compBorrowerIndex;
    mapping(address => uint) public compAccrued;
}
contract ComptrollerV4Storage is ComptrollerV3Storage {
    address public borrowCapGuardian;
    mapping(address => uint) public borrowCaps;
}
contract ComptrollerV5Storage is ComptrollerV4Storage {
    mapping(address => uint) public compContributorSpeeds;
 mapping(address => uint) public lastContributorBlock;
}
```

不过这种方法有一个很大的缺点：继承链中的所有合约都必须遵循这种模式，以防止混淆。包括来自外部库的合约，它们定义了自己的状态。

这种定义的方法还有一个问题，即如果我们想要更改baseStorage合约的变量个数就会导致后面继承该baseStorage合约的所有变量的存储位置发生改变，因为solidity在编排变量存储在EVM的插槽时，是按照abi.encodePacked方式。（map和不定长数组除外）。

一个解决方案是在baseStorage中预先留下dummy变量，用于占位便于后续使用。

### **逻辑实现合约Impl的缺点和初始化函数**

Impl合约最大的缺点就是不能使用constructor！这一点在我之前的文章：https://learnblockchain.cn/article/2663 和 https://learnblockchain.cn/article/2697 有详细的分析

> 但这里需要明确一点，通过构造函数constructor()实现合约的初始化和通过initialize()实现合约的初始化有什么区别：
> 最大的区别是构造函数constructor()实现合约初始化仅初始化一次，且在合约创建时发生，合约创建好之后无法再次调用该构造函数。而通过initialize()实现合约初始化，则可以在任意时候调用，需要自己写逻辑保证合约只能初始化一次，而无法保证该方法不再被调用。根本原因是合约编译好的字节码中，构造函数相关的字节码在init-code 中，不在runtime code中。而自定义的initialize()方法存在于runtime code中，可被反复调用

一个关键问题是如何保证initializer函数只被调用一次，而不是反复调用？

第一种思路：使用全局变量initialized。这种思路是最简单的思路，如果该合约没有被初始化过，则调用initialzer函数进行初始化，并且标记initialized=true. 如果该合约已经被初始化过，即initialized=true, 则当调用initializer函数时就会revert

```
bool public initialized = false;
function initialize(address _admin) public {
 requrire(!initialized);
 admin = _admin;
 initialized = true;
}
```

第二种思路：compound中使用的思路：在cToken合约中，其初始化函数initialize通过判断目前累计的区块数目为0，且借贷指数为0来判断是否已经初始化过了。

```
function initialize(ComptrollerInterface comptroller_,
                        InterestRateModel interestRateModel_,
                        uint initialExchangeRateMantissa_,
                        string memory name_,
                        string memory symbol_,
                        uint8 decimals_) public {
    require(msg.sender == admin, "only admin may initialize the market");
    require(accrualBlockNumber == 0 && borrowIndex == 0, "market may only be initialized once");
    borrowIndex = mantissaOne;
}
```

### **钻石代理多个逻辑合约**

这种模式首先在OpenZeppelin实验室作为vtable的可升级性进行了探索，直到由Nick Mudge在EIP2535中以Diamond Contract的名义进行了标准化，目前被nayms等项目使用。在这个版本中，代理不是存储一个单一的实现地址，而是存储一个从函数选择器到实现地址的映射。当它收到一个调用时，它会查找一个内部映射（类似于动态调度中使用的vtable），以检索哪些逻辑合同为所请求的函数提供了实现。

![img](https://i1.wp.com/blog.openzeppelin.com/wp-content/uploads/2020/09/graph-05.png?resize=840%2C420&ssl=1)img

### **用信标同时进行升级**

![img](https://i2.wp.com/blog.openzeppelin.com/wp-content/uploads/2020/09/graph-04.png?resize=840%2C420&ssl=1)img

## **Compound中可升级合约的使用**

compound业务中有两大块使用了代理合约，不一定是可升级合约，但是我们会按照可升级合约的思路来分析一下。

### **InteretsModel板块**

如上面分析，这部分其实是不算是可升级合约，它通过设计模式中的策略模式，定义了一个接口：InterestRateModel，在接口中规定了两个函数：

```
getBorrowRate(uint cash, uint borrows, uint reserves) 
getSupplyRate(uint cash, uint borrows, uint reserves, uint reserveFactorMantissa)
```

然后不同的策略，如WhitePaperInterestRateModel，JumpRateModel，BaseJumpRateModelV2，JumpRateModelV2，DAIInterestRateModelV3，LegacyJumpRateModelV2等都实现了该接口，并实现了规定的两个函数。从而在cToken的initialize函数中，通过设置InterestRateModel接口对应的实际处理逻辑合约地址，从而实现多种不同的策略应用到不同的cToken中。

### **CToken板块**

![image20210801093442358.png](https://img.learnblockchain.cn/attachments/2021/08/aCFDgsg36106140767a95.png)

CErc20Delegator.sol合约是一个proxy，其impl合约是CErc20Delegate合约。其合约升级模式仍然是通过合约升级管理函数进行。

```
//简单来看cErc20Delegator.sol的逻辑应该与Unitroller类似
contract CErc20Delegator {
    address public admin;
    address public implementation;
    constructor(address underlying_,
                ComptrollerInterface comptroller_,
                InterestRateModel interestRateModel_,
                uint initialExchangeRateMantissa_,
                string memory name_,
                string memory symbol_,
                uint8 decimals_,
                address payable admin_,
                address implementation_,
                bytes memory becomeImplementationData) 
     public 
    {
     //在初始化过程中，msg.sender 是 admin
        admin = msg.sender;
        //调用Impl具体实现逻辑合约的initialize函数
        delegateTo(implementation_, abi.encodeWithSignature(
            "initialize(address,address,address,uint256,string,string,uint8)",
            underlying_,
            comptroller_,
            interestRateModel_,
            initialExchangeRateMantissa_,
            name_,
            symbol_,
            decimals_       
        ));
        //设置具体实现合约的地址
        _setImplementation(implementation_, false, becomeImplementationData);
        //初始化结束后，将admin 变为 admin_
        admin = admin_;        
    }
    //设置具体实现合约Impl的地址
    function _setImplementation
            (address implementation_, 
             bool allowResign, 
             bytes memory becomeImplementationData) 
        public
    {
        require(msg.sender == admin);
        implementation = implementation_;
        delegateTo(implementation, abi.encodeWithSigature(
         "_becomeImplementation(bytes)",
            becomeImplementationData
        ));
        
    }
    fallback() external payable {
        address _to = implementation;
        assembly{
            let to := _to
            let ptr := mload(0x40)
            let in_size := calldatasize()
            calldatacopy(ptr,0,in_size)
            swtich delegatecall(gas(),to,ptr,in_size,0,0)
            case 0 {
             returndatacopy(ptr,0,returndatasize())
                revert(ptr,returndatasize())
            }
         case 1 {
          returndatacopy(ptr,0,returndatasize())
                return(ptr,reutrndatasize())
            }
        }
    }
}
```

从上面的分析可以看到，其实cErc20Delegator也是采用了跟unitroller一样的合约升级模式，即通过合约升级管理函数来实现。但是，在其具体的实现中，有如下几个难点需要我们仔细理解：

#### **难点1：staticcall与delegatecall**

纵观cErc20Delegator，会发现其与Unitroller还是不一样。Unitorller除开set admin和set impl地址的函数，其他函数都会走fallback，远程调用逻辑合约。但是cErc20Delegator合约中，compound自己实现interface中的部分函数，虽然每个函数还是使用的是delegateTo逻辑。那compound为什么要这样做呢？因为它认为一些**view** 函数，就不应该直接使用delegatecall这一opcode，而应该使用staticcall加上delegatecall, 以防止状态改变。如：

```
function balanceOf(address owner) external view returns (uint) {
    bytes memory data = 
        delegateToViewImplementation(abi.encodeWithSignature("balanceOf(address)", owner));
    return abi.decode(data, (uint));
}
function delegateToViewImplementation(bytes memory data) 
 public 
    view 
    returns (bytes memory) 
{
    (bool success, bytes memory res) = address(this).staticcall(abi.encodeWithSignature(
        "delegateToImplementation(bytes)",
        data
    )); 
    //可以简单的写成：require(success);
    //但是为了让出错信息也返回到堆栈中，我们需要手动写出revert逻辑
    assembly{
        if eq(success, 0) {
           revert(add(res,0x20),returndatasize()) 
        } 
    }
    return abi.decode(res,(bytes));
}
```

针对staticcall与call，delegatecall的区别，简单来说就是staticcall不允许存在状态改变，即它不允许：`create,create2,LOG0-4,sstore,selfdestruct`等opcode，可以参考我之前写的文章：https://learnblockchain.cn/article/2705

> 通过EIP-214得知，`staticcall`的本质是严禁修改任何地址，合约的状态，即不允许使用`create,create2,LOG0-4,sstore,selfdestruct`等OPCODE以及ETH的转账。而`call`则允许状态修改。

#### **难点2：复杂继承关系后的存储分布**

与Unitroller的存储不同，Unitroller使用了非常清晰的Append-only存储合约UnitrollerAdminStorage等，cErc20Delegator合约的继承关系如下：

```
CErc20Delegator is CTokenInterface, CErc20Interface, CDelegatorInterface
CTokenInterface is CTokenStorage
CErc20Interface is CErc20Storage
CDelegatorInterface is CDelegationStorage
contract CTokenStorage {
 bool internal _notEntered;
    string public name;
    string public symbol;
  uint8 public decimals;
    address payable public admin;
    address payable public pendingAdmin;
    ComptrollerInterface public comptroller;
    InterestRateModel public interestRateModel;
    uint internal initialExchangeRateMantissa;
    uint public reserveFactorMantissa;
    uint public accrualBlockNumber;
    uint public borrowIndex;
    uint public totalBorrows;
    uint public totalReserves;
    uint public totalSupply;
    mapping (address => uint) internal accountTokens;
    mapping (address => mapping (address => uint)) internal transferAllowances;
    mapping(address => BorrowSnapshot) internal accountBorrows;
}
contract CErc20Storage {
    address public underlying;
}
contract CDelegationStorage {
    address public implementation;
}
```

因为delegatecall,我们同时需要保证impl合约的储存分布要与proxy的储存分布一致。下面我们看下cErc20delegate的储存分布：

```
CErc20Delegate is CErc20, CDelegateInterface
CErc20 is CToken, CErc20Interface
CToken is CTokenInterface, Exponential, TokenErrorReporter
=> [CTokenInterface, Exponential, TokenErrorReporter, CErc20Interface, CDelegateInterface]
由于Exponential, TokenErrorReporter中不涉及存储，故可以省略
=> [CTokenInterface, CErc20Interface, CDelegateInterface] 与proxy中一致
CTokenInterface is CTokenStorage
CErc20Interface is CErc20Storage
CDelegatorInterface is CDelegationStorage
```

故我们详细分析proxy和impl的存储分布时发现其继承逻辑顺序一致，且存储分布一致，满足delegatecall的要求。

#### **难点3：_becomeImplementation的理解**

在CErc20Delegate合约中，出现了函数_becomeImplementation，其代码如下。

```
function _becomeImplementation(bytes memory data) public {
    // Shh -- currently unused
    data;
 // Shh -- we don't ever want this hook to be marked pure
    if (false) {
        implementation = address(0);
    }
    require(msg.sender == admin, "only the admin may call _becomeImplementation");
}
```

里面的data和if(false)非常让人难以理解。

在Trail of Bits的2019.8.16日的审计文章中，提到了这一点。if(false)的目的是让solidity在编译该函数的时候不使用staticcall这一opcode，而是使用call。

第一个data，就是简单的不适用该数据。也即是说_becomeImplementation这一函数其实只是简单的检查了一下`msg.sender==admin`而已。

### **Comptroller板块**

Comptroller被实现为一个可升级的代理。Unitroller把所有的逻辑都代理给了Comptroller的实现，但是存储值是在Unitroller上设置的。为了调用Comptroller的功能，在Unitroller地址上使用Comptroller的ABI。

如上面分析：Unitroller是一个典型的使用合约升级管理函数的可升级合约的代理proxy部分。问题的关键在于Comptroller的实现部分。

在compound中，Comptroller的实现一共有如下8个版本：ComptrollerG1，ComptrollerG2，ComptrollerG3，ComptrollerG4，ComptrollerG5，ComptrollerG6，ComptrollerG7，Comptroller

通过对比代码Comptroller和ComptrollerG7，可以发现基本类似，改动了部分逻辑，故可以认为Comptroller是ComptrollerG8, 也就是目前正在使用的Comptroller逻辑。
![image20210731215209342.png](https://img.learnblockchain.cn/attachments/2021/08/m6nJ0STK6106141b38a34.png)

在compound中，要实现由ComptrollerG1升级到ComptrollerG2，其具体的升级步骤为：

```
//admin 调用Unitroller中的_setPendingImplementation方法，将ComptrollerG2的地址填入
//admin 调用ComtrollerG2中的_become函数，同意成为Unitroller代理的逻辑实现合约Impl
```

在compound中，实现ComtrollerG1成为Unitroller代理合约的实际逻辑处理合约Impl的步骤为：

```
function deployComptrollerG1(address _unitroller, address _comptrollerG1) {
//admin 调用Unitroller中的_setPendingImplementation方法，将ComptrollerG1的地址填入
    Unitroller(_unitroller)._setPendingImplementation(_comtrollerG1);
//admin 调用ComtrollerG1中的_become函数，同意成为Unitroller代理的逻辑实现合约Impl    
 ComtrollerG1(_comtrollerG1)._become(_unitroller,_closeFactorMantissa,_maxAssets,false);
}
```

下面我们分析下ComptrollerG1._become函数究竟在干嘛：

```
function _become(Unitroller unitroller, 
                  PriceOracle _oracle, 
                  uint _closeFactorMantissa, 
                  uint _maxAssets, 
                  bool reinitializing)
  public 
{
    require(msg.sender == unitroller.admin(), "only unitroller admin can change brains");
    uint changeStatus = unitroller._acceptImplementation();
    require(changeStatus == 0, "change not authorized");

    if (!reinitializing) {
        //实例化代理合约Unitroller,后面的一切状态改变最终都发生在Unitroller地址上
        ComptrollerG1 freshBrainedComptroller = ComptrollerG1(address(unitroller));
        // Ensure invoke _setPriceOracle() = 0
        uint err = freshBrainedComptroller._setPriceOracle(_oracle);
        require (err == uint(Error.NO_ERROR), "set price oracle error");
        // Ensure invoke _setCloseFactor() = 0
        err = freshBrainedComptroller._setCloseFactor(_closeFactorMantissa);
        require (err == uint(Error.NO_ERROR), "set close factor error");
        // Ensure invoke _setMaxAssets() = 0
        err = freshBrainedComptroller._setMaxAssets(_maxAssets);
        require (err == uint(Error.NO_ERROR), "set max asssets error");
        // Ensure invoke _setLiquidationIncentive(liquidationIncentiveMinMantissa) = 0
        err = freshBrainedComptroller._setLiquidationIncentive(liquidationIncentiveMinMantissa);
        require (err == uint(Error.NO_ERROR), "set liquidation incentive error");
    }
}
```

从代码中，我们可以看到ComptrollerG1合约并不要求只被初始化一次，反而是只验证了是admin发出，且存在成为Impl的请求。也就是说可以多次初始化同一个Comptroller合约。反而是ComptrollerG1的合约中，定义了一些属于admin的方法，其为公开方法，并且可以多次访问。如：`_setPriceOracle，_setCloseFactor，_setCollateralFactor,_setMaxAssets,_setLiquidationIncentive,_supportMarket,_become`等方法，我们在看下ComptrollerG1对应的存储内容：

| 方法                     | 存储内容                                          |
| -------------------------- | --------------------------------------------------- |
| _setPriceOracle          | oracle                                            |
| _setCloseFactor          | closeFactorMantissa                               |
| _setLiquidationIncentive | liquidationIncentiveMantissa                      |
| _setMaxAssets            | maxAssets                                         |
|                          | mapping(address => CToken[]) public accountAssets |
| _setCollateralFactor     | mapping(address => Market) public markets         |
| _supportMarket           | mapping(address => Market) public markets         |

在compound中，要实现由ComptrollerG1升级到ComptrollerG2，其具体的升级步骤为：

```
function upgradeTo(address _unitroller, address _comptrollerG2) public {
    Unitroller unitroller = Unitroller(_unitroller);
    require(msg.sender == unitroller.admin());
//admin 调用Unitroller中的_setPendingImplementation方法，将ComptrollerG2的地址填入
    unitroller._setPendingImplementation(_comtrollerG2);
//admin 调用ComtrollerG2中的_become函数，同意成为Unitroller代理的逻辑实现合约Impl 
    ComtrollerG2(_comptrollerG2)._become(unitroller);
}![CompoundFinanceGuide.jpg](https://img.learnblockchain.cn/attachments/2021/08/TNVZnvof610613cc8cec2.jpg)
```

原文链接：https://mp.weixin.qq.com/s/Fv9k6bYhniHiHH5j8sINxA

关注我的公众号，让我更有动力去更新文章 :)
也可以在公众号后面留言，看你感兴趣的主题是啥，然后我来写。

![image20210723193312815.png](https://img.learnblockchain.cn/attachments/2021/08/P6fdxLXG61061466d42e1.png)
