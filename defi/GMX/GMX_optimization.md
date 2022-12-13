# 给GMX提升一下
gmx是很牛逼的项目, 但是毕竟是一个人的作品, 代码方面优化空间很大

# 1. gas 方面的优化
## 提升1
### 原来结构 消耗gas 186732

优化思路
* 布尔类型使用一个插槽太浪费
* factor这个参数听起来数字不会很大, 可以改小, 合并成一个插槽
* 最后在函数里, 先storage取出来放memory中, 修改完毕后, 放回storage.
```solidity
contract Vault  {

    bool public  isInitialized;
    uint256 public  liquidationFeeUsd;
    uint256 public  fundingRateFactor; // 最大值10000
    uint256 public  stableFundingRateFactor;// 最大值10000
    
    address public  router;
    address public  priceFeed;
    address public  usdg;
    
    function initialize(
            address _router,
            address _usdg,
            address _priceFeed,
            uint256 _liquidationFeeUsd,
            uint256 _fundingRateFactor,
            uint256 _stableFundingRateFactor
        ) external {
        _validate(!isInitialized, 1);
        isInitialized = true;

        router = _router;
        usdg = _usdg;
        priceFeed = _priceFeed;
        liquidationFeeUsd = _liquidationFeeUsd;
        fundingRateFactor = _fundingRateFactor;
        stableFundingRateFactor = _stableFundingRateFactor;
    }
}
```

#### gas 优化后, gas消耗从186732降为142136
```solidity
contract Vault  {
    
    struct Slot0{
        bool   isInitialized; // 8
        bool   isSwapEnabled ; // 16
        bool   isLeverageEnabled ; // 24
        bool  includeAmmPrice ; // 32        
        uint8   taxBasisPoints; // 500 max
        uint8  stableTaxBasisPoints ; // 500 max
        uint8  mintBurnFeeBasisPoints ; // 
        
        uint16 whitelistedTokenCount;//
        uint32 totalTokenWeights;//

        uint16 fundingRateFactor; // 最大值10000
        uint16 stableFundingRateFactor;// 最大值10000
        uint112   liquidationFeeUsd; // 最大值 100 * 10 ** 30
    }
    Slot0 public slot0; 
    address public  router;
    address public  priceFeed;

    address public  usdg;
    function initialize(
            address _router,
            address _usdg,
            address _priceFeed,
            uint256 _liquidationFeeUsd,
            uint256 _fundingRateFactor,
            uint256 _stableFundingRateFactor
        ) external {//162136, 186732
        Slot0 memory _slot0 = slot0;
        _validate(!_slot0.isInitialized, 1);
        _slot0.isInitialized = true;

        router = _router;
        usdg = _usdg;
        priceFeed = _priceFeed;
        _slot0.liquidationFeeUsd = uint112(_liquidationFeeUsd);
        _slot0.fundingRateFactor = uint16(_fundingRateFactor);
        _slot0.stableFundingRateFactor = uint16(_stableFundingRateFactor);
        slot0 = _slot0;
    }  
}
```

## 提升2
### 优化报错机制(162049gas)
* 不读取storage
```solidity
mapping (uint256 => string) public errors; // 应该去掉

function swap(address _tokenIn, address _tokenOut, address _receiver) external override nonReentrant returns (uint256) {
    _validate(isSwapEnabled, 23);
    _validate(whitelistedTokens[_tokenIn], 24);
    _validate(whitelistedTokens[_tokenOut], 25);
    _validate(_tokenIn != _tokenOut, 26);
    // ...
}

// 这个函数应该删掉
function _validate(bool _condition, uint256 _errorCode) private view {
    require(_condition, errors[_errorCode]);
}
```

#### 修改后(162049 - 4 * 1000 gas)

```solidity

function swap(address _tokenIn, address _tokenOut, address _receiver) external override nonReentrant returns (uint256) {
    require(isSwapEnabled, "23");
    require(whitelistedTokens[_tokenIn], "24");
    require(whitelistedTokens[_tokenOut], "25");
    require(_tokenIn != _tokenOut, "26");
}
```

## 提升3 
### 优化mapping

优化前 gas 263554

* 这么多address mapping, 太浪费, 合并成一个结构体, 把uint256改小

```solidity
uint256 public override totalTokenWeights;
mapping (address => bool) public override whitelistedTokens;
mapping (address => uint256) public override tokenDecimals;
mapping (address => uint256) public override tokenWeights;
mapping (address => uint256) public override minProfitBasisPoints;
mapping (address => uint256) public override maxUsdgAmounts;
mapping (address => bool) public override stableTokens;
mapping (address => bool) public override shortableTokens;
address[] public override allWhitelistedTokens;
uint256 public override whitelistedTokenCount;

function setTokenConfig(
        address _token,
        uint256 _tokenDecimals,
        uint256 _tokenWeight,
        uint256 _minProfitBps,
        uint256 _maxUsdgAmount,
        bool _isStable,
        bool _isShortable
    ) external override {
    // increment token count for the first time
    if (!whitelistedTokens[_token]) {
        whitelistedTokenCount = whitelistedTokenCount.add(1);
        allWhitelistedTokens.push(_token);
    }

    uint256 _totalTokenWeights = totalTokenWeights;
    _totalTokenWeights = _totalTokenWeights.sub(tokenWeights[_token]);

    whitelistedTokens[_token] = true;
    tokenDecimals[_token] = _tokenDecimals;
    tokenWeights[_token] = _tokenWeight;
    minProfitBasisPoints[_token] = _minProfitBps;
    maxUsdgAmounts[_token] = _maxUsdgAmount;
    stableTokens[_token] = _isStable;
    shortableTokens[_token] = _isShortable;

    totalTokenWeights = _totalTokenWeights.add(_tokenWeight);
}
```

