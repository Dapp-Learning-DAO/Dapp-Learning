# 介绍  
Vault 是 Yearn 的金库合约，用于存放用户存入的资金，以便后续根据策略进行投资收益。  
需要注意的是 Vault 使用的 Vyper 开发的合约，需要具备一定的 python 语言基础才能理解合约逻辑。   

## 合约分析  
Vault 合约包含了许多的接口和本地变量，这里主要讲解主要接口的逻辑功能。 

- initialize  
用于初始化 Vault 合约，需要在合约初始化之后进行调用。 这里主要设置 Vault name ， Vault symbol 以及几个特权地址，以便后续的运维管理操作。
需要注意的是 lockedProfitDegradation 这个值的作用，具体意义是收益的锁定周期，这里固定为 6 hours。意味着如果有 100$ 的收益，经过 6 hours 后才能完全释放，这样处理可以防止极端情况下的资金挤兑。  
因为 46 / 10 ** 6 ==> 1 / ( 10 ** 6 / 46 )  ，其中 10 ** 6 / 46 的计算结果为 21739，约为 6 hours = 60 * 60 * 6 = 21600。之后再进行精度扩展，即乘以 DEGRADATION_COEFFICIENT，最后得到 DEGRADATION_COEFFICIENT * 46 / 10 ** 6。    
其中 DEGRADATION_COEFFICIENT 字面理解是衰减系数，但实际这里理解为精度扩展系数更合适一些。另外需要注意的是这里 6 hours 的锁定周期没有直接使用 21600 这里数值，而是使用 10 ** 6 / 46 进行计算，应该是为了避免无法整除而造成的精度损失。  
```python
def initialize(
    token: address,
    governance: address,
    rewards: address,
    nameOverride: String[64],
    symbolOverride: String[32],
    guardian: address = msg.sender,
    management: address =  msg.sender,
    healthCheck: address = ZERO_ADDRESS
):
    """
    @notice
        Initializes the Vault, this is called only once, when the contract is
        deployed.
        The performance fee is set to 10% of yield, per Strategy.
        The management fee is set to 2%, per year.
        The initial deposit limit is set to 0 (deposits disabled); it must be
        updated after initialization.
    @dev
        If `nameOverride` is not specified, the name will be 'yearn'
        combined with the name of `token`.

        If `symbolOverride` is not specified, the symbol will be 'yv'
        combined with the symbol of `token`.

        The token used by the vault should not change balances outside transfers and
        it must transfer the exact amount requested. Fee on transfer and rebasing are not supported.
    @param token The token that may be deposited into this Vault.
    @param governance The address authorized for governance interactions.
    @param rewards The address to distribute rewards to.
    @param management The address of the vault manager.
    @param nameOverride Specify a custom Vault name. Leave empty for default choice.
    @param symbolOverride Specify a custom Vault symbol name. Leave empty for default choice.
    @param guardian The address authorized for guardian interactions. Defaults to caller.
    """
    assert self.activation == 0  # dev: no devops199
    self.token = ERC20(token)
    if nameOverride == "":
        self.name = concat(DetailedERC20(token).symbol(), " yVault")
    else:
        self.name = nameOverride
    if symbolOverride == "":
        self.symbol = concat("yv", DetailedERC20(token).symbol())
    else:
        self.symbol = symbolOverride
    decimals: uint256 = DetailedERC20(token).decimals()
    self.decimals = decimals
    assert decimals < 256 # dev: see VVE-2020-0001

    self.governance = governance
    log UpdateGovernance(governance)
    self.management = management
    log UpdateManagement(management)
    self.rewards = rewards
    log UpdateRewards(rewards)
    self.guardian = guardian
    log UpdateGuardian(guardian)
    self.performanceFee = 1000  # 10% of yield (per Strategy)
    log UpdatePerformanceFee(convert(1000, uint256))
    self.managementFee = 200  # 2% per year
    log UpdateManagementFee(convert(200, uint256))
    self.healthCheck = healthCheck
    log UpdateHealthCheck(healthCheck)

    self.lastReport = block.timestamp
    self.activation = block.timestamp
    self.lockedProfitDegradation = convert(DEGRADATION_COEFFICIENT * 46 / 10 ** 6 , uint256) # 6 hours in blocks
    # EIP-712
    self.DOMAIN_SEPARATOR = keccak256(
        concat(
            DOMAIN_TYPE_HASH,
            keccak256(convert("Yearn Vault", Bytes[11])),
            keccak256(convert(API_VERSION, Bytes[28])),
            convert(chain.id, bytes32),
            convert(self, bytes32)
        )
    )
```


