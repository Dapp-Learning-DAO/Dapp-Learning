# 介绍  
日语里，BentoBox 是便当盒；在 Sushi 里，BentoBox 是一个代币库，也被认为是一个渠道，既能够让用户用十分低的 Gas 体会到上面的多个 Dapp，也能够让开发者十分容易地、低成本地在上面进行使用开发。    
目前，上面的第一个 Dapp 是借贷产品 Kashi，用户可在此放贷和借贷。    
Bento Box 主体功能如下：  
- Defi 应用在 Bento Box 上进行注册，成为 Bento Box 的一个会员  
- 用户授权代币的 transferFrom 权限给 Bento Box   
- 当用户需要使用该 Defi 项目时，可以直接生成签名给该 Defi 项目   
通常用户使用 Defi 项目时，需要对该 Defi 项目进行 Approve ，这样该 Defi 项目才能使用用户的代币。然而在这里，因为用户已经授权给了 Bento Box ，需要进行资金转移的时候，统一通过 Bento Box 进行转移，减少了一次 Approve 的操作，从而节省了 Gas 。   
- 该 Defi 项目调用 Bento Box 的 deposit ，Bento Box 转移用户资金到 Bento Box，同时设置该 Defi 可以使用的资金额度。同时这样操作还有另一个好处，后面分析代码时会进行介绍     

## 合约分析  
Bento Box 的合约接口很多，这里按照用户的角度，从 Defi 项目注册到用户操作这一过程进行分析，中间忽略次要的接口   

- registerProtocol   
Defi 合约的注册接口，后续 Bento Box 判断该 Defi 项目是否可以操作用户资金时都会用到这个数据项   
```solidity
/// @notice Other contracts need to register with this master contract so that users can approve them for the BentoBox.
function registerProtocol() public {
        masterContractOf[msg.sender] = msg.sender;
        emit LogRegisterProtocol(msg.sender);
    }
```

- whitelistMasterContract   
只有 Bento Box 所有者才能调用，用于设置 whitelist 白名单。 
当用户对处于 whitelist 中的合约进行授权或取消授权时，就不需要发送 ECDSA 签名信息。  
```solidity
/// @notice Enables or disables a contract for approval without signed message.
function whitelistMasterContract(address masterContract, bool approved) public onlyOwner {
        // Checks
        require(masterContract != address(0), "MasterCMgr: Cannot approve 0");

        // Effects
        whitelistedMasterContracts[masterContract] = approved;
        emit LogWhiteListMasterContract(masterContract, approved);
    }
```

- setMasterContractApproval  
调用这个接口后，表示用户是否授权对应的 Defi 合约操作用户的资金。  
这个接口传入的参数 ECDSA 签名参数及相应的合约地址。 
```solidity
/// @notice Approves or revokes a `masterContract` access to `user` funds.
    /// @param user The address of the user that approves or revokes access.
    /// @param masterContract The address who gains or loses access.
    /// @param approved If True approves access. If False revokes access.
    /// @param v Part of the signature. (See EIP-191)
    /// @param r Part of the signature. (See EIP-191)
    /// @param s Part of the signature. (See EIP-191)
    // F4 - Check behaviour for all function arguments when wrong or extreme
    // F4: Don't allow masterContract 0 to be approved. Unknown contracts will have a masterContract of 0.
    // F4: User can't be 0 for signed approvals because the recoveredAddress will be 0 if ecrecover fails
    function setMasterContractApproval(
        address user,
        address masterContract,
        bool approved,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) {
        .......................
        // Effects
        masterContractApproved[masterContract][user] = approved;
        emit LogSetMasterContractApproval(masterContract, user, approved);
    }
    }
```

- allowed  
allowed 用于判断用户是否已经授权相应的 Defi 操作自己的资金。   
如果已经授权才能进行后续操作，否则进行报错。这个修饰器作用在涉及用户资金操作的地方。
```solidity
modifier allowed(address from) {
        if (from != msg.sender && from != address(this)) {
            // From is sender or you are skimming
            address masterContract = masterContractOf[msg.sender];
            require(masterContract != address(0), "BentoBox: no masterContract");
            require(masterContractApproved[masterContract][from], "BentoBox: Transfer not approved");
        }
        _;
    }
```

