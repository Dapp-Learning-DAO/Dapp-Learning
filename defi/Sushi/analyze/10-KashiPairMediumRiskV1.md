# 介绍   
Kashi 是一种将风险隔离的贷款组合解决方案，目前的解决方案允许用户提供多种抵押资产并借入另一组资产。如果一项资产的价格下跌速度超过清算人的反应速度，每位用户和每一项资产都会受到影响。Kashi 允许任何人都可以创建一个新交易对，就像任何人都可以创建一个 Sushi 交易对一样。  
Kashi 的主体功能如下：  
- 提供一对一的借贷，各个借贷池的资金彼此分开，互补影响。比如 WETH/DAI，WETH/WBTC 这两个借贷池子。存入 WETH， 可以借贷 DAI 和 WBTC 。 当  WETH/DAI 池子发生大规模清算的时候，不会影响到 WETH/WBTC 中的资金   
- 每一个借贷池都支持闪电贷，用户可以进行闪电贷交易，之后偿还借贷金额及手续费即可  
- 支持灵活的合约接口调度。Sushi 把 Kashi 中的每个接口使用数字编号进行了封装，用进行外部调用的时候，传入对应的数字编号即可调用对应功能接口   

## 合约分析  
Kashi 把所有用到的功能接口功能都写入到一个合约中间，导致合约非常的庞大，这里对主要的合约接口，按照业务顺序进行分析，之后再分析中间的辅助函数。    
- 部署合约     
Kashi 的构造函数，只有一个入参数，用于设置 bentoBox 地址，之后存入质押资金和借贷资金都会转入 BentoBox。   
同时，在构造函数内，还设置了 feeTo 地址，用于接受借贷的手续费。  
```solidity
/// @notice The constructor is only used for the initial master contract. Subsequent clones are initialised via `init`.
constructor(IBentoBoxV1 bentoBox_) public {
        bentoBox = bentoBox_;
        masterContract = this;
        feeTo = msg.sender;
    }
```

- 初始化借贷币种及 Oracle     
在 init 接口中，传入 bytes 类型的参数，之后对参数进行解构，获取 collateral ( 出借的币种 ) 和 asset ( 质押的币种 )。  
同时还会设置初始借贷费率 interestPerSecond 为 317097920。 如果按照年化进行计算的话：  
年化利率 = 317097920 * 60 * 60 * 24 * 365  / 10**18  = 0.010 = 1%   
```solidity
/// @notice Serves as the constructor for clones, as clones can't have a regular constructor
/// @dev `data` is abi encoded in the format: (IERC20 collateral, IERC20 asset, IOracle oracle, bytes oracleData)
function init(bytes calldata data) public payable override {
        require(address(collateral) == address(0), "KashiPair: already initialized");
        (collateral, asset, oracle, oracleData) = abi.decode(data, (IERC20, IERC20, IOracle, bytes));
        require(address(collateral) != address(0), "KashiPair: bad pair");

        accrueInfo.interestPerSecond = uint64(STARTING_INTEREST_PER_SECOND); // 1% APR, with 1e18 being 100%
    }
```

- 用户借贷前抵押   
跟其他的借贷协议一样，用户在借贷前需要抵押资产。   
这个接口接受三个参数：  
to：抵押资产的受益人，之后此用户可以根据抵押资产的大小进行更多的借贷   
skim：用于判断抵押资产已经由用户手工转入给 Kashi ，还是需要由 BentoBox 代为转入  
share：对于抵押的资产数额，需要获取的对应在 KaiShi 总抵押资产中所占的比例   
需要进行说明的是，KaiShi 把所有的抵押资产都存入 BentoBox ，然后使用了一个变量 userCollateralShare 保存了用户当前抵押的资产在 BentoBox 资产池中所占的份额。  
addAsset 同 addCollateral 类似，实际上是把对在 BentoBox 中的资产份额进行转移。但是 addAsset 的时候，也使用的一个 Rebase 结构体保存 Asset 信息 ( totalAsset )， 但 totalAsset.elastic 记录的是当前资产在 BentoBox 中份额，接着使用 balanceOf 记录用户在 totalAsset.elastic 中占据的总份额。
```solidity
/// @notice Adds `collateral` from msg.sender to the account `to`.
/// @param to The receiver of the tokens.
/// @param skim True if the amount should be skimmed from the deposit balance of msg.sender.
/// False if tokens from msg.sender in `bentoBox` should be transferred.
/// @param share The amount of shares to add for `to`.
function addCollateral(
        address to,
        bool skim,
        uint256 share
    ) public {
        userCollateralShare[to] = userCollateralShare[to].add(share);
        uint256 oldTotalCollateralShare = totalCollateralShare;
        totalCollateralShare = oldTotalCollateralShare.add(share);
        _addTokens(collateral, share, oldTotalCollateralShare, skim);
        emit LogAddCollateral(skim ? address(bentoBox) : msg.sender, to, share);
    }
```