- setWithdrawalQueue  
用于设置 withDraw 的时候资金提取的顺序，方便后续 Vault 进行资金提取的时候，按照最小影响顺序进行提取。举例来说，此 Vault 有 3 个 Strategy，分配 20% 的资金到第一个 Strategy （ 定期存款 ）， 30% 的资金到第二个 Strategy （ 基金理财 ）， 50% 的资金到第三个 Strategy （ 活期存款 ）。但是第一个 Strategy 资金提取的时候，如果没有达到 Strategy 要求的锁定周期 （ 比如 1 年 ），那么会有 30% 的资金损失，所以不到非必需时候，第一个 Strategy 资金总是要放到最后才提取。 setWithdrawalQueue 就是用于设置资金提取的顺序，最大程度较小收益影响。  
setWithdrawalQueue 设置的时候，判断逻辑如下：   
1. 遍历传入的 queue 参数时，如果遇到 queue[i] 为 0 地址，则判断对应位置的 withdrawalQueu[i] 地址是否为 0；如果 withdrawalQueu[i] 不为 0 ，则说明调用者试图移除 withdrawalQueu[i] 的 Strategy , 程序进行报错；如果 withdrawalQueu[i] 为 0，怎说明遍历 queue 结束，退出遍历处理  
2. 遍历传入的 queue 参数时，如果遇到 queue[i] 不为 0 地址，则需要保证 withdrawalQueu[i] 对应的 Strategy 也是非 0 地址  
3. 使用 queue 中的 Strategy 替换现有的 withdrawalQueue 中的 Strategy 的时候，需要进行验证，保证传入的 queue 中的 Strategy 已经处于激活状态，避免恶意更新  
4. 使用一个 set 数组 （ 长度为 32 ） 记录传入的 queue 中的所有 Strategy ，保证没有重复的 Strategy； 因为 withdrawalQueue 中的 Strategy 个数永远小于 32 ，所以可以保证 Set 数值记录排重的时候不会溢出。具体 set 数组记录流程为，首先取 queue[i] 地址的末尾 5 个 bit 位 （ 小于 32 ) 作为在 set 数组中的起始查找位置，步进为 1，如果步进过程中在 set 数组中查找到找相同的 queue[i] 地址，则报错；如果不存在相同地址，且对应 set 位置上地址为 0 地址，则保存当前 queue[i] 地址到 set 中，便于后续查找排重。  

```python
def setWithdrawalQueue(queue: address[MAXIMUM_STRATEGIES]):
    """
    @notice
        Updates the withdrawalQueue to match the addresses and order specified
        by `queue`.

        There can be fewer strategies than the maximum, as well as fewer than
        the total number of strategies active in the vault. `withdrawalQueue`
        will be updated in a gas-efficient manner, assuming the input is well-
        ordered with 0x0 only at the end.

        This may only be called by governance or management.
    @dev
        This is order sensitive, specify the addresses in the order in which
        funds should be withdrawn (so `queue`[0] is the first Strategy withdrawn
        from, `queue`[1] is the second, etc.)

        This means that the least impactful Strategy (the Strategy that will have
        its core positions impacted the least by having funds removed) should be
        at `queue`[0], then the next least impactful at `queue`[1], and so on.
    @param queue
        The array of addresses to use as the new withdrawal queue. This is
        order sensitive.
    """
    assert msg.sender in [self.management, self.governance]

    set: address[SET_SIZE] = empty(address[SET_SIZE])
    for i in range(MAXIMUM_STRATEGIES):
        if queue[i] == ZERO_ADDRESS:
            # NOTE: Cannot use this method to remove entries from the queue
            assert self.withdrawalQueue[i] == ZERO_ADDRESS
            break
        # NOTE: Cannot use this method to add more entries to the queue
        assert self.withdrawalQueue[i] != ZERO_ADDRESS

        assert self.strategies[queue[i]].activation > 0

        # NOTE: `key` is first `log_2(SET_SIZE)` bits of address (which is a hash)
        key: uint256 = bitwise_and(convert(queue[i], uint256), SET_SIZE - 1)
        # Most of the times following for loop only run once which is making it highly gas efficient
        # but in the worst case of key collision it will run linearly and find first empty slot in the set.
        for j in range(SET_SIZE):
            # NOTE: we can always find space by treating set as circular (as long as `SET_SIZE >= MAXIMUM_STRATEGIES`)
            idx: uint256 = (key + j) % SET_SIZE
            assert set[idx] != queue[i]  # dev: duplicate in set
            if set[idx] == ZERO_ADDRESS:
                set[idx] = queue[i]
                break

        self.withdrawalQueue[i] = queue[i]

    log UpdateWithdrawalQueue(queue)
```

