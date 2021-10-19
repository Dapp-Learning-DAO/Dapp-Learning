## 简介

AAVE v2版本相较于v1版本新增了两个重要变化：

- aToken变为可升级token
- 债务token
- flash loan V2

针对债务Token：

用户的债务以债务Token的形式存在，而不是之前的内部记账，好处有：

1. 代码简化 - 用户的债务生成销毁变成了债务Token的mint和burn
2. 同时借可变贷款利率和稳定贷款利率。在V1版本中，用户的贷款要么是可变贷款利率，要么是稳定贷款利率。多种贷款利率通过加权平均得到
3. 信用额度转移的支持：用户可以将它在AAVE中deposit得到的信用额度转移给其他账户，而其他账户可以拿着得到的信用额度来进行贷款等。

> 信用委托是一项简单的交易，Aave协议的储户将信用额度委托给他们信任的人。你也可以将信用额度委托给另一个执行预定义功能的智能合约，消除这种信任。
> 例如，Karen将USDC存入Aave Protocol以获得利息。由于Karen只用Aave Protocol来赚取而不是借贷，她不需要行使她的信用额度。相反，凯伦将她的信用额度委托给乍得以赚取额外的利息。一旦信贷额度被委托，chad就可以从专用的信贷委托金库中提取资金，这是一个建立在Aave协议之上的简单债务包装。为了确保一帆风顺，凯伦和乍得使用OpenLaw来签署条款协议。

针对flashloan V2:

flashloan V1上存在如下的不足：从AAVE上得到的flashloan无法再AAVE上去使用，即nonReentrant

## 架构