- deposit  
这里涉及的操作比较多，主要有以下几点：  
    -  Bento Box 对每种代币都会记录一个 Rebase 的结构信息。 这个结构体中有两个字段，分别是 elastic 和 base 。 其中 elastic 记录的是真正的代币总余额，base 记录的是总的份额。举例来说，Defi_A 从用户处转入了 10 ETH ， 获得了 10 Base； Defi_B 从用户处转入了 20 ETH ，获得了 20 Base。 此时 Bento Box 中总共有 30 ETH，30 Base。所以记录的 elastic 为 30, base 为 30。因为 Bento Box 会利用这些资金去进行其他收益投资，比如进行闪电贷。过一段时间后，Bento Box 收益了 30 ETH ，那么此时记录的 elasetic 为 60 ( 获得的收益会同时记录的到 Rebase 结构体中 )，但是 base 还是为 30。 如果 Defi_A 进行提取的话，那么它能得到 60 * ( 10 / 30) = 20 ETH 。   
    - 根据上述的说明，当 Defi 应用从用户处转入资金到 Bento Box 的时候，Bento Box 记录对应 Defi 拥有的资金为转入时的资金在资金池中的份额。    
    - 调用 deposit 接口的时候，传入 2 个重要参数，即 amount 和 share，amount 即表示希望转入入的资金量， share 表示希望在资金池中的占比。当 share 参数不为 0 时，以 share 重新反算 amount ，避免数值不一致。   
    - Bento Box 希望 Defi 应用能把资金存在 Bento Box 中，这样 Bento Box 这部分资金即可以用户赚取其他收益，还能给其他 Defi 项目提供必要的项目初期的流动性资金   

```solidity
/// @notice Deposit an amount of `token` represented in either `amount` or `share`.
    /// @param token_ The ERC-20 token to deposit.
    /// @param from which account to pull the tokens.
    /// @param to which account to push the tokens.
    /// @param amount Token amount in native representation to deposit.
    /// @param share Token amount represented in shares to deposit. Takes precedence over `amount`.
    /// @return amountOut The amount deposited.
    /// @return shareOut The deposited amount repesented in shares.
    function deposit(
        IERC20 token_,
        address from,
        address to,
        uint256 amount,
        uint256 share
    ) public payable allowed(from) returns (uint256 amountOut, uint256 shareOut) {
        // Checks
        require(to != address(0), "BentoBox: to not set"); // To avoid a bad UI from burning funds

        // Effects
        IERC20 token = token_ == USE_ETHEREUM ? wethToken : token_;
        Rebase memory total = totals[token];

        // If a new token gets added, the tokenSupply call checks that this is a deployed contract. Needed for security.
        require(total.elastic != 0 || token.totalSupply() > 0, "BentoBox: No tokens");
        if (share == 0) {
            // value of the share may be lower than the amount due to rounding, that's ok
            share = total.toBase(amount, false);
            // Any deposit should lead to at least the minimum share balance, otherwise it's ignored (no amount taken)
            if (total.base.add(share.to128()) < MINIMUM_SHARE_BALANCE) {
                return (0, 0);
            }
        } else {
            // amount may be lower than the value of share due to rounding, in that case, add 1 to amount (Always round up)
            amount = total.toElastic(share, true);
        }

        // In case of skimming, check that only the skimmable amount is taken.
        // For ETH, the full balance is available, so no need to check.
        // During flashloans the _tokenBalanceOf is lower than 'reality', so skimming deposits will mostly fail during a flashloan.
        require(
            from != address(this) || token_ == USE_ETHEREUM || amount <= _tokenBalanceOf(token).sub(total.elastic),
            "BentoBox: Skim too much"
        );

        balanceOf[token][to] = balanceOf[token][to].add(share);
        total.base = total.base.add(share.to128());
        total.elastic = total.elastic.add(amount.to128());
        totals[token] = total;

        // Interactions
        // During the first deposit, we check that this token is 'real'
        if (token_ == USE_ETHEREUM) {
            // X2 - If there is an error, could it cause a DoS. Like balanceOf causing revert. (SWC-113)
            // X2: If the WETH implementation is faulty or malicious, it will block adding ETH (but we know the WETH implementation)
            IWETH(address(wethToken)).deposit{value: amount}();
        } else if (from != address(this)) {
            // X2 - If there is an error, could it cause a DoS. Like balanceOf causing revert. (SWC-113)
            // X2: If the token implementation is faulty or malicious, it may block adding tokens. Good.
            token.safeTransferFrom(from, address(this), amount);
        }
        emit LogDeposit(token, from, to, amount, share);
        amountOut = amount;
        shareOut = share;
    }
```