- erc20_safe_transferFrom  
在用户存入 Token 时进行调用，把用户 Token 转移到 Vault 中来。 
```python
def erc20_safe_transferFrom(token: address, sender: address, receiver: address, amount: uint256):
    # Used only to send tokens that are not the type managed by this Vault.
    # HACK: Used to handle non-compliant tokens like USDT
    response: Bytes[32] = raw_call(
        token,
        concat(
            method_id("transferFrom(address,address,uint256)"),
            convert(sender, bytes32),
            convert(receiver, bytes32),
            convert(amount, bytes32),
        ),
        max_outsize=32,
    )
    if len(response) > 0:
        assert convert(response, bool), "Transfer failed!"
```

- _calculateLockedProfit   
计算还有多少收益处于锁定状态，Vault 或是用户在提取资金的时候，会进行计算
1. 在 initialize 接口中，我们讲解过 lockedProfitDegradation 表示锁定的是时长。首先计算自上次收益更新以来经过的时长（ 秒 ） lockedFundsRatio
2. 计算 lockedFundsRatio 对于 lockedProfitDegradation 的占比，比如 lockedFundsRatio 为 2 hours ，那么说明  2 / 6  的 profit 已经解锁，可以使用   
3. 计算还未解锁的 profit，按照步骤 2 中的计算即为 1 - ( 2 / 6) 的 profit 还为解锁   
```python
def _calculateLockedProfit() -> uint256:
    lockedFundsRatio: uint256 = (block.timestamp - self.lastReport) * self.lockedProfitDegradation

    if(lockedFundsRatio < DEGRADATION_COEFFICIENT):
        lockedProfit: uint256 = self.lockedProfit
        return lockedProfit - (
                lockedFundsRatio
                * lockedProfit
                / DEGRADATION_COEFFICIENT
            )
    else:
        return 0
```


- _totalAssets  
返回当前此 Vault 的总资产数量。self.token.balanceOf(self) 表示当前还留在 Vault 中的资金数量，self.totalDebt 表示 Vault 出借给 Strategy 进行投资收益的资金数量。
```python 
def _totalAssets() -> uint256:
    # See note on `totalAssets()`.
    return self.token.balanceOf(self) + self.totalDebt
```

- deposit  
1. 判断 emergencyShutdown 开关是否打开，如果打开，表示当前合约处于紧急状态，为避免用户资金损失，拒绝用户存入资金 
2. 判断用户准备存入的资金量大小。即如果传入的参数中 _amount 为 MAX_UINT256，则表示用户想要进行最大量存入，此时判断用户的余额和当前 Vault 最大可存入资金的大小，取其中较小的数进行存入。这里需要说明的是，Vault 有一个 depositLimit 的限制，因为根据收益规律，当使用的本金达到一定量后，单位本金的收益无法随着本金的增大而增大，反而可能减小。所以这里每个 Vault 为了保证最大收益，都设置了 depositLimit  
类似 UniV2 的 LP token，当用存入 token 到 Vault 的时候，Vault 根据当前 Vault 中的资金以及用户存入的资金，生成对应的份额给用户。举例来说，当前 Vault 中，所有用户存入资金总量为 100$，产生了 20$ 的收益，并且 20$ 收益中，已经解锁了 15$。所有用户的份额总量为 80，那么当用户存入 30$ 的资金时，获得份额 = 80 * ( 30 / ( 100 + 15)) = 20.86。 
其中 _issueSharesForAmount 为计算用户份额接口，具体计算方式入上所述。  
```python 
def deposit(_amount: uint256 = MAX_UINT256, recipient: address = msg.sender) -> uint256:
    """
    @notice
        Deposits `_amount` `token`, issuing shares to `recipient`. If the
        Vault is in Emergency Shutdown, deposits will not be accepted and this
        call will fail.
    @dev
        Measuring quantity of shares to issues is based on the total
        outstanding debt that this contract has ("expected value") instead
        of the total balance sheet it has ("estimated value") has important
        security considerations, and is done intentionally. If this value were
        measured against external systems, it could be purposely manipulated by
        an attacker to withdraw more assets than they otherwise should be able
        to claim by redeeming their shares.

        On deposit, this means that shares are issued against the total amount
        that the deposited capital can be given in service of the debt that
        Strategies assume. If that number were to be lower than the "expected
        value" at some future point, depositing shares via this method could
        entitle the depositor to *less* than the deposited value once the
        "realized value" is updated from further reports by the Strategies
        to the Vaults.

        Care should be taken by integrators to account for this discrepancy,
        by using the view-only methods of this contract (both off-chain and
        on-chain) to determine if depositing into the Vault is a "good idea".
    @param _amount The quantity of tokens to deposit, defaults to all.
    @param recipient
        The address to issue the shares in this Vault to. Defaults to the
        caller's address.
    @return The issued Vault shares.
    """
    assert not self.emergencyShutdown  # Deposits are locked out
    assert recipient not in [self, ZERO_ADDRESS]

    amount: uint256 = _amount

    # If _amount not specified, transfer the full token balance,
    # up to deposit limit
    if amount == MAX_UINT256:
        amount = min(
            self.depositLimit - self._totalAssets(),
            self.token.balanceOf(msg.sender),
        )
    else:
        # Ensure deposit limit is respected
        assert self._totalAssets() + amount <= self.depositLimit

    # Ensure we are depositing something
    assert amount > 0

    # Issue new shares (needs to be done before taking deposit to be accurate)
    # Shares are issued to recipient (may be different from msg.sender)
    # See @dev note, above.
    shares: uint256 = self._issueSharesForAmount(recipient, amount)

    # Tokens are transferred from msg.sender (may be different from _recipient)
    self.erc20_safe_transferFrom(self.token.address, msg.sender, self, amount)
    
    log Deposit(recipient, shares, amount)

    return shares  # Just in case someone wants them
```

