# Upgradeable Contract

## 前言

区块链信任基础的数据不可修改的特性, 让它传统应用程序有一个很大的不同的地方是一经发布于区块链上就无法修改.  
一方面正是由于智能合约的不可修改的特性, 因为只要规则确定之后, 没人能够修改它, 大家才能够信任它. 但另一方面, 如果规则的实现有 Bug, 可能会造成代币被盗, 或是调用消耗大量的 gas. 这时就需要我们去修复错误.  
这里介绍两种可升级的合约开发模式.

## 方式一合约功能说明

- DataContract

  - platform: 权限修饰器, 指定只有拥有权限的用户才能调用此合约
  - allowAccess: 给其他用户增加权限
  - denyAccess: 取消其他用户的权限
  - setBalance: 设置一个用户的余额, 同时这个接口指定了只有拥有权限的用户才能调用此接口
  - getBalance: 这是一个公共的接口, 任何用户都可以调用此接口

- ControlContract
  - constructor: 在部署合约的时候需要传入 DataContract 的合约地址进行加载
  - setBalance: 内部调用 DataContract 合约的 setBalance 接口, 中间可以加入对应的业务逻辑
  - getBalance: 调用 DataContract 合约的 getBalance 接口获取账户余额

## 测试步骤

- 安装依赖

```sh
yarn
```

- 执行测试

```sh
npx hardhat test
```

### controlContract_test.js 主逻辑说明

controlContract_test.js 在 test 目录, 执行 `npx hardhat test` 的时候就会自动执行这个测试脚本.

脚本中有三个单元测试用例.

- 第一个用例是 DataContract 合约的调用, 用于验证只有有权限的用户才能调用合约.
- 第二个用例是 ControlContract 调用 DataContract 合约的接口, 用于验证没有权限的用户不能调用合约.
- 第三个用例是 DataContract 合约的部署者赋权给 ControlContract 后, ControlContract 可以调用 DataContract 接口, 这样一来, 当业务逻辑有变动的时候, 只需要重新部署一个新的 ControlContract 合约, 然后进行赋权,
  就可以实现合约的升级改造.

## 方式二 OpenZeppelin Upgrades 合约功能说明

方式一如果需要对实现合约方法进行任何更改，那么我们也需要更新代理合约的方法（因为代理合约具有接口方法）。因此，用户同样需要更改代理合约地址。

<center><img src="https://github.com/Dapp-Learning-DAO/Dapp-Learning-Arsenal/blob/main/images/basic/24-upgradeable-contract/proxy.png?raw=true" /></center>

代理合约模式
```
delegatecall
User ---------->  Proxy  -----------> Implementation
             (storage layer)          (logic layer)
```

```solidity
// Sample code, do not use in production!x
contract TransparentAdminUpgradeableProxy {
    address implementation;
    address admin;

    fallback() external payable {
        require(msg.sender != admin);
        implementation.delegatecall.value(msg.value)(msg.data);
    }

    function upgrade(address newImplementation) external {
        if (msg.sender != admin) fallback();
        implementation = newImplementation;
    }
}
```

要解决此问题，我们可以在代理合约中使用 fallback 回退函数。 fallback 函数将执行任何请求，将请求重定向到实现合约并返回结果值。这与以前的方法类似，但是这里的代理合约没有接口方法，只有 fallback 回退函数，因此，如果更改合约方法，则无需更改代理地址。

### 深度理解 delegatecall

```solidity
assembly {
    // 获得自由内存指针
    let ptr := mload(0x40)
    // 复制 calldata 到内存中
    calldatacopy(ptr, 0, calldatasize)
    // 使用 delegatecall 处理 calldata
    let result := delegatecall(gas, _impl, ptr, calldatasize, 0, 0)
    // 返回值大小
    let size := returndatasize
    // 把返回值复制到内存中
    returndatacopy(ptr, 0, size)

    switch result
    case 0 { revert(ptr, size) } // 执行失败
    default { return(ptr, size) } // 执行成功，返回内存中的返回值
}
```

1. 可以传递 msg.sender
2. 可以改变同一存储槽中的内容

