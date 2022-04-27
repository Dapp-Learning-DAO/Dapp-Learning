# 介绍  
MiniChefV2 是一个简化版的 MasterChef 合约，用于发放 Sushi token。 用户质押指定的 LP token 到 MiniChef 中，可以享受 Sushi token 线性释放的分成奖励。
具体的分成规则如下： 
- MiniChef 设置 sushi 奖励的发放速率 sushiPerSecond ，以秒计算，比如 10 ，那么意味着每秒发放 10 sushi 奖励给所有人   
- MiniChef 设置能享受 Sushi token 奖励的 LP 池，同时设置此 LP 占 Sushi 奖励分成的比重。  
比如 MiniChef 设置了 WETH/DAI 和 WBTC/USDT 这两个交易对能享受分成，同时设置  WETH/DAI 交易对的分成币种为 10， WBTC/USDT 交易对的分成比重为 40，那么 sushi 的奖励总量为 100 时，WETH/DAI 交易对的 LP 用户能分到 100 * ( 10 / (10 + 40)) = 20 个 sushi，具体计算公式如下：  
sushiReward = $\frac{ poolWeight }{ totalWeight} \times (sushiPerSecond \times timePassed) $   
poolWeight = LP 奖励分配比重  
totalWeight = 所有 LP 分配比重之和  
sushiPerSecond = sushi 奖励每秒发放速率  
timePassed = 上一次奖励结算到现在为止经过的秒数  

- 计算 LP 池中每份 LP 获得的奖励 accSushiPerShare。 这个数值在用户 deposite 和 withdraw LP 的时候就算自动计算      
比如 WBTC/WETH 池当前分到了 100 sushi，在这个池子中总共质押了 20 LP token ， 那么每份 LP 能分到 100 / 20 => 5 个 sushi。具体计算公式如下：  
accSushiPerShare = $\frac{ poolReward }{ totalLpStaked }$   
poolReward = 当前池子分到的 sushi 奖励   
totalLpStaked = 质押的 LP 总量   

- 用户调用 harvest 接口提取当前的 sushi 奖励   


## 合约分析  
MiniChef 里面有很多接口，下面将逐个进行讲解。

- constructor  
合约部署时需要传入 sushi token 地址，以便后续发放 sushi 奖励。
```solidity
constructor(IERC20 _sushi) public {
        SUSHI = _sushi;
    }
```

- add  
添加奖励池列表，用户只有质押列表中的 LP token 才能获取 sushi token 奖励 。 
这里设置能享受 sushi token 奖励的 LP 列表，之后用户存入对应的 LP token 就能获取 sushi 奖励。  
```solidity
function add(uint256 allocPoint, IERC20 _lpToken, IRewarder _rewarder) public onlyOwner {
        require(addedTokens[address(_lpToken)] == false, "Token already added");
        totalAllocPoint = totalAllocPoint.add(allocPoint);
        lpToken.push(_lpToken);
        rewarder.push(_rewarder);

        poolInfo.push(PoolInfo({
            allocPoint: allocPoint.to64(),
            lastRewardTime: block.timestamp.to64(),
            accSushiPerShare: 0
        }));
        addedTokens[address(_lpToken)] = true;
        emit LogPoolAddition(lpToken.length.sub(1), allocPoint, _lpToken, _rewarder);
    }
```