- _reportLoss   
更新 strategy 投资损失。  
投资有收益就会有损失，strategy 从 Vault 借贷资金进行投资后，或出现收益，或出现损失的情况。当投资失败，造成损失时，就需要更新相应的 debt 数据。  
具体判断过程如下：  
1. 判断上报的资金损失量是否小于 strategy 的债务量。这里进行判断的原因是避免超额上报，比如 strategy 从 Vault 借贷 100$ ，如果此接口上报 loss 为 200$，那么就会出现债务不平衡的情况    
2. 把上报的 loss 转换为 ratio_change, 用于更新后续的 strategy debtratio 和 Vault 总的 debtRatio    
3. 用得出的 ratio_change 和 debtRatio 更新。这里可以看到 Vault 会根据 ratio_change 对应减少 strategy 的 debtRatio，应该是当 strategy 亏损的时候，为避免亏损进一步扩大，需要降低分配给此 strtegy 的配额    
```python
def _reportLoss(strategy: address, loss: uint256):
    # Loss can only be up the amount of debt issued to strategy
    totalDebt: uint256 = self.strategies[strategy].totalDebt
    assert totalDebt >= loss

    # Also, make sure we reduce our trust with the strategy by the amount of loss
    if self.debtRatio != 0: # if vault with single strategy that is set to EmergencyOne
        # NOTE: The context to this calculation is different than the calculation in `_reportLoss`,
        # this calculation intentionally approximates via `totalDebt` to avoid manipulatable results
        ratio_change: uint256 = min(
            # NOTE: This calculation isn't 100% precise, the adjustment is ~10%-20% more severe due to EVM math
            loss * self.debtRatio / self.totalDebt,
            self.strategies[strategy].debtRatio,
        )
        # If the loss is too small, ratio_change will be 0
        if ratio_change != 0:
            self.strategies[strategy].debtRatio -= ratio_change
            self.debtRatio -= ratio_change
    # Finally, adjust our strategy's parameters by the loss
    self.strategies[strategy].totalLoss += loss
    self.strategies[strategy].totalDebt = totalDebt - loss
    self.totalDebt -= loss
```

- withdraw  
用于从 Vault 中提取资金。因为 Vault 的部分资金已经借贷给 strategy 进行投资，所以当用户提取资金的时候，如果 Vault 中资金不足，需要从 strategy 中进行提取。  
具体处理过程如下：  
1. 处理用户传入的需要提取的资金 shares，此数值需要小于用户当前拥有的 share ， 且不能为 0  
2. 把传入的 share 转换为资金量 value，用于后面提取操作  
3. 循环从 strategy 中提取可提取的最大资金量到 Vault，同时累积记录从 strategy 提取资金时，造成的 loss    
4. 遍历 strategy 结束后，如果需要提取的 value 大于当前 Vault 的余额，则设置提取的 value 为 Vault 当前余额  
5. 判断从 strategy 提取资金过程中，造成的 totalloss 在 ( totalloss + value ) 中的占比是否小于用户传入的 maxLoss。如果大于，则说明此次的提取操作造成了过大的损失，则放弃提取；否则，提取资金  


