# 介绍  
用户在 SushiSwap 上交易会收取相应的手续费，其中 0.05% 的手续费会转换成 Sushi token 给予到 SushiBar。用户通过在 Sushi Bar 中质押 SUSHI 代币，根据质押的 Sushi 币在 Sushi Bar 中所占的比例可以获得Sushi token reward 分成。 在质押 Sushi 币的同时，用户还会获得 xSushi token（可增发，无上限），用于社区治理投票。 Sushi token 分配细则举例如下：   
-  用户添加 sushi token ，获得对应的 xsushi ，计算公式如下       
receivedXsushi =  $\frac{ stakeAmount }{ totalStakedAmount} \times totalXsushi $    
totalStakeAmount =  所有用户质押的 sushi 总量     
stakeAmount  =  用户质押的 sushi 数量   
totalXsushi =  xsushi 总量    

- 用户提取 sushi token，同时获得奖励的 xsushi ，计算公式如下  
receivedSushi =  $\frac{ withdrawAmount }{ totalStakedAmount} \times ( totalStakedAmount + rewardAmount ) $    
totalStakeAmount =  所有用户质押的 sushi 总量     
withdrawAmount  =  用户提取的 sushi 数量   
rewardAmount =  0.05% 手续费对应的 Sushi 数量    

官网的描述如下：    
For every swap on the exchange on every chain, 0.05% of the swap fees are distributed as SUSHI proportional to your share of the SushiBar. When your SUSHI is staked into the SushiBar, you receive xSUSHI in return for voting rights and a fully composable token that can interact with other protocols. Your xSUSHI is continuously compounding, when you unstake you will receive all the originally deposited SUSHI and any additional from fees.


## 合约分析  
SushiBar 总共有 3 个接口，一个 constructor 构造函数，一个 enter 接口，一个 leave 接口。  

- constructor  
合约部署时，需要传入 sushi token 的地址，用于后续的 sushi token 质押和移除
```solidity
constructor(IERC20 _sushi) public {
        sushi = _sushi;
    }
```

- enter  
质押 sushi token 的入口，用户调用这个接口来进行 sushi token 的质押，以换取 xSushi。  
观察 enter 函数的接口，可以看到接口是通过 sushi.transferFrom 进行 sushi token 的质押，所以用户在调用这个接口之前，需要对 SushiBar 合约进行 approve。 
1）首先获取 SushiBar 合约的 sushi token 余额  totalSushi
2）获取已经 mint 了的 xSushi 的总量 totalSupply  
3）如果 totalSupply 为 0 ，则直接根据用户传入的 sushi token 的数量，生成等量的 xSushi 给用户
4）当 totalSupply 不为 0 的时候， 根据用户传入的 sushi token 数量在当前 totalSushi 中的比例，生成等比例的 xSushi 给用户

```solidity
function enter(uint256 _amount) public {
        // Gets the amount of Sushi locked in the contract
        uint256 totalSushi = sushi.balanceOf(address(this));
        // Gets the amount of xSushi in existence
        uint256 totalShares = totalSupply();
        // If no xSushi exists, mint it 1:1 to the amount put in
        if (totalShares == 0 || totalSushi == 0) {
            _mint(msg.sender, _amount);
        } 
        // Calculate and mint the amount of xSushi the Sushi is worth. The ratio will change overtime, as xSushi is burned/minted and Sushi deposited + gained from fees / withdrawn.
        else {
            uint256 what = _amount.mul(totalShares).div(totalSushi);
            _mint(msg.sender, what);
        }
        // Lock the Sushi in the contract
        sushi.transferFrom(msg.sender, address(this), _amount);
    }
```

- leave  
和移除 LP 类似，根据用户当前传入的 xSushi 占 xSushi 总量的比例，返还对应比例的 sushi token 给用户
```solidity
function leave(uint256 _share) public {
        // Gets the amount of xSushi in existence
        uint256 totalShares = totalSupply();
        // Calculates the amount of Sushi the xSushi is worth
        uint256 what = _share.mul(sushi.balanceOf(address(this))).div(totalShares);
        _burn(msg.sender, _share);
        sushi.transfer(msg.sender, what);
    }
```

## 参考链接  
- 官网链接： https://app.sushi.com/stake  
- 官网说明： https://docs.sushi.com/products/yield-farming  