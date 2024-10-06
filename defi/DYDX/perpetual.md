## DYDX Perpetual

### 永续合约
合约代码
https://github.com/dydxprotocol/perpetual  
文档：
https://docs.dydx.exchange/#general

### 代码解析

#### 一、DYDX合约

`// 全局 Storage  
```
contract P1Storage is  
    Adminable,
    ReentrancyGuard
{
    // 用户仓位：User => [marginIsp, positionIsp, margin, position]
    mapping(address => P1Types.Balance) internal _BALANCES_;
    A 1000U
    B 1000U
    Price 2000
    A 开多 B 开空  1
    A = {
        false,
        true,
        1000,
        1,
    }
    Pos = 
    Neg = 
    NetValue = 2000 - 1000 = 1000
    B = {
        true,
        false,
        3000,
        1
    }
    NetValue = 3000 - 2000 = 1000
    NetValue < 0   underwater  (Delevaerage 的 Maker)
    NetValue = Pos - Neg * _MIN_COLLATERAL_ < 0 (Liquitaion 的 Maker)
    // 用户自己的资金费率参数：User => [ts, isPositive, value]
    // 单位Positon 的资金费率
    mapping(address => P1Types.Index) internal _LOCAL_INDEXES_;
    用户开仓时： 1000
    收取的时候：1050
    （1050 - 1000） * positon
    // operator
    // Trade时的 trader
    mapping(address => bool) internal _GLOBAL_OPERATORS_;
    // 用户自己设定的管理员   user - operator - true
    mapping(address => mapping(address => bool)) internal _LOCAL_OPERATORS_;
    **// Margin Token （保证金）    address internal _TOKEN_;**    // 预言机 地址
    // 1、资金费率的结算
    // 2、判定是否可以清算和underwarter
    address internal _ORACLE_;
    // 资金费率预言机 地址
    // 预言机里读到速率  速率 * 时间
    address internal _FUNDER_;
    // 全局资金费率参数 [ts, isPositive, value]
    P1Types.Index internal _GLOBAL_INDEX_;
    // 1.01 * 1E18  负数比分乘以这个
    uint256 internal _MIN_COLLATERAL_;
    // True-关停，进行了总结算
    bool internal _FINAL_SETTLEMENT_ENABLED_;
    // 关停后-总结算的价格
    uint256 internal _FINAL_SETTLEMENT_PRICE_;
}
// 结构体
struct Index { //
    uint32 timestamp; // 结算时间
    bool isPositive; // 方向
    uint128 value; // Margin维度的，  计算funding = (new-old) * position
}
struct Balance {
    bool marginIsPositive; // margin的正负号  开多时可能有负值
    bool positionIsPositive; // 仓位的正负号  负-空单  正-多单
    uint120 margin; // 数量
    uint120 position; // 数量
}
struct Context {
    uint256 price; // Price * 1E18
    uint256 minCollateral; // 1.001 * 1E18  类似这种
    Index index;
}
struct TradeResult { // Trade以后返回的结构
    uint256 marginAmount; // 保证金数量 2000
    uint256 positionAmount; // 仓位数量 1
    bool isBuy; // Taker方向
    bytes32 traderFlags; // 1-交易  2-清算  4-去杠杆
}`
```

## （一）Margin

**1、存**

`// 结算全局Funding - 结算用户Funding - 转账 - 修改用户Balance信息
``` 
function deposit(
    address account,
    uint256 amount
)
    external
    noFinalSettlement // 正常运转_FINAL_SETTLEMENT_ENABLED_ 默认是false 检查时取反
    nonReentrant
{
    // 先结算Funding  然后返回当前状态 [价格、最小抵押物限制、funding]
    P1Types.Context memory context = _loadContext();
    // 结算账户的资金费率，返回最新的Balance
    P1Types.Balance memory balance = _settleAccount(context, account);
    // 转账进来
    SafeERC20.safeTransferFrom(
        IERC20(_TOKEN_),
        msg.sender,
        address(this),
        amount
    );
    // 增加到保证金
    balance.addToMargin(amount);
    // 写入
    _BALANCES_[account] = balance;
    emit LogDeposit(
        account,
        amount,
        balance.toBytes32()
    );
}`

**2、取**

`// 确权 - 全局结算 - 用户结算 - 转出保证金 - 存储 - 检查抵押率
function withdraw( 
    address account,
    address destination,
    uint256 amount
)
    external
    noFinalSettlement // 正常运转
    nonReentrant
{
    require(
        hasAccountPermissions(account, msg.sender), // 自己 | Global管理 | 自己管理
        "sender does not have permission to withdraw"
    );
    // 先结算Funding  然后返回当前状态 [价格、最小抵押物限制、funding]
    P1Types.Context memory context = _loadContext();
    // 结算账户的资金费率，返回最新的Balance
    P1Types.Balance memory balance = _settleAccount(context, account);
    // 转出保证金
    SafeERC20.safeTransfer(
        IERC20(_TOKEN_),
        destination,
        amount
    );
    // 扣除Margin
    balance.subFromMargin(amount);
    // 写入
    _BALANCES_[account] = balance;
    require(
        _isCollateralized(context, balance), // 检查抵押品状态
        **"account not collateralized"
    );
    emit LogWithdraw(
        account,
        destination,
        amount,
        balance.toBytes32()
    );
}`
```