```python
def withdraw(
    maxShares: uint256 = MAX_UINT256,
    recipient: address = msg.sender,
    maxLoss: uint256 = 1,  # 0.01% [BPS]
) -> uint256:
    """
    @notice
        Withdraws the calling account's tokens from this Vault, redeeming
        amount `_shares` for an appropriate amount of tokens.

        See note on `setWithdrawalQueue` for further details of withdrawal
        ordering and behavior.
    @dev
        Measuring the value of shares is based on the total outstanding debt
        that this contract has ("expected value") instead of the total balance
        sheet it has ("estimated value") has important security considerations,
        and is done intentionally. If this value were measured against external
        systems, it could be purposely manipulated by an attacker to withdraw
        more assets than they otherwise should be able to claim by redeeming
        their shares.

        On withdrawal, this means that shares are redeemed against the total
        amount that the deposited capital had "realized" since the point it
        was deposited, up until the point it was withdrawn. If that number
        were to be higher than the "expected value" at some future point,
        withdrawing shares via this method could entitle the depositor to
        *more* than the expected value once the "realized value" is updated
        from further reports by the Strategies to the Vaults.

        Under exceptional scenarios, this could cause earlier withdrawals to
        earn "more" of the underlying assets than Users might otherwise be
        entitled to, if the Vault's estimated value were otherwise measured
        through external means, accounting for whatever exceptional scenarios
        exist for the Vault (that aren't covered by the Vault's own design.)

        In the situation where a large withdrawal happens, it can empty the
        vault balance and the strategies in the withdrawal queue.
        Strategies not in the withdrawal queue will have to be harvested to
        rebalance the funds and make the funds available again to withdraw.
    @param maxShares
        How many shares to try and redeem for tokens, defaults to all.
    @param recipient
        The address to issue the shares in this Vault to. Defaults to the
        caller's address.
    @param maxLoss
        The maximum acceptable loss to sustain on withdrawal. Defaults to 0.01%.
        If a loss is specified, up to that amount of shares may be burnt to cover losses on withdrawal.
    @return The quantity of tokens redeemed for `_shares`.
    """
    shares: uint256 = maxShares  # May reduce this number below

    # Max Loss is <=100%, revert otherwise
    assert maxLoss <= MAX_BPS

    # If _shares not specified, transfer full share balance
    if shares == MAX_UINT256:
        shares = self.balanceOf[msg.sender]

    # Limit to only the shares they own
    assert shares <= self.balanceOf[msg.sender]

    # Ensure we are withdrawing something
    assert shares > 0

    # See @dev note, above.
    value: uint256 = self._shareValue(shares)

    if value > self.token.balanceOf(self):
        totalLoss: uint256 = 0
        # We need to go get some from our strategies in the withdrawal queue
        # NOTE: This performs forced withdrawals from each Strategy. During
        #       forced withdrawal, a Strategy may realize a loss. That loss
        #       is reported back to the Vault, and the will affect the amount
        #       of tokens that the withdrawer receives for their shares. They
        #       can optionally specify the maximum acceptable loss (in BPS)
        #       to prevent excessive losses on their withdrawals (which may
        #       happen in certain edge cases where Strategies realize a loss)
        for strategy in self.withdrawalQueue:
            if strategy == ZERO_ADDRESS:
                break  # We've exhausted the queue

            vault_balance: uint256 = self.token.balanceOf(self)
            if value <= vault_balance:
                break  # We're done withdrawing

            amountNeeded: uint256 = value - vault_balance

            # NOTE: Don't withdraw more than the debt so that Strategy can still
            #       continue to work based on the profits it has
            # NOTE: This means that user will lose out on any profits that each
            #       Strategy in the queue would return on next harvest, benefiting others
            amountNeeded = min(amountNeeded, self.strategies[strategy].totalDebt)
            if amountNeeded == 0:
                continue  # Nothing to withdraw from this Strategy, try the next one

            # Force withdraw amount from each Strategy in the order set by governance
            loss: uint256 = Strategy(strategy).withdraw(amountNeeded)
            withdrawn: uint256 = self.token.balanceOf(self) - vault_balance

            # NOTE: Withdrawer incurs any losses from liquidation
            if loss > 0:
                value -= loss
                totalLoss += loss
                self._reportLoss(strategy, loss)

            # Reduce the Strategy's debt by the amount withdrawn ("realized returns")
            # NOTE: This doesn't add to returns as it's not earned by "normal means"
            self.strategies[strategy].totalDebt -= withdrawn
            self.totalDebt -= withdrawn

        # NOTE: We have withdrawn everything possible out of the withdrawal queue
        #       but we still don't have enough to fully pay them back, so adjust
        #       to the total amount we've freed up through forced withdrawals
        vault_balance: uint256 = self.token.balanceOf(self)
        if value > vault_balance:
            value = vault_balance
            # NOTE: Burn # of shares that corresponds to what Vault has on-hand,
            #       including the losses that were incurred above during withdrawals
            shares = self._sharesForAmount(value + totalLoss)
            # NOTE: Check current shares must be lower than maxShare.
            #       This implies that large withdrawals within certain parameter ranges might fail.
            assert shares <= maxShares

        # NOTE: This loss protection is put in place to revert if losses from
        #       withdrawing are more than what is considered acceptable.
        assert totalLoss <= maxLoss * (value + totalLoss) / MAX_BPS


    # Burn shares (full value of what is being withdrawn)
    self.totalSupply -= shares
    self.balanceOf[msg.sender] -= shares
    log Transfer(msg.sender, ZERO_ADDRESS, shares)

    # Withdraw remaining balance to _recipient (may be different to msg.sender) (minus fee)
    self.erc20_safe_transfer(self.token.address, recipient, value)
    log Withdraw(recipient, shares, value)
    
    return value
```


