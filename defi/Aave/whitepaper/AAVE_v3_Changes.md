AAVE v3的代码已经经过审计，且已经开源，合约地址是：

https://github.com/aave/aave-v3-core

# 功能
相对于V2，V3的主要功能如下:

- Portal
- 高效模式 eMode
- 隔离模式
- 改进风险管理
- L2 特色功能
- 社区贡献

## 基于社区反馈的技术进步
尽管 Aave 协议在过去两年中运行有效并取得了巨大的增长，社区的贡献为AAVE的技术进步提供了非常关键的作用：

- 资本效率：V2 不允许用户在收益产生（协议内和/或跨协议部署在各种网络上）或借贷能力方面优化他们提供给 Aave 协议的资产。V3 解决了这个问题。

- 风险控制调整：虽然 Aave 协议目前具有可以通过 Aave 治理由社区激活的风险控制功能，例如调整借贷能力和维持保证金，但附加功能可以提高 Aave 协议智能合约固有的众所周知的安全性。V3 解决了这个问题。

- 去中心化： Aave治理稳健且蓬勃发展——通过社区成员提交提案和创建子 DAO（GrantsDAO 和 RiskDAO）。但为了最大限度地去中心化，某些技术特性将允许 Aave 治理通过委托给团队或其他个人来进一步去中心化其功能。

- 跨链：通过社区的努力，Aave 协议已部署在许多网络中，每个网络都有对应的流动性。但是用户无法将自己的个人流动性从一个网络上无缝转移到另一个网络。V3 解决了这个问题。

V3 的设计旨在创建下一代第 0 层 DeFi 协议，该协议可以显着改善用户体验，同时提供更高的资本效率、更高程度的去中心化和进一步增强的安全性。

## Portal

Portal示意图：

![portal](https://aws1.discourse-cdn.com/standard21/uploads/aave/original/2X/5/57f9135e675f1ed5637491be6facec13f0c26883.jpeg)

portal模式可以让用户在多个网络之间无缝转移资产。例如，用户可以在ETH上burn aToken，然后在polygon上mint出来。类似于其他的跨链，不清楚技术原理

## 高效模式 eMode

eMode 示意图:

![emode](https://aws1.discourse-cdn.com/standard21/uploads/aave/original/2X/9/922d53c2b37505e9a368fca3960044d620225725.jpeg)

简单举个例子就是，在eMode下，你质押wBTC，只能借出renBTC，这时，你的质押率可以达到97%，清算线为98%, 然后清算罚金率为2%。也就是在同类资产借贷时，提高了资金利用率，同时降低了风险。

原理是把资产归类(category)，最多可以有255个类别。

例如第一类为稳定币，这个category有USDT，USDC，DAI, 用户甲在这个模式下借贷时，例如存USDC，借DAI，可以有97%的LTV，而普通模式只有75%，这样用户甲的资金利用率就提高了22%

当然，用户依然可以使用非category 1的资产作为抵押，但非category 1的资产的LTV就只能适用普通模式的LTV

## 新的风险管理参数

**隔离模式**
![Isolation Mode](https://aws1.discourse-cdn.com/standard21/uploads/aave/original/2X/e/e9ee63faffa5fa6252898e31c0ef8d8e103180d5.jpeg)

隔离模式的目标是允许 Aave 治理协议上新币时，降低风险

当社区成员提交治理提案以在 Aave市场上创建新资产时，该提案将该资产列为“隔离抵押品”，存入这些“隔离”资产的用户只能借出 Aave 治理指定的稳定币，且借款额不能高于指定的债务上限。

当用户提供“隔离资产”作为抵押品时，该用户只能将该资产用作抵押品；即使用户向协议提供其他资产，用户也只能从这些资产上赚取利息，而不能将这些资产用作抵押品。


## bug悬赏及riskDao

riskDao: 
https://governance.aave.com/t/proposal-aave-risk-dao/4729

# 其他特性

- 涉及代币转移（例如，供应、偿还）的功能支持 EIP 2612 许可（对于 L2 部署很重要）；

- 支持 EIP 712 签名；

- 用户可以使用aTokens代替原来借入的标的资产来偿还借入的头寸；

- Aave Governance 可以“允许”实体访问即时流动性；???（Aave Governance can “permitlist” entities to access instant liquidity;）

- Aave 治理可以重新配置向 Aave DAO 财政部提供的清算或即时流动性交易的任何费用；

- 新的 flashloanSimple 可减少高达 20% 的gas消耗（标准的全功能函数仍然可用）；

- 价格预言机逻辑可以提供对基础资产的通用计算（即不再仅限于 ETH）；

- 新的利率策略优化了稳定的利率计算（并且无需贷款利率预言机）；

- 代码重组以更加模块化；与 V2 单一存储库相比，V3 代码将分为三个不同的存储库——V3 core, V3 periphery, V3 deployments。这有助于社区贡献和在不同网络上的部署；

- 智能合约重构以减少代码大小（为未来的其他更改提供更多余量）→ 最多 100K 优化器运行！

有了所有这些新功能，所有功能的 gas 成本仍然全面下降了 10-15% 左右！
# 代码

注: 这部分是我粗略浏览一遍v3后的感受。

0. gas 费优化
solidity的版本升级为0.8.10，核心几个的Math都已经重写，大部分使用了assembly来节省手续费

1. 功能增加
- emode
- isolation

2. 命名改变
例如：
- deposit命名为supply
- LendingPool.sol 命名为 Pool.sol, 等
- 核心业务逻辑全部移到 libraries/logic 目录中 (之前只有利率计算, validation的逻辑在 libraries/logic 目录中，包括新增的 emode，isolation，bridge)

3. 外围功能单独 repo
类似于uniswap，有一个单独的 periphery 仓库。此外，deployment 好像也是一个单独的仓库，在安装`aave-v3-core`依赖时，会安装一个`@aave/deploy-v3`的包，但这个包目前找不到，issue在此：https://github.com/aave/aave-v3-core/issues/625

4. 协议变更
如果要fork AAVE v3的同学注意了，这个协议好像类似于 `uniswap v3`的协议，具体可以去研究一下: https://github.com/aave/aave-v3-core/blob/master/LICENSE.md

(注: 不过好像大家fork的都是compound，很少有项目fork AAVE ^_^)


5. 核心架构上变动不多

# 参考资料

https://governance.aave.com/t/introducing-aave-v3/6035

https://github.com/aave/aave-v3-core
