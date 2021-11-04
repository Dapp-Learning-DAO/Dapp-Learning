## 0. 摘要

  Liquity是一种去中心化的借贷协议，只用ETH作抵押提取无息贷款。
每个用户需通过链上合约创建一个单独的“金库(Trove)”来实现借贷。贷款以LUSD的形式支付，并要求110%的最低抵押率。LUSD是一种与美元锚定的稳定币，LUSD的持有人可以在任何时刻以美元计价来赎回等值ETH。
除了用户的抵押外，Liquity的贷款还由一个LUETH稳定池和所有借款人集体作为最后担保人提供担保，同时还有算法来保障LUSD和美元的锚定。
  Liquity协议是彻底的去中心化协议，它不可改变，也无需治理，ETH也是去中心化的。
  
## 1. 市场概述

稳定币是市场刚需。
当前稳定币的缺点:
- 当前是抵押类稳定币的都是有息借贷，利息超过20.5% p.a
- 治理机制的引入导致协议费用居高不下
- 无有效清算机制导致抵押率偏高
- 而算法稳定币却无法保证实时赎回。


### 1.1清算流程：
 Liquity 按优先级别排序的三重清算方案：
- 稳定池  
稳定池属于优先级别最高，即抵押借贷的用户需开启 Trove 提供高于 110% 的抵押品可发行 100% 的 LUSD。而一旦用户抵押品 ETH 价值低于 110% 会被触发清算，此时充斥着 LUSD 的稳定池即会发挥作用，稳定池会销毁对应量的 LUSD 而获得相对应的抵押品 ETH，因为只要低于 110% 即会被清算而 110%>100%，相当于稳定池会获得 10% 折扣的 ETH。
- 债务再分配  
第二阶段债务再分配，可理解为稳定池 LUSD 不足的情况下的 Plan B。假如稳定池里 LUSD 数量不足以覆盖系统债务，则会触发债务再分配，简单来讲就是把被清算的债务分配到抵押率较充足的 Trove 持有者头上。
- Recovery Mode （系统恢复模式）  
系统存在一个关键抵押率 =150%，当系统的总抵押率不足 150% 时，则会触发 Recovery Mode，此时，系统会依据抵押率由低到高，不管你的抵押率是否大于 110%，只要低于 150% 就有可能被清算，直到系统总抵押率为 150% 为止。针对 Trove 来说，不会有额外的损失，也就是说如果你的抵押率为 140% 被触发清算，你的 Trove 会被关闭，110% 抵押品被清算，30% 的抵押品则依旧 Claimable，因此该 Trove 的净损失已然为 10%，但对系统来说减少了很多有风险的 Trove 从而提升了系统总抵押率。

### 1.2 LUSD 价格稳定：硬锚定+软锚定
Liquity 的抵押品可赎回，且 1 枚 LUSD 可始终保持可赎回价值 1 美金的 ETH。此谓「硬锚定」， 任何时候都可以按面值赎回eth.
- 如果 LUSD 溢价，LUSD>1.1 的情况几乎不可能发生，因为假如高于 1.1，由于抵押率 110%，套利者可瞬时套利。而高于 1 美金，由于铸造成本为 1 美金，则可铸造出成本 1 美金的 LUSD 以高于 1 美金的价格卖出，折价同理。
- 软锚定是基于硬锚定而产生的对 LUSD 稳定于 1USD 的长期愿景借此影响人们对 LUSD 未来价格走势的预期从而作出的决定（1LUSD=1U 的谢林点）。 低于1美元时，仍然可以按1美元价格赎回eth。  ？有没有eth下跌更快的情况？
也就是说 1 美金以下会激励还款，1 美金以上会激励借款达成套利。
 ## 2. Liquity协议的优点:

- 利率为0％——作为借款人，您无需担心不断产生新的债务。
- 110％的最低抵押率——更有效地利用储蓄的ETH。
- 无治理——所有操作都是算法化的和自动化的，并且在协议部署时就已经设置好了协议参数。
- 可直接赎回——LUSD可以随时按面值赎回相关抵押品。
- 完全去中心化——Liquity协议没有管理密钥，并且可以通过由不同前端运营商提供的多个接口进行访问，从而使其不受审查。

## 3. 系统功能
[合约代码位置](https://github.com/liquity/dev/tree/main/packages/contracts)

[trailofbits审计报告](https://github.com/trailofbits/publications/blob/master/reviews/Liquity.pdf)
<!-- ![img](pics/trailofbits_audit.png) -->

#### 3.1 借贷
----
Liquity协议收取一次性借入和赎回费用。这一费用会根据最近的赎回时间在算法上进行调整。例如：如果近期发生更多的赎回（这意味着LUSD的交易价格可能低于1美元），则借贷费用将增加，从而阻碍借贷。

Core Code: packages/contracts/contracts/BorrowerOperations.sol
- 创建金库(Trove):
    >一个EOA和一个金库唯一绑定
    ```ts
    function openTrove(uint _maxFee, uint _LUSDAmount, address _upperHint, address _lowerHint) external payable;
    ```
- 添加抵押品(ETH):
    ```ts
    function addColl(address _upperHint, address _lowerHint) external payable;
    ```
- 提取LUST: 
    >可以提取一定数量的LUSD使您的抵押率不高于110%(Minimum Collateral Ratio (MCR))

    >最低债务为2,000 LUSD，避免

    >此时会收取一次性手续费(5% >= base rate + 0.5% >= 0.5%)，这笔费用直接添加到用户债务中，在结清closTrove时支付；
    
    >200 LUSD的清算准备金(偿还债务后准备金会退还)

    ```ts
    function withdrawLUSD(uint _maxFee, uint _amount, address _upperHint, address _lowerHint) external;
    ``` 
- 偿还LUSD:
    >目的是降低抵押率
    ```ts
    function repayLUSD(uint _amount, address _upperHint, address _lowerHint) external; 
    ``` 
- 关闭金库，结清债务(总借出的LUSD再加上一次性手续费):  
    ```ts
    function closeTrove() external; 
    ``` 
- 恢复模式时，借贷功能失效:


#### 3.2 稳定池(Stability Pool)




## 参考链接 
- liquity 和maker对比： https://www.chainnews.com/articles/778907264093.htm

- Bingen. (2021,Feb,23). Liquity System Summary. URL: Github:
https://github.com/liquity/beta/blob/main/README.md#liquidation-and-the-stability-pool

- CaymanMoore. (2021.2.28). URL: Tether:
https://tether.to/wp-content/uploads/2021/03/tether-assurance-feb-2021.pdf

- Kolten. (2021.2). Official Liquity Documentation. URL: Liquity:
https://docs.liquity.org/