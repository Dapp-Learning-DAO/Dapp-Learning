# 介绍  
SushiMaker 是 SushiBar 的手续费收集工具，用于把获得的用户手续费转换为 Sushi token 发送给 SushiBar 合约。当用户提取质押在 SushiBar 上的 Sushi token 的时候，会按比例获得 SushiBar 上获得用户手续费。  
SushiMaker 转换手续费的逻辑如下：  
- 用户每次在一个交易对 ( 比如 ETH-DAI ） 上进行交易的时候，支付的手续费会对应的转换为 LP token ，其中手续费 LP token 的 0.05% 会发送给 SushiMaker。    
- SushiMaker 对于每个交易对会调用对应的 burn 方法，获得 token0 和 token1   
- SushiMaker 之后再把获得的 token0 和 token1 全部通过 swap 转换为 sushi token   
- SushiMaker 把转换后的 sushi token 发送给 SushiBar 合约  
- SushiBar 在用提取质押的 sushi token 的时候，会把 SushiMaker 发送过来的 sushi token 按照用户质押的比例发送给用户   


## 合约分析  
Sushi Maker 有几个重要的接口，下面进行详细介绍。  
- setBridge   
设置非 weth/sushi 币种的中间转换币种。因为最终 SushiMaker 发送给 SushiBar 的是 sushi token，所以当不存在不存在此币种和 sushi token 的交易对时，需要通过其他币种进行转换。比如 shib ，当不存在 shib/sushi 这个交易对的时候，可以设置 bridge 为 weth ， 即先把 shib 转换为 weth ，然后再通过 weth/sushi 交易对，把 weth 全部转换为 sushi token。  
```solidity
function setBridge(address token, address bridge) external onlyOwner {
        // Checks
        require(
            token != sushi && token != weth && token != bridge,
            "SushiMaker: Invalid bridge"
        );

        // Effects
        _bridges[token] = bridge;
        emit LogBridgeSet(token, bridge);
    }
```

- onlyEOA   
定义 modifer，用于后面的 convert 接口。因为 SushiMaker 在转换其他 token 为 sushi token 的时候，会进过很多交易对，恶意用户可以通过闪电贷来操纵价格来获利，为了防止闪电贷的攻击，限制调用 convert 的用户只能为 EOA 账户，即非合约账户。  
```solidity
modifier onlyEOA() {
        // Try to make flash-loan exploit harder to do by only allowing externally owned addresses.
        require(msg.sender == tx.origin, "SushiMaker: must use EOA");
        _;
    }
```

- swap   
swap 接口为 token 转换接口，即可以使用这个接口把其他 token 转换为 sushi token ( 传入 fromToken 为其他 token，toToken 为 sushi token )，也可是用来把其他 token 转换为中间 token ( 比如 weth )。 需要注意的是，接口最终会返回转换后的 token 数量 ==> amountOut。 amountOut 值为扣除手续费后实际得到的 toToken 数量。 
```solidity
function _swap(
        address fromToken,
        address toToken,
        uint256 amountIn,
        address to
    ) internal returns (uint256 amountOut) {
        // Checks
        // X1 - X5: OK
        IUniswapV2Pair pair =
            IUniswapV2Pair(factory.getPair(fromToken, toToken));
        require(address(pair) != address(0), "SushiMaker: Cannot convert");

        // Interactions
        // X1 - X5: OK
        (uint256 reserve0, uint256 reserve1, ) = pair.getReserves();
        uint256 amountInWithFee = amountIn.mul(997);
        if (fromToken == pair.token0()) {
            amountOut =
                amountInWithFee.mul(reserve1) /
                reserve0.mul(1000).add(amountInWithFee);
            IERC20(fromToken).safeTransfer(address(pair), amountIn);
            pair.swap(0, amountOut, to, new bytes(0));
            // TODO: Add maximum slippage?
        } else {
            amountOut =
                amountInWithFee.mul(reserve0) /
                reserve1.mul(1000).add(amountInWithFee);
            IERC20(fromToken).safeTransfer(address(pair), amountIn);
            pair.swap(amountOut, 0, to, new bytes(0));
            // TODO: Add maximum slippage?
        }
    }
```

- _convertStep  
此接口是 SushiMaker 的核心接口，用于把其他转换为 sushi token，具体的转换规则如下：  
1） 当 token （ token0 或是 token1 ） 为 sushi token 时，直接把 token 对应余额发送给 sushiBar  
2） 当 token （ token0 或是 token1 ) 为 weth token 时，把 weth 通过 weth/sushi 交易对转换为 sushi token，然后把转换后的余额发送给 sushiBar  
3） 当不满足 1，2 时，通过 bridge 获得此币种的中间转币种，比如 shib 的中间转换币种为 weth 。把此币种转换为中间币种，然后重复步骤 1，2，3
```solidity
function _convertStep(
        address token0,
        address token1,
        uint256 amount0,
        uint256 amount1
    ) internal returns (uint256 sushiOut)
```