
## Perpetual V1 

[白皮书](https://www.notion.so/Strike-Protocol-9049cc65e99246d886a230972d0cbd60) 
### 原理图
![原理](./imgs/perp.png)
![合约结构](./imgs/cal.png)
![合约结构1](./imgs/overview.svg)

### 核心原理
在交易环节，以虚拟AMM定价，实际开仓/平仓的资金从资金池（Vault）进出，资金池中仅有USDC一种代币，开仓/平仓仅影响池中USDC数量；

在清算环节，由Chainlink喂价，保证金率低于6.5%时头寸将被清算，清算后的获利在保险基金与清算人之间分配。保险基金用于弥补行情剧烈波动时，平仓后穿仓的损失；  

Staking提供者在Perp上不作为流动性提供者，仅仅是保险基金的初始提供者，承担保险基金赔付时的损失风险，同时享有手续费收入。

**设计方案**
vAMM使用AMM的x*y=k方式定价，但不实际进行两种货币的兑换，而是由AMM公式提供价格后，从资金池（Vault）进出资金以代替直接从AMM池进出资金，实现单一货币的多/空头寸在Vault的开仓和平仓。

假设Vault中原本有10,000 USDC，并且x=100，k=100*10,000，
1. Alice用100 U以2倍开多仓后变化如下：

| 动作 | ETH | USDC | 计算|
| :-----| :---- | :---- | :---- |
| 初始状态 | 100 | 10000 | - |
| Alice开了1.96多仓 | 98.04 | 10200 | 100*10000/10200 |

2. 同样，如果此时Bob继续注入100 U以2倍杠杆开多仓后，vAMM公式将自动算出其持有多仓为1.89 ETH；

| 动作 | ETH | USDC | 计算|
| :-----| :---- | :---- | :---- |
| Bob开了1.89多仓 | 96.15 | 10400 | 98.04*10200/10400|
| Alice平了1.96多仓 | 98.11 | 10192 | 96.15*10400/98.115 |
| Bob平了1.89多仓 | 100 | 10000 | 98.11*10192/100 |

- vault存放真实的usdc，而eth为虚拟出来的（根据K值计算）
- 从实质上看，按照AMM的含义，后买入者将比先买入者的成本更高，后卖出者将比先卖出者得到更低的对价（换回更少的U），因此Alice获利而Bob损失，这一点在虚拟AMM中也同样体现。

**资金费率**
Perp上提供的是永续合约，每1小时收取一次资金费，按照加密货币衍生品交易所FTX的规则进行计算，公式如下：

FundingPayment（资金费）=PositionSize（仓位头寸）∗FundingRate（资金费率）

$\ fundingRate = \frac{P_{perp}- P_{index}}{24}$   

问题：都做多怎么办？？

**清算**
当保证金比例下降到6.25%或以下时，就会发生清算，这一规则即维持保证金（Maintenance Margin）。
清算由清算人的机器人出发，作为清算的奖励，清算人获得6.25%保证金中的1.25%，其余最高5%保证金存入协议保险基金。

**保险基金**
Perp V1协议赚取的交易费用，50%归Staking持币者，50%归入保险基金。当系统遭遇清算过程的损失和资金损失等意外损失是，保险基金将作为第一道防线首先支付这些损失。  

### 代码解析

`AMM`合约 

个人持仓


#### AMM合约

常用方法  
getOutputPriceWithReserves  ？？？
getInputPriceWithReserves   ???




calcBaseAssetAfterLiquidityMigration 计算新的持仓大小。 

事件：
```
 // EVENTS
    //
    event SwapInput(Dir dir, uint256 quoteAssetAmount, uint256 baseAssetAmount);
    event SwapOutput(Dir dir, uint256 quoteAssetAmount, uint256 baseAssetAmount);
    event FundingRateUpdated(int256 rate, uint256 underlyingPrice);
    event ReserveSnapshotted(uint256 quoteAssetReserve, uint256 baseAssetReserve, uint256 timestamp);
    event LiquidityChanged(uint256 quoteReserve, uint256 baseReserve, int256 cumulativeNotional);
    event CapChanged(uint256 maxHoldingBaseAsset, uint256 openInterestNotionalCap);
    event Shutdown(uint256 settlementPrice);
    event PriceFeedUpdated(address priceFeed);
```


cumulativeNotional：
在updateReserve函数使用，
```
 cumulativeNotional = cumulativeNotional.addD(_quoteAssetAmount);
```
结构体：
```
cumulativeNotional即累加的_quoteAssetAmount；

struct ReserveSnapshot {
        Decimal.decimal quoteAssetReserve;
        Decimal.decimal baseAssetReserve;
        uint256 timestamp;
        uint256 blockNumber;
    }

```
两个主要方法解析：
```
function swapInput(
    // 交易方向，ADD_TO_AMM for long, REMOVE_FROM_AMM for short
        Dir _dirOfQuote, 
        Decimal.decimal calldata _quoteAssetAmount,
        //minimum base asset amount expected to get to prevent front running  
        Decimal.decimal calldata _baseAssetAmountLimit,
        //the impact of the price MUST be less than `fluctuationLimitRatio`
        bool _canOverFluctuationLimit
    ) 
```


里面主要函数是
处理逻辑如下：
1. 通过getInputPrice 获取 需要的baseAssetAmount；
2. 通过updateReserve 更改储备值，并更改snapshot的值


根据amm池子的资产储备，以及quoteasset（usdc）资产的数量计算出baseasset(eth)的数量。 

```
function getInputPriceWithReserves(
        Dir _dirOfQuote,   // 方向
        Decimal.decimal memory _quoteAssetAmount,    // usdc金额
        Decimal.decimal memory _quoteAssetPoolAmount,   // 池子的usdc金额
        Decimal.decimal memory _baseAssetPoolAmount     // 池子eth金额
    ) public pure override returns (Decimal.decimal memory) {

        if (_quoteAssetAmount.toUint() == 0) {
            return Decimal.zero();
        }
         // 判断做空还是做多
        bool isAddToAmm = _dirOfQuote == Dir.ADD_TO_AMM;
        SignedDecimal.signedDecimal memory invariant =
            MixedDecimal.fromDecimal(_quoteAssetPoolAmount.mulD(_baseAssetPoolAmount));
        SignedDecimal.signedDecimal memory baseAssetAfter;
        Decimal.decimal memory quoteAssetAfter;
        Decimal.decimal memory baseAssetBought;

        if (isAddToAmm) {
            //做多，则usdc储备池增加
            quoteAssetAfter = _quoteAssetPoolAmount.addD(_quoteAssetAmount);
        } else {
            //做空，则usdc储备池减少
            quoteAssetAfter = _quoteAssetPoolAmount.subD(_quoteAssetAmount);
        }
        require(quoteAssetAfter.toUint() != 0, "quote asset after is 0");

        //x*y=k  计算兑换eth
        baseAssetAfter = invariant.divD(quoteAssetAfter);
        // 计算出usdc需要的量
        baseAssetBought = baseAssetAfter.subD(_baseAssetPoolAmount).abs();

        // if the amount is not dividable, return 1 wei less for trader
        if (invariant.abs().modD(quoteAssetAfter).toUint() != 0) {
            if (isAddToAmm) {
                baseAssetBought = baseAssetBought.subD(Decimal.decimal(1));
            } else {
                baseAssetBought = baseAssetBought.addD(Decimal.decimal(1));
            }
        }

        return baseAssetBought;
    }
```


根据amm池子的资产储备，以及baseasset(eth)资产的数量计算出quoteasset（usdc）的数量。 
逻辑跟getInputPriceWithReserves类似，只是反方向而已。
```
function getOutputPriceWithReserves(
        Dir _dirOfBase,
        Decimal.decimal memory _baseAssetAmount,
        Decimal.decimal memory _quoteAssetPoolAmount,
        Decimal.decimal memory _baseAssetPoolAmount
    ) public pure override returns (Decimal.decimal memory) {
        if (_baseAssetAmount.toUint() == 0) {
            return Decimal.zero();
        }

        bool isAddToAmm = _dirOfBase == Dir.ADD_TO_AMM;
        SignedDecimal.signedDecimal memory invariant =
            MixedDecimal.fromDecimal(_quoteAssetPoolAmount.mulD(_baseAssetPoolAmount));
        SignedDecimal.signedDecimal memory quoteAssetAfter;
        Decimal.decimal memory baseAssetAfter;
        Decimal.decimal memory quoteAssetSold;

        if (isAddToAmm) {
            baseAssetAfter = _baseAssetPoolAmount.addD(_baseAssetAmount);
        } else {
            baseAssetAfter = _baseAssetPoolAmount.subD(_baseAssetAmount);
        }
        require(baseAssetAfter.toUint() != 0, "base asset after is 0");

        quoteAssetAfter = invariant.divD(baseAssetAfter);
        quoteAssetSold = quoteAssetAfter.subD(_quoteAssetPoolAmount).abs();

        // if the amount is not dividable, return 1 wei less for trader
        if (invariant.abs().modD(baseAssetAfter).toUint() != 0) {
            if (isAddToAmm) {
                quoteAssetSold = quoteAssetSold.subD(Decimal.decimal(1));
            } else {
                quoteAssetSold = quoteAssetSold.addD(Decimal.decimal(1));
            }
        }

        return quoteAssetSold;
    }
```

**swapOutput**

**settleFunding**
```
function settleFunding() external override onlyOpen onlyCounterParty returns (SignedDecimal.signedDecimal memory) {
        require(_blockTimestamp() >= nextFundingTime, "settle funding too early");

        // premium = twapMarketPrice - twapIndexPrice
        // timeFraction = fundingPeriod(1 hour) / 1 day
        // premiumFraction = premium * timeFraction
        Decimal.decimal memory underlyingPrice = getUnderlyingTwapPrice(spotPriceTwapInterval);
        SignedDecimal.signedDecimal memory premium =
            MixedDecimal.fromDecimal(getTwapPrice(spotPriceTwapInterval)).subD(underlyingPrice);
        SignedDecimal.signedDecimal memory premiumFraction = premium.mulScalar(fundingPeriod).divScalar(int256(1 days));

        // update funding rate = premiumFraction / twapIndexPrice
        updateFundingRate(premiumFraction, underlyingPrice);

        // in order to prevent multiple funding settlement during very short time after network congestion
        uint256 minNextValidFundingTime = _blockTimestamp().add(fundingBufferPeriod);

        // floor((nextFundingTime + fundingPeriod) / 3600) * 3600
        uint256 nextFundingTimeOnHourStart = nextFundingTime.add(fundingPeriod).div(1 hours).mul(1 hours);

        // max(nextFundingTimeOnHourStart, minNextValidFundingTime)
        nextFundingTime = nextFundingTimeOnHourStart > minNextValidFundingTime
            ? nextFundingTimeOnHourStart
            : minNextValidFundingTime;

        // DEPRECATED only for backward compatibility before we upgrade ClearingHouse
        // reset funding related states
        baseAssetDeltaThisFundingPeriod = SignedDecimal.zero();

        return premiumFraction;
    }
```
 only allow to update while reaching `nextFundingTime`

**swapOutput**
把base asset 资产换成  quote asset, 在关闭仓位和清算时候使用。  


**查询AMM状态**
```
function getAmmStates(address _amm) external view returns (AmmStates memory) {
        Amm amm = Amm(_amm);
        (bool getSymbolSuccess, bytes memory quoteAssetSymbolData) =
            address(amm.quoteAsset()).staticcall(abi.encodeWithSignature("symbol()"));
        (Decimal.decimal memory quoteAssetReserve, Decimal.decimal memory baseAssetReserve) = amm.getReserve();

        bytes32 priceFeedKey = amm.priceFeedKey();
        return
            AmmStates({
                quoteAssetReserve: quoteAssetReserve.toUint(),
                baseAssetReserve: baseAssetReserve.toUint(),
                //每次交易最大比率
                tradeLimitRatio: amm.tradeLimitRatio(),
                // 资金费率周期
                fundingPeriod: amm.fundingPeriod(),
                //喂价
                priceFeed: address(amm.priceFeed()),
                //
                priceFeedKey: priceFeedKey,
                quoteAssetSymbol: getSymbolSuccess ? abi.decode(quoteAssetSymbolData, (string)) : "",
                baseAssetSymbol: bytes32ToString(priceFeedKey)
            });
    }

```

### 质押


## 参考链接
头等仓：https://mp.weixin.qq.com/s/Oq7g3_AjRP4Of__K9Gp_bw