delegatecall 并不通过变量名称来修改变量值，而是修改变量所在的存储槽。
在 solidity 中，内存槽中的 0x40 位置是很特殊的，因为它存储了指向下一个可用自由内存的指针。每次当你想往内存里存储一个变量时，你都要检查存储在 0x40 的值。这就是你变量即将存放的位置。现在我们知道了我们要在哪儿存变量，我们就可以使用 calldatacopy，把大小为 calldatasize 的 calldata 从 0 开始复制到 ptr 指向的那个位置了。

```solidity
let result := delegatecall(gas, _impl, ptr, calldatasize, 0, 0)
```

解释一下上面的参数：

- gas：函数执行所需的 gas
- _impl：我们调用的逻辑合约的地址
- ptr：内存指针（指向数据开始存储的地方）
- calldatasize：传入的数据大小
- 0：调用逻辑合约后的返回值。我们没有使用这个参数因为我们还不知道返回值的大小，所以不能把它赋值给一个变量。我们可以后面可以进一步使用 returndata 操作码来获取这些信息。
- 0：返回值的大小。这个参数也没有被使用因为我们没有机会创造一个临时变量用来存储返回值。鉴于我们在调用其他合约之前无法知道它的大小（所以就无法创造临时变量呀）。我们稍后可以用 returndatasize 操作码来得到这个值。

样例参考：

```solidity
pragma solidity ^0.4.24;

contract proxy {

    address public logicAddress;

    function setLogic(address _a) public {
        logicAddress = _a;
    }

    function delegateCall(bytes data) public {
        this.call.value(msg.value)(data);
    }

    function () payable public {
        address _impl = logicAddress;
        require(_impl != address(0));

        assembly {
            let ptr := mload(0x40)
            calldatacopy(ptr, 0, calldatasize)
            let result := delegatecall(gas, _impl, ptr, calldatasize, 0, 0)
            let size := returndatasize
            returndatacopy(ptr, 0, size)

        switch result
            case 0 { revert(ptr, size) }
            default { return(ptr, size) }
        }

    }

    function getPositionAt(uint n) public view returns (address) {
        assembly {
            let d := sload(n)
            mstore(0x80, d)
            return(0x80,32)
      }
    }

}

contract logic {
    address public a;
    function setStorage(address _a) public {
        a = _a;
    }
}

```

### 通用可升级代理
```
upgrade call
Admin -----------> Proxy ----->Implementation_v1
                     |
                      --------> Implementation_v2
```


透明代理和 UUPS代理 的区别在于， 升级逻辑就在是实现在代理合约，还是实现合约里。

#### Transparent Proxy
透明代理（EIP1967）升级逻辑 由代理合约处理， 必须调用 upgradeTo(address newImpl), 这样的函数来升级一个新的实现合约。 然后这个逻辑放在代理合约里，部署这类代理的成本很高。透明代理还需要管理机制来决定是委托调用 实现合约 的功能，还是执行代理合约本身的功能。

TransparentProxy 模式在升级的时候，需要调用 ProxyAdmin 的升级函数。而 UUPS 模式在升级时，需要调用代理合约的升级函数。后者相比于前者少部署一个合约。


```

                ProxyAdmin
                   |
                   |   delegatecall
EOA -----------> Proxy ------------>Implementation_v1
                     |
                      ------------->Implementation_v2
```

#### UUPS
UUPS 是 OpenZeppelin 在近期推出的一种新的合约升级模式，EIP1822 定义了通用的可升级代理标准，或简称为“ UUPS”。该标准使用相同的委托调用模式，但是将升级逻辑放在实现合约中，而不是在代理本身中。 即 upgradeTo(address newImpl)函数放在 实现合约里。 你可以通过让它继承一个包含升级逻辑的通用标准接口来使任何实现合约符合UUPS标准，比如继承 OpenZeppelin的 UUPSUpgradeable接口。 建议使用此模式。

若要支持 UUPS 的升级模式，需要做以下几点改动：

1. 逻辑合约需继承 UUPSUpgradeable 合约
2. 覆写 _authorizeUpgrade 函数

    这里有一个重点是，由于 TransparentProxy 模式是由 ProxyAdmin 进行管理，也就是说只有 ProxyAdmin 有权限进行升级，那么我们只要保证 ProxyAdmin 合约的管理员权限安全即可保证整个可升级架构安全。而对于 UUPS 模式来说，升级合约的逻辑是需要调用代理合约的，这时的权限管理就需要开发者手动处理。具体来说，就是对于我们覆写的 _authorizeUpgrade 函数，需要加上权限管理：