- 移除抵押资产    
当用户需要移除抵押资产的时候，可以调用 removeCollateral 接口进行移除。  
这里在移除资产前，会先调用 accrue 接口，更新出借费率，然后再把 Kashi 中的资产转移给用户。  
这里抵押资产的移除，实际也是把在 BentoBox 中的资产份额进行移除。     
removeAsset 接口类似，实际对在 BentoBox 中的资产份额进行移除。  
```solidiy
/// @dev Concrete implementation of `removeCollateral`.
    function _removeCollateral(address to, uint256 share) internal {
        userCollateralShare[msg.sender] = userCollateralShare[msg.sender].sub(share);
        totalCollateralShare = totalCollateralShare.sub(share);
        emit LogRemoveCollateral(msg.sender, to, share);
        bentoBox.transfer(collateral, address(this), to, share);
    }

    /// @notice Removes `share` amount of collateral and transfers it to `to`.
    /// @param to The receiver of the shares.
    /// @param share Amount of shares to remove.
    function removeCollateral(address to, uint256 share) public solvent {
        // accrue must be called because we check solvency
        accrue();
        _removeCollateral(to, share);
    }
```

- 用户进行借贷 && 偿还    
用户调用 borrow & repay 接口进行借贷和偿还，和前面的 addCollateral 和 removeCollateral 接口一样，实际也是对 BentoBox 中的资产份额进行操作。   
borrow 接口中使用 totalBorrow 结构体记录出借信息，其中 totalBorrow.elastic 记录的是出借币种的数量，userBorrowPart 记录用户所接币种的数量在 totalBorrow.elastic 中占据的份额，最后 totalBorrow.base 汇总所有借款用户的 userBorrowPart 。

- 清算  
清算部分的代码比较多，这里分开进行分析  
1） 统计每个被清算用户需要被清算的份额   
    - 根据每个用户的借款份额，计算所借币种到目前为止，需要偿还的借款数量 （ 这里同时算入了借款利息 ）  borrowAmount
    - 根据转换费率，把 borrowAmount 转换为质押币种的数量  collateralAmount  
    - 根据转换后质押币种的数量，再次把 collateralAmount 转换为对应在 BentoBox 中所占的份额  collateralShare
    - 从 userCollateralShare 中对应扣除用户的 collateralShare   
```solidity
for (uint256 i = 0; i < users.length; i++) {
            address user = users[i];
            if (!_isSolvent(user, open, _exchangeRate)) {
                uint256 borrowPart;
                {
                    uint256 availableBorrowPart = userBorrowPart[user];
                    borrowPart = maxBorrowParts[i] > availableBorrowPart ? availableBorrowPart : maxBorrowParts[i];
                    userBorrowPart[user] = availableBorrowPart.sub(borrowPart);
                }
                uint256 borrowAmount = _totalBorrow.toElastic(borrowPart, false);
                uint256 collateralShare =
                    bentoBoxTotals.toBase(
                        borrowAmount.mul(LIQUIDATION_MULTIPLIER).mul(_exchangeRate) /
                            (LIQUIDATION_MULTIPLIER_PRECISION * EXCHANGE_RATE_PRECISION),
                        false
                    );

                userCollateralShare[user] = userCollateralShare[user].sub(collateralShare);
                emit LogRemoveCollateral(user, swapper == ISwapper(0) ? to : address(swapper), collateralShare);
                emit LogRepay(swapper == ISwapper(0) ? msg.sender : address(swapper), user, borrowAmount, borrowPart);

                // Keep totals
                allCollateralShare = allCollateralShare.add(collateralShare);
                allBorrowAmount = allBorrowAmount.add(borrowAmount);
                allBorrowPart = allBorrowPart.add(borrowPart);
            }
        }
        require(allBorrowAmount != 0, "KashiPair: all are solvent");
        _totalBorrow.elastic = _totalBorrow.elastic.sub(allBorrowAmount.to128());
        _totalBorrow.base = _totalBorrow.base.sub(allBorrowPart.to128());
        totalBorrow = _totalBorrow;
        totalCollateralShare = totalCollateralShare.sub(allCollateralShare);

        uint256 allBorrowShare = bentoBox.toShare(asset, allBorrowAmount, true);

```

2) 进行开放式或是封闭式的结算   
总的来说，这部分功能就把质押的币换算成出借的币种，然后计算手续费，更新 Kashi 在 BentoBox 中的配额。
    - 当用户选择封闭式进行结算的时候，使用的是 allBorrowShare 和 allCollateralShare 进行结算。即使用对应资产数量在 BentoBox 中所占的份额来进行结算。具体结算过程为，把需要结算的  BorrowShare 和 CollateralShare 发送给 swapper 进行处理；然后计算实际返还的 BorrowShare 的 feeShare ( 即手续费 )   
    - 当用户选择开放式结算的时候，不进行手续费的结算  