- withdraw   
和 deposite 类似 ，当 Defi 应用提取资金时，根据希望提取的资金份额，计算出对应的代币数量返还给 Defi 项目  
```solidity
/// @notice Withdraws an amount of `token` from a user account.
    /// @param token_ The ERC-20 token to withdraw.
    /// @param from which user to pull the tokens.
    /// @param to which user to push the tokens.
    /// @param amount of tokens. Either one of `amount` or `share` needs to be supplied.
    /// @param share Like above, but `share` takes precedence over `amount`.
    function withdraw(
        IERC20 token_,
        address from,
        address to,
        uint256 amount,
        uint256 share
    ) public allowed(from) returns (uint256 amountOut, uint256 shareOut) {
        // Checks
        require(to != address(0), "BentoBox: to not set"); // To avoid a bad UI from burning funds

        // Effects
        IERC20 token = token_ == USE_ETHEREUM ? wethToken : token_;
        Rebase memory total = totals[token];
        if (share == 0) {
            // value of the share paid could be lower than the amount paid due to rounding, in that case, add a share (Always round up)
            share = total.toBase(amount, true);
        } else {
            // amount may be lower than the value of share due to rounding, that's ok
            amount = total.toElastic(share, false);
        }

        balanceOf[token][from] = balanceOf[token][from].sub(share);
        total.elastic = total.elastic.sub(amount.to128());
        total.base = total.base.sub(share.to128());
        // There have to be at least 1000 shares left to prevent reseting the share/amount ratio (unless it's fully emptied)
        require(total.base >= MINIMUM_SHARE_BALANCE || total.base == 0, "BentoBox: cannot empty");
        totals[token] = total;

        // Interactions
        if (token_ == USE_ETHEREUM) {
            // X2, X3: A revert or big gas usage in the WETH contract could block withdrawals, but WETH9 is fine.
            IWETH(address(wethToken)).withdraw(amount);
            // X2, X3: A revert or big gas usage could block, however, the to address is under control of the caller.
            (bool success, ) = to.call{value: amount}("");
            require(success, "BentoBox: ETH transfer failed");
        } else {
            // X2, X3: A malicious token could block withdrawal of just THAT token.
            //         masterContracts may want to take care not to rely on withdraw always succeeding.
            token.safeTransfer(to, amount);
        }
        emit LogWithdraw(token, from, to, amount, share);
        amountOut = amount;
        shareOut = share;
    }
```

- flashLoan   
Bento Box 支持的另一个重要的功能就是 flashloan ， 跟 Uniswap 的 flashloan 类似，转入资金到目标地址后，会进行相应的回调，之后检查余额是否正确。
```solidity
function flashLoan(
        IFlashBorrower borrower,
        address receiver,
        IERC20 token,
        uint256 amount,
        bytes calldata data
    ) public {
        uint256 fee = amount.mul(FLASH_LOAN_FEE) / FLASH_LOAN_FEE_PRECISION;
        token.safeTransfer(receiver, amount);

        borrower.onFlashLoan(msg.sender, token, amount, fee, data);

        require(_tokenBalanceOf(token) >= totals[token].addElastic(fee.to128()), "BentoBox: Wrong amount");
        emit LogFlashLoan(address(borrower), token, amount, fee, receiver);
    }
```  