```
// 需要继承 UUPSUpgradeable 合约
contract Demo is Initializable, UUPSUpgradeable {
    uint256 public a;

    function initialize(uint256 _a) public initializer {
        a = _a;
    }

    function increaseA() external {
        a += 10;
    }

    // 覆写 _authorizeUpgrade 函数
    function _authorizeUpgrade(address) internal override {}
}
```

UUPS:
```solidity

// Sample code, do not use in production!
contract UUPSProxy {
    address implementation;
    fallback() external payable {
        implementation.delegatecall.value(msg.value)(msg.data);
    }
}
abstract contract UUPSProxiable {
    address implementation;
    address admin;

    function upgrade(address newImplementation) external {
        require(msg.sender == admin);
        implementation = newImplementation;
    }
}

```

### 实战 TransparentUpgradeableProxy demo  

#### 首次部署

需要部署三个合约，分别是逻辑合约，ProxyAdmin，TransparentUpgradeProxy。
逻辑合约就是我们自己的业务合约，需要满足 OpenZeppelin 可升级合约的条件。ProxyAdmin 代理持有状态，而逻辑合约实现合约提供代码

1. 业务合约 Params 部署（先不进行初始化，initialize，本方法对应的 code 为 0x8129fc1c ）
2. ProxyAdmin 管理合约部署，代理合约的管理员
3. TransparentUpgradeableProxy 代理合约，此为用户直接交互的合约地址，一直不变；

部署需要参数，如下:

- \_LOGIC: 逻辑合约地址，步骤 1；
- ADMIN\_: 管理合约地址，步骤 2；
- \_DATA: 逻辑合约初始化方法调用数据，这里为 0x8129fc1c（只调用 initialize 方法，initialize 方法没有入参，如果有参数也是支持的）

合约升级：

1. 逻辑合约 Params 升级为 ParamsNew;
2. 调用 ProxyAdmin 进行升级;

ProxyAdmin 提供两个方法进行升级

- upgrade，需要传入 proxy 地址，新的逻辑实现地址;
- upgradeAndCall，需要传入 proxy 地址，新的逻辑实现地址，初始化调用数据
  本例中，由于数据是保存在代理合约中，这份数据已经初始化过了，不需要再初始化，所以调用 upgrade 方法即可。
  proxy: TransparentUpgradeableProxy 代理合约地址；
  implementation: ParamsNew 合约地址

**注意事项**。

- 可升级合约的存储不能乱，即：只能新增存储项，不能修改顺序。这种限制只影响状态变量。你可以随心所欲地改变合约的功能和事件。
- 不能有构造函数，使用 Initialize 合约替代，通过在方法上添加 initializer 标签，确保只被初始化一次。
- 继承的父合约也需要能满足升级，本例中的 Ownable 采用 OwnableUpgradeable，支持升级
- 可使用 OpenZeppelin 插件验证合约是否为可升级合约，以及升级时是否有冲突

![Alt text](image.png)
https://blog.logrocket.com/using-uups-proxy-pattern-upgrade-smart-contracts/ 
### 升级到 Gonsis 合约

代理的管理员（可以执行升级）是 ProxyAdmin 合约。 只有 ProxyAdmin 的所有者可以升级代理。可以调用：proxyadmin.transferOwnership 转移到自己的多签合约地址上。


### 实战 UUPS demo  
https://eips.ethereum.org/EIPS/eip-1822

UUPS 升级方法在逻辑合约里，相比透明代理无需部署proxyadmin合约，减少了一个合约的部署。
但是逻辑合约里要实现_authorizeUpgrade方法。

```
function _authorizeUpgrade(address newImplementation) internal override virtual {
        require(msg.sender == owner, "Unauthorized Upgrade");
    }
```

具体可以参考此教程：
https://medium.com/@pearliboy1/how-to-implement-an-upgradeable-smart-contract-with-uups-242c57f671ee

