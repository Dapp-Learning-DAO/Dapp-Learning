# Liquity 白皮书分享
## liquity整体架构：
![](2023-03-16-09-53-27.png)
1. 单一抵押借贷，低抵押率 110%
2. 0借贷利率，借贷有费用
3. 两段式清算
4. 稳定币LUSD，平台收益币LQTY
### 关键概念：

1. 单个Trove风险指标：MCR，ICR ⇒ 若 ICR < MCR, 该trove会被清算
2. 平台所有Trove风险指标：CCR，TCR ⇒ 若 TCR < CCR, liquify平台会进入恢复模式，进行全局清算。
   
$$
\begin{align*} TCR & = \frac{\sum_{i}^{n}ETH_{collateral}\times Price}{\sum_{i}^{n}LUSD_{debt}}& \\
  netDebt & = LUSD_{borrow}+LUSD_{borrowFee}& \\
  composeDebt & = LUSD_{borrow}+LUSD_{borrowFee}+LUSD_{gas}& \\ 
  LUSD_{borrowFee} & = b_t \times LUSD_{borrow}& \\ 
  b_t & = b_{t-1}+\alpha \times \frac{m}{n} \\ 
  b_t & = b_{t-1}\times\delta^{\Delta t} \\ 
  ICR & = \frac{ETH_{collateral}\times Price}{composeDebt} \\ 
  NICR & = \frac{ETH_{collateral}}{composeDebt}
\end{align*}
$$

### 主要用户交互：

开仓，平仓，调仓
![](2023-03-16-09-54-31.png)
![](2023-03-16-09-54-43.png)
![](2023-03-16-09-54-56.png)

### 有序双向链表：Troves

按照NICR排序

用户redeem时，按照从低到高顺序redeem
![](2023-03-16-09-55-22.png)
![](2023-03-16-09-55-31.png)
![](2023-03-16-09-55-42.png)
![](2023-03-16-09-55-51.png)

### 清算策略1: 稳定池

稳定池：stable pool

由用户存入LUSD组成，共担清算风险，均分ETH收益
![](2023-03-16-09-56-20.png)
![](2023-03-16-09-56-28.png)
![](2023-03-16-09-56-38.png)
![](2023-03-16-09-56-48.png)
![](2023-03-16-09-56-58.png)
![](2023-03-16-09-57-08.png)
![](2023-03-16-09-57-20.png)

### 清算策略2: 债务拆分
![](2023-03-16-09-57-40.png)
![](2023-03-16-09-57-47.png)
表中D被拆分了，拆分按照抵押物数量占比来分配被拆分人的资产和债务。

### 恢复模式：Recovery Mode

处于恢复模式，意味着整个系统的风险系数过高，需要降低系统的风险。需要对系统中的Trove进行整体的清算。同时不允许存在降低系统TCR的行为。但允许增加系统TCR的行为存在。
![](2023-03-16-09-58-07.png)

## ETH flow
![](2023-03-16-09-58-30.png)
## LUSD flow
![](2023-03-16-09-58-50.png)

## 代码分析
第一步是找到用户开仓，调仓，平仓的三笔交易，然后根据这三笔交易来分别进行分析：

开仓：