## （二）Trade

```
**1、入参**

`参数1：address[] memory accounts
本次交易中用到的账户列表，必须按照从小到大排列
参数2：TradeArg[] memory trades
struct TradeArg {
    uint256 takerIndex; // 参数1的Index
    uint256 makerIndex; // 参数2的Index
    address trader; // 交换需要调用的 合约地址 【trade、liquidate、deleverage】
    bytes data; // 需要的数据
}`

**2、调用逻辑**

全局结算 - 账户结算 - 执行每一个Trade - 最终状态检查

`执行Trade
// 调用trader.trade
P1Types.TradeResult memory tradeResult = I_P1Trader(tradeArg.trader).trade(
    msg.sender,
    maker,
    taker,
    context.price, // 价格
    tradeArg.data,
    traderFlags // 1-交换 2-清算 4-去杠杆 （去杠杆必须是0，也就是去杠杆只能在头部交易）
);
// 返回的数据
struct TradeResult { // Trade以后返回的结构
    uint256 marginAmount;
    uint256 positionAmount;
    bool isBuy; // Taker的方向  True-taker开多
    bytes32 traderFlags; // 1-交易 2-清算 4-去杠杆
}
// 根据返回的数据结算给 taker和maker的账户
if (tradeResult.isBuy) { // Taker是买（开多）
    // Maker 增加Margin
    makerBalance.addToMargin(tradeResult.marginAmount);
    // Maker 减少Position
    makerBalance.subFromPosition(tradeResult.positionAmount);
    // Taker 减少Margin
    takerBalance.subFromMargin(tradeResult.marginAmount);
    // Taker 增加Position
    takerBalance.addToPosition(tradeResult.positionAmount);
} else {
    makerBalance.subFromMargin(tradeResult.marginAmount);
    makerBalance.addToPosition(tradeResult.positionAmount);
    takerBalance.addToMargin(tradeResult.marginAmount);
    takerBalance.subFromPosition(tradeResult.positionAmount);
}
// 检查逻辑（检查参与交易的所有账户）
```

1、要么账户满足抵押率
2、如果账户不满足抵押率，必须满足 
[仓位大小没有增加+仓位方向未变+抵押率没有恶化]`

## （三）Admin

可调用方法

1、设定全局Operator

2、设定价格预言机

3、设定资金费率

4、设定抵押率限制参数

5、开启最终结束结算状态

## （四）Traders（撮合）

**1、P1Orders**

根据Order 和 Fill  计算好 两方需要相互划转的保证金和仓位，并返回结果

```
// 逻辑步骤
// 确权 - 验签 - 参数验证 - 交换 - 返回结果
// 订单结构
// Hash(Order) 验证签名
struct Order { // Maker的信息
    bytes32 flags; //  0x0 .. 00 1 1 1    [交易方向、是否只能平仓、手续费方向] 
    uint256 amount;
    uint256 limitPrice;
    uint256 triggerPrice; // 0  2000 开多  
    uint256 limitFee; // maker收费 0.01%
    address maker;
    address taker; // address（0）
    uint256 expiration;
}
hash(Order) - filledAmount
maker的Balance-position > 0
0 - maker 开空的
1 - maker amount <= Balance-position
// 本次交易信息
struct Fill {
    uint256 amount;
    uint256 price;
    uint256 fee; // 基于1Positin的费用（费用和Position同币种）
    bool isNegativeFee; // 手续费方向（必须和Order中Flag信息对应）
}
// data解析
struct TradeData {
    Order order; // Maker订单
    Fill fill; // 完成情况
    TypedSignature.Signature signature; // 签名  （和hash(order）=== maker地址）
}
// 检查
if (taker != sender) {
    require(
        P1Getters(perpetual).hasAccountPermissions(taker, sender),
        "Sender does not have permissions for the taker"
    );
}
```

