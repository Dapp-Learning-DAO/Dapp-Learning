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
        bool   isInitialized; 
        bool   isSwapEnabled ; 
        bool   isLeverageEnabled ; 
        bool  includeAmmPrice ;      
        uint32   taxBasisPoints; 
        uint32  stableTaxBasisPoints ; 
        uint32  mintBurnFeeBasisPoints ; 
        uint32   stableSwapFeeBasisPoints; 
        uint32   whitelistedTokenCount;
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
* 改成private节省gas
* view改成pure
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



