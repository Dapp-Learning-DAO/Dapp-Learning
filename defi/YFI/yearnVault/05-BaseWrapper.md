# 介绍  
BaseWrapper 在继承 BaseRouter 的基础上，对 router 进行了简单的封装，简化了参数的传入。  
可以认为 BaseWrapper 就是精键版的 Router 合约。  

## 合约分析  
- constructor  
BaseWrapper 的构造函数，需要传入两个参数，token 和 registry 地址，用于寻址对应的 Vault。  
```solidity
constructor(address _token, address _registry) public BaseRouter(_registry) {
        // Recommended to use a token with a `Registry.latestVault(_token) != address(0)`
        token = IERC20(_token);
    }
```

- _migrate  
在 BaseRouter 中，介绍了 _withdraw 函数，用于把资金从历史的 Vault 中提取出来，然后存入 registry 中最新的 Vault。 _migrate 接口内部就是调用的 _withdraw 接口，具体逻辑如下：  
1. 获取 registry 中的该币种最新的 bestVault 的 depositLimit 和 totalAssets  
2. 当 depositLimit < totalAssets 时，表示当前 deposit 的资金总量已经超过 bestVault 的上限，无法进行 migrate ，接口退出  
3. 获取  depositLimit 和 totalAssets 之间的差值，表示 bestVault 还允许 deposit 的金额数量  
4. 当 bestVault 还允许 deposit amount 的资金数量大于 0 时，首先调用 BaseRouter 的 _withdraw 接口，从历史 Vault 中提取对应的 amount，然后再调用  BaseRouter 的 _deposit 将资金存入 bestVault 中   
5. 最后判断 withdrawn - migrated ( 存入 bestVault 的资金 ) 差值是否在调用者允许范围内，即是否小于 maxMigrationLoss。 在第二步的时候，已经计算了 bestVault 当前还允许存入的资金总量，所以照理 withdrawn - migrated 应该等于 0 才对。出现现在这个情况的原因是，在调用 _withdraw 的时候，会出现过多 withdraw 的情况，即原本是要 withdraw 100$，但实际可能 withdraw 了 120$， 那么多 withdraw 出来的 20$ 就会存入 bestVault 中。在后续调用 _deposit 接口的时候，就会出现 withdrawn - migrated 大于 0 的情况。
```solidity
function _migrate(
        address account,
        uint256 amount,
        uint256 maxMigrationLoss
    ) internal returns (uint256 migrated) {
        VaultAPI _bestVault = bestVault();

        // NOTE: Only override if we aren't migrating everything
        uint256 _depositLimit = _bestVault.depositLimit();
        uint256 _totalAssets = _bestVault.totalAssets();
        if (_depositLimit <= _totalAssets) return 0; // Nothing to migrate (not a failure)

        uint256 _amount = amount;
        if (_depositLimit < UNCAPPED_DEPOSITS && _amount < WITHDRAW_EVERYTHING) {
            // Can only deposit up to this amount
            uint256 _depositLeft = _depositLimit.sub(_totalAssets);
            if (_amount > _depositLeft) _amount = _depositLeft;
        }

        if (_amount > 0) {
            // NOTE: `false` = don't withdraw from `_bestVault`
            uint256 withdrawn = _withdraw(token, account, address(this), _amount, false);
            if (withdrawn == 0) return 0; // Nothing to migrate (not a failure)

            // NOTE: `false` = don't do `transferFrom` because it's already local
            migrated = _deposit(token, address(this), account, withdrawn, false);
            // NOTE: Due to the precision loss of certain calculations, there is a small inefficency
            //       on how migrations are calculated, and this could lead to a DoS issue. Hence, this
            //       value is made to be configurable to allow the user to specify how much is acceptable
            require(withdrawn.sub(migrated) <= maxMigrationLoss);
        } // else: nothing to migrate! (not a failure)
    }
```