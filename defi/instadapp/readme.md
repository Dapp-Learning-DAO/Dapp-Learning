# Instadapp


## code analysis
1. InstaIndex: This is the Main Contract for all the Defi Smart Accounts. Used to create a new Defi Smart Account for a user and run a cast function in the new smart account.

2. InstaImplementationM1: This contract contains most core functions of smart account name cast(). It is only called by owners of smart accounts and has full-fledge access over the smart account. Used also to access all the DSA.

3. build(owner, accountVersion, _origin) 
Create a DSA Account using this function. It returns the address of the DSA account created.

4. cast(_targets, _datas, _origin) 
Using cast() user can access the connectors, which allows the smart account to interact with protocols or set up any settings on the smart account.


Connectors are standard proxy logics contract that let DeFi Smart Account (DSA) interact with various smart contracts, and make the important actions accessible like cross protocol interoperability. 



- Index: This is the Main Contract for all the DeFi Smart Accounts. Used for creating a new DeFi Smart Account of a user and to run a cast function in the new smart account.

- InstaList: Maintains a registry of all the DeFi Smart Account users using a Linked List. Using the user’s address, a smart account Id is created which is later mapped to get a smart account address. With this address, an account link is created which is utilised to add and remove accounts from the LinkedList.

- InstaAccounts: It’s the DeFi Smart Account Wallet. All smart accounts that are created are a clone of this contract.

- InstaConnectors: Holds a registry of all the Connectors associated with InstaDapp. An array of all the connectors is maintained using their address.

- InstaMemory: All the data (bytes, uint, address and Storage Id) for the cast function are stored in this contract.


# instadapp lite 

## v1 code analysis 

usr  ->  ieth  -> DSA -> aave 
User interaction contract: 0x8140725f7bda9484e20a86b9ed76cd39748824d6   ethwrapper
**iETH v1:**
0xc383a3833a87009fd9597f8184979af5edfad019   (system parameters)
Implement:  https://etherscan.io/address/0x79a043f68547dff57f4f5f30115d76bf01e8fdfc#code
code:       https://etherscan.deth.net/address/0x79a043f68547dff57f4f5f30115d76bf01e8fdfc#code 
vaultDSA:  0x94269A09c5Fcbd5e88F9DF13741997bc11735a9c 
Rebalance contract:  https://etherscan.io/address/0xcfcdb64a551478e07bd07d17cf1525f740173a35#code



#### supply 方法：
1. 如果是eth，则将将eth在1inch兑换成steth
2. 调用ethVault.supply方法，传入steth数量，返回itoken数量；
3. InstaVault： 0xc383a3833A87009fD9597F8184979AF5eDFad019 
主要调用supplyInternal 方法
   - getCurrentExchangePrice 获取当前的ieth的兑换率；并更新当前的ieth兑换率以及协议收益revenue；
   - vtokenAmount_ = (amount_ * 1e18) / exchangePrice_; mint出vtokenAmount_数量发送给用户。


### withdraw方法：
 withdraw(uint256 amount_, address to_)
1. 调用withdrawInternal(amount_, to_, false);
    - getCurrentExchangePrice获取当前汇率
    - updateStorage(exchangePrice_, newRevenue_) 更新汇率以及协议收益revenue;
    - 根据汇率计算出可提steth数量
    - burn itoken
    - 收取万一的withdraw fee，得出最终可提数量，
    调用 withdrawFinal(uint256 amount_, bool afterDeleverage_) 方法
      - 调用netAssets()，获取vault和 vaultDSA 各自steth,weth余额；
      - 如果afterDeleverage_为false， 则保证金率需要5%以上， 如果为true，保证金率需要10%以上，maxLimit最大负债率为72%；
      - 计算最大可借债务：colCoveringDebt_ = ((netBorrow_ * 10000) /(ratios.maxLimit - margin_)); 
      - 检查用户可提取amount需要小于balances_.totalBal + netCollateral_ - colCoveringDebt_，即系统最大可提取金额；
      - 提款顺序： 优先提vault的weth， steth, 再提 vaultDSA的weth， steth, 然后从借贷协议取； 计算出各个vault可提取transferAmts_[5]；
      - 调用withdrawTransfers(uint256 amount_, uint256[] memory transferAmts_)
           returns (uint256 wethAmt_, uint256 stEthAmt_) 执行转账操作，返回要转的weth和steth金额；aave提取的钱以及vaultDSA的钱都会返回到vault合约。最后由vault合约转给用户；
            
      - 调用validateFinalRatio检查协议安全系数； maxIsOk_，以及hfIsOk_；  
      - 如果afterDeleverage_是true，还要检查minGapIsOk_， 是否满足最小借债率要求；  