- setStrategy   
在解析 deposit 接口的时候，我们说到 Bento Box 会拿当前存入到 Bento Box 的资金去进行投资收益。那么对哪个币种施行何种投资策略呢，这个接口就是进行这种相应的设置。  
这个接口的处理逻辑如下：  
1） 当一个币种没有任何 strategy 或是 newstrategy 和当前已生效的 strategy 不相同时，当前传入的 strategy 置为 pending 状态，同时设置此币种的 strategyData.strategyStartDate 为两周之后，即两周之后此策略才能真正生效，避免误操作或是恶意攻击   
2） 如果两周之后，当再此调用这个接口，同时传入同样的参数时，会把此币种的 pending strategy 置空，同时设置此币种的 strategy 为此 strategy   
3） 如果两周之内，当再此调用这个接口，同时传入同样的参数时，接口会报错，报 strategy 生效时间未到  
4） 如果在任意时候，调用此接口，传入的参数中，strategy 和处于 pending strategy 的地址不相同，那么就重新进入步骤 2 和 3
5)  在步骤 2 执行成功，strategy 生效后，如果重新触发步骤 1，2 ，那么在执行步骤 2 的时候，会多进行一步操作，即执行旧 strategy 的 exit 操作，即从旧 strategy 中把资金提取回来。资金提取回来的同时，exit 接口会返回此次退出时返回的资金和初始存入的资金差额。如果此次退出的资金总量大于 Bento Box 初始存入的资金总量，那么返回的 amount 为正数，否则为负数。 然后根据返回的 amount 差值，更新 Rebase 结构体。  
```solidity
/// @notice Sets the contract address of a new strategy that conforms to `IStrategy` for `token`.
    /// Must be called twice with the same arguments.
    /// A new strategy becomes pending first and can be activated once `STRATEGY_DELAY` is over.
    /// @dev Only the owner of this contract is allowed to change this.
    /// @param token The address of the token that maps to a strategy to change.
    /// @param newStrategy The address of the contract that conforms to `IStrategy`.
    // F5 - Checks-Effects-Interactions pattern followed? (SWC-107)
    // F5: Total amount is updated AFTER interaction. But strategy is under our control.
    // C4 - Use block.timestamp only for long intervals (SWC-116)
    // C4: block.timestamp is used for a period of 2 weeks, which is long enough
    function setStrategy(IERC20 token, IStrategy newStrategy) public onlyOwner {
        StrategyData memory data = strategyData[token];
        IStrategy pending = pendingStrategy[token];
        if (data.strategyStartDate == 0 || pending != newStrategy) {
            pendingStrategy[token] = newStrategy;
            // C1 - All math done through BoringMath (SWC-101)
            // C1: Our sun will swallow the earth well before this overflows
            data.strategyStartDate = (block.timestamp + STRATEGY_DELAY).to64();
            emit LogStrategyQueued(token, newStrategy);
        } else {
            require(data.strategyStartDate != 0 && block.timestamp >= data.strategyStartDate, "StrategyManager: Too early");
            if (address(strategy[token]) != address(0)) {
                int256 balanceChange = strategy[token].exit(data.balance);
                // Effects
                if (balanceChange > 0) {
                    uint256 add = uint256(balanceChange);
                    totals[token].addElastic(add);
                    emit LogStrategyProfit(token, add);
                } else if (balanceChange < 0) {
                    uint256 sub = uint256(-balanceChange);
                    totals[token].subElastic(sub);
                    emit LogStrategyLoss(token, sub);
                }

                emit LogStrategyDivest(token, data.balance);
            }
            strategy[token] = pending;
            data.strategyStartDate = 0;
            data.balance = 0;
            pendingStrategy[token] = IStrategy(0);
            emit LogStrategySet(token, newStrategy);
        }
        strategyData[token] = data;
    }
```

