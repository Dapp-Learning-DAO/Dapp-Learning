# Reflexer GEB

GEB 协议的核心仓库，是 MCD(MakerDAO-dss)的修改版，具有几个核心的改进：

- 可以理解的变量名称
- 自主反馈机制，改变系统参与者的激励
- 可添加 SAFE 保险
- 固定和递增的折扣拍卖（而不是英国式拍卖）用于出售抵押品
- 自动调整系统中的几个参数
- 一组合约，约束了长期治理的参数控制
- 可以一次将稳定费用发送到多个地址
- 可以在盈余拍卖和其他类型的策略之间切换，以删除系统中的盈余
- 每种抵押品类型有两个价格：一个用于生成债务，另一个专门用于清算 SAFE
- stability fee treasury 可以支付 Oracle 调用或其他自动化系统的合约费用

## Flow

![GEB_overview](<https://1187825898-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-M9jdHretGKCtWYz5jZR%2F-MZCEBuqpWiVDbzkVeUa%2F-MZCEJv2Xvz-xIw0JAwy%2FGEB_overview%20(1).png?alt=media&token=d1233706-ec95-443b-8d45-97f973d18208>)

[GEB Overview Diagram](https://viewer.diagrams.net/?target=blank&highlight=0000ff&layers=1&nav=1&title=GEB_overview.drawio#Uhttps%3A%2F%2Fdrive.google.com%2Fuc%3Fid%3D1nIcaY8N8StVCfyAL_ztbmETJX2bvY3a9%26export%3Ddownload)

### build DSProxy

`GebProxyRegistry.build(address owner)` 创建属于用户的 `DSProxy`, 注册 proxy 地址

- `proxy = new DSProxy()`
- `proxies[owner] = msg.sender`

```solidity

// geb-proxy-registry/
// deploys a new proxy instance sets custom owner of proxy
contract GebProxyRegistry {
    function build(address owner) public returns (address payable proxy) {
        require(proxies[owner] == DSProxy(0) || proxies[owner].owner() != owner); // Not allow new proxy if the user already has one and remains being the owner
        proxy = factory.build(owner);
        proxies[owner] = DSProxy(proxy);
        emit Build(owner, proxy);
    }
}
```

### openLockETHAndGenerateDebt

1. `DSProxy.execute(address _target, bytes memory _data)` 组装操作，调用 Proxy 执行交易
2. `GebProxyActions.openLockETHAndGenerateDebt()` Actions 模块执行开仓, 抵押ETH，借出 RAI
   - `GebProxyActions.openSAFE(address manager, bytes32 collateralType, address usr)`
   - `GebSafeManager.openSAFE(bytes32 collateralType, address usr)`
     - `new SAFEHandler(safeEngine)` 创建 SAFEHandler 合约
   - `GebProxyActions.lockETHAndGenerateDebt()`
     - `ethJoin_join(ethJoin, safeHandler, msg.value)` 通过 adaptor 转入 ETH 抵押资产
     - `GebSafeManager.modifySAFECollateralization()` 创建 SAFE 仓位
       - `GebSafeManager._getGeneratedDeltaDebt()` 增加SAFE债务，包含税收
       - `SAFEEngine.modifySAFECollateralization()`
     - `transferInternalCoins()` 将 RAI token 转给用户
       - `BasicTokenAdapters.exit(address account, uint256 wad)`
         - `SAFEEngine.modifyCollateralBalance()`

```solidity
// ds-proxy/src/proxy.sol
contract DSProxy is DSAuth, DSNote {
    // step 1
    function execute(address _target, bytes memory _data) {
        // target.delegatecall()
    }
}

// geb-proxy-actions/src/GebProxyActions.sol
contract GebProxyActions is BasicActions {
    // step 2
    function openLockETHAndGenerateDebt(
        address manager,
        address taxCollector,
        address ethJoin,
        address coinJoin,
        bytes32 collateralType,
        uint deltaWad
    ) external payable returns (uint safe) {
        safe = openSAFE(manager, collateralType, address(this));
        lockETHAndGenerateDebt(manager, taxCollector, ethJoin, coinJoin, safe, deltaWad);
    }

    // step 3
    /// @notice Opens a brand new Safe
    /// @param manager address - Safe Manager
    /// @param collateralType bytes32 - collateral type
    /// @param usr address - Owner of the safe
    function openSAFE(
        address manager,
        bytes32 collateralType,
        address usr
    ) public returns (uint safe) {
        safe = ManagerLike(manager).openSAFE(collateralType, usr);
    }
}

// geb-safe-manager/src/GebSafeManager.sol
contract GebSafeManager {
    // step 4
    function openSAFE(
        bytes32 collateralType,
        address usr
    ) public returns (uint) {
        // safei is SAFE id
        safes[safei] = address(new SAFEHandler(safeEngine));
        ...
        return safei;
    }
}

// geb-proxy-actions/src/GebProxyActions.sol
contract GebProxyActions is BasicActions {
    // step 5
    /// @notice Locks Eth, generates debt and sends COIN amount (deltaWad) to msg.sender
    /// @param manager address
    /// @param taxCollector address
    /// @param ethJoin address
    /// @param coinJoin address
    /// @param safe uint - Safe Id
    /// @param deltaWad uint - Amount
    function lockETHAndGenerateDebt(
        address manager,
        address taxCollector,
        address ethJoin,
        address coinJoin,
        uint safe,
        uint deltaWad
    ) public payable {
    }
}

// geb-safe-manager/src/GebSafeManager.sol
contract GebSafeManager {
    // step 6
    function modifySAFECollateralization(
        uint safe,
        int deltaCollateral,
        int deltaDebt
    ) public safeAllowed(safe) {
        // SAFEEngine.modifySAFECollateralization()
    }
}

```

## Core Module

### SAFE Engine

> The SAFE, system coin and collateral database

SAFE Engine 存储所有的 SAFE (用户的抵押和债务仓位) 并跟踪所有的债务和抵押平衡。该合约是最重要的系统组件，因此为了尽可能减少错误的可能性，它没有任何外部依赖。

1. Coin cannot exist without collateral
2. The Safe data structure is the SAFE
3. Similarly, a collateral is an collateralType

```solidity
struct SAFE {
    // Total amount of collateral locked in a SAFE
    uint256 lockedCollateral;  // [wad]
    // Total amount of debt generated by a SAFE
    uint256 generatedDebt;     // [wad]
}

struct CollateralType {
    // Total debt issued for this specific collateral type
    uint256 debtAmount;        // [wad]
    // Accumulator for interest accrued on this collateral type
    uint256 accumulatedRate;   // [ray]
    // Floor price at which a SAFE is allowed to generate debt
    uint256 safetyPrice;       // [ray]
    // Maximum amount of debt that can be generated with this collateral type
    uint256 debtCeiling;       // [rad]
    // Minimum amount of debt that must be generated by a SAFE using this collateral
    uint256 debtFloor;         // [rad]
    // Price at which a SAFE gets liquidated
    uint256 liquidationPrice;  // [ray]
}
```

SafeEngine 中的方法被编写为尽可能通用，因此其接口可能相当冗长。应注意确保参数的顺序不混淆。

任何已通过 SafeEngine 授权的模块均具有完全的根访问权限，因此可以窃取系统中的所有抵押品。这意味着添加新的抵押品类型（及其相关适配器 Adapters）具有相当大的风险。

#### SAFE Management

- 任何人都可以通过 `modifySAFECollateralization` 来管理 SAFE，该方法可以使用用户提供的抵押品 `tokenCollateral` 来修改对应地址的 SAFE 仓位，并修改 `debtDestination` 的 `coinBalance`

- `confiscateSAFECollateralAndDebt` 通常由 `LiquidationEngine` 来调用，将债务从 SAFE 转移到另一个地址的 `debtBalance`

- `debtBalance` 表示坏账，可以使用 `settleDebt(uint rad)` 方法通过与等量系统币 (RAI) 抵消来消除。
  在 `settleDebt(uint rad)` 中，msg.sender 用作 `coinBalance` 和 `debtBalance` 的地址。

- coinBalance[user: address] - 在系统内用户有多少 coin ，该数量不会反应在 ERC20 合约中

```solidity
/**
* @notice Nullify an amount of coins with an equal amount of debt
* @param rad Amount of debt & coins to destroy
*/
function settleDebt(uint256 rad) external {
    address account       = msg.sender;
    debtBalance[account]  = subtract(debtBalance[account], rad);
    coinBalance[account]  = subtract(coinBalance[account], rad);
    globalUnbackedDebt    = subtract(globalUnbackedDebt, rad);
    globalDebt            = subtract(globalDebt, rad);
    emit SettleDebt(account, rad, debtBalance[account], coinBalance[account], globalUnbackedDebt, globalDebt);
}
```

#### Stability Fee Accrual

accumulatedRates 有助于将针对 collateralType 产生的标准化债务（generatedDebt）转换为该债务的现值（实际债务发行量+利息）。该费率通过 updateAccumulatedRate（由 TaxCollector 调用）更新。每次更新后，新计提的稳定费用都会添加到 surplusDst 的 coinBalance 中。

### Liquidation Engine

> The protocol's liquidation mechanism

LiquidationEngine 使外部参与者能够清算 SAFEs 并将其抵押品发送到 CollateralAuctionHouse，同时将部分债务发送到 AccountingEngine。

- liquidateSAFE 不会让 SAFE 带着债务离开且没有抵押品
- liquidateSAFE 不会让 SAFE 累积 dust， 即数量微小的清算残余
- 如果 `amountToRaise` + `currentOnAuctionSystemCoins` 超过了 `onAuctionSystemCoinLimit` ，liquidateSAFE 不会启动新的拍卖。
- 如果所选的 SAFESaviour 地址未被治理机构列入白名单，则 `protectSAFE` 将被撤销 (revert)

```solidity
// geb/src/single/LiquidationEngine.sol
function liquidateSAFE(bytes32 collateralType, address safe) external returns (uint256 auctionId) {
    /*
    1. 相应的仓位债务和抵押价值的检查，是否可以清算
    2. 被清算人若有设置 safeSaviours，转入补充抵押资产
    3. collateralToSell = (实际债务 / 可清算的债务上限) * 仓位中所有抵押资产
    4. amountToRaise = limitAdjustedDebt * accumulatedRate / liquidationPenalty
       该Safe仓位被清算最大值后，扣除的抵押价值 = 最大的债务 * 债务累计系数 / 惩罚折扣
    5. CollateralAuctionHouse.startAuction() 仓位进入竞价拍卖流程
    */
}
```

liquidateSAFE 可以随时调用，但只有当目标 SAFE 处于亏损状态时才会成功。当锁定的抵押品（lockedCollateral）乘以抵押品的清算价格（liquidationPrice）小于其当前价值的负债时（已生成的债务乘以抵押品的累积利率 `accumulatedRate` ），就意味着 SAFE 处于亏损状态。

- liquidationPrice 是由抵押品的清算比例调整的代理报告价格。尽管 Safety ratios 和清算比率的值可以相等，但二者之间有明显区别：

- Safety ratios 是在对 SAFE 的抵押品产生债务时使用的最小抵押率。在清算比率下更为保守（更高）

清算比率是 SAFE 的最小抵押率，在该抵押率下，SAFE 将被清算

如果正在被目标的 SAFE 所有者用 saviour 来保护其位置， liquidateSAFE 可能会提前终止尝试进行清算。

## Accounting Engine

> The protocol's accountant, keeping track of surplus and deficit

AccountingEngine 接收系统盈余和系统债务。它通过债务拍卖来弥补赤字，通过拍卖（Burning/RecyclingSurplusAuctionHouse）或转移（到 extraSurplusReceiver）来处理剩余。

### Accounting Debt

当 SAFE 被清算时，被查封 (confiscate) 的债务会被放入到 AccountingEngine 的队列中。此时的时间戳是清算 SAFE 行动的区块时间戳（`debtQueue[timestamp]`）。一旦 `AccountingEngine.popDebtDelay`（债务清算延迟）过期，该债务就可以通过 popDebtFromQueue 得到释放。一旦该债务被释放，就可以使用从 SAFE 清算中收集的剩余款项进行结算，或者如果没有收集足够的剩余款项，则可以使用 `DebtAuctionHouse` 进行拍卖。注意：只有在 `canPrintProtocolTokens` 返回 true 并且 `canPrintProtocolTokens` 未发生意外逆转时， AccountingEngine 才能开始一个新的债务拍卖。

主要风险涉及到 popDebtDelay < CollateralAuctionHouse.totalAuctionLength，这会导致债务拍卖在相关抵押品拍卖完成之前开始。

### Auctioning Surplus

当 AccountingEngine 拥有超过 surplusBuffer 的剩余余额（`safeEngine.coinBalance[accountingEngine] > surplusBuffer`）时，如果超出缓冲区的额外剩余款项没有被保留用于抵消引擎的坏账（`safeEngine.debtBalance[accountingEngine]`），并且 `extraSurplusIsTransferred` 为 0，则可以使用 `Burning/RecyclingSurplusAuctionHouse` 进行拍卖。此过程将导致销毁协议代币，以换取拍卖的剩余款项。

### Transferring Extra Surplus

当 AccountingEngine 中的余额高于 surplusBuffer（`safeEngine.coinBalance [accountingEngine]> surplusBuffer`）时，如果超出缓冲区的额外余额未保留用于抵消引擎的坏账（`safeEngine.debtBalance [accountingEngine]`）且 `extraSurplusIsTransferred` 为 1，则可以将额外余额转移给 `extraSurplusReceiver。`

### Disabling the Accounting Engine

当授权地址调用 AccountingEngine.disableContract 时，系统将尝试尽可能清算剩余的 `safeEngine.debtBalance[accountingEngine]`。

## Auction Module

> Maintaining system balance by covering shortfall and disbursing surplus

拍卖模块旨在通过参与抵押品、债务和盈余拍卖，激励外部参与者推动系统回到安全状态

- `CollateralAuctionHouse` 用于出售已成为不足抵押的 SAFE 中的抵押品，以保持系统的整体健康。有两种类型的抵押品拍卖：

  - `English Auction` 要求竞标者用逐渐增加的系统币竞标固定数量的抵押品，只有一个竞标者可以获胜。此拍卖类型有两个阶段：增加竞标金额，在此阶段中，竞标者提交更高的系统币竞标，而在第二个阶段中，降低售出数量，竞标者接受较低数量的抵押品，以获得获胜的系统币竞标。

  - 另一方面，`FixedDiscount`, `IncreasingDiscount` 拍卖只有一个阶段（购买抵押品），其中竞标者提交系统币，而智能合约以比市场价格更低的折扣价格向其提供抵押品。这些拍卖类型与英式拍卖相比更具有资本效率和用户友好性。它们还允许任何人使用闪电贷购买抵押品。

  - 默认情况下，合约将使用抵押品的 OSM 价格（相对于实际抵押品市场价格有所滞后）和系统币的 redemption price 来计算为每个个人竞标提供多少抵押品。如果规定在 FSM 价格和 redemption price 内部偏离一定限额，治理机构可以设置合约的参数，以便使用抵押品的中位数价格或系统币的市场价格。

- `DebtAuctionHouse` 用于通过将协议代币拍卖出一定数量的盈余（系统币）来摆脱会计引擎的债务。拍卖完成后，将收到的盈余发送到会计引擎，以抵消恶性债务，并且为获胜的竞标者铸造协议代币

- `SurplusAuctionHouse`（包括 Burning, Recycling and PostSettlement 3 个版本）用于通过拍卖一定数量的内部系统加密币，换取协议代币来清除 AccountingEngine 的盈余。拍卖结算后，拍卖行会将获胜的协议代币烧掉，或将竞标结果转移到外部地址，然后将内部系统加密币发送给获胜的竞标者，具体情况取决于拍卖行的决定。

## Oracle Module

> The "source of truth" for collateral and system coin prices

Oracle 模块负责将价格源更新输入并推入系统。它由三个核心组件组成：medianizer 获取某种资产的价格源，FSM(Feed Security Module)为从 medianizer 获取的价格引入延迟，OracleRelayer 按赎回价格将价格数据除以质押率（提交价格的资产的质押率），然后将结果再次除以质押率，并将最终输出推入 SAFEEngine 中。该模块也可用于为系统的反馈机制或旨在自主设置系统参数的其他合约提供价格源数据。

- `DSValue` 是 medianizer 的简化版本。它用于测试 Oracle 基础设施。合约创建者可以指定哪些地址被允许在合约内更新价格源。
- `OSM`（Oracle Security Module）确保从 medianizer 传播的新价格值在经过指定延迟后，才会被系统接受。
- `DSM`（Dampened Security Module）是类似 OSM 的合约，限制了两个连续价格源更新之间的最大价格变化。
- `FsmGovernanceInterface` 是一个抽象，旨在帮助治理停止 OSMs.
- `OracleRelayer` 是 OSM 和核心系统（SAFEEngine）之间的纽带。它将每个价格源除以最新的赎回价格，然后再次除以质押率，最后保存最终结果。事实上，中继器将为每种抵押品类型存储两种不同的价格：一个安全价格仅在 SAFE 用户想生成债务时使用，另一个是清算引擎调用 LiquidateSAFE 时使用的清算价格。中继器还负责存储赎回价格并使用赎回费率进行更新。
- `GovernanceLedPriceFeedMedianizer` 和 `ChainlinkPriceFeedMedianizer` 为系统中使用的每个令牌提供新鲜的价格源。两者之间的主要区别在于，治理主导版本维护了价格源合约的白名单，由代币持有人授权（并激励）将价格推送到系统中，而 Chainlink 版本不依赖于 GEB 的治理来正常运行（除了代币持有人需要指向 Chainlink 聚合器的升级版本的情况之外）。
- `UniswapConsecutiveSlotsPriceFeedMedianizer` 利用 Uniswap v2 基础设施来实现 TWAP，以提供价格源。它需要连接到一个单独的 oracle，以帮助将 TWAP 结果转换为另一种货币（例如美元、欧元等）。

### Oracle Relayer

> The glue between price feeds and the SAFE Engine

OracleRelayer 作为 FSMs 和 SAFEEngine 之间的接口合约，仅存储当前的抵押品类型列表，以及当前赎回价格和赎回率。该中继器将依赖治理来设置每种抵押品的安全系数和清算比率，并可能还会依赖外部反馈机制来更新赎回率，从而影响赎回价格。

#### UpdateCollateralPrice

`updateCollateralPrice` 是一个公开调用的函数。该函数接受一个表示需要更新（安全和清算）价格的抵押物类型的 bytes32。updateCollateralPrice 分为三个阶段：

- `getResultWithValidity` - 与抵押品类型的 orcl 进行交互，返回一个值以及它是否有效（若价格无效就返回 false 的布尔值）。如果 isValid == true，就进行第二个外部调用。

- 在计算安全价格(`safetyPrice`)和清算价格(`liquidationPrice`)时，`_redemptionPrice` 是至关重要的，因为它定义了系统代币与一个单位的抵押品之间的关系。从 OSM 获取的值被*divided* 通过（已更新的）赎回价格（得到抵押品价值与系统代币的比率），然后再次被抵押品类型的 safetyCRatio (计算安全价格时）和抵押品类型的 `liquidationCRatio`（计算清算价格时）divided。

- 然后调用 `cdpEngine.modifyParameters` 以更新系统内的抵押物价格。

$$
{redemptionPrice_{new}} = {redemptionPrice_{old}} \cdot {redemptionRate}^{\Delta t}
$$

```solidity
// geb/src/single/OracleRelayer.sol
/**
* @notice Update the collateral price inside the system (inside SAFEEngine)
* @param collateralType The collateral we want to update prices (safety and liquidation prices) for
*/
function updateCollateralPrice(bytes32 collateralType) external {
    (uint256 priceFeedValue, bool hasValidValue) =
        collateralTypes[collateralType].orcl.getResultWithValidity();
    uint256 redemptionPrice_ = redemptionPrice();
    uint256 safetyPrice_ = hasValidValue ? rdivide(rdivide(multiply(uint256(priceFeedValue), 10 ** 9), redemptionPrice_), collateralTypes[collateralType].safetyCRatio) : 0;
    uint256 liquidationPrice_ = hasValidValue ? rdivide(rdivide(multiply(uint256(priceFeedValue), 10 ** 9), redemptionPrice_), collateralTypes[collateralType].liquidationCRatio) : 0;

    safeEngine.modifyParameters(collateralType, "safetyPrice", safetyPrice_);
    safeEngine.modifyParameters(collateralType, "liquidationPrice", liquidationPrice_);
    emit UpdateCollateralPrice(collateralType, priceFeedValue, safetyPrice_, liquidationPrice_);
}

/**
* @notice Fetch the latest redemption price by first updating it
*/
function redemptionPrice() public returns (uint256) {
    if (now > redemptionPriceUpdateTime) return updateRedemptionPrice();
    return _redemptionPrice;
}

/**
* @notice Update the redemption price using the current redemption rate
*/
function updateRedemptionPrice() internal returns (uint256) {
    // Update redemption price
    _redemptionPrice = rmultiply(
        rpower(redemptionRate, subtract(now, redemptionPriceUpdateTime), RAY),
        _redemptionPrice
    );
    if (_redemptionPrice == 0) _redemptionPrice = 1;
    redemptionPriceUpdateTime = now;
    emit UpdateRedemptionPrice(_redemptionPrice);
    // Return updated redemption price
    return _redemptionPrice;
}

```

## Token Module

> ERC20 tokens, authority contracts and adapters for exiting and joining collateral in an out of the system

- DSDelegateToken
- Coin
- BasicTokenAdapters
- AdvancedTokenAdapters
- ProtocolTokenAuthority
- GebPrintingPermissions

- 系统币（System Coin | RAI）：这是核心系统认为价值等同于其内部债务单位的代币。
- 协议代币（Protocol Token | FLX）：一种 ds-token，继承了 UNI 和 COMP 的委派能力。它包含了销毁和授权铸造的逻辑。该代币可用于管理系统和作为资本重组的来源。
- 协议代币授权（Protocol Token Authority）：确定谁有资格铸造和烧毁协议代币的权威合约。
- Geb 铸造权限（Geb Printing Permissions）：允许多个债务拍卖合约铸造协议代币的权限系统。
- 代币适配器（Token Adapters）：
  - 抵押品适配器（Collateral Adapters）：允许任何人将抵押品进入或退出 GEB。
  - Coin Join：用于使系统币以 ERC20 的形式退出系统，并以 SAFEEngine.coinBalance 的形式进入系统的适配器。

## Money Market Module

> Interest rate setters and collectors

Relevant smart contracts:

- TaxCollector 合约

Money Market Module 包含了治理（或自治利率设定者）可用于设定和收取稳定费用的组件。

## Sustainability Module

> The protocol's resource management engine

Relevant smart contracts:

- StabilityFeeTreasury
- FSM Wrapper
- Increasing Treasury Reimbursement
- Mandatory Fixed Treasury Reimbursement
- Increasing Reward Relayer

可持续性模块分配资源给那些更新关键系统组件（如预言机）的参与者，即使他们没有对协议进行治理的权限也可以执行。

- StabilityFeeTreasury——此合约试图为自己保持“最佳”数量的稳定费，以确保其能向维护协议的其他合约（或某些情况下为个人）提供资金。任何人都可以定期调用功能来重新计算要保留在国库中的最佳资金金额。超过最佳值的任何剩余资金都将转移到 `extraSurplusReceiver` 中。
- FSMWrapper —— 此合约旨在作为 FSM 类合约的资金来源，并充当允许其他合约从与包装器集成的 FSM 中读取数据的接口。
- IncreasingTreasuryReimbursement——此合约旨在被继承并用作提供逐步增加的稳定费奖励（从 SF 国库中提取）任何人都可调用。
- MandatoryFixedTreasuryReimbursement，旨在被继承并用作向任何地址提供固定稳定费奖励（从 SF 国库中提取）的方法。
- IncreasingRewardRelayer，旨在从 StabilityFeeTreasury 中获取资金并将其发送到自定义地址。它继承自 IncreasingTreasuryReimbursement 合约的功能。

### Stability Fee Treasury

> The protocol's invoice processor

StabilityFeeTreasury 旨在允许其他合约或 EOA 拉取资金（稳定费），以资助其运营。国库设置为 TaxCollector 的 secondaryReceiver。任何人都可以定期调用合约，重新计算在国库中应该保留的最佳的费用数量，并将任何额外的剩余资金发送到 extraSurplusReceiver 中。

Treasury 的资金来源是稳定费，可以来自 TaxCollector 或愿意将系统代币发送到 Treasury 的任何人。治理机构也可以使用 takeFunds 将内部系统代币从源地址转移到 Treasury。

治理机构负责设置授权地址，这些地址可以从 Treasury 中提取资金（如果其总额或每块津贴允许的话），同时设置 Treasury 参数以确定合约中应始终保留的资金最佳数量。我们定义“最佳”是最近一次 transferSurplusFunds 调用以来 Treasury 发生的开支的乘数（expensesMultiplier）。

transferSurplusFunds 是 Treasury 重新计算其应保留储备资金的方式，并将任何剩余资金转入 extraSurplusReceiver。请注意，重新计算最佳值和从合约转移剩余款项之间存在时间延迟。

发送资金到 extraSurplusReceiver 或 Treasury 本身

如果治理机构想使用 giveFunds 将资金发送到 extraSurplusReceiver，则 expensesAccumulator 不会增加。如果某个地址想要 pullFunds 并将它们发送到 extraSurplusReceiver，则 pullFunds 将 revert。

如果 dstAccount 是 Treasury 合约本身，则 pullFunds 将静默失败，而 giveFunds 将 revert。

## Automation Module

> A set of contracts in charge with automating a GEB

Relevant smart contracts:

- CollateralAuctionThrottler
- SingleSpotDebtCeilingSetter
- ESMThresholdSetter

自动化模块是一套用于自动化 GEB 部署中参数设置的合约。它们旨在减轻系统管理的负担，使社区能够将精力集中于其他领域。

- CollateralAuctionThrottler - 这个合约限制了任何给定时间等待通过抵押品拍卖来覆盖的坏账的数量

- SingleSpotDebtCeilingSetter - 这个合约通过查看 SAFEEngine 中的当前 globalDebt 来重新计算特定抵押品类型的债务上限

- ESMThresholdSSetter - 这个合约通过使用 ESM 重新计算燃烧和触发结算所需的阈值

## Governance Module

> Tools for achieving consensus

- ​DSPause - 规定了社区投票或多签钱包交易发出和执行的 间隔时间 (delay)

## Shutdown Module

> Winding down system operations

Shutdown Module 负责在发生严重威胁时（如长期市场失序、黑客攻击或安全漏洞），对系统进行关机处理，并将所有抵押物资退还给用户。结算可以由紧急关机模块（ESM）触发，在这种情况下，治理需要存入（并销毁）一定数量的协议代币，或者如果治理方可以直接访问 GlobalSettlement，则可以绕过 ESM 并结算系统。

- GlobalSettlement-该合约关闭 GEB 并确保 SAFE 和系统代币用户收到他们应得的资产净值。硬币持有人可以赎回的抵押品价值将根据结算时系统盈余或赤字而异。有可能，硬币持有人将获得少于或多于- OracleRelayer.redemptionPrice 的抵押品价值。
- ESM-如果足够的代币在 ESM 中存入（并随后被销毁），该合约可以触发全局结算。
