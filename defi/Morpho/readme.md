## Morpho 是什么  
Morpho是一个基于以太坊的借贷池优化器，通过点对点的匹配，为贷款人和借款人提供更好的利率。 
在 Morpho 的白皮书中，Morpho 描述自己的产品定位是 “流动性协议优化器”  

- 以 Compound 上  ETH 收益为例  
<img src=./pictures/compoundAPY.png width=50% />   

- 对应的曲线  
可以看到 Borrow 的平均年化收益率 为 0.1％，Supply 平均年化收益率为 2.7％  
<img src=./pictures/borrowAPY2LendAPY.png width=50% />   

- Morpho 的目标就是降低 Borrow 的年化利率，提高 Supply 的年化利率，就是中间这条蓝色的曲线  
<img src=./pictures/morphoAPY.png width=50% />  

- 具体操作如下   
    - 对于 Supplier   
        Step1: Supplier 存入资金到 Morpho  
        Step2: Morpho 把资金转存到 Compound    
        Step3: Compound mint cToken 给 Morpho  
        <img src=./pictures/morphoSupply.png width=50% /> 

    - 对于 Borrower  
        Step4:  存入抵押品，这一步可以视为 上面 Supplier 的操作   
        Step5、6:  Morpho 使用 cToken 换取 Supplier 存入的资金    
        Step7:   把从 Compound 提取出来的资金借给 Borrower    
        <img src=./pictures/morphoBorrow.png width=50% /> 

    以上就是 Morpho 的整体流程，像是没有 Supplier 的时候，如果有用户进行 Borrow 需要怎么处理 ？或是 Supplier 和 Borrower 匹配成功后，Supplier 进行 withdraw 的时候需要怎么处理 ？ 这些都是在 deposit, borrow, withdraw, repay , liquidate 接口进行的更加细致话的处理

## Deposit 
Deposit 的接口流程伪代码如下
```
supply(user, amount):
	update_Index()  // 更新 Index
  transfer(user, Morpho, amount)  // 把用户资金转入到 Morpho 中

	// Peer-to-peer supply
	//// Promote borrowers
	matched = matchBorrowers(amount)    // 作为 Supplier, 寻找对手方 Borrower 进行匹配，
                                      //  返回匹配到的最大资金量
  

	supply_p2p(user) += matched / index_p2p  // 更新用户的 p2p supply 基数


	amount -= matched                    // 更新 amount


  repay(Morpho, matched)               // 把 matched 的资金偿还给 compound pool，因为这部分资金
                                       // 开始是 Borrower 从 Compound 池中借出的，
                                       // 现在直接和 Supplier 匹配了，就需要偿还这部分资金

	// Pool supply
	supply_pool(user) += amount / index_pool  // 更新用户的 pool supply 基数
	supply(Morpho, amount)                // 把剩余的，未匹配的 amount 存入到 compound 中
```   

<img src=./pictures/depositFlow.png width=50% /> 

