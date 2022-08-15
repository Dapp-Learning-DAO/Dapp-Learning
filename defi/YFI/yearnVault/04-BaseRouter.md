# 介绍  
前面已经介绍了 Registry 合约，了解了 Vault 注册和发布的流程。这里，继续介绍下 BaseRouter 合约。  
BaseRouter 封装了用于和 Registry 交互接口，用户通过调用这些接口，就可以操作对应的 Vault。  

## 合约分析  
- constructor  
构造函数，传入参数为 registry 合约地址，后续便和此 registry 进行交互。 
```solidity
constructor(address _registry) public {
        // Recommended to use `v2.registry.ychad.eth`
        registry = RegistryAPI(_registry);
    }
```


- setRegistry  
当 Yearn 进行升级或迁移时，相应的 registry 地址会进行更新。  
调用这个接口，可以把合约中保存的 registry 地址更新为最新的 registry 地址。  
```solidity
function setRegistry(address _registry) external {
        require(msg.sender == registry.governance());
        // In case you want to override the registry instead of re-deploying
        registry = RegistryAPI(_registry);
        // Make sure thgovernanceere's no change in 
        // NOTE: Also avoid bricking the router from setting a bad registry
        require(msg.sender == registry.governance());
    }
```


- allVaults  
为方便查询特定币中的所有 Vault，router 会缓存从 registry 中获得的 Vault。 
1. 接口首先判断当前缓存的 vault 数量是否和 registry 中的 vault 数量相同，如果相同则直接返回缓存的 vault 列表  
2. 如果 registry 中对应币中的 vault 数量和当前 router 缓存的 vault 数量不相同，则从 registry 中拉取缺失的 vault 进行缓存。 因为在 registry 中的 vault 列表时追加的，所以对于缺失的部分，直接从缺的位置进行拉取即可。  

```solidity
function allVaults(address token) public view virtual returns (VaultAPI[] memory) {
        uint256 cache_length = _cachedVaults[token].length;
        uint256 num_vaults = registry.numVaults(token);

        // Use cached
        if (cache_length == num_vaults) {
            return _cachedVaults[token];
        }

        VaultAPI[] memory vaults = new VaultAPI[](num_vaults);

        for (uint256 vault_id = 0; vault_id < cache_length; vault_id++) {
            vaults[vault_id] = _cachedVaults[token][vault_id];
        }

        for (uint256 vault_id = cache_length; vault_id < num_vaults; vault_id++) {
            vaults[vault_id] = VaultAPI(registry.vaults(token, vault_id));
        }

        return vaults;
    }
```


-  _updateVaultCache  
_updateVaultCache 是一个内部的接口，用于更新缓存的特定币种的 vault 列表。  
这个接口在 _withdraw 接口中被调用，用于更新的列表会预先和 registry 合约进行同步。  
```solidity
function _updateVaultCache(address token, VaultAPI[] memory vaults) internal {
        // NOTE: even though `registry` is update-able by Yearn, the intended behavior
        //       is that any future upgrades to the registry will replay the version
        //       history so that this cached value does not get out of date.
        if (vaults.length > _cachedVaults[token].length) {
            _cachedVaults[token] = vaults;
        }
    }
```

- totalVaultBalance  
获取一个在账户，在一个币种的所有 vault 中的存款总量。 
1. 因为账户在 vault 中的存款是以 share 的方式进行记录的，所以首先获取每一份 share 对应多少的 token 数量，这里计算的时候进行了币种的精度处理  
2. 根据此账户在当前 vault 中的 share 总量，得出账户在此 vault 中存入的资金总量  
3. 遍历币种的所有 vault ，进行资金的累加，然后计算得出账户在 yearn 中存入的此币种的资金总量  
```solidity
function totalVaultBalance(address token, address account) public view returns (uint256 balance) {
        VaultAPI[] memory vaults = allVaults(token);

        for (uint256 id = 0; id < vaults.length; id++) {
            balance = balance.add(vaults[id].balanceOf(account).mul(vaults[id].pricePerShare()).div(10**uint256(vaults[id].decimals())));
        }
    }
```


