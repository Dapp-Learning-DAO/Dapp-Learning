# masterChef learning

根据cmichel的[文章](https://cmichel.io/how-to-become-a-smart-contract-auditor/)，[masterChef](https://github.dev/sushiswap/sushiswap/blob/271458b558afa6fdfd3e46b8eef5ee6618b60f9d/contracts/MasterChef.sol)是后面所有的DEFI项目都必须掌握的基础

它涉及到了质押，分发代币的功能。

主要是根据用户质押的时间和数量来线性的分发代币。即质押挖矿的模式。具体的分发逻辑是每一个区块固定分的一定量的sushi代币，考虑到同时存在不同的LP资金池都需要奖励sushi，这几个池子会按照预先设计好的allocPoint来按照权重分配sushi代币。对于一个池子中，会按照LPtoken的比例给用户分发该池子中分配得到的sushi代币。每一个区块都会累积，这里应该是累加，而不是累乘。

它应该涉及到一个LP流动性池，一个待分发的代币Token。一条类似于borrowIndex的曲线。

这条曲线应该怎样来设计？即如何抽象？

首先是一个用户质押了amount数量的LPtoken，在时间段Delta Blocks，以及这段时间内的分发速率f。

借鉴compound中的抽象思路，肯定是在池子中维护一个全局变量index，这个index应该对池子的deltaBlocks和这段时间的分发速率进行抽象，一个用户具体应该分发得到的token数量应该是用户的LP amount与这个index的一个函数。

即：N=f(index, n)

分发速率F应该如何定义？即token对于单位LP数量，单位时间的分发速率应该是一个常数，

即分发速率F应该等于单位区块总共分发出的sushiPerBlock数量乘以这个LP资金池的sushi分配额度占据所有池子的分配额度总和的百分比，得到这个池子在这个块应该能分到的sushi总数。然后再除以这个池子中此时的LP总的流动性，得到每一份流动性LPtoken提供者应该在一个区块中分配到sushi数量, 即：

<!--<img src="https://render.githubusercontent.com/render/math?math=f=\frac{sushiPerBlock\times\frac{pool.allocPoint}{totalAllocPoint}}{lpSupply}">-->
$$
f=\frac{sushiPerBlock\times\frac{pool.allocPoint}{totalAllocPoint}}{lpSupply}
$$

即：rewardIndex_b = rewardIndex_a + (deltaBlocks * F )

<!--<img src="https://render.githubusercontent.com/render/math?math=Index(N)=Index(N-1)%2B\deltaN\times\frac{sushiPerBlock}{lpSupply(N-1)}\times\frac{pool.allocPoint}{totalAllocPoint}">-->
$$
Index(N)=Index(N-1)%2B\deltaN\times\frac{sushiPerBlock}{lpSupply(N-1)}\times\frac{pool.allocPoint}{totalAllocPoint}
$$

> 与compound中的borrowIndex不同的是: 
> borrowIndex中，借贷利率不是一个常数，而是一个随着资金利用率变化的一个值。而这里的分发速率是一个定值；
> 不同点之二在于：borrowindex事实上是复利的一个实现，即FV=PV*(1 + borrowRate)^t, 而masterchef中，应该采用累加，而不是borrowIndex中的累乘。因为它只是奖励sushi，把每一个区块的奖励都累加到用户上即可，不需要累乘的逻辑

在sushi中，定义了一个accSushiPerShare的概念，类似于这里的index。

<!--<img src="https://render.githubusercontent.com/render/math?math=deltaBlocks=block.number-pool.lastRewardBlock">-->
$$
deltaBlocks = block.number - pool.lastRewardBlock
$$

<!--<img src="https://render.githubusercontent.com/render/math?math=sushiReward=deltaBlocks*sushiPerBlock*pool.allocPoint/totalAllocPoint">-->
$$
sushiReward = deltaBlocks * sushiPerBlock * pool.allocPoint / totalAllocPoint
$$
  
<!--<img src="https://render.githubusercontent.com/render/math?math=pool.accSushiPerShare_b=pool.accSushiPerShare_a%2BsushiRewardlpSupply">-->
$$
pool.accSushiPerShare_b = pool.accSushiPerShare_a + sushiRewardlpSupply
$$

比较trick的一点是，sushi在计算deltaBlocks中，其设计了一个bonus时间，在bonus时间内的LP提供者，其奖励会乘以10倍。

## 合约实现

上面简单分析了下masterchef应该如何去公平的分发代币，然后这里我们需要落实到代码实现层面。如何去设计数据结构等.

针对用户，masterchef中定义了一个结构体：UserInfo，对比compound中的borrowSnapshot，可以发现有类似之处，首先UserInfo中的amount即该用户在最新时刻的LP token的数量。rewardDebt应该是用户截至最新时刻已经claimed的sushi代币数量。对比compound中，compound给用户设计了一个borrowSnapshot，即一个借款金额快照，principal是用户截止最新时刻的含息贷款数额，interestIndex是最新时刻的借贷指数。因为masterchef是一个累加的逻辑，所以在用户里保存上一次claim的sushi数量；而compound是一个累乘的逻辑，所以在用户里保存上一次的borrowIndex。

针对masterchef，当需要计算新增的分配用户的sushi Token时，只需要：

pending reward = user.amount * pool.accSushiPerShare - user.rewardDebt

针对compound，当需要计算用户新的含息借款数量时，只需要：

principalNew =  principal * borrowIndexNew / interestIndex;

```js
//masterchef
struct UserInfo {
  uint256 amount;
  uint256 rewardDebt;
}
//compound
struct BorrowSnapshot {
  uint256 principal;
  uint256 interestIndex;
}
```

针对pool，masterchef设计了如下的数据结构：

```js
struct PoolInfo {
	IERC20 lpToken; //LP token address
	uint256 allocPoint; // allocation points assinged to this pool
	uint256 lastRewardBlock; //last block number that sushi distributed
	uint256 accSushiPerShare; //accumulated sushi per share, mantissa=12
}
```

全局变量的设计：

```js
SushiToken public sushi;
address public devAddr;
uint256 public bonusEndBlock;
uint256 public sushiPerBlock;
uint256 public constant BONUS_MULTIPLIER = 10;
IMigratorChef public migrator;
PoolInfo[] public poolInfo;
mapping(uint256 => mapping(address => UserInfo)) public userInfo;
uint256 public totalAllocPoint = 0;
uint256 public startBlock;
```

方法设计：

疑问：用户相关的方法中，为什么没有一个类似于harvest的方法，用于收割sushi？



1. user related

   1. Deposit => deposit LP to get sushi

      ```js
      //用户存款的核心方法,用户存LP，获取sushi收益
      
      function deposit(uint256 _pid, uint256 _amount) public {}
      //第一步：根据pid在list中找到对应的pool，保存在storage中
      //第二步：根据pid和msg.sender,在userInfo的map中找到用户的在该pid对应的userInfo结构体,保存到storage中
      //第三步：最重要的一步：调用updatePool方法，更新池子
      //第四步：如果userInfo中的amount>0,它代表的是用户之前在池子中的lp存款数量，根据公式：userinfo.amount * pool.accSushiPerShare - userinfo.rewardDebt计算出应该给用户转账的sushi数量，然后执行sushi的转账
      //第五步：把用户的LPtoken转账到该资金池中
      //第六步：更新用户的存款：userinfo.amount += amount
      //第七步：更新用户的已cliamedSushi： 
      //userInfo.rewardDebt += userinfo.amount * pool.accSushiPerShare -userinfo.rewardDebt 
      //= userinfo.amount * pool.accSushiPerShare

   2. Withdraw => withdraw LP from Masterchef

      ```js
      //用户提款的核心方法：用户提走LPtoken，同时应该将此时的sushi收益分给用户
      function withdraw(uint _pid, uint256 _amount) public {}
      
      //第一步：根据pid在list中找到对应的pool，保存在storage中
      //第二步：根据pid和msg.sender地址在map userInfo中找到对应的userinfo，保存在storage中
      //第三步：进行判断，用户在池子中存入的amount >= 此次要提出的amount
      //第四步：最重要的一步：更新池子状态
      //第五步：计算出用户的pendingSushi，根据公式：userinfo.amount * pool.accSushiPerShare - userinfo.rewardDebt
      //第六步：把sushi转账给用户
      //第七步：更新userinfo.amount数量
      //第八步：更新userinfo.rewardDebt数量
      //第九步：把lPtoken转账回用户。
      ```

      

   3. emergencyWithdraw => withdraw LP from masterchef regradless the rewards

      ```js
      //紧急撤离，看来大多数的protocol里面都涉及到这部分功能，即我不要你的奖励，我只要我的本金安全。
      
      function emergencyWithdraw(uint256 _pid) public {}
      //第一步：根据pid在list中找到对应的pool，保存在storage中
      //第二步：根据pid和msg.sender地址在map userInfo中找到对应的userinfo，保存在storage中
      //第三步：更新userinfo.amount = 0
      //第四步：更新userinfo.rewardDebt = 0
      //第五步：把lptoken转账给用户，用户的全部
      ```

      

2. pool related

   1. massUpdatePools => update all pools

      ```js
      //批量更新所有的池子，简单就是利用一个循环来调用updatePool方法即可
      function massUpdatePools() public{}
      
      ```

   2. updatePool => update the rewardIndex

      ```js
      //应该是masterchef中最核心的方法，用于更新rewardIndex指数，并且直接把sushi给mint到该池子中，也会mint一部分到dev中
      //rewardIndex_b = rewardIndex_a + deltaBlocks * sushiPerBlock * pool.allocPoint / totalAllcoPoint / lpSupply 
      
      function updatePool(uint256 _pid) public {}
      
      //第一步：根据pid在list中找到对应的pool，保存成memory
      //第二步：判断是否在同一个块中，因为一个块只更新一次。如果在同一个块，则直接返回
      //第三步：利用pool.lpToken.balanceOf方法，获取目前lpToken的总数lpSupply
      //第四步：如果lpSupply==0，即分母为0，需要特殊考虑，这里更新完blocknumber后直接返回
      //第五步：利用getMultiplier方法，根据当前的block.number和pool中记录的lastRewardBlock计算deltaBlocks
      //第六步：计算sushiReward，即deltaBlocks * sushiPerBlock * pool.allocPoint / totalAllcoPoint，这里是整个池子在这段区块中的总的reward
      //第七步：给DEV地址，mint 10%的sushiReward的sushi
      //第八步：给pool地址，mint 这个池子应该得到的sushi
      //第九步：计算池子的rewardIndex：rewardIndex_b = rewardIndex_a + sushiReward/ lpSupply
      //第十步：更新池子的lastRewardBlock=block.number
      ```

      

3. helper

   1. poolLength => return poolInfo.length;
   2. getMultiplier => return deltaBlocks
   3. pendingSushi => pending sushi for user for pid pools
   4. safeSushiTransfer => transfer sushi token
   5. Dev => update dev address 

4. onlyOwner

   1. add => add a lp to the pool
   2. Set => set allowcation point
   3. setMigrator => set migrator

5. Migrate:

   1. Migrate

      ```js
      //作用是把一个池子中的LP token转移到另一个池子里，这里的思路是先由合约的owner设定一个migrate合约地址，然后由任何人来调用其migrate方法
      function migrate(uint256 _pid) public {}
      //第一步：检查migrate合约地址不能为空
      //第二步：把对应pid的pool找到，放在storage中
      //第三步：拿到对应的pool的lptoken地址
      //第四步：获取该lptoken的总余额
      //第五步：approve migrate合约
      //第六步：调用migrate合约的migrate方法，返回一个新的LP合约地址
      //第七步：migrate后的数量与之前一致
      //第八步：更新pool的lptoken地址
      ```

      




