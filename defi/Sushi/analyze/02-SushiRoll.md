# 介绍  
SushiRoll 是 SushiSwap 的 LP 迁移合约，可以一键帮助用户迁移 Uniswap 的流动性到 SushiSwap。   
在合约的开头部分，SushiSwap 就已经已经明确的注明此合约是专门用来迁移 UniSwap 的流动性的。
LP 迁移过程如下：  
- 调用 migrateWithPermit 接口，传入需要迁移的两个 token 地址，迁移的 LP 大小 ，用户的 ECDSA 签名    
- migrateWithPermit 调用 pair 合约的 permit ，使用用户授权 SushiRoll 合约操作用户的 LP token      
-  从旧 pair 合约中迁移 LP 到新 pair 合约中 （ 按照新 pair 合约中 token0 和 token1 当前的比例添加 token0 和 token1 )  
- 返还迁移后多余的 token0 和 token1 给用户   


## 合约分析  
SushiRoll 中的主要接口为  migrateWithPermit 和 migrate ，这两个接口功能是是一样的，在 migrateWithPermit 中也是调用了 migrate 接口。  
区别的地方在于 migrateWithPermit 在调用 migrate 之前，先对 SushiRoll 进行了授权，使得 SushiRoll 合约可以操作用户的 liquidity token ，从而进行迁移。 
在 [Ether scan](https://etherscan.io/address/0x14b2075e6d5993ae10df843f9979296f4b6100c6#code ) 上可以查看 SushiRoll 的具体代码。  


- migrateWithPermit  
此接口比 migrate 接口多了三个 ECDSA 参数，分别是 v/r/s ，用于恢复出签名的用户，进而给 SushiRoll 合约授权操作 liquidity token。 
具体授权操作调用的是 UniswapV2Pair 合约的 permit 方法。

```solidity
function migrateWithPermit(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        IUniswapV2Pair pair = IUniswapV2Pair(pairForOldRouter(tokenA, tokenB));
        pair.permit(msg.sender, address(this), liquidity, deadline, v, r, s);

        migrate(tokenA, tokenB, liquidity, amountAMin, amountBMin, deadline);
    }
```

- migrate  
这个接口是真正进行流动性迁移的接口，首先把流动性从 UniSwap 中移除，然后再添加到 Sushi 这边，最后判断添加完成后，是否有剩余的 token，有的话则返还给用户。
```solidity
function migrate(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        uint256 deadline
    ) public {
        require(deadline >= block.timestamp, 'SushiSwap: EXPIRED');

        // Remove liquidity from the old router with permit
        (uint256 amountA, uint256 amountB) = removeLiquidity(
            tokenA,
            tokenB,
            liquidity,
            amountAMin,
            amountBMin,
            deadline
        );

        // Add liquidity to the new router
        (uint256 pooledAmountA, uint256 pooledAmountB) = addLiquidity(tokenA, tokenB, amountA, amountB);

        // Send remaining tokens to msg.sender
        if (amountA > pooledAmountA) {
            IERC20(tokenA).safeTransfer(msg.sender, amountA - pooledAmountA);
        }
        if (amountB > pooledAmountB) {
            IERC20(tokenB).safeTransfer(msg.sender, amountB - pooledAmountB);
        }
    }
```