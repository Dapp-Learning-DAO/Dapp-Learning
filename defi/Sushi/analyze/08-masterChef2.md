# MasterChef 2

masterChef的使用程度之广泛远超我的想象，之前写过一版本的分析，但是自己的认知还是不深刻。这次借用Paradigm的一篇[分析文章](https://www.paradigm.xyz/2021/05/liquidity-mining-on-uniswap-v3/)，把masterchef重新再梳理一下。

masterChef它所要解决的核心问题是：如何在区块链上对流动性提供者进行代币的线性分配。即用户alice向一个池子里提供了流动性，alice的LP数量为 $l$,此刻整个池子中的总共的流动性为： $L$，作为项目方，需要奖励类似于Alice这样的流动性提供者，奖励的标的是项目方自己发行的治理代币，比如sushi。

项目方奖励的逻辑是规定一段时间，这个池子中的所有流动性提供者会按照他们提供的流动性占比来分配一定额度的sushi代币，且该代币的分配数量应该是与提供流动性的时间呈线性相关。即：

<!--<img src="https://render.githubusercontent.com/render/math?math=Reward_{Alice}=\sum_{t=t_0}^{t_1}R\cdot\frac{l(t)}{L(t)}">-->
$$
Reward_{Alice}=\sum_{t=t_0}^{t_1}R\cdot\frac{l(t)}{L(t)}
$$

其中， $R$ 是单位时间内，项目方愿意分配给池子中的代币总额

$l(t)$为t时刻，流动性提供者Alice的流动性数量； $L(t)$ 为t时刻，池子中所有的流动性数量之和。

对上面的公式进行简化，首先是如果在一段时间内，alice的流动性数量不变，且R也不变，即公式中的R和 $l(t)$ 与时间无关，则公式可以简化为：

<!--<img src="https://render.githubusercontent.com/render/math?math=Reward_{Alice}=R\cdotl\cdot\sum_{t=t_0}^{t_1}\frac{1}{L(t)}">-->
$$
Reward_{Alice} = R \cdot l \cdot \sum_ {t=t_0}^{t_1}\frac{1}{L(t)}
$$

然后再将从t0到t1的时间段可以拆分成[0,t0],[0,t1]两个时间段之差，公式可变形为：

<!--<img src="https://render.githubusercontent.com/render/math?math=Reward_{Alice}=R\cdotl\cdot(\sum_{t=0}^{t_1}\frac{1}{L(t)}-\sum_{t=0}^{t_0}\frac{1}{L(t)})">-->
$$
Reward_{Alice} = R \cdot l \cdot (\sum_ {t=0}^{t_1}\frac{1}{L(t)} - \sum_ {t=0}^{t_0}\frac{1}{L(t)})
$$

可以看到，Alice 在一段时间内应该获得的代币数量为代币单位时间分配速率R，alice在这段时间内的流动性数量 $l$,以及总流动性倒数之和相关。

在合约的实现中，可以在全局储存一个变量，即accSushiPerShare

<!--<img src="https://render.githubusercontent.com/render/math?math=accSushiPerShare=R\cdot\sum_{t=0}^{t}\frac{1}{L(t)}">-->
$$
accSushiPerShare = R \cdot \sum_{t=0}^{t}\frac{1}{L(t)}
$$

针对每一个用户，必须在用户首次提供流动性时，就记录下用户提供流动性的那一个时刻 $t_0$ 的`accSushiPerShare`,即rewardDebt，以及用户提供的流动性数量amount

<!--<img src="https://render.githubusercontent.com/render/math?math=rewardDebt=l\cdotR\cdot\sum_{t=0}^{t_0}\frac{1}{L(t)}">-->
$$
rewardDebt = l \cdot R \cdot \sum_{t=0}^{t_0}\frac{1}{L(t)}
$$

<!--<img src="https://render.githubusercontent.com/render/math?math=amount=l">-->
$$
amount = l
$$

则在任意时刻t，用户想要去获取奖励的Sushi时,即Harvest时，其Sushi数量应该为：

<!--<img src="https://render.githubusercontent.com/render/math?math=Reward_{alice}=l\cdot(R\cdot\sum_{t=0}^{t}\frac{1}{L(t)}-R\cdot\sum_{t=0}^{t_0}\frac{1}{L(t)})">-->
$$
Reward_{alice} = l \cdot (R \cdot \sum_{t=0}^{t}\frac{1}{L(t)} - R \cdot \sum_{t=0}^{t_0}\frac{1}{L(t)})
$$

对应成代码部分，则应该为：

```js
int256 accumulatedSushi = user.amount.mul(pool.accSushiPerShare) / ACC_SUSHI_PRECISION;
uint256 _pendingSushi = accumulatedSushi.sub(user.rewardDebt).toUInt256();
```



在上面的分析中，我们可以看到要保证用户的Sushi代币的数量计算正确，需要做到如下几点：

1. 每一个用户在进入池子中首次提供流动性的时候，就需要给用户记录下rewardDebt，因为系统只记录一个累加的数值，需要用户自己记录一个某个时间点t0的数值
2. 要保证每次池子中流动性发生变化时，累加的全局变量accSushiPerShare必须相应变化，因为此时的流动性总量发生了变化L(t)
3. 尽可能保证全局变量accSushiPerShare能够及时更新，最好是每一次与合约的交互都去更新该数值。
4. 在用户更新自己的rewardDebt之前应该首先更新全局变量accSushiPerShare



## SushiSwap的MasterChefV2 - 标准实现

sushiSwap的一个特点是它同时存在大量的池子需要来瓜分sushi代币奖励。所以设计时，需要把池子的编号也考虑进去。

首先是全局变量设计：

```js
struct UserInfo {
	uint256 amount; //用来储存用户的流动性l(t)
	int256 rewardDebt; 
}
mapping(uint256=>mapping(address=>UserInfo)) public userInfo; //userInfo[pid][userAddr]
        
struct PoolInfo {
	uint128 accSushiPerShare; 
	uint64 lastRewardBlock; 
	uint64 allocPoint; //用来计算分配速率R
}
PoolInfo[] public poolInfo;
```

方法设计：

1. updatePool

   作用是作为在用户与协议进行交互的第一步，更新系统的accSushiPerShare全局变量。在更新该变量时，类似于compound，同一个块里面不需要再次更新，即一个块只更新一次，不能更新多次。

   为什么一个块里只能更新一次，不允许更新多次呢？首先从定义上讲，是随着时间线型增发。如果在同一个块里，说明时间没有增加，自然就不应该去更新这个值。其次如果一个块里多次更新，后续的更新也不会产生效果，因为deltaT=0

   ```js
   function updatePool(uint256 pid) public returns (PoolInfo memory pool) {
     第一步：根据pid拿到对应的poolInfo
     第二步：判断当前blockNumber和上次更新的blockNumber，如果相同，说明在同一个块里，应直接跳过
     第三步：获取当前pool的lpSupply,即L(t)
     第四步：如果L(t)>0,则首先计算deltaT,计算R=poolInfo.allocPoint/totalPoint,计算deltaT*R/L(t),计算accSushiPerShare
     第五步：更新pool.blockNumber
   }
   ```

2. deposit

   作用是用户存入流动性，并开始给用户记账.注意这里有msg.sender和to地址，这里记账只记to地址的

   ```js
   function deposit(uint256 pid, uint256 amount, address to) public {
   	第一步：首先更新updatePool，更新全局变量accSushiPerShare
   	第二步：拿到Userinfo，根据to地址
   	第三步：更新userinfo的āmount和rewardDebt，即给user记账。
   					user.rewardDebt += l*accSushiPerShare
   					user.amount += amount
   	第四步：把LPtoken从msg.sender地址转账到address(this)
   }
   ```

3. withdraw

   作用是取出流动性，并更新账本

   ```js
   function withdraw(uint256 pid, uint256 amount, address to) public {
   	第一步：首先更新updatePool，更新全局变量accSushiPerShare
   	第二步：拿到userInfo，根据msg.sender
   	第三步：计算amount和rewardDebt: 
   					user.rewardDebt -= l*accSushiPerShare
   					user.amount -= amount;
   	第四步：把LPtoken从address(this)转账到to地址
   }
   ```

4. harvest

   作用是收割奖励的token，并且更新user.rewardDebt

   ```js
   function harvest(uint256 pid, address to) public {
   	第一步：首先更新updatePool，更新全局变量accSushiPerShare
   	第二步：拿到userInfo,根据msg.sender
   	第三步：计算用户累积的sushi： Reward_alice = l * accSushiPerShare - rewardDebt
   				_pendingSushi = user.amount * accSushiPerShare - user.rewardDebt
    	第四步：更新用户的user.rewardDebt
     第五步：把sushi转账到to地址
   }
   ```

   

## 常见的错误

在上面sushi的标准实现中，存在msg.sender和地址to，最常见的错误是updatePool后，应该更新user状态是msg.sender还是to？

即因为一个用户的奖励sushi的数量是全局变量与用户自己记录的一个快照之间的差值，所以如果更新用户状态时，忘记更新用户的rewardDebt就会导致奖励的sushi数量非常大，远大于用户实际应该得到的数量。

<!--<img src="https://render.githubusercontent.com/render/math?math=Reward_{alice}=l\cdot(R\cdot\sum_{t=0}^{t}\frac{1}{L(t)}-R\cdot\sum_{t=0}^{t_0}\frac{1}{L(t)})">-->
$$
Reward_{alice} = l \cdot (R \cdot \sum_{t=0}^{t}\frac{1}{L(t)} - R \cdot \sum_{t=0}^{t_0}\frac{1}{L(t)})
$$

一个简单的例子是Andrecronje的[代码片段](https://gist.github.com/andrecronje/6c3da8b294488001adeda528f70bc301)

```js
function deposit(uint amount, address recipient) external {
        _deposit(amount, recipient);
    }

function _deposit(uint amount, address to) internal update(msg.sender) {
    _totalSupply += amount;
    _balanceOf[to] += amount;
    _safeTransferFrom(stake, msg.sender, address(this), amount);
    emit Deposit(msg.sender, amount);
}

```

在上面的例子中，update始终更新的是msg.sender这个用户的状态，并没有更新address To的状态。这会导致如下的一种攻击模式：

1. alice调用deposit方法，传入的地址recipient是bob
2. bob调用withdraw方法，此时bob得到的sushi数量为：

<!--<img src="https://render.githubusercontent.com/render/math?math=$Reward_{bob}=l\cdotR\cdot\sum_{t=0}^{t}\frac{1}{L(t)}">-->
$$
$Reward_{bob} = l \cdot R \cdot \sum_{t=0}^{t}\frac{1}{L(t)}
$$

而不是应该得到的：

<!--<img src="https://render.githubusercontent.com/render/math?math=$Reward_{bob}=l\cdot(R\sum_{t=0}^{t}\frac{1}{L(t)}-R\cdot\sum_{t=0}^{t_0}\frac{1}{L(t)})">-->
$$
$Reward_{bob} = l \cdot (R \sum_{t=0}^{t}\frac{1}{L(t)} - R \cdot \sum_{t=0}^{t_0}\frac{1}{L(t)})
$$
