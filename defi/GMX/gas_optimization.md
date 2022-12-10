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
    uint256 public  fundingRateFactor;
    uint256 public  stableFundingRateFactor;
    
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

gas 优化后, gas消耗从186732降为162136
```solidity
contract Vault  {
    
    struct Slot0{
        bool   isInitialized; // 8
        bool   isSwapEnabled ; // 16
        bool   isLeverageEnabled ; // 24
        bool  includeAmmPrice ; // 32        
        uint32   taxBasisPoints; // 80
        uint32  stableTaxBasisPoints ; // 88
        uint32  mintBurnFeeBasisPoints ; // 96
        
        uint32   whitelistedTokenCount;//136
        uint32 totalTokenWeights;//224

        uint32 fundingRateFactor;
        uint32 stableFundingRateFactor;
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
        liquidationFeeUsd = _liquidationFeeUsd;
        _slot0.fundingRateFactor = uint32(_fundingRateFactor);
        _slot0.stableFundingRateFactor = uint32(_stableFundingRateFactor);
        slot0 = _slot0;
    }  
}
```

## 提升2
### 优化报错机制(162049gas)
* 不读取storage
```solidity
mapping (uint256 => string) public errors;

function initialize(){
  _validate(!_slot0.isInitialized, 1);
  // ...
}

function _validate(bool _condition, uint256 _errorCode) private view {
    require(_condition, errors[_errorCode]);
}
```

#### 修改后(161911 gas)

```solidity

function initialize(){
  require(!_slot0.isInitialized, "Vault: already initialized");
  // ...
}
```

# 优化3 
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

优化后 263554 -> 168347
```solidity
struct AddrObj{
    bool isLiquidator;
    bool isManager;
    bool whitelistedTokens;
    bool stableTokens;
    bool shortableTokens;//40
    uint32 tokenWeights;
    uint16 tokenDecimals;
    uint16 minProfitBasisPoints;
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