- _deposit  
_deposit 接口用于向 Vault 中存入资金。当 pullFunds 为 true 时的处理逻辑如下：
1. 当 amount 为 DEPOSIT_EVERYTHING 时，表示从 depositor 中转入 router 的资金总量为 depositor 的余额总量  
2. 从  depositor 中转入资金总量 amount 到当前 router 中  

处理了 pullFunds 为 true 的情况后，下面就是通用的处理：
1. 判断 router 授予给 Vault 的信用额度是否大于 amount ，如果小于 amount ，则修改信用额度为 unlimited  
2. 根据 receiver，amount 参数的不同，调用不同的 deposit 接口  
3. deposit 的时候，可能因为 amount 数量超过 Vault 能接受的最大限度，所以会存在无法全部存入的情况。所以在最后需要进行判断，当 router 中还有资金剩余时，需要把剩余的资金返还给 depositor  
4. 返还存入的实际资金数量 deposited 

```solidity
function _deposit(
        IERC20 token,
        address depositor,
        address receiver,
        uint256 amount, // if `MAX_UINT256`, just deposit everything
        bool pullFunds // If true, funds need to be pulled from `depositor` via `transferFrom`
    ) internal returns (uint256 deposited) {
        VaultAPI _bestVault = bestVault(address(token));

        if (pullFunds) {
            if (amount == DEPOSIT_EVERYTHING) {
                amount = token.balanceOf(depositor);
            }
            SafeERC20.safeTransferFrom(token, depositor, address(this), amount);
        }

        if (token.allowance(address(this), address(_bestVault)) < amount) {
            SafeERC20.safeApprove(token, address(_bestVault), 0); // Avoid issues with some tokens requiring 0
            SafeERC20.safeApprove(token, address(_bestVault), UNLIMITED_APPROVAL); // Vaults are trusted
        }

        // Depositing returns number of shares deposited
        // NOTE: Shortcut here is assuming the number of tokens deposited is equal to the
        //       number of shares credited, which helps avoid an occasional multiplication
        //       overflow if trying to adjust the number of shares by the share price.
        uint256 beforeBal = token.balanceOf(address(this));
        if (receiver != address(this)) {
            _bestVault.deposit(amount, receiver);
        } else if (amount != DEPOSIT_EVERYTHING) {
            _bestVault.deposit(amount);
        } else {
            _bestVault.deposit();
        }

        uint256 afterBal = token.balanceOf(address(this));
        deposited = beforeBal.sub(afterBal);
        // `receiver` now has shares of `_bestVault` as balance, converted to `token` here
        // Issue a refund if not everything was deposited
        if (depositor != address(this) && afterBal > 0) SafeERC20.safeTransfer(token, depositor, afterBal);
    }
```