### 钻石代理模式
https://eips.ethereum.org/EIPS/eip-2535
合约大小目前限制在24KB，这个就比较难解决，一般是使用库函数和业务拆解成多个合约，但是不是所有的业务都适合，并且拆解难度也很大，最后很可能造成代码结构过于复杂。
在这个场景下，就提出了EIP-2535。
一个Proxy有多个Implementation合约，做法就是改造fallback，之前的proxy模式都是fallback到一个固定的实现合约，Diamond把fallback函数改造成根据函数签名，把delegatecall路由到不同的Implementation合约，这样Implementation合约的数量基本就没有限制了。一个合约可以有多个实现，就像一个钻石可以有很多个切面，这就是Diamond名字的来源。
所以原理上就是通过函数签名把调用路由到不同的Implementation合约。
那我们就需要记录这个路由表，并且能有方法暴露这个路由表进行查看和管理。这个在Diamond的标准实现里是实现了一个DiamondCutFacet，这个合约会保存这个路由表，并由LibDiamond库实现了维护这张路由表的方法（增删改查）。

#### Diamond 概念介绍
Diamond其实就是proxy合约，负责数据存储和通过fallback函数转发函数调用到实现合约。这一点和别的proxy合约没有什么质的区别。一般我们不会再手动构造这个合约，直接使用标准合约即可。核心功能：

根据路由表执行的fallback函数
初始化Diamond
Diamond -> Proxy
Facet(s) -> Implementation(s)
Cut -> Upgrade
Loupe -> Function list


配置diamondCutFacet，给Diamond增加diamondCut方法;
配置loupe，给Diamond增加loupe相关方法;
配置ERC165，给Diamond增加ERC165（supportInterfaces）相关支持;
配置ERC173，给Diamond增加ERC173（ownership）相关支持; 

参考文章： https://juejin.cn/post/7179066816419856443

#### 实操
https://guides.quicknode.com/guides/ethereum-development/smart-contracts/the-diamond-standard-eip-2535-explained-part-2
https://louper.dev/


### ds-proxy
https://github.com/dapphub/ds-proxy?tab=readme-ov-file
https://dapp.tools/ 

## 参考文档

- 如何编写一个可升级的智能合约(登链): <https://zhuanlan.zhihu.com/p/34690916>
- openzeppelin: <https://blog.openzeppelin.com/proxy-patterns/>
- 深入理解合约升级mirror: https://mirror.xyz/xyyme.eth/kM9ld2u0D1BpHAfXTiaSPGPtDnOd6vrxJ5_tW4wZVBk
- 全面理解智能合约升级： https://blog.openzeppelin.com/the-state-of-smart-contract-upgrades/ 
- proxy 升级: <https://learnblockchain.cn/article/2758>
- UUPS： https://segmentfault.com/a/1190000041731293
- 深度理解 delegatecall: <https://segmentfault.com/a/1190000015732950>
- gnosis 升级： <https://learnblockchain.cn/article/1403>
- 知乎王大锤：<https://zhuanlan.zhihu.com/p/40598039>
- 知乎王大锤：<https://zhuanlan.zhihu.com/p/40598169>
- 合约代码：<https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/tree/master/contracts/proxy>
- openzeppelin test: <https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable>
- openzeppelin: <https://docs.openzeppelin.com/upgrades-plugins/1.x/proxies>
- openzeppelin: <https://blog.openzeppelin.com/proxy-patterns/>
- testcase: <https://forum.openzeppelin.com/t/openzeppelin-upgrades-step-by-step-tutorial-for-truffle/3579>
- 原理介绍：<https://www.jianshu.com/p/3fa12d7ed76d>
- compound: 合约升级
- MinimalProxy: <https://github.com/optionality/clone-factory>
- creat2 contract upgrade: https://github.com/0age/metamorphic
- 钻石代理：https://juejin.cn/post/7179066816419856443
- The Diamond Standard : https://www.quicknode.com/guides/ethereum-development/smart-contracts/the-diamond-standard-eip-2535-explained-part-1
- Proxy contract设计总览： https://medium.com/taipei-ethereum-meetup/proxy-contract-variations-6f9d359d35bf
- Diamond hardhat: https://github.com/mudgen/diamond-1-hardhat/tree/main
- quicknode Diamond description: https://www.quicknode.com/guides/ethereum-development/smart-contracts/the-diamond-standard-eip-2535-explained-part-1