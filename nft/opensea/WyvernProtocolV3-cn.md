## 翻译说明

> * 对于翻译中不明确的词汇会将原词汇跟随在翻译词汇后。

## 协议组件

协议、组成部分和术语的概述。

### 概述

Wyvern 是一阶(first-order)去中心化交换协议。可比较的现有零阶(zeroeth-order)协议，例如[Etherdelta](https://github.com/etherdelta/smart_contract)、[0x](https://github.com/0xProject/0x-monorepo)和[Dexy](https://github.com/DexyProject/protocol)：每个订单指定了两个离散资产（通常是特定比率和最大数量的两个代币）的所需交易。相对于零阶协议，Wyvern 订单改为指定状态转换的谓词：订单是一个函数，将订单构建者(maker)发出的调用、交易的另一方发出的调用和订单元数据映射到布尔值（订单是否匹配）。这些谓词是任意的——以太坊上可表示的任何资产或资产的任何组合都可以用 Wyvern 订单进行交换——事实上，Wyvern 可以实例化所有上述协议。

优势

- 非常灵活: 可以表达任何订单简化协议可以表达的和很多他们不能表达的
- 接近最佳的gas效率：大多数gas消耗在实际调用和calldata谓词中
- Security-conducive: constituent protocol components are isolated, core protocol is minimal
- 安全：协议组件是隔离的，核心协议是最小化的。

缺点

- 对开发人员不是很友好并且容易被滥用
- Not as well-supported by user-level tooling (e.g. Metamask displaying signed messages)
- 没有得到用户级工具的良好支持(例如Metamask显示消息签名信息)

### 订单架构

```
struct Order {
    address registry;
    address maker;
    address staticTarget;
    bytes4  staticSelector;
    bytes   staticExtradata;
    uint256 maximumFill;
    uint256 listingTime;
    uint256 expirationTime;
    uint256 salt;
}
```

| Name            | Type    | Purpose                                           |
| --------------- | ------- | ------------------------------------------------- |
| registry        | address | 用来调用的注册表(记录如何调用)                    |
| maker           | address | Order maker, who will execute the call 订单创建者 |
| staticTarget    | address | 谓词函数的目标地址                                |
| staticSelector  | bytes4  | 谓词函数的Selector(函数签名的hash)                |
| staticExtradata | bytes   | 谓词函数的额外数据                                |
| maximumFill     | uint256 | 订单无法被匹配的最大填充                          |
| listingTime     | uint256 | 在listingTime之前，订单无法被匹配                 |
| expirationTime  | uint256 | 在这个时间之后订单无法被匹配                      |
| salt            | uint256 | 用于hash去重                                      |

All fields are signed over.

### 构造一个订单

#### 资产注册

订单创建者会检查他和他的交易伙伴使用了有效的注册中心(尽管注册中心在交易所合约的在白名单中)

#### 资产calldata

一个订单的大部分逻辑是在构造调用和交易伙伴调用的谓词. 每个订单的静态回调(谓词函数)接收调用的所有参数，交易对手调用，和订单元数据(Ether数量，时间戳，匹配地址)和必须决定是否来允许订单匹配，和填入多少钱。

##### Call

第一次调用是订单创建者通过代理合约来执行。静态回调接收所有的参数 - 调用目标、调用类型(CALL 或 DELEGATECALL)，和调用数据 - 并且必须验证这个调用是是订单创建者期望的那样(转账特定资产或者一系列资产)。

##### Countercall

第二次调用被交易对手调用，为方便起见，在源代码中成为反调用。静态回调接收所有的参数 - 反调用目标，反调用类型(CALL 或 DELEGATECALL)，和反调用数据 - 并且必须验证调用时订单创建者期望接收到的(转移一个特定的资产或者一系列资产)

#### Asserting state

静态调用在调用滞后被执行(如果静态调用失败整个交易被revert)，所以你可以断言特定状态的变更，而不是断言calldata的属性 --例如 一个账户现在拥有一些资产。在某些情况下可能更有效，但它会导致意外结果如果状态因为其他原因变更了(例如，如果你正在尝试去买的资产被送给你) - 所以仅在特殊情况下才推荐使用这种方法，例如放一个bug赏金在合约上如果不变量被违背了。

#### Metadata

Metadata 包含订单listing时间，订单过期时间，对手订单listing时间，调用中Ether转账数量，当前订单填入的值和匹配地址

#### Generalized Partial Fill

订单在一个最大填充上签名，并且静态调用在订单匹配的情况下返回一个无符号整型来指定被更新的填充值。当前的订单填充能被订单的创建者通过交易手动设置(这也允许取消订单)。要注意的是，设置订单的填充为非空值也会隐式的授权订单，因为对部分填充的订单的授权会被缓存以避免不必要的签名检查。

