# 介绍  
MiniChefV2 是一个简化版的 MasterChef 合约，用于发放 Sushi token。 用户质押指定的 LP token 到 MiniChef 中，可以享受 Sushi token 线性释放的分成奖励。


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