- _debtOutstanding  
在一些情况下，会出现 strategy 的 debt 超过它的上限的情况。比如 Vault 总资金为 100$，分给 strategy_1 的 debt 为 10% ( 10$ ), 分给 strategy_2 的 debt 为 10% ( 10$ )。 
当 strategy_1 report loss 5$ 后，Vault 的总资金量变为 95$，此时 strategy_2 占据的 debt 比例为 10 / 95 = 10.5% > 10% 上限，此时就需要从 strategy 中回转部分资金到 Vault 中。 
而 _debtOutstanding 的作用就是计算这个情况下，strategy 需要返还给 Vault 的资金量。 
```python
@view
@internal
def _debtOutstanding(strategy: address) -> uint256:
    # See note on `debtOutstanding()`.
    if self.debtRatio == 0:
        return self.strategies[strategy].totalDebt

    strategy_debtLimit: uint256 = (
        self.strategies[strategy].debtRatio
        * self._totalAssets()
        / MAX_BPS
    )
    strategy_totalDebt: uint256 = self.strategies[strategy].totalDebt

    if self.emergencyShutdown:
        return strategy_totalDebt
    elif strategy_totalDebt <= strategy_debtLimit:
        return 0
    else:
        return strategy_totalDebt - strategy_debtLimit
```

- _assessFees  
这个接口，是根据 strategy 传入的收益 gain 计算 performance_fee / strategist_fee / management_fee。
_assessFees 主要为 report 接口服务。当 strategy 通过 report 接口上报赚取的收益 gain 的时候，在进行收益分配前， Vault 会先把收益中的 performance_fee / strategist_fee / management_fee 分配给 strategy 和 rewards，之后再把剩余的 gain 分配给 Vault 中的代币质押者。 
其中在计算 management_fee 的时候， strategy.delegatedAssets() 可能出现不为 0 的情况，即当前 strategy 同时代理了其他的 Vault 资金。
```python
def _assessFees(strategy: address, gain: uint256) -> uint256:
    # Issue new shares to cover fees
    # NOTE: In effect, this reduces overall share price by the combined fee
    # NOTE: may throw if Vault.totalAssets() > 1e64, or not called for more than a year
    if self.strategies[strategy].activation == block.timestamp:
        return 0  # NOTE: Just added, no fees to assess

    duration: uint256 = block.timestamp - self.strategies[strategy].lastReport
    assert duration != 0 #dev: can't call assessFees twice within the same block

    if gain == 0:
        # NOTE: The fees are not charged if there hasn't been any gains reported
        return 0

    management_fee: uint256 = (
        (
            (self.strategies[strategy].totalDebt - Strategy(strategy).delegatedAssets())
            * duration
            * self.managementFee
        )
        / MAX_BPS
        / SECS_PER_YEAR
    )

    # NOTE: Applies if Strategy is not shutting down, or it is but all debt paid off
    # NOTE: No fee is taken when a Strategy is unwinding it's position, until all debt is paid
    strategist_fee: uint256 = (
        gain
        * self.strategies[strategy].performanceFee
        / MAX_BPS
    )
    # NOTE: Unlikely to throw unless strategy reports >1e72 harvest profit
    performance_fee: uint256 = gain * self.performanceFee / MAX_BPS

    # NOTE: This must be called prior to taking new collateral,
    #       or the calculation will be wrong!
    # NOTE: This must be done at the same time, to ensure the relative
    #       ratio of governance_fee : strategist_fee is kept intact
    total_fee: uint256 = performance_fee + strategist_fee + management_fee
    # ensure total_fee is not more than gain
    if total_fee > gain:
        total_fee = gain
    if total_fee > 0:  # NOTE: If mgmt fee is 0% and no gains were realized, skip
        reward: uint256 = self._issueSharesForAmount(self, total_fee)

        # Send the rewards out as new shares in this Vault
        if strategist_fee > 0:  # NOTE: Guard against DIV/0 fault
            # NOTE: Unlikely to throw unless sqrt(reward) >>> 1e39
            strategist_reward: uint256 = (
                strategist_fee
                * reward
                / total_fee
            )
            self._transfer(self, strategy, strategist_reward)
            # NOTE: Strategy distributes rewards at the end of harvest()
        # NOTE: Governance earns any dust leftover from flooring math above
        if self.balanceOf[self] > 0:
            self._transfer(self, self.rewards, self.balanceOf[self])
    return total_fee
```