- set  
每个 LP token 池有一个配额比例，比如 sushi/weth LP 池的占比 10%，那么如果 sushi token 总产出为 100，那么 sushi/weth LP 池的用户能得到 10 sushi 。
这个接口用于改 LP token 在 sushi token 分配中的占比。 
需要注意的是，如果直接调用这个 set 接口改变 pool 的分配比例，会出现 sushi token 分配不一致的情况。比如 pool1 的 allocPoint 为 20， pool2 的 allocPoint 为 80，那么如果当前时刻 sushi token 的总产量为 100 ，pool1 可以分到 20 个 sushi token，pool2 可以分到 80 个 sushi token。 但如果在进行 sushi token 分配钱直接调用 set 接口，修改 pool2 的 allocPoint 为 180，那么分配时 pool1 只能分配到 10 个 sushi token， pool2 能分配到 90 个 sushi token。 所以正确的做法是，在调用 set 接口前，首先调用 massUpdatePools 更新每个 pool 的收益，然后之后的周期开始，按照新的分配比例进行分配。
```solidity
/// @notice Update the given pool's SUSHI allocation point and `IRewarder` contract. Can only be called by the owner.
    /// @param _pid The index of the pool. See `poolInfo`.
    /// @param _allocPoint New AP of the pool.
    /// @param _rewarder Address of the rewarder delegate.
    /// @param overwrite True if _rewarder should be `set`. Otherwise `_rewarder` is ignored.
    function set(uint256 _pid, uint256 _allocPoint, IRewarder _rewarder, bool overwrite) public onlyOwner {
        totalAllocPoint = totalAllocPoint.sub(poolInfo[_pid].allocPoint).add(_allocPoint);
        poolInfo[_pid].allocPoint = _allocPoint.to64();
        if (overwrite) { rewarder[_pid] = _rewarder; }
        emit LogSetPool(_pid, _allocPoint, overwrite ? _rewarder : rewarder[_pid], overwrite);
    }
```

- setSushiPerSecond  
sushi token 的总释放量是根据每秒中 sushi token 的释放速度进行计算的。通过这个接口，可以改变每秒 sushi token 的释放速度，从而改变 sushi token 的总释放量。  

```solidity
/// @notice Sets the sushi per second to be distributed. Can only be called by the owner.
    /// @param _sushiPerSecond The amount of Sushi to be distributed per second.
    function setSushiPerSecond(uint256 _sushiPerSecond) public onlyOwner {
        sushiPerSecond = _sushiPerSecond;
        emit LogSushiPerSecond(_sushiPerSecond);
    }
```

- pendingSushi   
此接口用于计算特定用户可以收获的 sushi token 数量。 
1) accSushiPerShare：表示每分 LP token 可以分得的 sushi token 数量  
2) user.rewardDebt： 用户已经分配的 sushi token 数量  
3) pool.allocPoint： 当前 pool 池可以分得的 sushi token 的占比比重  
4） totalAllocPoint： 所有分配 sushi token 的 pool 相加获得的总的比重  
5) block.timestamp.sub(pool.lastRewardTime) 用于计算上次分配 sushi token 后经过的 秒数 
```solidity
function pendingSushi(uint256 _pid, address _user) external view returns (uint256 pending) {
        PoolInfo memory pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accSushiPerShare = pool.accSushiPerShare;
        uint256 lpSupply = lpToken[_pid].balanceOf(address(this));
        if (block.timestamp > pool.lastRewardTime && lpSupply != 0) {
            uint256 time = block.timestamp.sub(pool.lastRewardTime);
            uint256 sushiReward = time.mul(sushiPerSecond).mul(pool.allocPoint) / totalAllocPoint;
            accSushiPerShare = accSushiPerShare.add(sushiReward.mul(ACC_SUSHI_PRECISION) / lpSupply);
        }
        pending = int256(user.amount.mul(accSushiPerShare) / ACC_SUSHI_PRECISION).sub(user.rewardDebt).toUInt256();
    }
```

- deposite    
用户质押 LP  token 的接口，通过这个接口质押 LP 到 MiniChef 后，用户才能获得 sushi token 收益。需要注意的是，只有质押通过 add 接口添加到 sushi token 收益列表的 LP token 才能获得 sushi token 收益。 用户在质押的时候，会同时更新用户的 user.amount 和 user.rewardDebt，具体更新公式如下：   
1） 截止用户再次质押时，用户总的收益为 total_yield : user.amount * pool.accSushiPerShare    
2)  截止用户再次质押时，用户总的已领取的收益为 total_rewardDebt： user.rewardDebt    
3） 所以用户可领取的收益为 ： total_yield - total_rewardDebt   
4) total_yield 和 total_rewardDebt 式子中同时加上用户此时质押的 LP amount，两个式子的差值不变  
```solidity
function deposit(uint256 pid, uint256 amount, address to) public {
        PoolInfo memory pool = updatePool(pid);
        UserInfo storage user = userInfo[pid][to];

        // Effects
        user.amount = user.amount.add(amount);
        user.rewardDebt = user.rewardDebt.add(int256(amount.mul(pool.accSushiPerShare) / ACC_SUSHI_PRECISION));

        // Interactions
        IRewarder _rewarder = rewarder[pid];
        if (address(_rewarder) != address(0)) {
            _rewarder.onSushiReward(pid, to, to, 0, user.amount);
        }

        lpToken[pid].safeTransferFrom(msg.sender, address(this), amount);

        emit Deposit(msg.sender, pid, amount, to);
    }
```

