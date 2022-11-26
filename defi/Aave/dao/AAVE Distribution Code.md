# HOW AAVE DISTRIBUTION CODE ANALYSIS

Aave的平台币AAVE的分发机制已经在之前的[文章](https://github.com/Dapp-Learning-DAO/Dapp-Learning/blob/main/defi/Aave/dao/AAVE%20Distribute%20Mechanism.md)讲述过，因此本文章主要讲解一下Aave是如何实现这一分发机制的。

在[官方文档](https://github.com/aave/incentives-controller)描写中
>  On `handleAction()`, that is triggered whenever an aToken/debt Token is minted/burned by a user, the `userIndex` and the `assetIndex` are accumulated depending on the time passed since the last action

指明每当aToken或者debt Token的mint/burn操作是，触发一次IncentiveController的`handleAction()`，来进行更新用户的index和assetIndex。因此在这篇文章中，就在代码的层面，分析一下Aave如何计算每个asset的分发量和更新用户的应得利益。方便以后更多人在分发平台币，分发奖励时可以更好参考Aave的设计，计算用户的收益。

在了解具体的代码前，需要明确该合约中的几个变量的定义
- asset指的是在Aave中aToken，而非的underlying。
- totalSupply/totalStaked是atoken/debt token的totalSupply,而非Aave的totalSupply
- stakedByUser指的是用户的atoken/debt token的持有量，而非质押资产的持有量。

在IncentiveController的代码中，StakedTokenIncentivesController是继承自BaseIncentivesController，BaseIncentivesController则是主要继承DistributionManager以及使用IAaveIncentivesController来定义接口。因此本文将从DistributionManager开始了解，从上到下的了解如何实现AAVE分发。

## DistributionManager

DistributionManager合约主要的作用是记录各个lending pool中对应的分发参数，以及对应lending pool中用户的应发奖励。因此在[DistributionManager](https://github.com/aave/incentives-controller/blob/master/contracts/incentives/base/DistributionManager.sol)的代码中，AssetData就是最主要的数据结构。

```
struct AssetData {
    uint104 emissionPerSecond;
    uint104 index;
    uint40 lastUpdateTimestamp;
    mapping(address => uint256) users;
}
```

其中包括每秒应该分发的AAVE奖励，指数，上次更新的时间，以及记录每个用户的未提取收益。在DistributionManager中最重要的功能就是如何更新各类asse的分发情况，也就是_updateAssetStateInternal函数，以及各个用户的收益情况，即_updateUserAssetInternal函数。

### _updateAssetStateInternal

_updateAssetStateInternal负责更新一个asset在当前时间点累计的供应量单位收益。

```
function _updateAssetStateInternal(
    address asset,
    AssetData storage assetConfig,
    uint256 totalStaked
  )
```

在这个函数中，主要的处理逻辑是
1. 首先将asset对应的AssetData中的变量从stroage中提出来，赋值给在memory中的变量，避免后续需要多次读取stroage变量导致的gas费提高。
2. 检查当前的时间节点是否需要更新
3. 根据当前的指数，每秒分发量，时间累计以及asset中总的aToken供应量计算新的index
4. 确保计算出的index不会存在overflow或者没有更新的情况，并将更新值重新存储会存在与storage的AssetData

> 在函数中，使用storage而非memory传递参数是因为需要将更新后的变量存储回处于stroage层的合约的状态变量中。

### _getAssetIndex

在_updateAssetStateInternal中使用_getAssetIndex函数来负责计算lending pool的index。

```
function _getAssetIndex(
    uint256 currentIndex,
    uint256 emissionPerSecond,
    uint128 lastUpdateTimestamp,
    uint256 totalBalance
  )
```

主要的逻辑顺序是
1. 检查各类参数是否有设置，设置是否正确。
2. 当前是否处于分发的期限。
3. 计算当前时间离上次更新的时间间隔timeDelat(以秒做单位)
4. index的计算公式为`currentIndex + ((emissionPerSecond * timeDelta * 1e18) / totalSupply)`。该公式是累计的。从公式可见，index是计算在一段时间内，asset的总的供应量每单位可以分得多少的AAVE。

### _updateUserAssetInternal

_updateUserAssetInternal负责记录一个用户应该得到的收益。

```
function _updateUserAssetInternal(
    address user,
    address asset,
    uint256 stakedByUser,
    uint256 totalStaked
)
```

主要的执行逻辑是
1. 将asset的assetData以及用户的userindex从storage中读取出来
2. 更新当前asset的index
3. _getRewards计算用户从上一次更新后应得的收益
4. 更新用户的userindex

### _getRewards

当计算出asset分发的index之后，就需要函数统计如何计算一个user应该分的AAVE。从asset index的更新我们可以看到他是以每单位的供应量来计算的，因此在计算用户可得的奖励时，公式为`stakeByUser * (asset index - userIndex) / 1e18`,即使用用户当前拥有的token量乘以在一段时间内积累的index值。因为asset index是累计的，因此在公式中的asset index - userIndex即自从上次更新后，用户在这段时间内应得的AAVE。相比于asset index，userIndex是代表用户当前已经计算过的asset index，每次计算成功后，就会与当前得asset index同步，因此两者其实本质上一样。

```
function _getRewards(
    uint256 principalUserBalance,
    uint256 reserveIndex,
    uint256 userIndex
)
```

### 小总结

DistributionManager其余的函数其实是以上介绍的四个基本方法的组合，在了解如何更新，计算用户以及asset的index之后，剩余的就是接口函数，如计算用户的未声明收益，计算用户总的收益。

## BaseIncentivesController

在了解DistributionManager合约的计算方法后，IncentiveController的目的是利用index的计算来实现AAVE的分发逻辑。

### handleAction

在官方文档中，在每一次mint/burn的逻辑中都会调用`handleAction()`，因此我们首先介绍handleAction函数。

```
function handleAction(
    address user,
    uint256 totalSupply,
    uint256 userBalance
)
```

主要的逻辑是
1. 利用asset是具体的msg.sender，调用_updateUserAssetInternal更新用户在过去时间中应得的收益。
2. 将应得收益记录在mapping变量_usersUnclaimedRewards中

> 这种利用变量_usersUnclaimedRewards实际记录用户未收取收益的方法，解释了为什么_updateUserAssetInternal中会直接更新userindex，而不是等到用户主动主张收益时才更新。

### _claimRewards

作为参与defi的奖励，平台币往往会根据用户的参与程度，抵押资产作为依据建立分发机制，但是由于EVM的gas机制以及mapping不可以预测元素数量的原因，合约难以遍历mapping所记录的用户，从而实现点对点的分发。因此，在分发AAVE时，Aave也是选择使用让用户主动发起交易声明所有权的方式来返还stkAAVE。在EVM机制没有进一步更新的情况，平台币的发放很可能也会按照该种模式。

在Aave中，有很多的claimRewards函数的变形，但是最最核心的函数是_claimRewards。

```
function _claimRewards(
    address[] calldata assets,
    uint256 amount,
    address claimer,
    address user,
    address to
)
```

主要的执行过程是：
1. 避免amount=0，即用户声明零收益
2. 读取_usersUnclaimedRewards中记录的用户未收取收益
3. 如果用户想申明的奖励数量多于记录中未收取收益，则进行第四步，否则跳转到第7步
4. 获取在用户想要claim的assets数组中，asset的总供应量以及用户所持有的数量。
5. 利用第三步获得的数据调用`DistributionManager._claimRewards()`,遍历并更新assets数组中asset对应的asset index以及用户在对应asset的userindex，得到在用户想要claim的assets数组范围中用户累计应得的奖励
6. 如果用户确实有新的累计收益，添加到未收取收益中
7. 计算后若用户没有未声明收益则返回0
8. 若用户未声明的奖励满足函数参数amount，先更新用户的unclaimedRewards，然后转移奖励给用户

## StakedTokenIncentivesController

在了解BaseIncentivesController之后，Aave基本平台币分发代码逻辑就基本介绍完毕了。但是Aave，以平台的发展为本，不会直接将AAVE发放给用户，而是将其转移到Safe Moudle等AAVE的质押处，从而保证Aave协议。因此实际的奖励转移会调用AAVE的stake方法，因此用户得到的是stkAAVE。

在StakedTokenIncentivesController中，主要是定义_transferRewards。利用stkAAVE的stake方法，将用户得到的AAVE转化为stkAAVE。

在stkAAVE中，stake函数是mint出新的stkAAVE，然后msg.sender转账AAVE给stkAAVE的地址从而完成一次stake。在AAVE的分发中，当IncentivesController调用_transferRewards，即将自身拥有的AAVE转账给stkAAVE地址，然后发放stkAAVE给用户。

## 参考资料

[AAVE IncentiveController代码](https://github.com/aave/incentives-controller)

[AAVE IncentiveController链上合约](https://etherscan.io/address/0xd784927Ff2f95ba542BfC824c8a8a98F3495f6b5#code)