**2、P1Liquidation**

清算仓位，并计算得到 应该划转的保证金和仓位数量，并返回

`// 逻辑步骤
// 确权（调用地址、调用者） - 参数验证 - 确定数量 - 返回结果
// Data 解码
struct TradeData {
    uint256 amount;
    bool isBuy; 
    bool allOrNothing; 
}`

**3、P1Deleveraging**

去杠杆操作，Maker仓位净值是0才可以操作，Taker去吃Maker的亏损订单

`// 确权 - Flag检查 - 调用者确权 - 参数验证 - 确定数量 - 返回结果
struct TradeData {
    uint256 amount;
    bool isBuy;
    bool allOrNothing;
}
// 任何人都可以mark一个水下的订单
function mark( // 标记
    address account
)
    external
{
    // 判断是否在水下
    require(
        _isAccountUnderwater(account),
        "Cannot mark since account is not underwater"
    );
    // 记录时间
    _MARKED_TIMESTAMP_[account] = block.timestamp;
    emit LogMarkedForDeleveraging(account);
}
Mark订单，在15分钟后任何人都可以进行去杠杆操作
可能是用于大额交易，无需拆分成多个订单，就算水下 也许有优势`

## （五）预言机

**预言机价格仅用于 资金费率计算 和 判定是否可以清算**

**1、P1FundingOracle**

- 完全根据配置的Rate * 时间 计算Funding的数量；
- Owner权限可以修改Rate配置

`// 可配置的Rate
P1Types.Index private _FUNDING_RATE_; // 包含了大小和方向信息
// Owner权限修改Rate
function setFundingRate(
    SignedMath.Int calldata newRate
)
    external
    returns (P1Types.Index memory)
{
    require(
        msg.sender == _FUNDING_RATE_PROVIDER_,
        "The funding rate can only be set by the funding rate provider"
    );
    SignedMath.Int memory boundedNewRate = _boundRate(newRate);
    P1Types.Index memory boundedNewRateWithTimestamp = P1Types.Index({
        timestamp: block.timestamp.toUint32(),
        isPositive: boundedNewRate.isPositive,
        value: boundedNewRate.value.toUint128()
    });
    _FUNDING_RATE_ = boundedNewRateWithTimestamp;
    emit LogFundingRateUpdated(boundedNewRateWithTimestamp.toBytes32());
    return boundedNewRateWithTimestamp;
}
// Perp合约在结算时调用，传入过去的时间
// 直接时间 * Rate 计算出Funding的数量
function getFunding( // 根据过去的时间计算资金费率
    uint256 timeDelta
)
    public
    view
    returns (bool, uint256)
{
    // Note: Funding interest in PerpetualV1 does not compound, as the interest affects margin
    // balances but is calculated based on position balances.
    P1Types.Index memory fundingRate = _FUNDING_RATE_;
    uint256 fundingAmount = uint256(fundingRate.value).mul(timeDelta);
    return (fundingRate.isPositive, fundingAmount);
}`

**2、P1ChainlinkOracle**

- 从Chainlink获取价格；
- 需要提前配置到合约上

`// Perp合约 - 配置文件  uint256(uint160+uint96)  预言机地址 + 价格扩大的指数大小
mapping (address => bytes32) public _MAPPING_;
// 获取价格方法
function getPrice()
    external
    view
    returns (uint256)
{
    // 找到预言机地址 和 指数信息
    bytes32 oracleAndExponent = _MAPPING_[msg.sender];
    require(
        oracleAndExponent != bytes32(0),
        "P1ChainlinkOracle: Sender not authorized to get price"
    );
    // 找到预言机地址 和 指数信息
    (address oracle, uint256 adjustment) = getOracleAndAdjustment(oracleAndExponent);
    // 预言机最新结果
    int256 answer = I_Aggregator(oracle).latestAnswer();
    require(
        answer > 0,
        "P1ChainlinkOracle: Invalid answer from aggregator"
    );
    uint256 rawPrice = uint256(answer);
    // 价格 / 1E18 * 10 ** 指数
    return rawPrice.baseMul(adjustment);
}`