- harvest   
此接口用于对对应的币种进行收益提取，或更新进行收益的资金，具体逻辑如下：  
1） 对 strategy 调用 harvest ，即进行收益提取；如果收益为 0 ，并且 balance 标志为 false ，则直接返回  
2） 对 strategy 调用 harvest ，即进行收益提取；如果收益不为 0 ，则对应更新 Rebase 结构信息中的 elastic。需要注意的是，执行的 strategy 可能收益 （ balanceChange 为正 ）， 也可能亏损 （ balanceChange 为负 ）   
3） 判断 balance 标志是否为 True，如果为 True 则执行相应的操作。这里 balance 的意义在于： 假如 Bento Box 的 strategy 一直收益，那么 Rebase 结构信息中的 elastic 一直增长，但因为 Bento Box 初始投入到 Strage 中的资金数额一直不变，这样会导致在收益高增长时期，无法最大化的享受收益增长。所以，需要按照对应的资金比例，对 strategy 进行资金追加投入； 同理，如果 strategy 一直在亏损，需要及时回撤部分资金，以免损失过大。
```solidity
/// @notice The actual process of yield farming. Executes the strategy of `token`.
    /// Optionally does housekeeping if `balance` is true.
    /// `maxChangeAmount` is relevant for skimming or withdrawing if `balance` is true.
    /// @param token The address of the token for which a strategy is deployed.
    /// @param balance True if housekeeping should be done.
    /// @param maxChangeAmount The maximum amount for either pulling or pushing from/to the `IStrategy` contract.
    // F5 - Checks-Effects-Interactions pattern followed? (SWC-107)
    // F5: Total amount is updated AFTER interaction. But strategy is under our control.
    // F5: Not followed to prevent reentrancy issues with flashloans and BentoBox skims?
    function harvest(
        IERC20 token,
        bool balance,
        uint256 maxChangeAmount
    ) public {
        StrategyData memory data = strategyData[token];
        IStrategy _strategy = strategy[token];
        int256 balanceChange = _strategy.harvest(data.balance, msg.sender);
        if (balanceChange == 0 && !balance) {
            return;
        }

        uint256 totalElastic = totals[token].elastic;

        if (balanceChange > 0) {
            uint256 add = uint256(balanceChange);
            totalElastic = totalElastic.add(add);
            totals[token].elastic = totalElastic.to128();
            emit LogStrategyProfit(token, add);
        } else if (balanceChange < 0) {
            // C1 - All math done through BoringMath (SWC-101)
            // C1: balanceChange could overflow if it's max negative int128.
            // But tokens with balances that large are not supported by the BentoBox.
            uint256 sub = uint256(-balanceChange);
            totalElastic = totalElastic.sub(sub);
            totals[token].elastic = totalElastic.to128();
            data.balance = data.balance.sub(sub.to128());
            emit LogStrategyLoss(token, sub);
        }

        if (balance) {
            uint256 targetBalance = totalElastic.mul(data.targetPercentage) / 100;
            // if data.balance == targetBalance there is nothing to update
            if (data.balance < targetBalance) {
                uint256 amountOut = targetBalance.sub(data.balance);
                if (maxChangeAmount != 0 && amountOut > maxChangeAmount) {
                    amountOut = maxChangeAmount;
                }
                token.safeTransfer(address(_strategy), amountOut);
                data.balance = data.balance.add(amountOut.to128());
                _strategy.skim(amountOut);
                emit LogStrategyInvest(token, amountOut);
            } else if (data.balance > targetBalance) {
                uint256 amountIn = data.balance.sub(targetBalance.to128());
                if (maxChangeAmount != 0 && amountIn > maxChangeAmount) {
                    amountIn = maxChangeAmount;
                }

                uint256 actualAmountIn = _strategy.withdraw(amountIn);

                data.balance = data.balance.sub(actualAmountIn.to128());
                emit LogStrategyDivest(token, actualAmountIn);
            }
        }

        strategyData[token] = data;
    }
```

## 参考链接   
- Proxy contract： https://blog.openzeppelin.com/deep-dive-into-the-minimal-proxy-contract/  
- EIP1167: https://medium.com/taipei-ethereum-meetup/reason-why-you-should-use-eip1167-proxy-contract-with-tutorial-cbb776d98e53  
- 克隆说明： https://ethereum.stackexchange.com/questions/78900/clone-factory-and-constructor-arguments   
- Bento box 三大优势： http://www.jifengbtc.com/article/13487  
- Bento box 官网介绍： https://docs.sushi.com/products/bentobox  
- Bento box Strategy: https://github.com/sushiswap/bentobox/blob/master/contracts/strategies   