### leverage 方法 
function leverage(uint256 amt_) external nonReentrant 
// If ratio is below then this function will allow anyone to swap from steth -> weth.  seth->weth
1. 扣除swapfee后（目前是0）， 用户转入amt_ 的steth;
2. 计算vault当前weth，以及steth数量；
3. 如果weth充足，直接转给用户weth； 函数返回
4. 如果不足，则将vault的所有steth充入vaultDsa，然后将steth一起deposit到aave，borrow剩余的weth，返回给用户；
5. 并检查validateFinalRatio。 maxIsOk_，minIsOk_最大和最小负债率。



### deleverage 方法 
 function deleverage(uint256 amt_) external nonReentrant
//If ratio is above then this function will allow anyone to payback WETH and withdraw astETH to msg.sender at 1:1 ratio.
// weth -> steth, 减少池子在aave的债务。
1. 调用deleverageInternal方法， 
   - vault合约将用户的weth转入到vaultDSA;
   - 先偿还aave上amt的的weth债务，
   - 如果不是DSA，直接从aave提取加上deleverage fee的amt weth， 然后转steth给用户。
   - 如果用户是DSA，则从vaultDSA直接提取astethToken给用户。 
2.  检查validateFinalRatio。 minGapIsOk_最小负债率


### rebalanceOne 
 方法：leverage and rebalance the position.增加负债，平衡仓位；
 rebalanceOne(
        address flashTkn_,
        uint256 flashAmt_, 
        uint256 route_,             // flashloan route
        address[] memory vaults_, // leverage using other vaults
        uint256[] memory amts_,
        uint256 excessDebt_,     //增加债务 weth
        uint256 paybackDebt_,    //减少债务 weth
        uint256 totalAmountToSwap_,  // 1inch swap  steth ->weth
        uint256 extraWithdraw_,      //提款
        uint256 unitAmt_,           //swap slippage
        bytes memory oneInchData_
    )
    
    1. functionDelegateCall 方法rebalancerModuleAddr： https://etherscan.io/address/0xcfcdb64a551478e07bd07d17cf1525f740173a35#code 
    2. 一系列检查， 不能同时增加债务和偿还债务， 不能同时swap和偿还债务，
    3. getIdealBalances 获取vault和vaultDSA weth,steth空余余额,以及闲置总余额；
    4. 如果weth，steth大于0.0001， 转入到vaultDSA;
    5. 如果是excessDebt_，增加债务，在aave存入flashTkn_，flashAmt_借出excessDebt_ weth债务，
       如果vaults_不为空； 
       循环调用vaults的deleverage方法，转入weth，换取steth，帮助 vaults降低杠杆；
       如果totalAmountToSwap_不为空，则调用1inch接口，卖出stEthAddr换steth，然后存入aave。
       excessDebt_存在，则从aave再withdraw flashTkn_,flashAmt_, 然后flashPayback。偿还闪电贷。 
    6. 检查validateFinalRatio



###  rebalanceOne
// 调仓使得仓位更安全， 方便用户退出，   
 function rebalanceTwo(
        uint256 withdrawAmt_,
        address flashTkn_,
        uint256 flashAmt_,
        uint256 route_,
        uint256 totalAmountToSwap_,
        uint256 unitAmt_,
        bytes memory oneInchData_
    ) external  
    
   1.  validateFinalRatio()获取hf，安全则设置2%滑点，不安全5%
   2. getIdealBalances 获取vault和vaultDSA weth,steth空余余额,以及闲置总余额；
   3. 将空闲资金转入vaultDSA;
   4. 使用闪电贷，卖出steth，买入weth；偿还债务
   5. 检查validateFinalRatio



## instadapp lite v2 code analysis 

v2 function description 
1. ERC-4626 Standard
2. Multi-protocol Strategy
3. Improved Withdrawals 
4. Rebalancers

The Rebalancer can carry out the following transactions on the vault:
- deposit
deposit assets from the vault into a protocol whenever the vault has excess deposit
- withdraw 
withdraw assets  from protocol back to vault;  It can only happen as per the max ratios;
- leverage 
leveraging the assets to earn greater yield  as per the max ratio
- Refinance
 move assets between protocols;
When you deleverage the vault, the vault unwinds by selling stETH collateral to repay ETH debt. When issuing a deleverage there will be increased gas costs as the transaction uses a flashloan to unwind the vault and withdraw your deposit.

**for User** 
Deleveraging:  If for any reason there is not enough liquidity in the withdraw pool or you want to withdraw more than is available, you still redeem your balance by forcing a deleverage to the vault.


**iETH v2**
0xA0D3707c569ff8C87FA923d3823eC5D81c98Be78 
Implement: https://etherscan.io/address/0x172455d14d1eb242e6f7f3b451529ab289095bb6#code



## Reference
- Introducing Lite v2: https://blog.instadapp.io/introducing-lite-v2/