**3、P1MakerOracle**

`// Perp合约地址 对应的 预言机地址
mapping(address => address) public _ROUTER_;
// 需要调整的指数信息 例如   1E18
mapping(address => uint256) public _ADJUSTMENTS_;
// 找到地址，读取价格，根据指数调整后返回
function getPrice()
    external
    view
    returns (uint256)
{
    // get the oracle address to read from
    address oracle = _ROUTER_[msg.sender];
    // revert if no oracle found
    require(
        oracle != address(0),
        "Sender not authorized to get price"
    );
    // get adjustment or default to 1
    uint256 adjustment = _ADJUSTMENTS_[oracle];
    if (adjustment == 0) {
        adjustment = BaseMath.base();
    }
    // get the adjusted price
    uint256 rawPrice = uint256(I_MakerOracle(oracle).read());
    uint256 result = rawPrice.baseMul(adjustment);
    // revert if invalid price
    require(
        result != 0,
        "Oracle would return zero price"
    );
    return result;
}`

## （六）其他模块

**1、P1CurrencyConverterProxy**

ERC20 带交换功能的 增减保证金

**2、P1LiquidatorProxy**

- 清算入口
- 无需本金的清算，账户可以是新开启的；
- 清算得到的钱，会计算利润，在利润中收取一部分佣金转到配置的合约；
- 清算人得到的是仓位（需要自行平仓）；

`function liquidate(
    address liquidatee,
    address liquidator,
    bool isBuy, // 方向
    SignedMath.Int calldata maxPosition // 清算人愿意清算的最大量
)
    external
    returns (uint256)`

**3、P1SoloBridgeProxy**

Perp和Solo的转移

**4、P1WethProxy**

原生代币处理的 增减保证金

## （七）未看合约

- Inverse相关的：P1InverseOrders、P1InverseFundingOracle；
- 几个没有 getPrice接口的预言机：P1MirrorOracleETHUSD；

# 二、重要计算逻辑

## （一）是否满足抵押率

**抵押率Ok：Positive部分 >= Negative部分*系数**

**underWarter：Negative > Positive**
```
`// 系数
// Admin   setMinCollateral  方法可修改 
uint256 internal _MIN_COLLATERAL_;
function _isCollateralized(
    P1Types.Context memory context, // [价格、最小抵押品、index]
    P1Types.Balance memory balance //
)
    internal
    pure
    returns (bool)
{
    // 根据Margin和Position的正负
    // 开空的人 position为负数  开多的人 position为正数
    // 已抵押品为单位，扩大了1E18
    (uint256 positive, uint256 negative) = balance.getPositiveAndNegativeValue(context.price);
    // 正的部分 必须满足大于 负的部分 * 系数
    return positive.mul(BaseMath.base()) >= negative.mul(context.minCollateral);
}`
```

## （二）撮合逻辑

计算出撮合结果，Margin和Postion增减的数量

然后分别更改Taker和Maker的 Margin和Positon
```

`if (tradeResult.isBuy) { // Taker为开多
    // Maker 增加Margin
    makerBalance.addToMargin(tradeResult.marginAmount);
    // Maker 减少Position
    makerBalance.subFromPosition(tradeResult.positionAmount);
    // Taker 减少Margin
    takerBalance.subFromMargin(tradeResult.marginAmount);
    // Taker 增加Position
    takerBalance.addToPosition(tradeResult.positionAmount);
} else { // Taker 为开空 相反操作
    makerBalance.subFromMargin(tradeResult.marginAmount);
    makerBalance.addToPosition(tradeResult.positionAmount);
    takerBalance.addToMargin(tradeResult.marginAmount);
    takerBalance.subFromPosition(tradeResult.positionAmount);
}`
```

## （三）资金费率逻辑

