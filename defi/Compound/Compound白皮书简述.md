一千个读者就有一千个哈姆雷特，前有[Keegan小刚](https://learnblockchain.cn/people/96)的五篇长篇巨制分析过Compound这一明星借贷产品，现在再从另一个角度来分析这一产品。
![](https://img.learnblockchain.cn/pics/20210727085513.png)

## 要解决什么问题

加密货币市场参与者无法交易其资产的时间价值。人们为什么需要利息？因为利息填补了有多余资产无处使用的人和需要资产去投资和生产的人之间的裂隙。交易资产的时间价值同时使得双方受益，并创造出了一个非零和的财富。对于区块链资产，目前有两大缺点存在：

1. 借贷机制严重受限，这导致了错误的资产价格
2. 持有区块链资产是一个负产出，由于其存储损失和高风险。

目前市面上已有两种解决方案：

1. 中心化交易所，如Bitfinex，Poloniex等，其允许用户进行期货交易，然而用户需要信任该系统，即需要信任该交易所不会被黑，也不会跑路。并且在中心化的交易所内的头寸和持仓等都是一些交易所数据库的数字而已，你不能将其直接用在以太坊上的DAPP中，如参与ICO等
2. 点对点的合约，如直接针对借贷人的抵押或者非抵押的贷款。然而去中心化的机制严重的增加了用户的成本和阻力。在市面上的所有点对点合约中，放款人需要去发布放贷信息，管理和审核贷款提议，激活贷款。并且贷款回款总是非常慢并且是非同步的（贷款必须先被还款，这需要时间）

![](https://img.learnblockchain.cn/pics/20210727085521.png)

## 如何设计模型

Compound是以太坊上的一系列合约，它建立了一组资金池，每个资金池都有基于供需的算法衍生利率。放款人和借款人都直接与合约交互，去获取利息或者支付利息。每一个资金池都包含唯一一种以太坊资产（如ETH，DAI或者其他的Augur等），并且包含有一份透明的，公众可查的账本，其记录了所有的交易和历史利率。

### 提供流动性

不同于中心化交易所或者P2P平台，其用户的资产互相匹配并直接借给另一个用户，Compound合约聚合了每一个用户提供的流动性。当用户提供一种资产时，该种资产就转换为一种可替换的资源cToken。这种方式比直接借给用户提供了显著得多的流动性。除非资金池中的所有资产都被借走，用户可以随时提走他们的资产，而不需要等待某一个特定的贷款到期。
![](https://img.learnblockchain.cn/pics/20210727085531.png)

提供给资金池的资产被转换为一个ERC-20 Token，称为cToken, 该token确保拥有者享有增值抵押资产的权力。由于资金池中利率的积累，其是一个借贷需求的函数，cToken能够换回更多的原抵押资产。

此处与Uniswap中LP token的增值逻辑类似, cToken的增值是这段时间中的利息的积累。

> 在Uniswap中，LP token在mint中被铸造出来，在burn中销毁。除开首次铸造，非首次铸造的LP token数量都是与LP token的当前总量成线性关系。LP token的价值来源于流动性的提供，即mint方法。LP token的增值逻辑是时间段($t_1$,$t_2$)间的swap交易手续费的累计。swap的交易手续费又可以表现为时间段($t_1$,$t_2$)对应的($\sqrt{k_1}$,$\sqrt{k_2}$​​)的增值。

### 借贷流动性

Compound允许用户无摩擦地从协议中借款，使用cTokens作为抵押品，在以太坊生态系统的任何地方使用。与点对点协议不同，从Compound借贷只需要用户指定所需的资产；没有任何条款需要协商，到期日或融资期；借贷是即时和可预测的。与提供资产类似，每个货币市场都有一个由市场力量设定的浮动利率，这决定了每个资产的借贷成本。
![](https://img.learnblockchain.cn/pics/20210727085538.png)

#### 抵押价值

协议持有的资产（由cToken的所有权代表）被用作向协议借款的抵押品。每个市场都有一个抵押品系数，范围从0到1，代表可以借入的基础资产价值的部分。流动性差的小盘资产的抵押品系数低；它们不是很好的抵押品，而流动性好的大盘资产的抵押品系数高。一个账户基础代币余额的价值之和，乘以抵押品系数，等于用户的借款能力。

$$
Borrowing\ Capacity =\sum{N} \cdot f
$$

用户能够借到但不超过他们的借贷能力，而且一个账户不能采取任何会使借贷资产总值超过其借贷能力的行为（例如借贷、转移cToken抵押品或赎回cToken抵押品）；这可以保护协议免受违约风险。

#### 风险和清算

如果一个账户的未偿还借款的价值超过了他们的借款能力，一部分未偿还的借款可以被偿还，以换取用户的cToken抵押品，以当前的市场价格减去清算折扣；这激励了一个套利者的生态系统迅速介入，减少借款人的风险，并消除协议的风险。

有资格被关闭的比例，即关闭因子，是可以被偿还的借款资产的部分，范围从0到1，如25%。清算过程可以继续调用，直到用户的借款少于他们的借款能力，即达到安全债务部分。

任何拥有借款资产的以太坊地址都可以调用清算功能，用他们的资产交换借款人的cToken抵押品。由于用户、资产和价格都包含在Compound协议中，清算是无摩擦的，不依赖于任何外部系统或订单簿。

![](https://img.learnblockchain.cn/pics/20210727085545.png)

### 利率模型

在每个货币市场上，compound协议不是由个别供应商或借款人就条款和利率进行谈判，而是利用一个利率模型，根据供求关系实现利率平衡。根据经济理论，当需求低的时候，利率应该是低的，反之亦然，当需求高的时候，利率应该是高的。每个市场的利用率U将供应和需求统一为一个单一的变量。

$$
资金利用率：U_a = \frac {Borrows_a} { (Cash_a + Borrows_a - Reserves_a) }
$$

需求曲线是通过治理来设置的，并表示为资金利用率的一个函数。作为一个例子，借贷利率可能类似于以下。

$$
贷款利率：a=0.025 +U_a \cdot 0.2
$$

供应商获得的利率是隐性的，等于借款利率，乘以利用率。

$$
存款利率：b=a\times U_a
$$

![](https://img.learnblockchain.cn/pics/20210727085554.png)

#### 流动性激励结构

该协议不保证流动性；相反，它依靠利率模型来激励流动性。在对资产的极端需求时期，协议的流动性（可提取或借用的代币）将下降；当这种情况发生时，利率上升，激励供应，抑制借款。

#### 利率的移动

从上面的公式可以看到，只要利用率x发生变化，则利率就会相应的移动变化。而资金利用率受铸币（供给），借贷（消费）的影响。

## 如何实现模型

在其核心，compound货币市场是一个公开账本，允许以太坊账户供应或借用资产，同时计算利息，这是一个时间函数。

### cToken

每个货币市场的资金池都是一个智能合约，实现了ERC-20代币规范。用户的余额表示为cToken余额；用户可以通过向市场提供资产来`mint（uint amountUnderlying）`cToken，或者用基础资产`redeem（uint amount）`cToken。cTokens和基础资产之间的价格（汇率）随着时间的推移而增加，因为资产的借款人会产生利息

$$
cToken的汇率: exchangeRate=\frac{underlyingBalance+totalBorrowBalance_a-reserves_a}{cTokenSupply_a}
$$

随着市场的总借贷余额`totalBorrowBalance`的增加（作为借款人应计利息的函数），cTokens和基础资产之间的汇率也会增加。

:question:为什么要减去reserves?

| Function ABI                                                 | Description                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| $mint(uint256 \ amountUnderlying) $                          | 将一个标的资产转入市场，更新msg.sender的cToken余额。         |
| $ redeem(uint256 \  amount) \\ redeemUnderlying(uint256 \ amountUnderlying)   $ | 将一个标的资产转出市场，更新msg.sender的cToken余额。         |
| $  borrow(uint \ amount)   $                                 | 检查msg.sender的抵押品价值，如果足够，将标的资产转出市场至msg.sender，并更新msg.sender的借款余额。 |
| $repayBorrow(uint \ amount) \\ repayBorrowBehalf(address \ account, uint \  amount)   $ | 将标的资产转入市场，更新借款人的借款余额。                   |
| $liquidate(address \ borrower,\\ address \  collateralAsset, uint \ closeAmount)   $ | 将标的资产转入市场，更新借款人的借款余额，然后将cToken抵押品从借款人转移到msg.sender。 |

#### mint函数

mint函数增加了cToken的供应量，从而改变了利用率U,故存款利率和借款利率都会相应移动。当存款利率和借款利率移动前，需要更新应为未付利息。

mint函数在compound中的实现很复杂，添加了很多的检查，但其实质逻辑很简单，如下：

```js
function mint(uint mintAmount) external returns (uint) {
	//检查1. 应付未付利息
    require(accrueInterest()==uint(Error.NO_ERROR));
    //检查2：审计合约是否允许该合约铸币
    require(mintAllowed(address(this), minter, mintAmount)==uint(Error.NO_ERROR));
    //检查3：检查market的区块编号是否为当前编号
    require(block.number==accureBlockNumber);
    //检查4：检查msg.sender是否有足够的token余额来transfer给minter合约
    require(checkTransferIn(minter, mintAmount));
	//计算1：计算当前的cToken兑换Token的汇率
    (,vars.exchangeRateMantissa)= exchangeRateStoredInternal();
    //存币到minter合约
    token.transferFrom(msg.sender, address(this), mintAmount);
	//计算2：根据汇率算出需要铸造的cToken的数量
    vars.mintToken = mintAmount / vars.exchangeRateMantissa;
    //生效1：更新全局变量totalSupply
    totalSupply = totalSupply + vars.mintToken;
    //生效2：更新全局变量accountTokens[minter],当前用户的余额
    accountTokens[minter] = accountTokens[minter] + vars.mintToken;
    //检查5：调用审计合约检查是否铸币成功
    comptroller.mintVerify(address(this),minter,vars.actualMintAmount,vars.mintTokens);
    //返回：铸造的cToken数量
    return vars.mintToken;
    
}
```

![](https://img.learnblockchain.cn/pics/20210727085603.png)

```js
//cErc20.sol 中mint方法
function mint(uint mintAmount) external returns (uint) {
    //调用cToken.sol中的mintInternal方法
    (uint err,) = mintInternal(mintAmount);
    return err;
}
//cToken.sol中mintInternal方法
function mintInternal(uint mintAmount) internal nonReentrant returns (uint, uint) {
	//检查应付未付利息是否为0
    (uint err) = accrueInterest();
    require(err==uint(Error.NO_ERROR), "error for accureInterest");
    //调用mintFresh方法
    return mintFresh(msg.sender, mintAmount);
}
//cToken.sol中mintFresh方法
//用户向市场提供资产，并获得cTokens作为交换。
struct MintLocalVars {
    Error err;
    MathError mathErr;
    uint exchangeRateMantissa;
    uint mintTokens;
    uint totalSupplyNew;
    uint accountTokensNew;
    uint actualMintAmount;
}
function mintFresh(address minter, uint mintAmount) internal returns (uint, uint) {
	//检查审计合约中的是否允许铸币
    // address(this)本合约即cToken.sol合约地址是cToken的合约地址
    uint err = mintAllowed(address(this), minter, mintAmount);
    require(err==Error.NO_ERROR, "not allowed");
    //验证market的区块号码是否等于当前区块号码
    require(accrualBlockNumber == block.number);
    //如果调用checkTransferIn(minter, mintAmount)失败，则失败。
    //checkTransferIn函数作用是检查该合同是否有足够的余量从`from`中转移金额，以及`from'是否有至少`amount'的余额。不做转账。
    MintLocalVars memory vars;
    vars.err = checkTransferIn(minter, mintAmount);
    require(checkTransferIn(minter, mintAmount));
    //我们得到当前的汇率，并计算出要铸造的cTokens数量。
    (vars.mathErr, vars.exchangeRateMantissa) = exchangeRateStoredInternal();
    require(vars.mathErr == Error.NO_ERROR);
    //exchangeRate = invoke Exchange Rate Stored()
    //注意：除数在必要时被四舍五入到零，因此有可能出现0个代币。
    // transfer token from minter to address(cErc20), 先转移token
    token.transferFrom(minter, address(cErc20),mintAmount);
    vars.actualMintAmount = mintAmount;
    // 除法的精度问题有可能最后铸造0个cToken
    vars.mintTokens = mintAmount / vars.exchangeRateMantissa;
    //我们计算新的cTokens总供应量和cToken代币余额。
    vars.totalSupplyNew = totalSupply + vars.mintTokens;
    totalSupply = vars.totalSupplyNew;
    vars.accountTokenNew = accountTokens[minter] + vars.mintTokens;
    accountTokens[minter] = vars.accountTokenNew;
    // 调用审计合约的mintVerify方法
    comptroller.mintVerify(address(this),minter,vars.actualMintAmount, vars.mintTokens);
    return (uint(Error.NO_ERROR), vars.mintTokens);
}
```

#### redeem函数

cToken->token, 基本上是mint函数的逆函数。

```js
//cErc20.sol 中的redeem方法
function redeem(uint redeemTokens) external returns (uint) {
    //调用redeemInternal方法
    return redeemInternal(redeemTokens);
}
//cToken.sol 中的redeemInternal方法
function redeemInternal(uint redeemTokens) internal nonReentrant returns (uint) {
    //检查应付未付利息
    require(accureInterest() == uint(Error.NO_ERROR));
    //调用redeemFresh方法
    return redeemFresh(msg.sender, redeemTokens, 0);
}
//cToken.sol 中的redeemFresh方法
struct RedeemLocalVars {
    Error err;
    MathError mathErr;
    uint exchangeRateMantissa;
    uint redeemTokens;
    uint redeemAmount;
    uint totalSupplyNew;
    uint accountTokensNew;
}
function redeemFresh(address payable redeemer, uint redeemTokensIn, uint redeemAmountIn) 
		internal 
		returns (uint) {
    //检查1：输入检查，redeemTokensIn或者redeemAmountIn必须有一个为0
    require(redeemTokensIn == 0 || redeemAmountIn == 0);
    //计算1：拿到cToken兑换Token的汇率
    RedeemLocalVars memory vars;
    (vars.err, vars.exchangeRateMantissa) = exchangeRateStoredInternal();
    //计算2：根据兑换比例，算出要兑换的token和需要的cToken数量
    if (redeemTokensIn > 0) {
        vars.redeemTokens = redeemTokensIn;
        vars.redeemAmount = vars.redeemTokens * vars.exchangeRateMantissa;
    } else {
       //只要固定数量的Token
        vars.redeemTokens = redeemAmountIn / vars.exchangeRateMantissa;
        vars.redeemAmount = redeemAmountIn;
    }
	//检查2：审计合约是否允许redeem
    require(redeemAllowed(address(this),redeemer, vars.redeemTokens)==0);
    //检查3：检查market的区块编号是否为当前编号
    require(block.number == accrualBlockNumber);
    //计算3：计算新的totalSupply和cToken 余额
    vars.totalSupplyNew = totalSupply - vars.redeemTokens;
    vars.accountTokensNew = accountTokens[redeemer] - vars.redeemTokens;
    //检查4：检查合约是否有足够的现金Token用于兑换给用户
    require(getCashPrior() >= vars.redeemAmount);
    //执行：发送token给到用户
    doTransferOut(redeemer, vars.redeemAmount);
    //生效：更新totalSupply和accountTokens[redeemer]到全局变量
    totalSupply = vars.totalSupply;
    accountTokens[redeemer] = vars.redeemAmount;
    //检查5：审计合约检查确认是否已经完成redeem
    comptroller.redeemVerify(address(this),redeemer,vars.redeemAmount,vars.redeemTokens);
    //返回
    return uint(Error.NO_ERROR);
}
```

:question: 为什么是检查-执行-生效模式，而不是检查-生效-执行呢？即如果将执行：`doTransferOut(redeemer, vars.redeemAmount);`放到生效后面，即如下所示，有什么问题吗？

```js
//生效：更新totalSupply和accountTokens[redeemer]到全局变量
totalSupply = vars.totalSupply;
accountTokens[redeemer] = vars.redeemAmount;
//执行：发送token给到用户
doTransferOut(redeemer, vars.redeemAmount);
```

![](https://img.learnblockchain.cn/pics/20210727085614.png)

#### borrow函数

borrow增加totalBorrowBalance，会改变汇率，也会改变资金利用率，从而改变借贷利率和存款利率

token->borrower

```js
//cErc20.sol borrow
function borrow(uint borrowAmount) external returns (uint) {
    //调用cToken中的borrowInternal 函数
    return borrowInternal(borrowAmount);
}
//cToken.sol borrowInternal
function borrowInternal(uint borrowAmount) internal nonReentrant returns (uint) {
    //检查1：应付未付利息
    require(accureInterest()==uint(Error.NO_ERROR));
    //调用borrowFresh方法
    return borrowFresh(msg.sender,borrowAmount);
}
//cToken.sol borrowFresh
struct BorrowLocalVars {
    MathError mathErr;
    uint accountBorrows;
    uint accountBorrowsNew;
    uint totalBorrowsNew;
}
function borrowFresh(address payable borrower, uint borrowAmount) internal returns (uint) {
    //检查1：审计合约是否允许borrow
    require(comptroller.borrowAllowed(address(this),borrower,borrowAmount)==0);
    //检查2：当前区块号码与资金池区块号码是否一致
    require(block.number == accuralBlockNumber);
    //计算1：新的借贷债务总额和该用户的借贷债务
    BorrowLocalVars memory vars;
    vars.accountBorrows = borrowBalanceStoredInternal(borrower);
    vars.accountBorrowsNew = vars.accountBorrows + borrowAmount;
    vars.totalBorrowsNew = totalBorrows + borrowAmount;
    //检查3：当前现金Token数量大于要借贷的数量
    require(getCashPrior() >= borrowAmount);
    //执行1：转给借贷者相应的token数量
    doTransferOut(borrower, borrowAmount);
    //生效1：将借贷债务总额和用户的借贷债务写入全局变量
    totalBorrows = vars.totalBorrowsNew;
    accountBorrows[borrower].principal = vars.accountBorrowsNew;
    accountBorrows[borrower].interestIndex = borrowIndex;
    //检查4：审计合约检查是否有效的借出token
    comptroller.borrowVerify(address(this),borrower,borrowAmount);
    return uint(Error.NO_ERROR);
}
```

![](https://img.learnblockchain.cn/pics/20210727085622.png)

#### repayBorrow函数

borrower->pay token->compound

```js
//cERC20.sol
function repayBorrow(uint repayAmount) external returns (uint) {
	(uint err, ) = repayBorrowInternal(repayAmount);
	require(err == uint(Error.NO_ERROR));
	return uint(Error.NO_ERROR);
}
//cToken.sol repayBorrowInternal
//偿付自己的债务
function repayBorrowInternal(uint repayAmount) internal nonReentrant returns (uint, uint) {
	//检查1：应付未付利息
	require(accureInterest() == uint(Error.NO_ERROR));
	repayBorrowFresh(msg.sender,msg.sender,repayAmount);
}
//代为偿还他人的债务
function repayBorrowBehalfInternal(address borrower, uint repayAmount) 
	internal 
	nonReentrant 
	returns (uint, uint) 
{
	//检查1：应付未付利息
	require(accureInterest() == uint(Error.NO_ERROR));
	repayBorrowFresh(msg.sender,borrower,repayAmount);
}

//cToken.sol repayBorrowFresh
struct RepayBorrowLocalVars {
    Error err;
    MathError mathErr;
    uint repayAmount;
    uint borrowerIndex;
    uint accountBorrows;
    uint accountBorrowsNew;
    uint totalBorrowsNew;
    uint actualRepayAmount;
}
function repayBorrowFresh(address payer, address borrower, uint repayAmount) 
	internal 
	returns (uint, uint) 
{
	//检查1：审计合约允许偿还债务
    require(
        comptroller.repayBorrowAllowed(address(this),payer,borrower,repayAmount)==uint(Error.NO_ERROR)
    );
    //检查2：当前区块号码与资金池的区块号码是否一致
    require(block.number == accurualBlockNumber);
    //计算1：计算欠款人债务总额，含应付未付利息
    RepayBorrowLocalVars memory vars;
    //计算1：拿到债务人的当前债务编号
    vars.borrowerIndex = accountBorrows[borrower].interestIndex;
    vars.accountBorrows = borrowBalanceStoredInternal(borrower);
    if (repayAmount == -1) {
        //偿还全部债务
        vars.repayAmount = vars.accountBorrows;
    } else {
        //偿还repayAmount数量的债务
        vars.repayAmount = repayAmount;
    }
    //检查3：检查是否有足够的token余额以便于打款到本合约
    require(checkTransferIn(underlying,payer,repayAmount) == uint(Error.NO_ERROR));
    //计算2：更新后的债务总额和债务人的债务总额
    vars.accountBorrowsNew = vars.accountBorrows - vars.repayAmount;
    vars.totalBorrowsNew = totalBorrows - vars.repayAmount;
    //执行：将token打款到本合约
    vars.actualRepayAmount = doTransferIn(payer, vars.repayAmount);
    //生效1：将更新后的债务总额和债务人的债务总额写入全局变量
    totalBorrows = vars.totalBorrowsNew;
    accountBorrows[borrower].principal = vars.accountBorrowsNew;
    accountBorrows[borrower].interestIndex = borrowIndex;
    //检查4：审计合约审核是否已经完成repayBorrow
    comptroller.repayBorrowerVerify(address(this),payer,borrower,vars.repayAmount,vars.borrowerIndex);
    return (uint(Error.NO_ERROR), vars.actualRepayAmount);
}
```

![](https://img.learnblockchain.cn/pics/20210727085631.png)

#### liquidate函数

token In,cToken out

```js
//cErc20.sol
function liquidateBorrow(address borrower, uint repayAmount, CTokenInterface cTokenCollateral) 
	external 
    returns (uint) 
{
    (uint err, ) = liquidateBorrowInternal(borrower,repayAmount,cTokenCollateral);
    return err;
}
//cToken.sol liquidateBorrowInternal
function liquidateBorrowInternal(address borrower, uint repayAmount, CTokenInterface cTokenCollateral) 
	internal 
    nonReentrant 
    returns (uint, uint) 
{
    //检查1：应付未付利息
    require(accrueInterest() == uint(Error.NO_ERROR));
    //检查2：cTokenCollateral的应付未付利息 Collateral-抵押品，担保物
    require(cTokenCollateral.accrueInterest() == uint(Error.NO_ERROR));
    
    return liquidateBorrowFresh(msg.sender, borrower,repayAmount,CTokenCollateral);
}
//cToken.sol liquidateBorrowsFresh
function liquidateBorrowFresh(address liquidator, address borrower, uint repayAmount, CTokenInterface cTokenCollateral) 
	internal 
    returns (uint, uint) 
{
    //检查1：审计合约是否允许执行清算
    require(
        comptroller.liquidateBorrowAllowed(
            address(this),
            cTokenCollateral,
            liquidator,
            borrower,
            repayAmount) == uint(Error.NO_ERROR)
    );
    //检查2：当前区块编号与资金池中记录区块编号是否一致
    requrie(block.number == accrualBlockNumber);
    //检查3：当前区块编号与cTokenCollateral资金池中记录区块编号是否一致
    require(block.number == cTokenCollateral.accrualBlockNumber());
    //检查4：清算者不能是借款人自己
    require(liquidator != borrower);
    //检查5：还款金额不能为0，还款金额不能为-1
    require(repayAmount != 0);
        //问题：uint怎么与-1比较？
    require(repayAmount != uint(-1));
    //计算1：计算需要分发给清算者的cToken数量，即扣除债务人的cToken数量
    (uint err, uint seizeTokens) = 	
        comptroller.liquidateCalculateSeizeTokens(address(this),cTokenCollateral,repayAmount);
    require(err == uint(Error.NO_ERROR));
    //检查6：要扣除的cToken数量必须要小于等于债务人的cToken余额
    require(seizeTokens <= cTokenCollateral.balanceOf(borrower));
    //执行：执行代偿还token
    (uint err, ) = repayBorrowFresh(liquidator, borrower, repayAmount);
    require(err == uint(Error.NO_ERROR));
    //执行：执行代发cToken给清算者
    //为防止重进入攻击，这里区分cTokenCollateral cToken抵押合约是否就是cTokenBorrowed cToken借贷合约
    if (address(this) == address(cTokenCollateral)) {
    	require(seizeInternal(address(this), liquidator, borrower, seizeTokens) ==
                uint(Error.NO_ERROR));    
    } else {
	    require(cTokenCollateral.seize(liquidator,borrower,seizeTokens) == uint(Error.NO_ERROR));
    }
    //检查7：审计合约审计是否清算成功
    comptroller.liquidateBorrowVerify(
        address(this),
        cTokenCollateral,
        liquidator,
        borrower,
        repayAmount,
        seizeTokens);
    return (uint(Error.NO_ERROR), seizeTokens);
    
}
```

#### seize 函数

将债务人的cToken传送给清算者

```js
function seizeInternal(address seizerToken, address liquidator, address borrower, uint seizeTokens) 
	internal 
	returns (uint) 
{
	//检查1：审计合约允许执行扣除
	require(comptroller.seizeAllowed(address(this),msg.sender,liquidator,borrower,seizeTokens) == uint(Error.NO_ERROR));
	//检查2：债务人不能是清算人
	require(borrower != liquidator);
	//计算1：新的债务人和清算人余额
	uint borrowerTokenNew = accountTokens[borrower] - seizeTokens;
	uint liquidatorTokenNew = accountTokens[liquidator] + seizeTokens;
	//生效1：将债务人和清算人的新的余额写入全局变量
	accountTokens[borrower] = borrowerTokenNew;
	accountTOkens[liquidator] = liquidatorTokenNew;
	//检查3：审计合约审计是否扣款成功
	comptroller.seizeVerify(address(this),msg.sender,liquidator,borrower,seizeTokens);
}
```

### 利率机制

compound货币市场是由一个利率定义，统一适用于所有借款人的借贷协议，随着时间的推移，供求关系的变化而调整。
![](https://img.learnblockchain.cn/pics/20210727085638.png)

每个利率的历史，对于每个货币市场来说，都是由利率指数，即`borrowIndex`来记录的，每次利率的变化都是由用户铸造mint、赎回redeem、借入borrow、偿还repayBorrow或清算liquidate资产所导致的。

$$
资金利用率：U_a = \frac {Borrows_a} { (Cash_a + Borrows_a) }
$$

$$
贷款利率：a=0.025 +U_a \cdot 0.2
$$

$$
存款利率：b=a\times U_a
$$

| 方法        | 资金利用率变化                    | 利率变化                   |
| ----------- | --------------------------------- | -------------------------- |
| mint        | $Cash \uparrow$, $U_a \downarrow$ | $a \downarrow,b\downarrow$ |
| redeem      | $Cash \downarrow, U_a \uparrow$   | $a\uparrow,b\uparrow$      |
| borrow      | $Borrows\uparrow,U_a\uparrow$     | $a\uparrow,b\uparrow$      |
| repayBorrow | $Borrows\downarrow,U_a\downarrow$ | $a\downarrow,b\downarrow$  |
| liquidate   | $Borrows\downarrow,U_a\downarrow$ | $a\downarrow,b\downarrow$  |

#### 市场动态

##### 利率指数

每次交易发生时，该资产的利率指数都会被更新，以复利的方式计算自上一次指数以来的利息，使用的是以区块为单位的期间利息，以每块的利率计算。

$$
Index_{a,n} = Index_{a,(n-1)} \times (1 + borrowRate_n \cdot \Delta blocks)
$$

可以改写为：

$$
\begin{cases}
Index_{a,n} = \prod_{i=1}^n (1 + borrowRate_i \cdot \Delta blocks) &n>0\\
Index_{a,0}=c \ (c>0)&n=0
\end{cases}
$$

则两个时间点之间的利率积累可以表示为：

$$
\frac{Index_{a,y}}{Index_{a,x}}=\prod_{i=x}^y (1+borrowRate_i\cdot\Delta blocks)
$$

市场的总借贷余额被更新以包括自上一次指数以来的利息。即利息也是要产生利息的，复利。

$$
totalBorrowBalance_{a,n} = totalBorrowBalance_{a,(n-1)} \times (1 + borrowRate_n \cdot \Delta blocks)
$$

一部分应计利息被保留（预留）为储备金，由储备金因子决定，范围从0到1。

$$
reserves_a = reserves_{a,(n-1)} + totalBorrowBalance_{a,(n-1)} \times (borrowRate_n \cdot \Delta blocks \cdot reserveFactor)
$$

##### accrueInterest 函数

我们在每次操作时都会计入利息并更新借款指数。这增加了复利，接近真实值，而不管其余的操作是否成功与否。

这将计算从上一个检查点的区块到当前区块的应计利息，并将新的检查点写入存储。

```js
struct AccrueInterestLocalVars {
    MathError mathErr;
    uint opaqueErr;
    uint borrowRateMantissa;
    uint currentBlockNumber;
    uint blockDelta;

    Exp simpleInterestFactor;

    uint interestAccumulated;
    uint totalBorrowsNew;
    uint totalReservesNew;
    uint borrowIndexNew;
}
function accrueInterest() public returns (uint) {
    AccrueInterestLocalVars memory vars;
    // 拿到总的现金数量
	uint totalCash = getCashPrior();
    // 拿到目前利率模型的借贷利率
    vars.borrowRateMantissa = 
        interestModel.borrowRate(address(this),totalCash,totalBorrows,totalReserves);
    // 计算1：算出累计的区块对应的复利因子
    vars.currentBlockNumber = getBlockNumber();
    vars.blockDelta = vars.currentBlockNumber - accrualBlockNumber;
    vars.simpleInterestFactor = vars.blockDelta * vars.borrowRateMantissa;
    // 状态1：更新状态借贷因子
    vars.borrowIndexNew = borrowIndex * (1 + vars.simpleInterestFactor);
    // 计算2：累计利息
    vars.interestAccumulated = totalBorrows * vars.simpleInterestFactor;
    // 计算3：存款额度和债务总额
    vars.totalBorrowsNew = totalBorrows + vars.interestAccumulated;
    vars.totalReservesNew = totalReserves + varss.interestAccumulated * reserveFactorMantissa;
    // 状态：更新状态信息
    accuralBlockNumber = getBlockNumber();
    borrowIndex = vars.borrowIndexNew;
    totalBorrows = vars.totalBorrowsNew;
    totalReserves = vars.totalReservesNew;
    
    return uint(Error.NO_ERROR);
}
```

#### 借款人动态

利率指数 time_0->time_1

$$
\frac{Index_{a,time1}}{Index_{a,time0}}=\prod_{i=time0}^{time1} (1+borrowRate\cdot\Delta blocks)
$$

一个借款人的余额，包括应计利息，应该是当前指数除以用户余额最后一次检查点时的指数的比率。

$$
borrowCurrent=\frac{Index_{a,time1}}{Index_{a,time0}}=\prod_{i=time0}^{time1}(1+borrowRate\cdot \Delta blocks)
$$

当借贷被创建时，我们将当前利率指数和债务数量进行保存。无论何时一笔涉及到该借贷的债务数量的交易发生时，我们首先计算新的该账户的债务数量，基于这段时间累计的利息等。为了确定到底有多少利息积累，我们拿到当前的利率指数，并将其与之前存入账户借贷的利率指数进行对比，得到的比例即为单位美金所累计的利息。通过这笔新的利息，我们计算得到新的账户债务数量并将其与当前利率指数一起保存进入账户借贷中。

$$
effectiveRate=\frac{borrowIndex_{i+\Delta blocks}}{borrowIndex_i}=\prod_{i=time0}^{time1}(1+borrowRate\cdot \Delta blocks)
$$

$$
principal_{i+\Delta blocks}=principal_i\cdot effectiveRate
$$

$$
borrowIndex_{i+\Delta blocks}=borrowIndex_i
$$

```js
//cToken.sol borrowBalanceStored
function borrowBalanceStoredInternal(address account) 
	internal 
    view 
    returns (MathError, uint) 
{
    //作用是返回该账户对应的借款数额 
    //return accountBorrow[account].princlpal? 需要考虑这段时间积累的利息。
    //并不假设市场反应最新的状态
    //计算1：从cToken合约中拿到borrowBalance和borrowIndex
    BorrowSnapshot storage borrowSnapshot = accountBorrows[account];
    //判断1：如果借贷数量为0，则对应的利率指数也大概率为0
    if(borrowSnapshot.principal == 0) {
        return (uint(Error.NO_ERROR),0);
    }
    //计算2：根据当前利率指数和之前利率指数算出当前借款总额
    uint recentBorrowBalance = borrowSnapshot.principal * borrowIndex / borrowSnapshot.interestIndex;
    return (uint(Error.NO_ERROR),recentBorrowBalance);
}
```

cToken中每个借款人地址的余额被存储为一个账户检查点。帐户检查点是一个 Solidity 元组 `<uint256 balance, uint256 interestIndex>` . 这个元组描述了最后一次应用于该账户的利息时的余额。

```js
accountBorrows[borrower].principal = vars.accountBorrowsNew;
accountBorrows[borrower].interestIndex = borrowIndex;
```

### 借贷

一个希望借款并且在 Compound 中有足够余额的用户可以在相关的 cToken 合同上调用 `borrow(uint amount)` 。这个函数调用将检查用户的账户价值，如果有足够的抵押物，将更新用户的借款余额，将代币转移到用户的以太坊地址，并更新货币市场的浮动利率。

借款的计息方式与上面计算余额的方式完全相同；借款人有权在任何时候偿还未偿还的贷款，通过调用`repayBorrow(uint amount)`来偿还未偿还的余额。
![](https://img.learnblockchain.cn/pics/20210727085647.png)

:question:借贷中，质押cToken的部分在哪里？

:bed: 检查质押部分是在其第一个检查：`comptroller.borrowAllowed`函数中进行检查

其中，`getHypotheticalAccountLiquidityInternal`函数非常的关键，它事实上检查了实时状态下的该账户所对应的所有cToken的资产价值总和和借贷的token的资产价值总和，并通过对比cToken的资产价值和借贷的token价值和，来判断用户是否还可以继续借贷。

由于是比较的是cToken对应的资产价值和借贷的token价值总和，故其调用了预言机，来获取cToken对应的token的实时价格。

当用户借贷borrow时，其将要借贷的这笔token的价值也考虑在了总的借贷token总价值中；

当用户赎回redeem时，其将要赎回的这笔token的价值也考虑在了总的借贷token总价值中。
![](https://img.learnblockchain.cn/pics/20210727090148.png)

```js
//ComptorllerG1.sol -> 第一个版本的实现，后面版本新增了很多其他的功能，这里我们只关注最核心的逻辑 
function borrowAllowed(address cToken, address borrower, uint borrowAmount) external returns (uint) {
	//检查1：如果cToken没有上线则直接失败
    require(markets[cToken].isListed);
    //检查2：policy hook?
    
    //检查3：如果借款人在该资产中没有会员
    require(markets[cToken].accountMemberShip[borrower]);
    //检查4：如果预言机的价格为0
    require(oracle.getUnderlyingPrice(CToken(cToken)) != 0);
    //计算1：计算账户流动性，即可借款额度，看是否触发清算
    (Error err,uint liquidity,uint shortfall) = 
        getHypotheticalAccountLiquidityInternal(borrower,cToken,0,borrowAmount);
    //检查5：err 和 shortfall
    require(err == Error.NO_ERROR);
    require(shortfall == uint(Error.NO_ERROR));
    return uint(Error.NO_ERROR);
}
```

```js
//comptrollerG1.sol -> 计算账户流动性,通过这个函数要给出该账户是否能够借到borrowAmount数量的token值
struct AccountLiquidityLocalVars {
    uint sumCollateral;
    uint sumBorrowPlusEffects;
    uint cTokenBalance;
    uint borrowBalance;
    uint exchangeRateMantissa;
    uint oraclePriceMantissa;
    Exp collateralFactor;
    Exp exchangeRate;
    Exp oraclePrice;
    Exp tokensToEther;
}
function getHypotheticalAccountLiquidityInternal(
    address account,
    CToken cTokenModify,
    uint redeemTokens,
    uint borrowAmount) internal view returns (Error, uint, uint) 
{
	AccountLiquidityLocalVars memory vars;
    uint liquidity;
    uint shortfall;
	 //对于该账户对应的每一个资产，都进行如下计算：
        //mapping(address => CToken[]) public accountAssets;
	CToken[] memory cTokens = accountAssets[account];
    for (uint i = 0; i < cTokens.length; i++) {
        CToken cToken = cTokens[i];
        //拿到cToken的余额
        vars.cTokenBalance = cToken.balanceOf(account);
        //拿到账户在cToken上的借贷数量
        vars.borrowBalance = cToken.borrowBalanceStored(account);
        //拿到cToken对话Token的汇率
        vars.exchangeRateMantissa = cToken.exchangeRateStored();
        vars.exchangeRate = (vars.exchangeRateMantissa << 18);
        //拿到cToken的抵押因子
        vars.collateralFactor = (markets[cToken].collateralFactorMantissa() << 18);
        //拿到预言机的token价格
        vars.oraclePriceMantissa = oracle.getUnderlyingPrice(cToken);
        vars.oraclePrice = (vars.oraclePriceMantissa << 18);
        require(vars.oraclePrice != 0);
        //拿到单位cToken对应的美元价格=抵押因子*汇率*价格
        uint tokensToDollars = vars.collateralFactor * vars.exchangeRate * vars.oraclePrice;
        //拿到cToken对应的价值总和
        vars.sumCollateral = vars.sumCollateral + tokensToDollars * vars.cTokenBalance;
        //拿到cToken账户借贷的token价值总和
        vars.sumBorrowPlusEffects = vars.sumBorrowPlusEffects + vars.oraclePrice * vars.borrowBalance;
        if (cToken == cTokenModify) {
            //赎回的影响
            vars.sumBorrowPlusEffects += tokensToDollars * redeemTokens;
            //借贷的影响
            vars.sumBorrowPlusEffects += vars.oraclePrice * borrowAmount;
            }
    } 
    if (vars.sumCollateral > vars.sumBorrowPlusEffects) {
        liquidity = vars.sumCollateral - vars.sumBorrowPlusEffects;
        shortfall = 0;
        return (Error.NO_ERROR, liquidity, 0);
    } else {
        liquidity = 0;
        shortfall = vars.sumBorrowsPlusEffects - vars.sumCollateral;
        return (Error.NO_ERROR, 0, shortfall);
    }
    
}
```

### 清算

如果一个用户的借款余额超过了他们的总抵押物价值（借款能力），由于抵押物的价值下降，或借款资产的价值增加，公共函数

`liquidate(address target, address collateralAsset, address borrowAsset, uint closeAmount）`可以被调用，它以略高于市场的价格将调用用户的资产与借款人的抵押品交换。

:question:清算中，最重要的一个概念是找到可清算部分的债务，不能清算用户的安全债务. 其也通过调用`getHypotheticalAccountLiquidityInternal`来找到对应的shrotfall数量。
![](https://img.learnblockchain.cn/pics/20210727090159.png)

```js
//comptrollerG1.sol
function liquidateBorrowAllowed(
    address cTokenBorrowed,
    address cTokenCollateral,
    address liquidator,
    address borrower,
    uint repayAmount) external returns (uint) 
{
    //检查1：cTokenBorrowed或者cTokenCollateral上线
	require(markets[cTokenBorrowed].isListed() || markets[cTokenCollateral].isListed());
    //policy hook
    //拿到借款人的账户流动性，即可借款额度，看是否触发清算
    (Error err,uint liquidity, uint shortfall) = getAccountLiquidityInternal(borrower);
    require(err == Error.NO_ERROR);
    require(shortfall != 0);
    //债务人账户必须要shortfall，否则无法被清算
    //拿到债务人的债务余额
    uint borrowBalance = CToken(cTokenBorrowed).borrowBalanceStored(borrower);
    uint closeFactor = (closeFactorMantissa << 18);
    uint maxCloseValue = borrowBalance * closeFactor;
    require(repayAmount <= maxCloseValue);
    
    return uint(Error.NO_ERROR);
    
}
```

### 预言机

一个Price Oracle维护每个支持的资产的当前汇率；Compound协议将设置资产价值的能力委托给一个委员会，该委员会汇集了前10个交易所的价格。这些汇率用于确定借款能力和抵押品要求，并用于所有需要计算账户价值当量的功能。

### 审计合约

Compound协议默认不支持特定的代币；相反，市场必须被列入白名单。这是通过一个管理函数`supportMarket(address market, address interest rate model)`完成的，它允许用户开始与资产互动。为了借入一项资产，必须有一个来自Price Oracle的有效价格；为了使用一项资产作为抵押品，必须有一个有效的价格和一个collateralFactor。

每个函数的调用都是通过一个政策层来验证的，这个政策层被称为 "审计官"；这个合同在允许用户行动进行之前，对抵押品和流动性进行验证。

**各位兄弟姐妹们，关注如下公众号，分享更多有意思的文章**

![image20210723193312815.png](https://img.learnblockchain.cn/attachments/2021/07/onO5Mgso60fed4ac347e0.png)

**点赞 点赞 点赞！点赞的人最帅**
