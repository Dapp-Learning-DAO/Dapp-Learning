# 介绍  
Strategy 基础合约类，里面含有很多抽象类，每个 Vault 的具体 Strategy 实现都需要继承抽象类。 

## 抽象类介绍  
### BaseStrategy  
BaseStrategy 中包括了许多和 Vault 交互的接口，并进行了简单实现。  

- delegatedAssets  
在 Vault 合约中， _assessFees 计算 management_fee 的时候就会调用 strategy 的这个接口，用于得到归属于当前 Vault 的真正 debt。 
接口默认返回 0 ，表示没有代理其他 Vault 的资金。当然，strategy 可以覆盖这个接口，用于实现特定的场景需求。  
```solidity
function delegatedAssets() external view virtual returns (uint256) {
        return 0;
    }
```

- _initialize  
初始化接口，在构造函数中被调用，用于初始化 strategy 的重要变量。 
minReportDelay/maxReportDelay/profitFactor/debtThreshold 用于判断 strategy 是否需要进行和 Vault 的收益结算。 
```solidity
function _initialize(
        address _vault,
        address _strategist,
        address _rewards,
        address _keeper
    ) internal {
        require(address(want) == address(0), "Strategy already initialized");

        vault = VaultAPI(_vault);
        want = IERC20(vault.token());
        SafeERC20.safeApprove(want, _vault, type(uint256).max); // Give Vault unlimited access (might save gas)
        strategist = _strategist;
        rewards = _rewards;
        keeper = _keeper;

        // initialize variables
        minReportDelay = 0;
        maxReportDelay = 86400;
        profitFactor = 100;
        debtThreshold = 0;

        vault.approve(rewards, type(uint256).max); // Allow rewards to be pulled
    }
```

- harvestTrigger  
主要提供给自动化程序，或是 Keep3r 使用，用于判断是否可以触发 harvest 。 
```solidity
function harvestTrigger(uint256 callCostInWei) public view virtual returns (bool) {
        return
            StrategyLib.internalHarvestTrigger(
                address(vault),
                address(this),
                ethToWant(callCostInWei),
                minReportDelay,
                maxReportDelay,
                debtThreshold,
                profitFactor
            );
    }
```

- harvest  
用于收益结算，在处理过程中，总共进行如下几个步骤：
1. 判断当前 strategy 是否处于 emergency 状况。如果是，则撤回所有投资，计算当前此 strategy 需要返还给 Vault 的资金。在这个计算过程中可以发现，loss 和 profit 只会有一个变量大于0，即 strategy 要么投资亏损，要么投资盈利。 最后，计算 strategy 实际返回给 Vault 的资金，需要扣除 loss 部分   
2. 当 strategy 没有处理 emergency 状态时，调用 prepareReturn 返回需要传递给 Vault 的 profit/loss/debtPayment 这三个值
3. 调用 adjustPosition 处理剩余未返还给 Vault 的资金  
```solidity
function harvest() external onlyKeepers {
        uint256 profit = 0;
        uint256 loss = 0;
        uint256 debtOutstanding = vault.debtOutstanding();
        uint256 debtPayment = 0;
        if (emergencyExit) {
            // Free up as much capital as possible
            uint256 amountFreed = liquidateAllPositions();
            if (amountFreed < debtOutstanding) {
                loss = debtOutstanding.sub(amountFreed);
            } else if (amountFreed > debtOutstanding) {
                profit = amountFreed.sub(debtOutstanding);
            }
            debtPayment = debtOutstanding.sub(loss);
        } else {
            // Free up returns for Vault to pull
            (profit, loss, debtPayment) = prepareReturn(debtOutstanding);
        }

        // Allow Vault to take up to the "harvested" balance of this contract,
        // which is the amount it has earned since the last time it reported to
        // the Vault.
        debtOutstanding = vault.report(profit, loss, debtPayment);

        // Check if free returns are left, and re-invest them
        adjustPosition(debtOutstanding);

        emit Harvested(profit, loss, debtPayment, debtOutstanding);
    }
```

- withdraw  
分析 Vault 的时候，我们知道，当用户需要提取存入的资金时，如果 Vault 中资金不足，Vault 会从 strategy 中提取。 withdraw 接口就是用于此目的  
```solidity
function withdraw(uint256 _amountNeeded) external returns (uint256 _loss) {
        require(msg.sender == address(vault), "!vault");
        // Liquidate as much as possible to `want`, up to `_amountNeeded`
        uint256 amountFreed;
        (amountFreed, _loss) = liquidatePosition(_amountNeeded);
        // Send it directly back (NOTE: Using `msg.sender` saves some gas here)
        SafeERC20.safeTransfer(want, msg.sender, amountFreed);
        // NOTE: Reinvest anything leftover on next `tend`/`harvest`
    }
```

- sweep  
可能会出现其他代币被误转入此 strategy 的情况。为了能取出这些代币，strategy 预留了一个 sweep 的接口，只允许 governance 调用，取出误打入此 strategy 的非投资用代币。  
```solidity
function sweep(address _token) external onlyGovernance {
        require(_token != address(want), "!want");
        require(_token != address(vault), "!shares");

        address[] memory _protectedTokens = protectedTokens();
        for (uint256 i; i < _protectedTokens.length; i++) require(_token != _protectedTokens[i], "!protected");

        SafeERC20.safeTransfer(IERC20(_token), governance(), IERC20(_token).balanceOf(address(this)));
    }
```