- _withdraw  
_withdraw 接口用于从 Vault 中提取资金。 主要逻辑如下： 
1. 最外层为循环遍历处理，遍历 registry 中的 Vault 进行 withdraw  
2. 对 withdrawFromBest 参数判断是仅仅从历史 Vault 中提取资金，还是包括当前的最新的 Vault  
3. 判断 sender 在 Vault 中的可用 share  （ availableShares ）
4. 取 availableShares 和 vaults.maxAvailableShares 两个值中的最小值，避免提取的资金超过限额。这里这样处理的原因为，从 Vault 提取资金时，为避免资金的过度提取，导致 Vault 资金不足， Vault 对提取的资金做了相应的限制    
5. 当前可提取的 share 不为 0 的时候进行 withdraw ，否则跳过  
6. 当接口入参中的 amount 为  MAX_UINT256 时，表示全部提取；否则根据剩余需要提取的 amount， 换算成对应的 share 进行提取
7. 从 Vault withdraw 后，计算当前已经提取的所有的资金总量 withdrawn 是否已经满足要求，如果已经满足，则跳出循环   
8. 判断 withdrawn 是否大于 amount ， 如果大于，则把多余的资金存回 Vault 
9. 将提取的资金准入 receiver  
```solidity
function _withdraw(
        IERC20 token,
        address sender,
        address receiver,
        uint256 amount, // if `MAX_UINT256`, just withdraw everything
        bool withdrawFromBest // If true, also withdraw from `_bestVault`
    ) internal returns (uint256 withdrawn) {
        VaultAPI _bestVault = bestVault(address(token));

        VaultAPI[] memory vaults = allVaults(address(token));
        _updateVaultCache(address(token), vaults);

        // NOTE: This loop will attempt to withdraw from each Vault in `allVaults` that `sender`
        //       is deposited in, up to `amount` tokens. The withdraw action can be expensive,
        //       so it if there is a denial of service issue in withdrawing, the downstream usage
        //       of this router contract must give an alternative method of withdrawing using
        //       this function so that `amount` is less than the full amount requested to withdraw
        //       (e.g. "piece-wise withdrawals"), leading to less loop iterations such that the
        //       DoS issue is mitigated (at a tradeoff of requiring more txns from the end user).
        for (uint256 id = 0; id < vaults.length; id++) {
            if (!withdrawFromBest && vaults[id] == _bestVault) {
                continue; // Don't withdraw from the best
            }

            // Start with the total shares that `sender` has
            uint256 availableShares = vaults[id].balanceOf(sender);

            // Restrict by the allowance that `sender` has to this contract
            // NOTE: No need for allowance check if `sender` is this contract
            if (sender != address(this)) {
                availableShares = Math.min(availableShares, vaults[id].allowance(sender, address(this)));
            }

            // Limit by maximum withdrawal size from each vault
            availableShares = Math.min(availableShares, vaults[id].maxAvailableShares());

            if (availableShares > 0) {
                // Intermediate step to move shares to this contract before withdrawing
                // NOTE: No need for share transfer if this contract is `sender`

                if (amount != WITHDRAW_EVERYTHING) {
                    // Compute amount to withdraw fully to satisfy the request
                    uint256 estimatedShares = amount
                    .sub(withdrawn) // NOTE: Changes every iteration
                    .mul(10**uint256(vaults[id].decimals()))
                    .div(vaults[id].pricePerShare()); // NOTE: Every Vault is different

                    // Limit amount to withdraw to the maximum made available to this contract
                    // NOTE: Avoid corner case where `estimatedShares` isn't precise enough
                    // NOTE: If `0 < estimatedShares < 1` but `availableShares > 1`, this will withdraw more than necessary
                    if (estimatedShares > 0 && estimatedShares < availableShares) {
                        if (sender != address(this)) vaults[id].transferFrom(sender, address(this), estimatedShares);
                        withdrawn = withdrawn.add(vaults[id].withdraw(estimatedShares));
                    } else {
                        if (sender != address(this)) vaults[id].transferFrom(sender, address(this), availableShares);
                        withdrawn = withdrawn.add(vaults[id].withdraw(availableShares));
                    }
                } else {
                    if (sender != address(this)) vaults[id].transferFrom(sender, address(this), availableShares);
                    withdrawn = withdrawn.add(vaults[id].withdraw());
                }

                // Check if we have fully satisfied the request
                // NOTE: use `amount = WITHDRAW_EVERYTHING` for withdrawing everything
                if (amount <= withdrawn) break; // withdrawn as much as we needed
            }
        }

        // If we have extra, deposit back into `_bestVault` for `sender`
        // NOTE: Invariant is `withdrawn <= amount`
        if (withdrawn > amount && withdrawn.sub(amount) > _bestVault.pricePerShare().div(10**_bestVault.decimals())) {
            // Don't forget to approve the deposit
            if (token.allowance(address(this), address(_bestVault)) < withdrawn.sub(amount)) {
                SafeERC20.safeApprove(token, address(_bestVault), UNLIMITED_APPROVAL); // Vaults are trusted
            }

            _bestVault.deposit(withdrawn.sub(amount), sender);
            withdrawn = amount;
        }

        // `receiver` now has `withdrawn` tokens as balance
        if (receiver != address(this)) SafeERC20.safeTransfer(token, receiver, withdrawn);
    }
}
```