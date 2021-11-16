## Ticket 介绍  
此合约为彩票合约, 当用户存入资产, 如 Dai/USDT/USDC 时, 就会获得相应的彩票份额.  

## 主要接口介绍  
- initialize   
初始化接口, 用于初始化相应的 name/symbol/decimals/controller.  
```solidity
/// @notice Initializes the Controlled Token with Token Details and the Controller
  /// @param _name The name of the Token
  /// @param _symbol The symbol for the Token
  /// @param _decimals The number of decimals for the Token
  /// @param _controller Address of the Controller contract for minting & burning
  function initialize(
    string memory _name,
    string memory _symbol,
    uint8 _decimals,
    TokenControllerInterface _controller
  )
    public
    virtual
    override
    initializer
  {
    require(address(_controller) != address(0), "Ticket/controller-not-zero");
    ControlledToken.initialize(_name, _symbol, _decimals, _controller);
    sortitionSumTrees.createTree(TREE_KEY, MAX_TREE_LEAVES);
    emit Initialized(
      _name,
      _symbol,
      _decimals,
      _controller
    );
  }
```

- 