### 关键点解析  
#### Compound 中对于 Supplier 使用汇率的方式计算 Supplier 的本息总额  
    $汇率 = \frac {资产 token 总数} {cToken总数}$   
    $资产token总数 = underlyingBalance + totalBorrowBalance - reserves$  
    $cToken总数 = cTokenSupply$    
    $underlyingBalance : 池子中现货 token 的数量$    
    $totalBalance: 池子中总共借出去的 token 数量，含利息$    
    $reserve: 池子自己的储备金$      
    Compound Supplier  的计算具体可参考 [Compound白皮书的思考](https://learnblockchain.cn/article/3153)   


#### Compound 中 BorrowerIndex  、totalBorrow 的计算方式    
    $Amount = 用户初始输入的借贷金额$    
    $latestBorrowIndex = borrowIndexInit * (1 + borrowRate(\Delta Blocks) )^{n}$      
    （ 注： 为了简化理解，上述式子中的 borrowIndexInit 可以取 1 )   
    $BorrowAmount = \frac {Amount} {latestBorrowIndex}$     
    $totalBorrow = BorrowAmount * latestBorrowIndex$    
    $n = 经过的块高或是时长( second )$     
    Compound Index 计算具体可参考 [Compound 合约部署](https://github.com/Dapp-Learning-DAO/Dapp-Learning/blob/main/defi/Compound/contract/Compound%E5%90%88%E7%BA%A6%E9%83%A8%E7%BD%B2.md)   

#### update_Index 逻辑
前面说过，Morpho 的目标是求取 Borrow APY ( 代码中使用 poolBorrowGrowthIndex 表示 )、 Supply APY  ( 代码中使用 poolSupplyGrowthIndex 表示 ) 以及 target APY ( 代码中使用 p2pGrowthIndex 表示 )  ，以便 Borrower 和 Supplier 都受益。  Morpho 中的 index 就是这个 target APY。  
后面使用 targetIndex 描述 target APY  
<img src=./pictures/targetAPY.png width=50% />   


对于每一个借贷 Token，会设置一个 p2pIndexCursor 和  reserveFactor。 
- p2pIndexCursor 用于计算 p2pGrowthIndex   
- reserveFactor 设置 Morpho 的 p2p 借贷手续费，这个手续费只在用户进行 p2p 借贷的时候才会收取，如果直接向 compound 借贷是不会收取这个手续费  
```
struct MarketParameters {
        uint16 reserveFactor; // Proportion of the interest earned by users sent to the DAO for each market, in basis point (100% = 10 000). The value is set at market creation.
        uint16 p2pIndexCursor; // Position of the peer-to-peer rate in the pool's spread. Determine the weights of the weighted arithmetic average in the indexes computations ((1 - p2pIndexCursor) * r^S + p2pIndexCursor * r^B) (in basis point).
    }
```
$p2pGrowthIndex = (1 - p2pIndexCursor) * poolSupplyGrowthIndex + p2pIndexCursor * poolBorrowGrowthIndex$ 

$p2pBorrowGrowthIndex = p2pIndex + (poolBorrowGrowthIndex - p2pIndex ) * reserveFactor$

$p2pSupplyGrowthIndex = p2pIndex - (p2pIndex -  poolSupplyGrowthIndex ) * reserveFactor$
$p2pSupplyIndex = p2pIndex - (p2pIndex -  poolSupplyIndex ) * reserveFactor$  

<img src=./pictures/adjustAPY.png width=50% />   

最后，得到 p2pSupplyGrowthIndex 和 p2pBorrowGrowthIndex 后，就可以计算  
$p2pSupplyIndex = p2pSupplyIndex * (1 + p2pSupplyGrowthIndex )$    
$p2pBorrowIndex = p2pBorrowIndex * ( 1 + p2pBorrowGrowthIndex )$  


#### Index 计算方式，和 $Supply_{p2p}$ ， $Supply_{pool}$ 的关系  
- Index  在 Morpho 中用于计算借款利率，贷款利率 和 Compound 中的 borrowIndex 类似
- 在 Morpho 的黄皮书中， 使用 λ 进行描述，这里为了便于理解统一使用 Index 描述。而且在 Morpho 的合约中，实际也是使用 Index 进行标识的
- $Supply_{p2p}$ ， $Supply_{pool}$  分别保存用户的 p2p 贷款基数，和 pool 贷款基数

假设 Index 以每天 20% 的速率递增   
|  | 操作 | Morpho 状态 |
| --- | --- | --- |
| 第 0 天 |     | Index = 1 |
| 第一天 | $User_{A}$ 存入 100 Dai | Index = 1 * ( 1 + 0.2 ) = 1.2   ( 首先更新 Index 后再进行其他计算  ）
$Supply_{pool}[User_{A}]$ = $\frac {100} {1.2}$ = 83.333 |
| 第二天 |  | Index = 1.2 * ( 1 + 0.2 ) = 1.44  ( 首先更新 Index 后再进行其他计算  ）
$Supply_{pool}[User_{A}]$ = 83.333 |
| 第三天 |  $User_{B}$ 存入 200 Dai | Index = 1.44 * ( 1 + 0.2 ) = 1.728 ( 首先更新 Index 后再进行其他计算  ）
$Supply_{pool}[User_{A}]$ = 83.333
$Supply_{pool}[User_{B}]$ = $\frac {200} {1.728}$ = 115.7407 |  

#### Supplier 和 Borrower 队列更新逻辑  
队列按照 Supplier （ 或是 Borrower ） 尚未匹配 p2p 的资金大小进行排序    
| Head | Second | Third | Fourth |
| --- | --- | --- | --- |
| User_A ( 100 Dai ) | User_B ( 80 Dai ) | User_C ( 60 Dai ) | User_D ( 20 Dai ) |

队列具体更新逻辑可以参考 [DoubleLinkedList.sol](https://etherscan.io/address/0xe3d7a242614174ccf9f96bd479c42795d666fc81#code)


#### 在匹配回路内允许消耗的最大的 gas     
查看用户 deposit 时的接口代码，可以看到，在接口输入中有一个 _maxGasForMatching 参数，用于设置在匹配 Borrower 时允许消耗的 gas 大小

```
/// @dev Implements supply logic.
    /// @param _poolToken The address of the pool token the user wants to interact with.
    /// @param _from The address of the account sending funds.
    /// @param _onBehalf The address of the account whose positions will be updated.
    /// @param _amount The amount of token (in underlying).
    /// @param _maxGasForMatching The maximum amount of gas to consume within a matching engine loop.
    function supplyLogic(
        address _poolToken,
        address _from,
        address _onBehalf,
        uint256 _amount,
        uint256 _maxGasForMatching
    )
```  

## Borrow  
Borrow 的接口流程伪代码如下

```
borrow(user, amount):
	update_Index()
	if amount * pθ > borrow_capacity(user):  // 判断借款金额是否超过抵押品价值
		return

	transfer(Morpho, user, initialAmount)   // 转入用户资金到 Morpho
	initialAmount = amount
	
	// Peer-to-peer borrow
	//// Promote suppliers
	matched = matchSuppliers(amount)       // 作为 Borrow 寻找匹配的 Supplier 对手方
                                         // 返回匹配到的最大资金量

	borrow_p2p(user) += matched / index_p2p    // 更新用户的 p2p borrow 基数

	amount -= matched                     // 更新 amount

	withdraw(Morpho, matched)            // 把 matched 的资金从 compound pool 中提取出来，

	// Pool borrow
	borrow_pool(user) += amount / index_pool  // 更新用户的 pool borrow 数据
	borrow(Morpho, amount)                   // 从 pool 中借出对应的金额
``` 
<img src=./pictures/borrowFlow.png width=50% />   

### 关键点解析 
- 判断用户的借款金额是否超出它的抵押品价值   
这里在 borrow_capacity 进行判断是否允许用户再次进行   
<img src=./pictures/borrowCapacity.png width=50% />  
- Borrow 流程
整体的 Borrow 流程和 Supply 类似，但是中间有一个特殊的处理  
但是随着交易的进行会出现 $P2P_{supply}$ 大于  $P2P_{borrow}$ 的情况，在下面的 repay 接口中会描述如何产生这种情况。  
在这种情况下，这部分 $\Delta {P2P_{supply}}$  是 Morpho 按照 p2p 的 supply 提供给 supplier 的, 但是实际这部资金 Morpho 又会存入到 Compound 中，按照 pool supply 的利率从 Compound 中收取利息。所以这里就会存在一个利率差  

<img src=./pictures/borrowDelta.png width=50% />      

用户在 Borrow 的时候，Morpho 会首先把这部分资金匹配给 Borrower，以减少损失  

## Withdraw  
withdraw 的接口流程伪代码如下    
```
withdraw(user, amount):
	update_index()
	if amount * Fθ * pθ > borrow_capacity(user):  // 判断 withdraw 金额是否合法
		return
	initialAmount = amount

	// Pool withdraw
	withdrawnFromPool = min(amount, supply_pool(user) * index_pool )  //优先从 compound pool 中 withdraw
	
	supply_pool(user) -= withdrawnFromPool / index_pool    // 更新用户的 pool supply 记录
	
	amount -= withdrawnFromPool                          //更新需要从 p2p pool 中提取的资金
	
	withdraw(Morpho, withdrawnFromPool)         // 从 compound pool 中提取资金

	// Promote suppliers
	matched = matchSuppliers(amount)      // 如果当前 user 作为 supplier 已经匹配了对应的 borrower
									                      // 则使用其他的 supplier 替换当前的 user 作为 p2p 的 supplier

	supply_p2p(user) -= matched / index_p2p  // 更新用户的 p2p supply 值

	amount -= matched

	withdraw(Morpho, matched)           // 提取匹配到的 replace 当前 user 的 supplier 的资金

	// Demote borrowers
	unmatched = unmatchBorrowers(amount)   // 剩余 p2p supply 资金无法找到 replace supplier 
                                         // 只能把一些 p2p borrower 降级为 pool borrower

	supply_p2p (user) -= unmatched / index_pool  // 更新 user 的 p2p supply

	borrow(Morpho, unmatched)              // 从 compound 中提取 剩余 p2p supply

	transfer(Morpho, user, initialAmount)  // 转移资金给用户
```  

### 关键点解析  
资金 withdraw 顺序    
假设当前进行 withdraw 的用户为 User_A  
- 初始状态时，Morpho 池子处于平衡状态，即所有的 Borrow 都匹配了 p2p
<img src=./pictures/supplyBorrowBalance.png width=50% /> 

- 用户 User_A 有部分资金在 p2p 中，部分资金在 pool 中
- 当 User_A 进行 withdraw 时，首先提取 User_A 在 pool 中的资金，此时所有的 Borrow 依然全部匹配 p2p
- 在讲解 Borrow 接口的时候，我们讲到会存在 $\Delta P2P_{supply}$ 的情况，那么用户在 withdraw 的时候，会优先提取这部分的资金，相当于补偿 Morpho protocl 的损失   
<img src=./pictures/supplyDelta.png width=50% /> 
    
- 之后，User_A 提取剩余 p2p 的资金 ，这里假设为 100 Dai ，同时从 pool 中寻中替代的 supplier 提供 p2p 贷款，此时所有的 Borrow 依然全部匹配 p2p
- 如果在上一个寻找替代的 p2p supplier 时，只找到 20 Dai ，那么从 Compound 中提取这 20 Dai 还给用户，对于剩余的 80 Dai 进行如下处理。  
<img src=./pictures/borrowOverFlow.png width=50% />  

- 尝试对 80 Dai 对应的 Borrower 做 unmatch 处理，即改变这些 borrower 的借款利率，使之从 p2p 模式变为 pool 模式            
<img src=./pictures/supplyMatch.png width=50% />    

- 在 unmatch 接口中，同样需要传入一个 _maxGasForMatching，用于计算在 unmatch 过程中允许消耗的最大 gas。
    
    ```solidity
    /// @notice Unmatches borrowers' liquidity in peer-to-peer for the given `_amount` and moves it to Compound.
        /// @dev Note: This function expects and peer-to-peer indexes to have been updated.
        /// @param _poolToken The address of the market from which to unmatch borrowers.
        /// @param _amount The amount to unmatch (in underlying).
        /// @param _maxGasForMatching The maximum amount of gas to consume within a matching engine loop.
        /// @return The amount unmatched (in underlying).
        function _unmatchBorrowers(
            address _poolToken,
            uint256 _amount,
            uint256 _maxGasForMatching
        ) internal returns (uint256) {
    ```
    
- 如果传入一个很小的值，那么会造成只 unmatch 部分 p2p 资金 ，这里假设 unmatch 了 20 Dai ， 那么还剩余 80 - 20 = 60 Dai 的 p2p 资金没有 unmatch。这个时候 Morpho 就会让这 60 Dai 对应的 borrower 继续保持 p2p 借贷的利率，同时记录 delta.p2pBorrowDelta 作为没有匹配到 p2p 的 borrow 资金。    
<img src=./pictures/borrowUnmatch.png width=50% />  

- 最后，从 Comound 中借出剩余的 80 Dai 还给用户。这里可以看到，实际这部分 delta.p2pBorrowDelta 是 Morpho 从 Compound 借出来，但是按照 p2p 的利率提供给 Borrow 的，这样中间就会产生一个利率差  

## Repay  
repay 的接口流程伪代码如下    
```
repay(user, amount):
	update_Index()       // 更新 Index
	if amount > borrow_p2p(user) * index_p2p + borrow_pool(user) * index_pool:
		return

	transfer(user, Morpho, amount)     // 准入用户 repay 资金到 Morpho

	// Pool repay
	repaidOnPool = min(amount, b_pool(user) * index_pool)   // 优先偿还 pool 的借贷资金
	borrow_pool(user) -= repaidOnPool / index_pool
	amount -= repaidOnPool
	repay(Morpho, repaidOnPool)

	// Promote borrowers
	matched = matchBorrowers(amount)                // 如果当前 user 是 p2p 匹配用户
	borrow_p2p(user) -= matched / index_p2p         // 则寻找 replace borrower
	amount -= matched
	repay(Morpho, matched)

	// Demote suppliers
	unmatched = unmatchSuppliers(amount)           // 对于剩余的 p2p borrower 资金,
	borrow_p2p(user) -= unmatched / index_p2p      // 如果未找到 replace borrower,
	supply(Morpho, unmatched)                      // 则尝试把对应的 p2p supplier 降级为 pool supplier
```

### 关键点解析  
#### 资金 repay 顺序

- 假设用户 pool borrow 资金为 20 Dai, p2p borrow 资金为 80 Dai。那么用户首先需要偿还 pool borrow 部分的 20 Dai 资金
    
<img src=./pictures/repayBalance.png width=50% /> 
    
- pool borrow 资金偿还后，用户剩下的 borrow 资金就是 p2p 资金，这里为 80 Dai
    
<img src=./pictures/replayMatch.png width=50% />   
    
- 更新 borrower 的 p2p 资金。
    
    这里需要注意的是，borrower 的 p2p 资金更新是在 repay p2p 之前的，因为后面更新 Morpho p2p borrow amount 的时候还需要额外计算一部分利息
    
    ```solidity
    borrowerBorrowBalance.inP2P -= Math.min(
                borrowerBorrowBalance.inP2P,
                vars.remainingToRepay.div(vars.p2pBorrowIndex)
            );
    ```
    
- 在讲 withdraw 接口的时候，我们提到在 Borrow 这边会存在 $\Delta P2P_{borrow}$ 的情况。那么这里用户进行 repay 的时候，Morpho 会检测是否存在  $\Delta P2P_{borrow}$ ，如果存在，则用户需要优先支付这部分的 borrow 资金 ，这里假设   $\Delta P2P_{borrow}$  为 10 Dai， 那么剩余需要 repay 的资金为 80 - 10 = 70 Dai。  
    
    需要注意的是，这里用户偿还  $\Delta P2P_{borrow}$   时，实际是在补偿 Morpho protocl 的亏损，而不是用户自己的   

    <img src=./pictures/repayBorrowDelta.png width=50% />  
    
- 更新 Morhpo protocl 的 p2pBorrowAmount，p2pSupplyAmount。
    
    主意这里更新全局的 p2pBorrowAmount 的时候，会把  $\Delta P2P_{supply}$ 产生的利息差计算进去进行更新
    
    ```solidity
    
    // Fee = (p2pBorrowAmount - p2pBorrowDelta) - (p2pSupplyAmount - p2pSupplyDelta).
    // No need to subtract p2pBorrowDelta as it is zero.
    vars.feeToRepay = Math.zeroFloorSub(
                    delta.p2pBorrowAmount.mul(vars.p2pBorrowIndex),
                    delta.p2pSupplyAmount.mul(vars.p2pSupplyIndex).zeroFloorSub(
                        delta.p2pSupplyDelta.mul(ICToken(_poolToken).exchangeRateStored())
                    )
                );
    
                if (vars.feeToRepay > 0) {
                    uint256 feeRepaid = Math.min(vars.feeToRepay, vars.remainingToRepay);
                    vars.remainingToRepay -= feeRepaid;
                    delta.p2pBorrowAmount -= feeRepaid.div(vars.p2pBorrowIndex);
                    emit P2PAmountsUpdated(_poolToken, delta.p2pSupplyAmount, delta.p2pBorrowAmount);
                }
    ```
    
    <img src=./pictures/repaySupplyDelta.png width=50% /> 
    
- 到这一步的时候，Morpho 池子中消除了原始存在的 $\Delta P2P_{supply}$  和 $\Delta P2P_{borrow}$  。
        
    和 withdraw 的时候类似，这个时候就是在 $Pool_{borrow}$ 中寻找替代者。
        
    但是如果找不到可以提到的 borrower 的时候，又会产生新的 $\Delta P2P_{supplyNew}$ 
        
    <img src=./pictures/repayP2P.png width=50% /> 
        
    - 对于这个  $\Delta P2P_{supplyNew}$ 继续进行处理，最直接的方式就是把这部分的 supplier 降级。这里使用 _unmatchSuppliers 进行降级处理。
        
        跟  _unmatchBorrowers 接口一样，调用时会传入一个 _maxGasForMatching，用于计算在 unmatch 过程中允许消耗的最大 gas。所以依然存在 $\Delta P2P_{supplyNew}$  无法完全消除的情况
        
        ```solidity
        /// @notice Unmatches suppliers' liquidity in peer-to-peer up to the given `_amount` and moves it to Compound.
            /// @dev Note: This function expects Compound's exchange rate and peer-to-peer indexes to have been updated.
            /// @param _poolToken The address of the market from which to unmatch suppliers.
            /// @param _amount The amount to search for (in underlying).
            /// @param _maxGasForMatching The maximum amount of gas to consume within a matching engine loop.
            /// @return The amount unmatched (in underlying).
            function _unmatchSuppliers(
                address _poolToken,
                uint256 _amount,
                uint256 _maxGasForMatching
            ) internal returns (uint256) {
        ```
        
    - $\Delta P2P_{supplyNew}$  无法完全消除时，更新 p2pSupplyDelta 的值，然后把剩余的 repay 资金转入 Compound 并结束此次处理
        
        ```solidity
        if (vars.remainingToRepay > 0) {
                    uint256 unmatched = _unmatchSuppliers(
                        _poolToken,
                        vars.remainingToRepay,
                        vars.remainingGasForMatching
                    );
        
                    // Increase the peer-to-peer supply delta.
                    if (unmatched < vars.remainingToRepay) {
                        delta.p2pSupplyDelta += (vars.remainingToRepay - unmatched).div(
                            ICToken(_poolToken).exchangeRateStored() // Exchange rate has already been updated.
                        );
                        emit P2PSupplyDeltaUpdated(_poolToken, delta.p2pSupplyDelta);
                    }
        
                    delta.p2pSupplyAmount -= unmatched.div(vars.p2pSupplyIndex);
                    delta.p2pBorrowAmount -= vars.remainingToRepay.div(vars.p2pBorrowIndex);
                    emit P2PAmountsUpdated(_poolToken, delta.p2pSupplyAmount, delta.p2pBorrowAmount);
        
                    _supplyToPool(_poolToken, underlyingToken, vars.remainingToRepay); // Reverts on error.
                }
        ```
        

## Liquidate

liquidate 的接口流程伪代码如下

```solidity
liquiate(user, amount):
	update_Index()           // 更新 Index
	liquidationAllowed()     // 判断是否可以被清算

	_unsafeRepay()         // 调用内部 repay 接口进行 repay
  _unsafeWithdraw()     // 调用内部 withdraw 接口进行 withdraw
```

### 关键点解析

- 清算逻辑  
Morpho 使用和 Compound 同样的 oracle，closeFactor 和 liquidationIncentive 进行清算，即保持和 Compound 完全相同的清算处理


## 参考链接
- https://github.com/etherhood/Morpho-Looper/blob/main/src/MorphoLooper.sol