- report  
strategy 调用这个接口，上报相应的 收益/损失/需要偿还的债务，接口中传入的三个参数分别对应这三个值。  
具体处理过程如下：
1. 对 strategy 进行健康检查，通过检查后再继续后续的处理 （ 具体的健康检查处理可以参考 CommonHealthChceck.md ) 
2. 检查当前调用此接口的 strategy 余额是否大于 gain + _debtPayment ，因为此数值是 strategy 需要支付给 Vault 的金额，需要保证 strategy 余额充足    
3. 调用 _reportLoss 接口处理 strategy 上报的 loss。这里先处理 loss ，可以保证 strategy 对应的 debtRatio 的更新正确。
4. 根据 strategy 上报的 debtPayment 和 strategy 实际的 debt 更加 strategies.debt 和 totalDebt。其中 strategy 实际的 debt 就是根据 strategy 当前的 debtRatio 和  strategies.debt，计算出 strategy 需要返还给 Vault 的资金数量   
5. 计算 strategy 剩余的 credit。这里的 credit 就是根据 strategy 的 debtRatio 计算出 strategy 能从 Vault 获取的最大的配额，然后计算和 strategy 当前的 debt 差值 ，最终得出 strategy 剩余的 credit  
6. 计算最终代币的转移方向。gain + debtPayment 是 strategy 需要支付给 Vault 的资金，credit 则是 Vault 需要支付给 strategy 的资金。这里对比这两个数值，可以得出是需要 Vault 支付给 strategy 还是 strategy 需要支付给 Vault  
7. 计算 lockedProfit 。 这里先计算 lockedProfitBeforeLoss = self._calculateLockedProfit() + gain - totalFees ，得出当前可以用户锁定的 profit 是多少。注意到， report 接口上报的时候，是传入了一个 loss 参数，用于 strategy 上报亏损。Vault 会对比 lockedProfitBeforeLoss 和 loss 的数值，如果 lockedProfitBeforeLoss 大于 loss, 那么会从 lockedProfitBeforeLoss 中拿出 loss 大小的资金，用于填补 strategy 造成的损失，剩余的 profit 再进入锁定期。如果 lockedProfitBeforeLoss 小于 loss, 则 lockedProfitBeforeLoss 全部用于填补 strategy 的 loss
```python
def report(gain: uint256, loss: uint256, _debtPayment: uint256) -> uint256:
    """
    @notice
        Reports the amount of assets the calling Strategy has free (usually in
        terms of ROI).

        The performance fee is determined here, off of the strategy's profits
        (if any), and sent to governance.

        The strategist's fee is also determined here (off of profits), to be
        handled according to the strategist on the next harvest.

        This may only be called by a Strategy managed by this Vault.
    @dev
        For approved strategies, this is the most efficient behavior.
        The Strategy reports back what it has free, then Vault "decides"
        whether to take some back or give it more. Note that the most it can
        take is `gain + _debtPayment`, and the most it can give is all of the
        remaining reserves. Anything outside of those bounds is abnormal behavior.

        All approved strategies must have increased diligence around
        calling this function, as abnormal behavior could become catastrophic.
    @param gain
        Amount Strategy has realized as a gain on it's investment since its
        last report, and is free to be given back to Vault as earnings
    @param loss
        Amount Strategy has realized as a loss on it's investment since its
        last report, and should be accounted for on the Vault's balance sheet.
        The loss will reduce the debtRatio. The next time the strategy will harvest,
        it will pay back the debt in an attempt to adjust to the new debt limit.
    @param _debtPayment
        Amount Strategy has made available to cover outstanding debt
    @return Amount of debt outstanding (if totalDebt > debtLimit or emergency shutdown).
    """

    # Only approved strategies can call this function
    assert self.strategies[msg.sender].activation > 0

    # Check report is within healthy ranges
    if self.healthCheck != ZERO_ADDRESS:
        if HealthCheck(self.healthCheck).doHealthCheck(msg.sender):
            strategy: address  = msg.sender
            _debtOutstanding: uint256 = self._debtOutstanding(msg.sender)
            totalDebt: uint256 = self.strategies[msg.sender].totalDebt

            assert(HealthCheck(self.healthCheck).check(strategy, gain, loss, _debtPayment, _debtOutstanding, totalDebt)) #dev: fail healthcheck
        else:
            strategy: address  = msg.sender
            HealthCheck(self.healthCheck).enableCheck(strategy)

    # No lying about total available to withdraw!
    assert self.token.balanceOf(msg.sender) >= gain + _debtPayment

    # We have a loss to report, do it before the rest of the calculations
    if loss > 0:
        self._reportLoss(msg.sender, loss)

    # Assess both management fee and performance fee, and issue both as shares of the vault
    totalFees: uint256 = self._assessFees(msg.sender, gain)

    # Returns are always "realized gains"
    self.strategies[msg.sender].totalGain += gain

    # Compute the line of credit the Vault is able to offer the Strategy (if any)
    credit: uint256 = self._creditAvailable(msg.sender)

    # Outstanding debt the Strategy wants to take back from the Vault (if any)
    # NOTE: debtOutstanding <= StrategyParams.totalDebt
    debt: uint256 = self._debtOutstanding(msg.sender)
    debtPayment: uint256 = min(_debtPayment, debt)

    if debtPayment > 0:
        self.strategies[msg.sender].totalDebt -= debtPayment
        self.totalDebt -= debtPayment
        debt -= debtPayment
        # NOTE: `debt` is being tracked for later

    # Update the actual debt based on the full credit we are extending to the Strategy
    # or the returns if we are taking funds back
    # NOTE: credit + self.strategies[msg.sender].totalDebt is always < self.debtLimit
    # NOTE: At least one of `credit` or `debt` is always 0 (both can be 0)
    if credit > 0:
        self.strategies[msg.sender].totalDebt += credit
        self.totalDebt += credit

    # Give/take balance to Strategy, based on the difference between the reported gains
    # (if any), the debt payment (if any), the credit increase we are offering (if any),
    # and the debt needed to be paid off (if any)
    # NOTE: This is just used to adjust the balance of tokens between the Strategy and
    #       the Vault based on the Strategy's debt limit (as well as the Vault's).
    totalAvail: uint256 = gain + debtPayment
    if totalAvail < credit:  # credit surplus, give to Strategy
        self.erc20_safe_transfer(self.token.address, msg.sender, credit - totalAvail)
    elif totalAvail > credit:  # credit deficit, take from Strategy
        self.erc20_safe_transferFrom(self.token.address, msg.sender, self, totalAvail - credit)
    # else, don't do anything because it is balanced

    # Profit is locked and gradually released per block
    # NOTE: compute current locked profit and replace with sum of current and new
    lockedProfitBeforeLoss: uint256 = self._calculateLockedProfit() + gain - totalFees
    if lockedProfitBeforeLoss > loss:
        self.lockedProfit = lockedProfitBeforeLoss - loss
    else:
        self.lockedProfit = 0

    # Update reporting time
    self.strategies[msg.sender].lastReport = block.timestamp
    self.lastReport = block.timestamp

    log StrategyReported(
        msg.sender,
        gain,
        loss,
        debtPayment,
        self.strategies[msg.sender].totalGain,
        self.strategies[msg.sender].totalLoss,
        self.strategies[msg.sender].totalDebt,
        credit,
        self.strategies[msg.sender].debtRatio,
    )

    if self.strategies[msg.sender].debtRatio == 0 or self.emergencyShutdown:
        # Take every last penny the Strategy has (Emergency Exit/revokeStrategy)
        # NOTE: This is different than `debt` in order to extract *all* of the returns
        return Strategy(msg.sender).estimatedTotalAssets()
    else:
        # Otherwise, just return what we have as debt outstanding
        return debt

```