```solidity
if (!open) {
            // Closed liquidation using a pre-approved swapper for the benefit of the LPs
            require(masterContract.swappers(swapper), "KashiPair: Invalid swapper");

            // Swaps the users' collateral for the borrowed asset
            bentoBox.transfer(collateral, address(this), address(swapper), allCollateralShare);
            swapper.swap(collateral, asset, address(this), allBorrowShare, allCollateralShare);

            uint256 returnedShare = bentoBox.balanceOf(asset, address(this)).sub(uint256(totalAsset.elastic));
            uint256 extraShare = returnedShare.sub(allBorrowShare);
            uint256 feeShare = extraShare.mul(PROTOCOL_FEE) / PROTOCOL_FEE_DIVISOR; // % of profit goes to fee
            // solhint-disable-next-line reentrancy
            bentoBox.transfer(asset, address(this), masterContract.feeTo(), feeShare);
            totalAsset.elastic = totalAsset.elastic.add(returnedShare.sub(feeShare).to128());
            emit LogAddAsset(address(swapper), address(this), extraShare.sub(feeShare), 0);
        } else {
            // Swap using a swapper freely chosen by the caller
            // Open (flash) liquidation: get proceeds first and provide the borrow after
            bentoBox.transfer(collateral, address(this), swapper == ISwapper(0) ? to : address(swapper), allCollateralShare);
            if (swapper != ISwapper(0)) {
                swapper.swap(collateral, asset, msg.sender, allBorrowShare, allCollateralShare);
            }

            bentoBox.transfer(asset, msg.sender, address(this), allBorrowShare);
            totalAsset.elastic = totalAsset.elastic.add(allBorrowShare.to128());
        }
```

- 提取手续费  
调用 withdrawFees 接口，可以把用户借贷产生的手续费发送到 _feeTo 地址上  
```solidity
function withdrawFees() public {
        accrue();
        address _feeTo = masterContract.feeTo();
        uint256 _feesEarnedFraction = accrueInfo.feesEarnedFraction;
        balanceOf[_feeTo] = balanceOf[_feeTo].add(_feesEarnedFraction);
        accrueInfo.feesEarnedFraction = 0;

        emit LogWithdrawFees(_feeTo, _feesEarnedFraction);
    }
```

- 其他辅助接口   
    - accrue  利率结算接口。主体功能如下：  
    1） 当目前没有任何借贷时，更新借贷利率为 STARTING_INTEREST_PER_SECOND = 317097920; ( approx 1% APR ) 
    2） 计算当前时刻距离上一次结算所经过的时间 （ 秒数 ） elapsedTime ，然后计算总 extraAmount  
    3） 根据总利息 extraAmount 计算手续费 feeAmount   
    3） 把 feeAmount 换算成 feeFraction （ 即占质押资产份额中的份额 ）   
    4） 根据当前资金的借贷使用率更新借贷利率，即如果借贷使用率大于目标使用率，则增大借款利率；反之，如果资金借贷使用率效率目标使用率，则减小借款利率  