1、全局资金费率
```
`// 数据结构
struct Index {
    uint32 timestamp; // 结算时间
    bool isPositive; // 方向
    uint128 value; // 值
}
// 方法
function _loadContext()
// 逻辑
uint256 timeDelta = block.timestamp.sub(index.timestamp); // 距离上次的结算时间
调用 FUNDER合约的 getFunding方法 得到 funding的数值和方向
// 具体方法
根据存储的 _FUNDING_RATE_ 里面的数值  计算funding
**funding = rate * 时间**_FUNDING_RATE_  可以修改，有权限的可以调用修改
function getFunding( // 根据过去的时间计算资金费率
    uint256 timeDelta
)
    public
    view
    returns (bool, uint256)
{
    // Note: Funding interest in PerpetualV1 does not compound, as the interest affects margin
    // balances but is calculated based on position balances.
    P1Types.Index memory fundingRate = _FUNDING_RATE_;
    uint256 fundingAmount = uint256(fundingRate.value).mul(timeDelta);
    return (fundingRate.isPositive, fundingAmount);
}`

2、个人资金费率

`// 数据结构 同全局
struct Index {
    uint32 timestamp; // 结算时间
    bool isPositive; // 方向
    uint128 value; // 值
}
// 计算资金费率的margin变动方法
// 根据index的方向和开仓方向相同，付出资金费率；反之收取资金费率
deltaMargin = (newValue - oldValue) * position`
```


## （四）停止状态的结算逻辑

计算用户仓位对应的数量 - 取出最大可取的值 - 修改用户Balance（如有没取的记录在抵押品数量）
```
`function withdrawFinalSettlement()
    external
    onlyFinalSettlement
    nonReentrant
{
    // Load the context using the final settlement price.
    P1Types.Context memory context = P1Types.Context({
        price: _FINAL_SETTLEMENT_PRICE_,
        minCollateral: _MIN_COLLATERAL_,
        index: _GLOBAL_INDEX_
    });
    // Apply funding changes.
    // 结算账户的资金费率，返回最新的Balance
    P1Types.Balance memory balance = _settleAccount(context, msg.sender);
    // Determine the account net value.
    // `positive` and `negative` are base values with extra precision.
    (uint256 positive, uint256 negative) = P1BalanceMath.getPositiveAndNegativeValue(
        balance,
        context.price
    );
    // No amount is withdrawable.
    // 资不抵债
    if (positive < negative) {
        return;
    }
    // Get the account value, which is rounded down to the nearest token amount.
    // 账户还剩几个钱
    uint256 accountValue = positive.sub(negative).div(BaseMath.base());
    // Get the number of tokens in the Perpetual Contract.
    // 抵押品数量
    uint256 contractBalance = IERC20(_TOKEN_).balanceOf(address(this));
    // Determine the maximum withdrawable amount.
    // 可取
    uint256 amountToWithdraw = Math.min(contractBalance, accountValue);
    // Update the user's balance.
    // 记录可取Margin
    uint120 remainingMargin = accountValue.sub(amountToWithdraw).toUint120();
    balance = P1Types.Balance({
        marginIsPositive: remainingMargin != 0,
        positionIsPositive: false,
        margin: remainingMargin,
        position: 0
    });
    _BALANCES_[msg.sender] = balance;
    // Send the tokens.
    // 转移
    SafeERC20.safeTransfer(
        IERC20(_TOKEN_),
        msg.sender,
        amountToWithdraw
    );
    // Emit the log.
    emit LogWithdrawFinalSettlement(
        msg.sender,
        amountToWithdraw,
        balance.toBytes32()
    );
}
```
StarkEx采用的是有效性证明。

## StarkEX


这种“数据不上链+有效性证明”的方案称为Validium。（不同于“数据上链”型的Rollup方案，比如另一知名项目的Arbitrum）。



## 参考链接
- https://help.dydx.exchange/en/articles/4320633-why-should-someone-use-the-perpetual-vs-margin  永续跟杠杆差别
- https://docs.dydx.community/dydx-governance/jiao-yi-jiao-cheng/ru-he-zai-dydx-shang-kai-kong-dan-zuo-kong/ru-he-zai-dydx-shang-kai-duo-dan-zuo-duo 操作文档  
- https://www.chainnews.com/articles/669485806574.htm Validium介绍
- https://www.chainnews.com/articles/906891466719.htm  全景式解读加密货币衍生品交易赛道  
- https://mp.weixin.qq.com/s/VF4JGW-XG3drUAelKbYySA  橙皮书dydx保证金交易原理介绍
- https://www.chainnews.com/articles/609351382358.htm dydx保证金  
