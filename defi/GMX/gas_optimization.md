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
  require(isSwapEnabled, "Vault: !SwapEnabled");
  // ...
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