#### 优化后 263554 -> 168347
```solidity
struct AddrObj{
    bool isLiquidator;
    bool isManager;
    bool whitelistedTokens;
    bool stableTokens;
    bool shortableTokens;
    uint32 tokenWeights; // 可以大于100, 利用tokenWeights / totalTokenWeights 计算总比例
    uint16 tokenDecimals;// 一般在0-32之间
    uint16 minProfitBasisPoints; // 最大值10000, 因此65535够用了
    // feeReserves tracks the amount of fees per token
    uint112 feeReserves;
}
    
mapping (address => AddrObj) public addrObjs;

function setTokenConfig(
        address _token,
        uint256 _tokenDecimals,
        uint256 _tokenWeight,
        uint256 _minProfitBps,
        uint256 _maxUsdgAmount,
        bool _isStable,
        bool _isShortable
    ) external  {
    // increment token count for the first time
    AddrObj memory _addrObj = addrObjs[_token];
    Slot0 memory _slot0 = slot0;

    if (!_addrObj.whitelistedTokens) {
        _slot0.whitelistedTokenCount = _slot0.whitelistedTokenCount + 1;
        allWhitelistedTokens.push(_token);
    }

    uint32 _totalTokenWeights = _slot0.totalTokenWeights;
    _totalTokenWeights = _totalTokenWeights - _addrObj.tokenWeights;

    _addrObj.whitelistedTokens = true;
    _addrObj.tokenDecimals = uint16(_tokenDecimals);
    _addrObj.tokenWeights = uint32(_tokenWeight);
    _addrObj.minProfitBasisPoints = uint16(_minProfitBps);
    _addrObj.stableTokens = _isStable;
    _addrObj.shortableTokens = _isShortable;
    addrObjs[_token] = _addrObj;
    maxUsdgAmounts[_token] = _maxUsdgAmount;

    _slot0.totalTokenWeights = _totalTokenWeights + uint32(_tokenWeight);
    slot0 = _slot0;
}
```

## 提升4 local作用域, 保存变量多次使用

#### before 54280
```solidity
function _increaseReservedAmount(address _token, uint256 _amount) external {//54280
    reservedAmounts[_token] = reservedAmounts[_token] + _amount;
    require(reservedAmounts[_token] <= poolAmounts[_token], "error");
}   
```



#### after 54011
```solidity
function _increaseReservedAmount2(address _token, uint256 _amount) external {//54011
    uint256 _local = reservedAmounts[_token];
    _local = _local + _amount;
    require(_local<= poolAmounts[_token], "error");
    reservedAmounts[_token] = _local;
}
```

## 提升5 减少重复访问另一个合约
作者有较多函数调用了VaultPriceFeed合约, 该合约与vault合约完全分离, vault通过调用该合约获取代币当前的标记价格, 如果是我们本地访问这种view函数, 是不需要gas费的, 但是如果是在一次transaction当中访问, 是需要额外gas的. 因此可以在此同一次transaction当中, 缓存价格, transaction结束后,清空缓存. 避免重复消耗资源, 从而达到节省gas的目的.


# 2. 代码文件大小的优化
我们在优化了gas和数据结构后, 发现代码因为过大无法部署, 另一方面也说明原先代码功能过于集中在一个文件, 后期维护和升级造成较大困难

我们的主要目的是拆分`Vault.sol`

#### 使用代理合约
拆分代码一般步骤: 
* 抽离状态变量做一个单独的父类
* 逻辑合约与代理合约分别继承同一个父类的状态变量, 保持插槽一致性
* 把原先代码中比较长的函数分离出来, 放入新建的这个逻辑合约中
* 把逻辑合约和代理合约中共用的代码做成library(最好是internal的, 节省一些gas费, 否则又是一个跨合约调用)
* libraray拆分一般是计算类的工具类的函数形成一个lib
* 验证类的形成一个lib
* 修改状态变量类的形成一个lib(只修改一个状态变量且需要大量计算的, 如果修改多个状态变量的,不建议形成lib)


```solidity
contract VaultStorage{
// 这里放状态变量, 一般定义为internal
    uint256 internal x;
    address internal vaultManager;
}
interface IVault{
    function A()external;
    function B()external;
    function getX() exnteral returns(uint256);
    function setX() exnteral;
}
contract Vault is IVault{
    constructor(address _mgr){
        vaultManager = _mgr;
    }
    function A()external override{
        //...
    }
    function B()external override{
        vaultManager.delegatecall(msg.data);        
    }
    function getX()external override returns(uint256){
        return x;
    }
    function setX(uint256 _x) external override{
        x = _x;
    }
}
contract VaultManager{
    function B()external {
        // ...
    }
}

```
其实原作者在拆分方面已经做了很多工作:
* 把报错的代码单独分拆出来, 形成一个`error controller`合约
* `vault price feed`单独分离出来做了一个合约
* 做了route合约, 把一部分非核心逻辑抽离出来
* 做了reader和vaultreader合约, 把一部分view和大量数学计算的函数抽离
