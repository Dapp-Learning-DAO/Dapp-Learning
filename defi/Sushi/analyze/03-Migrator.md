# 介绍  
Migrator 也是 SushiSwap 的 LP 迁移合约，和 SushiRoll 不同的是，Migrator 合约用于 Sushi 内部的 LP 迁移，并且只能由 MasterChef 合约进行调用。 
比如 Sushi 合约进行了升级后，MasterChef 可以调用 migrate 接口，把流动性从旧的 pair 合约中迁移到新的 pair 合约上。具体流程如下：  
1) 部署合约时设置 oldFactory 和 newFactory 合约地址  
2）调用 migrate 接口，传入需要迁移的 pair 合约地址； Migrator 把 LP 从 old pair 合约迁移到 new pair 合约，然后判断迁移前后 LP 的大小是否一致，如果一致，本次迁移成功，否则失败  


## 合约分析  
Migrator 合约中只有两个接口，一个 constructor 构造函数和 migrate 迁移函数  

- constructor  
构造函数用于在 Migrator 合约部署时，接受 4 个参数   
1） _chef 是 MasterChef 合约的地址    
2） _oldFactory 就旧的 factory 合约地址   
3）_factory 新的 factory 合约地址   
4）notBeforeBlock 限制只能在特定的块高后进行迁移     

```solidity
constructor(
        address _chef,
        address _oldFactory,
        IUniswapV2Factory _factory,
        uint256 _notBeforeBlock
    ) public {
        chef = _chef;
        oldFactory = _oldFactory;
        factory = _factory;
        notBeforeBlock = _notBeforeBlock;
    }
```

- migrate   
执行 LP 迁移的接口。
1）首先判断当前进行迁移的旧 factory 合约是否为指定的合约，如果不是则不进行迁移  
2）在新的 factory 合约中是否存在对应的 pair 交易对，如果不存在则进行创建  
3）获取 MasterChef 在旧 facotry 的 LP ，然后进行 burn ，获取 token0 和 token1
4）在新的 pair 合约中添加流动性  

```solidity
function migrate(IUniswapV2Pair orig) public returns (IUniswapV2Pair) {
        require(msg.sender == chef, "not from master chef");
        require(block.number >= notBeforeBlock, "too early to migrate");
        require(orig.factory() == oldFactory, "not from old factory");
        address token0 = orig.token0();
        address token1 = orig.token1();
        IUniswapV2Pair pair = IUniswapV2Pair(factory.getPair(token0, token1));
        if (pair == IUniswapV2Pair(address(0))) {
            pair = IUniswapV2Pair(factory.createPair(token0, token1));
        }
        uint256 lp = orig.balanceOf(msg.sender);
        if (lp == 0) return pair;
        desiredLiquidity = lp;
        orig.transferFrom(msg.sender, address(orig), lp);
        orig.burn(address(pair));
        pair.mint(msg.sender);
        desiredLiquidity = uint256(-1);
        return pair;
    }
```