[https://versatile.blocksecteam.com/tx/eth/0x9a7c5e5fefbde5de53183607442e4955af08843522f82014bbc97990b18225e4](https://versatile.blocksecteam.com/tx/eth/0x9a7c5e5fefbde5de53183607442e4955af08843522f82014bbc97990b18225e4)

调仓：

[https://versatile.blocksecteam.com/tx/eth/0xd0c55c1a4c519b2e243c76d4dd3d31d242ae82390680299067bbe3f6f6d81c44](https://versatile.blocksecteam.com/tx/eth/0xd0c55c1a4c519b2e243c76d4dd3d31d242ae82390680299067bbe3f6f6d81c44)

平仓：

[https://versatile.blocksecteam.com/tx/eth/0x658163ff420eb0bdcf2a9ccdb94cd317c86a3b9c1bcf5df91dfd631f8e821c62](https://versatile.blocksecteam.com/tx/eth/0x658163ff420eb0bdcf2a9ccdb94cd317c86a3b9c1bcf5df91dfd631f8e821c62)

openTrove

```jsx
Function: openTrove(uint256 _maxFeePercentage, uint256 _LUSDAmount, address _upperHint, address _lowerHint)

MethodID: 0x860665b3
[0]:  0000000000000000000000000000000000000000000000000023d8b9cb5133ed //maxFeePercentage
[1]:  0000000000000000000000000000000000000000000001ccc9324511e4500000 //LUSD
[2]:  0000000000000000000000009293e91b7c2722f1dd25bb826aadfae32b01b11f //UpperHint
[3]:  0000000000000000000000006e5288e47e21227c7f102c6695c103e1d80effda //lowerHint
msg.value = 8.5 ether
```

用户调用该方法是，会调用borrowOperations的openTrove方法：

涉及到的数学公式有：

$$
\begin{align}
  TCR & = \frac{\sum_{i}^{n}ETH_{collateral}\times Price}{\sum_{i}^{n}LUSD_{debt}}& \\ 
  netDebt & = LUSD_{borrow}+LUSD_{borrowFee}& \\ 
  composeDebt & = LUSD_{borrow}+LUSD_{borrowFee}+LUSD_{gas}& \\ 
  LUSD_{borrowFee} & = b_t \times LUSD_{borrow}& \\ 
  b_t & = b_{t-1}+\alpha \times \frac{m}{n} \\ 
  b_t & = b_{t-1}\times\delta^{\Delta t} \\ 
  ICR & = \frac{ETH_{collateral}\times Price}{composeDebt} \\ 
  NICR & = \frac{ETH_{collateral}}{composeDebt}
\end{align}
$$

```js
function openTrove(uint _maxFeePercentage, uint _LUSDAmount, address _upperHint, address _lowerHint) external payable override {
第一步：通过priceFeed拿到当前的ETH/USD的价格
第二步：根据拿到的ETH价格，判断是否进入recover模式
第三步：判断参数maxFeePercentage是否合法
第四步：要求trove没有被创建，即该msg.sender首次调用openTrove
第五步：赋值净债务netBebt为LUSDAMOUNT
第六步：如果不是recoveryMode的话，则计算出LUSD的borrow费用，并把费用更新到用户的净债务上
第七步：检查净债务的最小值是否满足条件
第八步：计算trove的复合债务，即净债务加上gas 费用
第九步：计算ICR和NICR      
第十步：如果是恢复模式，则要求ICR在CCR(150%)之上，如果不是恢复模式，则要求ICR是否在MCR(110%)之上。
计算新的TCR，并要求新的TCR在CCR之上。
第十一步：更新TroveManager的该trove的状态，设置该trove为活跃，增加该trove的抵押品数量，增加该trove的债务数量
第十二步：更新TroveManager的该trove的reward快照
第十三步：更新TroveManager的总抵押

第十四步：根据前端页面传过来的upper和lower，将该trove插入到链表中                                                                
第十五步：把TroveOwner添加到troveManger中。
第十六步：把ETH转账给actvePool,给用户mint相应数量_LUSDAmount的LUSD
第十七步：给gasPoolmint一定数量LUSD_GAS_COMPENSATION的LUSD
```
![](2023-03-16-10-00-39.png)

第二步：调仓：

```jsx
Function: adjustTrove(uint256 _maxFeePercentage, uint256 _collWithdrawal, uint256 _LUSDChange, bool _isDebtIncrease, address _upperHint, address _lowerHint)

MethodID: 0xc6a6cf20
[0]:  0000000000000000000000000000000000000000000000000024db6565c6d854 //maxFeePercentage
[1]:  0000000000000000000000000000000000000000000000000000000000000000 //collWithdraw
[2]:  0000000000000000000000000000000000000000000000d876102494c9a36b50 //LUSD change
[3]:  0000000000000000000000000000000000000000000000000000000000000000 //isDebtIncrease
[4]:  000000000000000000000000a4b120fdb2fd946a67fbe996cb650dc2cd7d55f2 // upper hint
[5]:  000000000000000000000000251acec7536e28cc43268f92f1d554e64f421420 //lower hint
```

涉及到的公式有：

$$
TCR=\frac{\sum_{i}^{n}ETH_{coll}\times Price_t}{\sum_{i}{n}LUSD_{debt}}\\ 
$$

$$
\delta netDebt=\left\{\begin{matrix} 
  \delta LUSD+borrowFee &\text{新增债务}\\  
  \delta LUSD &
\end{matrix}\right. 
$$

$$
\begin{align*}
ICR_{t,old} & = \frac{ETH_{collateral}\times Price_t}{composeDebt}\\
ICR_{t,new} & = \frac{(ETH_{collateral}\pm \delta collateral)\times Price_t}{composeDebt\pm \delta netDebt}
\end{align*}
$$

$$
\begin{cases} 
  ICR_{t,new} > ICR_{t,old}\ ,ICR_{t,new} > CCR & \text{ recovery mode}\\ 
  ICR_{t,new} > MCR\ , TCR_{t,new} >CCR & \text{ non recovery mode }
\end{cases}
$$

$$
\begin{cases} 
  ICR_{t,new} > ICR_{t,old}\ ,ICR_{t,new} > CCR & \text{ recovery mode} \\  
  ICR_{t,new} > MCR\ , TCR_{t,new} >CCR & \text{ non recovery mode }
\end{cases}
$$

$$
\begin{cases} isDebtIncrease=false, \delta LUSD > 0  & \text{ 偿还债务 } \\
isDebtIncrease=true,\delta LUSD > 0  & \text{ 新增债务 } \\
\end{cases} 
$$

$$
\begin{cases}
collWithdrawl > 0,msg.value > 0  & \text{ 禁止同存同取 } \chi \\
collWithdrawl = 0,msg.value > 0  & \text{ 存入ETH }\\
collWithdrawl > 0,msg.value = 0  & \text{ 取出ETH }\\
\end{cases}
$$

$$
\begin{align*} \text{偿还债务要求} \\ \begin{cases}
 composeDebt-\delta LUSD \ge minDebt & \text{ 债务最小值 }\\
 composeDebt \ge  \delta LUSD & \text{ 债务偿还上限 }\\
 LUSD_{userBalance} \ge \delta LUSD & \text{ 足够余额 } 
\end{cases}
\end{align*}
$$

```js
function _adjustTrove(address _borrower, uint _collWithdrawal, uint _LUSDChange, bool _isDebtIncrease, address _upperHint, address _lowerHint, uint _maxFeePercentage) internal {

第一步：获取pricefeed中的ETH-USD价格
第二步：判断是否进入recoveryMode，即TCR<150%
第三步：如果没有进入recoveryMode，则要求maxfeePercentage合法，要求LUSDChange必须不为0.即不允许只增减保证金的操作
第四步：要求不存在提取ETH和存储ETH的情况，即判断msg.value == 0 || collWithdraw == 0
第五步：要求Adjust必须有调整的参数量，即masg.value !=0 || collwithdraw != 0||LUSDchange != 0
第六步：要求Trove是活跃的。
第七步：计算该trove的pending Reward？？
第八步：计算该请求中的ETH变化量
第九步：赋值LUSDchange到netDebtChange中
第十步：如果debtIncrease且不在recoveryMode中，则计算出borrowFee，并把BorrowFee添加到netDebtChange中
第十一步：拿到该trove的debt和coll数量
第十二步：根据当前的ETH价格，和trove中原有的debt和coll，计算出旧的ICR
第十三步：根据当前的ETH价格，和trove中改变后的debt和coll，计算出新的ICR
第十四步：要求用户提出的collWithdraw小于用户的抵押Coll数量
第十五步：检查调整后的trove状态，即ICR满足当前模式的要求，即recoveryMode ICR>CCR, 非recoveryMode，ICR>MCR
第十六步：当调仓是债务偿还，检查用户是否拥有足够的LUSD
第十七步：更新Trovemanager中该trove的状态
第十八步：更新Trovemanager中totalStake的数量
第十九步：计算该Trove的新NICR
第二十步：把该Trove根据新的NICR重新插入到链表里
第二十一步：把相应的ETH和LUSD进行转账
```
第三步：平仓

```jsx
Function: closeTrove()

MethodID: 0x0e704d50
```

closeTrove与adjustTrove的区别在于，closeTrove可以把这个Trove中的所有债务全部偿还完毕，但是adjustTrove要求一个trove中必须至少有2000刀的债务，不允许adjust。

```jsx
function closeTrove() external override {
第一步：检查待关闭的Trove是活跃状态
第二步：从预言机中拿到ETH的价格
第三步：要求该ETH价格下的整个系统不处于RecoveryMode
第四步：调用troveManager给该Trove分发奖励
第五步：拿到该trove中剩余的抵押品
第六步：拿到该trove中剩余的债务
第七步：要求该用户名下有足够的LUSD用于支付债务，债务扣除200U的gas费用后
第八步：计算系统新的TCR
第九步：要求系统的新的TCR>CCR
第十步：从troveManager中移除该trove的质押
第十一步：从troveManger中关闭该Trove
第十二步：从msg.sender中移除debt-gas部分的LUSD，并将其销毁
第十三步：从gasPool中移除200U的gas部分LUSD，并将其销毁
第十四步：从activePool中，转账ETH到msg.sender里。
```

### Stable Pool Share 分发算法

要解决的问题：
在stable pool中，用户向stable pool中deposit LUSD，然后获得一定的份额。由于stable pool设计的机制，其池子中的LUSD会用于清算Trove，从而会导致Stable pool里的LUSD减少，清算时获得的ETH增多。需要设计一个合理的机制，让stable pool的储户来公平分配ETH，公平承担LUSD减少。
算法推导及设计：

$$
\begin{align*}
d_i &:\text {用户在第i次清算前的存款LUSD}\\
Q_i &:\text {第i次清算时使用的LUSD数量}\\
E_i &:\text {第i次清算时获利的ETH数量}\\
D_i &:\text {第i次清算前stable Pool中LUSD的总量}
\end{align*}
$$

首先考虑LUSD的扣款：

用户alice在第0次清算后，alice的LUSD余额应该为：

$$
\begin{align*}
d_1 & = d_0-LUSD_{loss}\\
LUSD_{loss} & = Q_1\times \frac{d_0}{D_0} \\
d_1 &= d_0\times(1-\frac{Q_1}{D_0} )\\
d_2 &= d_1\times(1-\frac{Q_2}{D_1} )\\
&\cdots \\
d_n &= d_{n-1}\times(1-\frac{Q_n}{D_{n-1}} )\\
\frac{d_n}{d_{n-1}} &=  1-\frac{Q_n}{D_{n-1}} \\
&=> \\
\frac{d_n}{d_0} &= \prod_{i=1}^{n} (1-\frac{Q_i}{D_{i-1}}) &\text{要求：}1>\frac{Q_i}{D_{i-1}}
\end{align*}
$$

则从上述公式推导来看，只需要在全局变量中维护一个P值，该P值为一个联乘的值。即：

$$
P_n =  \prod_{i=1}^{n} (1-\frac{Q_i}{D_{i-1}})
$$

对于任意一次清算i，其Qi和Di-1均是一个确定的值，故，任意一次清算的Pi值都是一个可计算的值。

然后再考虑ETH的分发：

对于一个用户alice，其在第i次清算后，其能获得的ETH累计收益为：

$$
\begin{align*}e_1 & = \frac{d_0}{D_0} \times E_1 \\
  e_2 & = e_1 +\frac{d_1}{D_1} \times E_2 \\
  &\cdots \\ 
  e_n & = e_{n-1} + \frac{d_{n-1}}{D_{n-1}}\times E_n \\
  &=> \\ 
  e_n &= \sum_{i=1}^{n}(\frac{d_{i-1}}{D_{i-1}}\times E_i) \\
  d_{i-1} &= d_0 \times \frac{P_{i-1}}{P_0}  \\
  P_0 &= 1   \\
  &=>\\ 
  e_n &= d_0\times \sum_{i=1}^{n} (\frac{E_i}{D_{i-1}} \times P_{i-1}) \\
  \frac{e_n}{d_0} &=  \sum_{i=1}^{n} (\frac{E_i}{D_{i-1}} \times P_{i-1}) \\ 
\end{align*}
$$

故记录一个全局变量S，用于记录从最初一次清算前，单位储蓄所能获得的累计ETH收益之和，记为：

$$
S_n=  \sum_{i=1}^{n} (\frac{E_i}{D_{i-1}} \times P_{i-1})
$$

则某个用户在第t次清算前存钱，第n次清算前取钱，则该用户应得的ETH奖励为：

$$
e_{t}^{n}=\frac{d_t}{P_t}\times (S_n-S_t) 
$$

需要解决的两个问题：

1. P值是一个联乘的值，每一次相乘都是乘上一个小于1的数，会导致P值越来越小。而solidity中，无法精确表达一个无限小的数。
2. P值在计算时做了一个假设：Di-1 > Qi, 即每次清算的时候，稳定池里都有足够的钱用于清算。没有考虑到，如果稳定池中的钱不够的情况，即一次就把稳定池里的所有LUSD全部用完，这时 D = Q，P = 0. 如果P = 0，则后续所有的联乘的值都为0.

问题1的解决方案：

如何表示一个无限小的小数？可以让P值在小于某个值的时候，将其放大一定的倍数，然后在系统里记录下放大的倍数就行。

在liquity中，如果P值小于1e-9, 则会首先给P值乘上1e9,然后记录一个scale factor即可。

为什么选取1e9作为放大倍数，而不是1e18作为放大倍数呢？原因在于1e9保证了可忽略的精度损失接近于放大倍数边界。即P值的最小值是1e9，而P值的相对精度损失则是1e-9

问题2的解决方案：

如果清算时，稳定池的LUSD全部用完，此时D=Q，这属于一个特殊情况。需要设置P值为1，而不是0. liquity中采取记录一个epoch的方式，即每次稳定池的LUSD全部用完时，其记录一个epoch，并将P值重置，S值也重置。将epoch之前的值通过snapshot的方式记录下来。

$$
P_n = \begin{cases} \prod_{i=1}^{n} (1-\frac{Q_i}{D_{i-1}}) & \text{ if } D_{i-1} < Q_i \\ 
  1 & \text{ if } D_{i-1} = Q_i 
\end{cases}
$$

针对问题2，采取Epoch的方式，存在如下几种情况：

针对deposit，其LUSD剩余值dn应该为：

当每次deposit时，都会给一个snapshot：P值，S值，currentEpoch，currentScale等

$$
d_n = \begin{cases} 0 & Epoch_{current} > Epoch_{snapshot} \\
  d_t \times \frac{P}{P_t} & Epoch_{current} = Epoch_{snapshot},Scale_{current}=Scale_{snampshot} \\
  d_t \times \frac{P}{P_t} / 1e^9 & Epoch_{current} = Epoch_{snapshot},Scale_{current}=Scale_{snampshot}+1 \\
  0 & Epoch_{current} = Epoch_{snapshot},Scale_{current}>Scale_{snampshot}+1 \\
\end{cases}
$$

针对withdraw，其ETH获得值 e_{t}^{n} 应该为：

$$
e_{t}^{n}=
\begin{cases}
\frac{d_t}{P_t}\times (S_n-S_t)   & Epoch_{n}=Epoch_{t},Scale_n=Scale_t \\
\frac{d_t}{P_t}\times (S_{scale=t}-S_t) + \frac{d_t}{P_t \times 1e9}\times (S_{scale=n}-0) & Epoch_{n}=Epoch_{t},Scale_n=Scale_t+1 \\
\frac{d_t}{P_t}\times (S_{epoch}-S_t) & Epoch_{n}=Epoch_{t}+1,Scale_n=Scale_t \\
\end{cases}
$$

针对liquidity清算操作，其数据更新为：

$$
P_n =  
\begin{cases}
\prod_{i=1}^{n} (1-\frac{Q_i}{D_{i-1}}) & & \text{ if } D_{i-1}<Q_i,P_i > 1e9 \\
\prod_{i=1}^{n} (1-\frac{Q_i}{D_{i-1}})*1e9,& Scale_{i}=Scale_{i-1}+1  & \text{ if } D_{i-1} < Q_i,P_i < 1e9 \\
 1,&Epoch_{i} = Epoch_{i-1}+1 & \text{ if } D_{i-1} = Q_i
\end{cases}
$$

$$
S_n = \begin{cases}\sum_{i=1}^{n} (\frac{E_i}{D_{i-1}} \times P_{i-1})  &  ,Epoch_{i} = Epoch_{i-1} \\
0  &  ,Epoch_i = Epoch_{i-1}+1 \\
\end{cases}
$$

### 代码实现部分

首先是全局变量的设计：
针对每一个用户，其设计了两个结构体，分别是：

```jsx
struct Deposit {
	uint initialValue;
	address frontEndTag;
}
struct Snapshots {
	uint S;
	uint P;
	uint G; //用于分发LQTY代币
	uint128 scale;
	uint128 epoch;
}
mapping (address => Deposit) public deposits;  // depositor address -> Deposit struct
mapping (address => Snapshots) public depositSnapshots;  // depositor address -> snapshots struct
```

针对S，由于S跟epoch相关，也跟Scale相关，故其设计了一个netsted map，

```jsx
mapping(uint128=>mapping(uint128=>uint)) public epochToScaleToSum;
内部map用于存放：scale=>s
外部map用于存放：epoch=>(scale=>s)
```

定义了与P相关的全局变量：

```jsx
uint public P = DECIMAL_PRECISION;

uint public constant SCALE_FACTOR = 1e9;

    // Each time the scale of P shifts by SCALE_FACTOR, the scale is incremented by 1
    uint128 public currentScale;

    // With each offset that fully empties the Pool, the epoch is incremented by 1
    uint128 public currentEpoch;
```

操作1: 给stable Pool存钱

这里为了简化起见，忽略LQTY的分发和计算。忽略前端和用户的kickback。

[https://versatile.blocksecteam.com/tx/eth/0x8a04c8e765aa0ff9012ecf0fbf0f2a24b05523d2c8cc5350f5dbad4e9eb7f91b](https://versatile.blocksecteam.com/tx/eth/0x8a04c8e765aa0ff9012ecf0fbf0f2a24b05523d2c8cc5350f5dbad4e9eb7f91b)

```jsx
Function: provideToSP(uint256 _amount, address _frontEndTag)

MethodID: 0x5f788d65
[0]:  0000000000000000000000000000000000000000000000171e6366514aefacbf
[1]:  00000000000000000000000030e5d10dc30a0ce2545a4dbe8de4fcba590062c5
```

![](2023-03-16-10-05-39.png)

这里的关键是：provideToSp中是如何计算P值，以及如何进行token transfer操作。

帮助函数: getDepositorETHGain

对应的公式为：

$$
e_{t}^{n}=
\begin{cases}
\frac{d_t}{P_t}\times (S_n-S_t+0/1e9)   & Epoch_{n}=Epoch_{t},Scale_n=Scale_t \\
\frac{d_t}{P_t}\times (S_{scale=t}-S_t+S_{scale=t+1}/1e9) & Epoch_{n}=Epoch_{t},Scale_n>=Scale_t+1 \\
\frac{d_t}{P_t}\times (S_{epoch}-S_t+0） & Epoch_{n}=Epoch_{t}+1,Scale_n=Scale_t \\
\end{cases}
$$

```jsx
getDepositorETHGain(address _depositor):
第一步：从deposits中拿到该depositor对应的initialValue，即dt
第二步：如果dt=0，则返回0
第三步：从depositSnapshots中拿到该depositor对应的snapshot，即dt对应时刻的P，S，G，Scale，Epoch值
第四步：调用_getETHGainFromSnapshots方法，拿到计算的ETH数量
_getETHGainFromSnapshots(uint initialDeposit, Snapshots memory snapshots):
第一步：从传入的snapshot中，拿到对应的epoch，scale，S_{snapshot}，P_{snapshot}等值
第二步：根据epoch,scale等查出该epoch，scale下对应的S_{scale=t}的值，并用delatS = S_{scale=t} - S_{snapshot}
第三步：从epochToScaleToSum中拿出epoch和scale+1对应的S_{scale=t+1}的值，deltaS2 = S_{scale=t+1} / 1e9
第四步：根据dt*(S_{scale=t}-S_{snapshot}+S_{scale=t+1}/1e9)/P_{snapshot}/1e18得到最终的eth数量
```

帮助函数：getCompoundedLUSDDeposit

对应的公式为：

$$
d_n=\begin{cases}0   &  Epoch_{current} > Epoch_{snapshot}   \\
d_t \times \frac{P}{P_t}  & Epoch_{current} = Epoch_{snapshot},Scale_{current}=Scale_{snampshot}\\
d_t \times \frac{P}{P_t}  / 1e^9 & Epoch_{current} = Epoch_{snapshot},Scale_{current}=Scale_{snampshot}+1\\
0 & Epoch_{current} = Epoch_{snapshot},Scale_{current}>Scale_{snampshot}+1\\
\end{cases}
$$

```jsx
getCompoundedLUSDDeposit(address _depositor) d = d0 * P/P0
第一步：从deposits中拿到该depositor对应的initialValue，即dt
第二步：如果dt=0，则返回0
第三步：从depositSnapshots中拿到该depositor对应的snapshot
第四步：调用_getCompoundedStakeFromSnapshots计算应该返回的d的值
_getCompoundedStakeFromSnapshots(uint initialStake,Snapshots memory snapshots)
第一步：从传入的snapshot中，拿到对应的P，Scale，Epoch
第二步：如果跨越了一个epoch，则剩余的LUSD数量为0，返回0
第三步：计算出当前的scal与snapshot中scale的差值
第四步：如果scalediff=0，说明在同一个scale中，则按照dt*P/Pt计算返回值
第五步：如果scaleDiff=1，则说明跨越了一个scale，则按照dt*P/Pt/1e9计算返回值
第六步：如果scaleDiff>1, 则说明跨越了多个scale，则直接返回0
第七步：如果最后计算得到的返回值小于d0/1e9,即小于了最小精度，则直接返回0
```

帮助函数：_updateDepositAndSnapshots

该函数的主要作用是在provide和withdraw的操作中，更新用户的dt和对应的snapshot状态。该函数只在provide的时候和withdraw的时候调用。

```jsx
_updateDepositAndSnapshots(address _depositor, uint _newValue)：
第一步：首先将deposits中该depositor的initialValue更新为newValue，即更新dt
第二步：如果dt=0，则删除deposits中该depositor。注意这里不能直接delete deposits[_depositor].
原因是如果直接delete，还会剩下该mapping对应的结构体信息在区块链中。
只能是delete deposits[_depositor].frontEndTag。和 delete deposits[_depositor].initalValue;
然后是删除depositSnapshots[_depositor]
第三步：拿到当前的scale，epoch, P
第四步：根据当前的scale，epoch，P值拿到对应的S，G值
第五步：更新depositSnapshots中该depositor的p,s,g,scale,epoch值
```

帮助函数：_computeRewardsPerUnitStaked

该函数的主要作用是计算每单位需要消耗的LUSD和每单位预期获得的ETH奖励，函数里面有先➗后✖️

$$
LUSD_{loss}=\frac{Q_i}{D_{i-1}} \\
ETH_{gain}=\frac{E_i}{D_{i-1}}
$$

```jsx
function _computeRewardsPerUnitStaked(
        uint _collToAdd, //预期获得的ETH数量
        uint _debtToOffset, //预期消耗的LUSD数量
        uint _totalLUSDDeposits //池子里总共的LUSD数量
    )
第一步：考虑精度的情况下计算分子ETH：ethNumerator=coll*1e18+errorColl
第二步：要求预期消耗的LUSD数量不能超过池子里总共的LUSD数量
第三步：如果预期消耗的LUSD数量等于池子里总共的LUSD数量，即稳定池被榨干，则设定每一个depositor的LUSD loss=100%
第四步：如果没有被榨干，则LUSDlossNumerator=debt*1e18-errorDebt,则LUSDLossPerStake=

```

帮助函数：_updateRewardSumAndProduct

主要作用是更新P值和S值

$$
P_n = \begin{cases}
\prod_{i=1}^{n} (1-\frac{Q_i}{D_{i-1}}) & & \text{ if } D_{i-1} < Q_i , P_i > 1e9 \\
\prod_{i=1}^{n} (1-\frac{Q_i}{D_{i-1}})*1e9, & Scale_{i} = Scale_{i-1}+1  & \text{ if } D_{i-1} < Q_i, P_i < 1e9 \\
 1,& Epoch_{i} = Epoch_{i-1}+1 & \text{ if } D_{i-1} = Q_i
\end{cases}
$$

$$
S_n = \begin{cases} \sum_{i=1}^{n} (\frac{E_i}{D_{i-1}} \times P_{i-1})  & , Epoch_{i}=Epoch_{i-1} \\
0  & , Epoch_i=Epoch_{i-1}+1 \\
\end{cases}
$$

Calculate the new S first, before we update P.
* The ETH gain for any given depositor from a liquidation depends on the value of their deposit
* (and the value of totalDeposits) prior to the Stability being depleted by the debt in the liquidation.
* Since S corresponds to ETH gain, and P to deposit loss, we update S first.
```js
_updateRewardSumAndProduct(uint _ETHGainPerUnitStaked, uint _LUSDLossPerUnitStaked)：
第一步：要求LUSD_loss <= 1
第二步：deltaP = 1 - LUSD_loss
第三步：记录下当前的scale，epoch，以及当前epoch，scale对应的S
第四步：先计算S，然后在计算P. 因为S的计算公式里，需要P_{i-1}
第四步：S = S + ETH_gain * P
第五步：把S按照当前的epoch，scale写入mapping中
第六步：判断deltaP,如果deltaP=0，说明全部稳定池被抽干，则epoch++，重置P=1，scale=0
第七步：如果deltaP > 0, 说明需要继续联乘， P = P * deltaP。
第八步：若联乘后的结果，即新P小于1e9，则 scale++， 并且 P = P * deltaP * 1e9
第九步：如联乘后的记过，即新P大于1e9，则 P = P * deltaP
```
