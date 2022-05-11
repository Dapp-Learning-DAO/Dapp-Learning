# Uniswap v3 Flashswap 介绍  

Uniswap v3 版本中，和 v2 一样也有两种闪电贷的方式，但是是通过不同的函数接口来完成的。

第一种是普通的闪电贷，即借入 token 和还贷 token 相同，通过 UniswapV3Pool.flash() 完成
第二种是类似 v2 的 flash swap，即借入 token 和还贷 token 不同，这个是通过 UniswapV3Pool.swap() 来完成的。

## 代码解析  
- constructor  
合约的构造函数，用于进行 flahs loan 和 flash swap.  
部署的时候需要传入 token0 和 token1 的地址, 其中一个 WETH , 另一个可以为 DAI/USDC/USDT 等. 在本样例中，借入币种为 WETH，所以需要 token0 或 token1 其中一个为 WETH

```solidity
constructor(address _token0, address _token1) {
        token0 = _token0;
        token1 = _token1;

        // pool fees that where be used to get the pool with largest liquidity
        v3Fees[0] = 500;
        v3Fees[1] = 3000;
        v3Fees[2] = 10000;
    }

```

- uniswapV3FlashCallback   
pool.flash 的回调接口。 当调用 pool.flash 后，uniswap V3 会根据接口传入的 token0 amount 和 token1 amount 数值，借贷对应的数额给调用者，然后回调调用者的 uniswapV3FlashCallback 让调用者进行后续的处理。当 uniswapV3FlashCallback 回调结束后，uniswap V3 pool 会检查调用者是否偿还对应的 amount + fee 给 pool, 如果已经偿还，则 flash loan 调用成功；否则 flash loan 调用失败。   
在 demo 合约中，没有进行其他的操作，直接偿还 amount + fee 给 pool，实际调用中，可以添加相应的处理代码。  

```solidity
// callback function of uniswap V3's flash loan
    // _fee0: callback data, input by uniswapV3 automatically, which is used to repay for the borrow. which means, if you borrow 5 token0 , you need to repay "5 + _fee0"
    // _fee1: same as _fee0, which is used for token1
    // data: user input data when call pool.flahs
    function uniswapV3FlashCallback(uint256 _fee0, uint256 _fee1, bytes calldata data) external {
        (
            uint256 amount0,
            uint256 amount1,
            address pool
        ) = abi.decode(data, (uint256, uint256,address));

        uint256 fee0 = _fee0;
        uint256 fee1 = _fee1;

        // launch actions
        {
           
            console.log('[+] Do flashloan ');

        }

        // repay flash loan
        IERC20(token0).transfer(pool, amount0 + fee0);
        IERC20(token1).transfer(pool, amount1 + fee1);
    }
```   
   
- uniswapV3SwapCallback   
uniswapV3 pool 的 swap 回调接口. 通过 uniswap v3 的官方页面进行 swap 的时候，实际是调用 uniswap v3 router 的 swap 接口，同时 uniswap v3 router 已经实现了 uniswapV3SwapCallback 的处理，所以用户感知不到回调。但如果是通过 uniswap v3 pool 的 swap 接口进行 swap 操作时，调用合约需要实现 uniswapV3SwapCallback ， 否则会调用失败。  
不同于 uniswapV3FlashCallback 回调时，uniswap v3 pool 回调传入的 amount 参数只有需要支付的 fee，用户的 borrow amount 需要自行进行处理。而 uniswapV3SwapCallback 回调时，uniswap v3 pool 传入的参数为此次 swap 需要偿还币种的数量 ( token0 和 token1 )。   
举例来说，我们想使用 10 WETH 换取 20 DAI，当 swap 回调成功时，pool 会借贷 20 DAI 给调用者 （ 注意此时我们还没有转入 10 WETH 给 pool ），然后传入此次 swap 需要 repay 的 token0 或 token1 的数量，即转入 10 WETH 给 pool 完成此次 swap ， 或是再转回 20 DAI 给 pool ( 相当于不进行 swap )。 

```solidity
    /// @notice Uniswap v3 callback fn, called back on pool.swap
    // amount0Delta: token0 amount which is needed to repay to pool at least
    // amount1Delta: token1 amount which is needed to repay to pool at least
    function uniswapV3SwapCallback(
        int256 amount0Delta,
        int256 amount1Delta,
        bytes calldata data/*data*/
    ) external {
        (
            address pool,
            bool zeroForOne
        ) = abi.decode(data, (address,bool));
        // do your callback actions here
        console.log('[+] Do swap callback ');

        // token0 repay amount for swap. for this demo, we just repay token0 amount 
        // for example, you swap 10 WETH , and get 20 DAI, you can choose whether repay 10 WETH ( token0 ) or 20 DAI ( token1 ). here, we suppose token0 is WETH , and we just repay WETH
        if (zeroForOne)
            IERC20(token0).transfer(msg.sender, uint256(amount0Delta));
        else
            IERC20(token1).transfer(msg.sender, uint256(amount1Delta));
    }
```

## 操作步骤  
- 安装依赖  
```shell
yarn
```

- 配置环境变量  
```shell
cp .env.example .env
# 在 .env 中配置  INFURA_ID , PRIVATE_KEY, ETHERSCAN_APIKEY
```

- 执行闪电贷 && swap callback    
```shell
npx hardhat run scripts/flashloan_and_swapcallback.js --network rinkeby  
```

参考：  
- 闪电贷详解：https://liaoph.com/uniswap-v3-6/   
- uniswap-flash-swapper： https://github.com/gebob19/uniswap-v3-flashswap           
- 获取 kovan Dai Token: https://docs.alchemist.wtf/copper/auction-creators/getting-test-tokens-for-balancer-lbps-on-the-kovan-testnet    
- WETH Token List: https://docs.uniswap.org/protocol/reference/deployments    
- uniswap v3 swap callback: https://github.com/makerdao/univ3-lp-oracle/blob/master/src/GUniLPOracle.t.sol  
- uniswap v3 pool: https://github.com/Uniswap/v3-core/blob/main/contracts/UniswapV3Pool.sol  