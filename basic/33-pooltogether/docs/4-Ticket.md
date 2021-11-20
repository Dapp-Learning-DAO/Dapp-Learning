## Ticket 介绍  
此合约为彩票合约, 当用户存入资产, 如 Dai/USDT/USDC 时, 就会获得相应的彩票份额.  

## 主要接口介绍  
- initialize   
初始化接口, 用于初始化相应的 name/symbol/decimals/controller, 同时创建一个最大子节点个数为 5 的树。
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

- chanceOf 
获取用户的获奖几率, 实际上就是获取这个用户 ID 对应的叶子节点值
```solidity
/// @notice Returns the user's chance of winning.
  function chanceOf(address user) external view returns (uint256) {
    return sortitionSumTrees.stakeOf(TREE_KEY, bytes32(uint256(user)));
  }
``` 

- draw 
抽取获奖用户. 
首先会判断当前 totalSupply 是否为 0, 即是否有用户参与抽奖, 如果没有, 则选取获奖用户为 0 地址; 如果有用户参与抽奖, 则调用 UniformRandomNumber.uniform 获取随机数, 然后根据产生的随机数抽取获奖用户.
```solidity
/// @notice Selects a user using a random number.  The random number will be uniformly bounded to the ticket totalSupply.
  /// @param randomNumber The random number to use to select a user.
  /// @return The winner
  function draw(uint256 randomNumber) external view override returns (address) {
    uint256 bound = totalSupply();
    address selected;
    if (bound == 0) {
      selected = address(0);
    } else {
      uint256 token = UniformRandomNumber.uniform(randomNumber, bound);
      selected = address(uint256(sortitionSumTrees.draw(TREE_KEY, token)));
    }
    return selected;
  }
```

- _beforeTokenTransfer
钩子函数, 在每次转账之前都会调用这个函数用户进行特定设置.
当调用 Ticket 合约的 mint 的接口时, 会在 sortitionSumTrees 中设置用户对应叶子结点的 ID 和 节点值.
```solidity
function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override {
    super._beforeTokenTransfer(from, to, amount);

    // optimize: ignore transfers to self
    if (from == to) {
      return;
    }

    if (from != address(0)) {
      uint256 fromBalance = balanceOf(from).sub(amount);
      sortitionSumTrees.set(TREE_KEY, fromBalance, bytes32(uint256(from)));
    }

    if (to != address(0)) {
      uint256 toBalance = balanceOf(to).add(amount);
      sortitionSumTrees.set(TREE_KEY, toBalance, bytes32(uint256(to)));
    }
  }
```