![image20211011174016233.png](https://img.learnblockchain.cn/attachments/2021/10/kUDRVi8r61641b534d5c0.png)

与之前V1版本不同：

1. 资金存放在aToken中，与compound类似。
2. 债务Token记录用户的债务
3. 所有的操作都发生在LendingPool中

## 经济模型

### aToken

aToken支持EIP-2612

$LR_t$当前流动性率：等于总的借贷利率乘以此时的资金利用率, 注意：这里的利率是一个年化利率

$$
LR^{asset}_t=R_tU_t
$$

$LI_t$​累计流动性指数，也可理解为汇率：再时间段$\Delta T$​范围内，由贷款利率累计产生的单位本金利息，任何操作都会更新该参数

$$
LI_t=(LR_t \times \Delta T_{year} + 1) \times LI_{t-1}
$$

$$
LI_0=1 \times 10 ^{27} = 1 ray
$$

这里的概念与compound中的概念利率指数是很类似的，只是compound中的利率指数概念是由所有的贷款利率乘以delta Blocks，是每一个block的利率；而这里是一个年华利率的概念，需要进行下单位换算。

$NI_t$​ 储备金正常化收入：

$$
NI_t=(LR_t \times \Delta T_{year} + 1) \times LI_{t-1}
$$

在V2中，用户指数实际上作为一个存储变量消失了，它与本金余额一起被存储为一个比率，被称为 "按比例的余额"，ScB。用户的余额被计算出来，导致在每一个导致代币铸币或烧毁的动作上的增加或减少。用户的余额被计算出来，导致每一个导致铸币或烧毁代币的行动的增加或减少。

也就是说用户手上的aToken会增加或者减少!

如果是deposit：

$$
ScB_t(x) = ScB_{t-1} + \frac{m}{NI_t}
$$

如果是withdraw：

$$
ScB_t(x)=ScB_{t-1}(x)-\frac{m}{NI_t}
$$

任何时刻，用户手上的aToken的数量为：

$$
aB_t(x)=ScB_t(x)\times NI_t
$$

此时需要结合代码看到：

aToken的balanceOf函数的定义为：一个用户的aToken的数量为该用户的本金与该本金产生的利息之和。而在AAVE内部，统一使用$ScB_t$作为用户的实际本金。即$ScB_t=super.balanceOf(user)$

```js
function balanceOf(address user)
    public
    view
    override(IncentivizedERC20, IERC20)
    returns (uint256)
  {
    return super.balanceOf(user).rayMul(_pool.getReserveNormalizedIncome(_underlyingAsset));
  }
```

这里的一个难点即在于如何理解ScBt(x),

当t=0时刻，此时用户还没有向AAVE中存钱，$ScB_0$​​​​​​ = 0， $NI_0$​​​​​​=1 ray
当t=1时刻，此时用户向AAVE中存入抵押token，数量为m, 此时AAVE给用户记账存入数量为 $ScB_1=\frac{m}{NI_1}$​​​​​​ ,用户自己查自己的账户余额为$aB_1=\frac{m}{NI_1}\times NI_1=m$​​​​​​
当t=2时刻，此时用户没有继续向AAVE中存钱，即数量为0，此时AAVE给用户记账存入数量为$ScB_2=ScB_1$​​​​​​，用户自己查自己的账户余额为$aB2=\frac{m}{NI_1}\times {NI_2}=m\times \frac{NI_2}{NI_1}> m$​​​​​​
当t=3时刻，此时用户再次向AAVE中存入抵押token，数量为n，此时AAVE给用户记账存入数量为$ScB_3=\frac{m}{1\ ray}+ \frac{n}{NI_3}$​​​​，此时用户自己查自己的账户余额为$aB_3=(\frac{m}{NI_1}+\frac{n}{NI_3})\times NI_3=m\times \frac{NI_3}{NI_1}+n$​

故用户会发现自己的账户余额每查一次自己的balanceOf都会慢慢变大，这就是原因。但是再AAVE内部，其使用的是$ScB$这一概念，即实际记账数量。​​​​​​​

### 债务Token

债务Token的总供给变化率为：所有用户再此时刻t的ScB之和

$$
dS_t=\sum{ScB_t(i)}
$$

某一种资产再时刻t对应的总的债务为：稳定贷款利率在此时刻t的总供给与可变贷款利率在时刻t的总供给之和

$$
D_t^{asset} = SD_t+VD_t
$$

当AAVE将债务token化的时候，最让人困惑的一点就是，如果我收到了债务Token，然后我把债务Token转账给别人，这样岂不就是可以自己不用归还债务了？

AAVE为了解决这个问题，它的债务Token并不是一个标准的ERC20合约，而是自己魔改之后的ERC20

```js
function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
    recipient;
    amount;
    revert('TRANSFER_NOT_SUPPORTED');
  }
```

当用户想要把自己的债务转嫁给别人时，会被revert，是不被允许的。

## 可变债务

$VI_t^{asset}$ 累计可变债务借贷利率指数：即由可变债务总额V B在时间段$\Delta T$范围内，以可变债务利率 V R，产生的累计可变债务指数

$$
V I_t=(1+\frac{V R_t}{T_{year}})^{\Delta T}\times VI_{t-1}
$$

这里需要其为指数函数，回忆复利的定义，但是compound中并不是指数函数，而是一个近似的乘积，即：泰勒级数展开

$$
(1+x)^y=1+xy+...
$$

AAVE自己实现了一个pow函数，而compound则简单使用泰勒级数展开的前两项作为估算

$VI(x)$ 用户累计可变利率指数： 某一个用户的累计可变利率指数当且仅当用户持有借款头寸时更新。用户不借钱自然就没有可变利率指数了

$$
VI(x)=VI_t(x)
$$

$PB(x)$​​,用户总的借贷总金额： 当用户借钱时的用户所借贷的金额。如果用户多次借钱，那么复利的利息会每一次都累计并成为最新的借款总额

$VN_t$均化累计可变贷款：​

$$
V N_t=(1+\frac{V R_t}{T_{year}})^{\Delta T}\times VI_{t-1}
$$

债务Token的数量跟aToken的逻辑类似，也是会变化的。也是有一个Scaled Balance概念，即借贷总额缩放因子

当用户借钱时，可变借款总额的缩放因子为借款前的缩放因子加上这次借款数量m与平均化后的总的借款数量$VN_t$之比的和

$$
ScVB_t(x)=ScVB_{t-1}(x)+\frac{m}{VN_t}
$$

当用户还钱时，可变借款总额的缩放因子为借款前的缩放因子加上这次借款数量m与平均化后的总的借款数量$VN_t$之比的差

$$
ScVB_t(x)=ScVB_{t-1}(x)-\frac{m}{VN_t}
$$

在任何时刻，用户的可变债务总量是：

$$
VD(x)=ScVB(x)D_t
$$

在这里的这个公式，经由周五的讨论一致认为应该是：

$$
VD(x)=ScVB(x)\times VN_t
$$

如果对比上面存款的aToken，你会发现这里的逻辑基本上是类似的，即AAVE里面实际记录用户债务的记账数量是$ScVB$，而用户查询到的自己的债务数量是$VD_t$​.

## 稳定利率债务

$SR_t^{asset}$: 总的稳定平均贷款利率 - AAVE中的稳定利率贷款是什么意思？贷款利率不随着资金利用率变化吗？那要怎么去结算利息呢？

如果以稳定利率$SR_t$发行一笔稳定利率贷款$SBnew$, 那么稳定平均利率$SR_t$:

$$
SR_t=\frac{SD_t\times SR_{t-1}+SBnew\times SR_t}{SD_t+SBnew}
$$

如果用户x以稳定贷款利率$SR_t$偿还一笔稳定利率贷款SB,则稳定平均利率为：

$$
SR_t= 
\left\{
\begin{aligned}
0,& \ if\ SD_t-SB(x)=0 \\
\frac{SD_t \times SR_{t-1}-SB(x)\times SR(x)}{SD_t - SB_x}, &\ if\ SD_t-SB_x > 0
\end{aligned}
\right.
$$

$SD(x)$：用户的稳定贷款总金额：都是年化利率，要进行单位划算

$$
SD(x) = SB(x)(1+\frac{SR_t}{T_{year}})^{\Delta T}
$$

## 闪电贷

相较于V1版本，V2版本的闪电贷功能更为完善。

v1版本的闪电贷路径：

1. 在转账给用户之前，AAVE对闪电贷的货币余额进行一次快照
2. 在闪电贷结束后，检查闪电贷货币余额是否大于等于之前的快照加上闪电贷的利息。如果不满足条件，则revert

V2版本的闪电贷路径：

1. AAVE直接给用户转账
2. 闪电贷结束时，AAVE从用户账户中拉取借贷金额和手续费，如果拉取失败，则闪电贷失败。主要是用户要给AAVE进行授权

通过pull的方式而不是push，可以避免使用两次snapshot，这样也避免使用nonReentrant检查。