- withdraw   
用户提取质押在 MiniChef 中的 LP token。 具体计算逻辑同 deposite 类似，在用户提取的过程中会更新用户的 user.amount 和 user.rewardDebt，具体更新公式如下： 
1） 截止用户再次质押时，用户总的收益为 total_yield : user.amount * pool.accSushiPerShare    
2)  截止用户再次质押时，用户总的已领取的收益为 total_rewardDebt： user.rewardDebt    
3） 所以用户可领取的收益为 ： total_yield - total_rewardDebt 
4) total_yield 和 total_rewardDebt 式子中同时减去用户此时提取的 LP amount，两个式子的差值不变  
```solidity
function withdraw(uint256 pid, uint256 amount, address to) public {
        PoolInfo memory pool = updatePool(pid);
        UserInfo storage user = userInfo[pid][msg.sender];

        // Effects
        user.rewardDebt = user.rewardDebt.sub(int256(amount.mul(pool.accSushiPerShare) / ACC_SUSHI_PRECISION));
        user.amount = user.amount.sub(amount);

        // Interactions
        IRewarder _rewarder = rewarder[pid];
        if (address(_rewarder) != address(0)) {
            _rewarder.onSushiReward(pid, msg.sender, to, 0, user.amount);
        }

        lpToken[pid].safeTransfer(to, amount);

        emit Withdraw(msg.sender, pid, amount, to);
    }
```

- harvest   
提取用户的 sushi token 收益。根据之前分析的 deposite 和 withdraw 的逻辑中，我们知道用户此时的收益为 user.amount.mul(pool.accSushiPerShare) - user.rewardDebt 。 这里 harvest 的时候就是这样处理的，在处理过程中同时处理的对应数值的精度。 
在提取的过程中，会更新用户的 user.rewardDebt = accumulatedSushi 以保证用户无法重复提取 sushi token 奖励
```solidity
/// @notice Harvest proceeds for transaction sender to `to`.
    /// @param pid The index of the pool. See `poolInfo`.
    /// @param to Receiver of SUSHI rewards.
    function harvest(uint256 pid, address to) public {
        PoolInfo memory pool = updatePool(pid);
        UserInfo storage user = userInfo[pid][msg.sender];
        int256 accumulatedSushi = int256(user.amount.mul(pool.accSushiPerShare) / ACC_SUSHI_PRECISION);
        uint256 _pendingSushi = accumulatedSushi.sub(user.rewardDebt).toUInt256();

        // Effects
        user.rewardDebt = accumulatedSushi;

        // Interactions
        if (_pendingSushi != 0) {
            SUSHI.safeTransfer(to, _pendingSushi);
        }

        IRewarder _rewarder = rewarder[pid];
        if (address(_rewarder) != address(0)) {
            _rewarder.onSushiReward( pid, msg.sender, to, _pendingSushi, user.amount);
        }

        emit Harvest(msg.sender, pid, _pendingSushi);
    }
```

## 参考链接  
- polygon MiniChefV2: https://polygonscan.com/address/0x0769fd68dfb93167989c6f7254cd0d766fb2841f    
- polygon rewarder:  https://polygonscan.com/address/0xa3378Ca78633B3b9b2255EAa26748770211163AE#writeContract  
- polygon MiniChefV2 的 harvest 交易： https://polygonscan.com/tx/0x68709510e36106b8af5d45390b2da055a02a0fbd6f5fde54c167e6ac6845bbe7  