```solidity
/// @notice Accrues the interest on the borrowed tokens and handles the accumulation of fees.
    function accrue() public {
        AccrueInfo memory _accrueInfo = accrueInfo;
        // Number of seconds since accrue was called
        uint256 elapsedTime = block.timestamp - _accrueInfo.lastAccrued;
        if (elapsedTime == 0) {
            return;
        }
        _accrueInfo.lastAccrued = uint64(block.timestamp);

        Rebase memory _totalBorrow = totalBorrow;
        if (_totalBorrow.base == 0) {
            // If there are no borrows, reset the interest rate
            if (_accrueInfo.interestPerSecond != STARTING_INTEREST_PER_SECOND) {
                _accrueInfo.interestPerSecond = STARTING_INTEREST_PER_SECOND;
                emit LogAccrue(0, 0, STARTING_INTEREST_PER_SECOND, 0);
            }
            accrueInfo = _accrueInfo;
            return;
        }

        uint256 extraAmount = 0;
        uint256 feeFraction = 0;
        Rebase memory _totalAsset = totalAsset;

        // Accrue interest
        extraAmount = uint256(_totalBorrow.elastic).mul(_accrueInfo.interestPerSecond).mul(elapsedTime) / 1e18;
        _totalBorrow.elastic = _totalBorrow.elastic.add(extraAmount.to128());
        uint256 fullAssetAmount = bentoBox.toAmount(asset, _totalAsset.elastic, false).add(_totalBorrow.elastic);

        uint256 feeAmount = extraAmount.mul(PROTOCOL_FEE) / PROTOCOL_FEE_DIVISOR; // % of interest paid goes to fee
        feeFraction = feeAmount.mul(_totalAsset.base) / fullAssetAmount;
        _accrueInfo.feesEarnedFraction = _accrueInfo.feesEarnedFraction.add(feeFraction.to128());
        totalAsset.base = _totalAsset.base.add(feeFraction.to128());
        totalBorrow = _totalBorrow;

        // Update interest rate
        uint256 utilization = uint256(_totalBorrow.elastic).mul(UTILIZATION_PRECISION) / fullAssetAmount;
        if (utilization < MINIMUM_TARGET_UTILIZATION) {
            uint256 underFactor = MINIMUM_TARGET_UTILIZATION.sub(utilization).mul(FACTOR_PRECISION) / MINIMUM_TARGET_UTILIZATION;
            uint256 scale = INTEREST_ELASTICITY.add(underFactor.mul(underFactor).mul(elapsedTime));
            _accrueInfo.interestPerSecond = uint64(uint256(_accrueInfo.interestPerSecond).mul(INTEREST_ELASTICITY) / scale);

            if (_accrueInfo.interestPerSecond < MINIMUM_INTEREST_PER_SECOND) {
                _accrueInfo.interestPerSecond = MINIMUM_INTEREST_PER_SECOND; // 0.25% APR minimum
            }
        } else if (utilization > MAXIMUM_TARGET_UTILIZATION) {
            uint256 overFactor = utilization.sub(MAXIMUM_TARGET_UTILIZATION).mul(FACTOR_PRECISION) / FULL_UTILIZATION_MINUS_MAX;
            uint256 scale = INTEREST_ELASTICITY.add(overFactor.mul(overFactor).mul(elapsedTime));
            uint256 newInterestPerSecond = uint256(_accrueInfo.interestPerSecond).mul(scale) / INTEREST_ELASTICITY;
            if (newInterestPerSecond > MAXIMUM_INTEREST_PER_SECOND) {
                newInterestPerSecond = MAXIMUM_INTEREST_PER_SECOND; // 1000% APR maximum
            }
            _accrueInfo.interestPerSecond = uint64(newInterestPerSecond);
        }

        emit LogAccrue(extraAmount, feeFraction, _accrueInfo.interestPerSecond, utilization);
        accrueInfo = _accrueInfo;
    }
```

    - cook 批量接口调用   
    Kaishi 把各个接口分装成对应的数字，这样就可以通过合约选择的方式进行调用，优化了交互体验   
    ```solidity
    /// @notice Executes a set of actions and allows composability (contract calls) to other contracts.
    /// @param actions An array with a sequence of actions to execute (see ACTION_ declarations).
    /// @param values A one-to-one mapped array to `actions`. ETH amounts to send along with the actions.
    /// Only applicable to `ACTION_CALL`, `ACTION_BENTO_DEPOSIT`.
    /// @param datas A one-to-one mapped array to `actions`. Contains abi encoded data of function arguments.
    /// @return value1 May contain the first positioned return value of the last executed action (if applicable).
    /// @return value2 May contain the second positioned return value of the last executed action which returns 2 values (if applicable).
    function cook(
        uint8[] calldata actions,
        uint256[] calldata values,
        bytes[] calldata datas
    ) external payable returns (uint256 value1, uint256 value2) {
        CookStatus memory status;
        for (uint256 i = 0; i < actions.length; i++) {
            uint8 action = actions[i];
            if (!status.hasAccrued && action < 10) {
                accrue();
                status.hasAccrued = true;
            }
            if (action == ACTION_ADD_COLLATERAL) {
                (int256 share, address to, bool skim) = abi.decode(datas[i], (int256, address, bool));
                addCollateral(to, skim, _num(share, value1, value2));
            } else if (action == ACTION_ADD_ASSET) {
                (int256 share, address to, bool skim) = abi.decode(datas[i], (int256, address, bool));
                value1 = _addAsset(to, skim, _num(share, value1, value2));
            } else if (action == ACTION_REPAY) {
                (int256 part, address to, bool skim) = abi.decode(datas[i], (int256, address, bool));
                _repay(to, skim, _num(part, value1, value2));
            } else if (action == ACTION_REMOVE_ASSET) {
                (int256 fraction, address to) = abi.decode(datas[i], (int256, address));
                value1 = _removeAsset(to, _num(fraction, value1, value2));
            } else if (action == ACTION_REMOVE_COLLATERAL) {
    }
    ```


## 参考资料  
- 曲线绘图 ： https://www.desmos.com/calculator?lang=zh-CN    
- 官方资料： https://dev.sushi.com/bentobox/interfaces/lending-pair   
