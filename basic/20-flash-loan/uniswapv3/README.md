[中文](./README-CN.md) / English

# Uniswap v3 Flashswap introduce  

In v3 version of Uniswap, it has two ways to use flash loan like v2, but by using different functions.

The first one is the normal flash loan, which is you need to borrow and repay the same type of token, by calling UniswapV3Pool.flash() to do this.

The second one is similar to flash swap of v2, you don't need to use the same token to borrow or repay, you can call UniswapV3Pool.swap() to make this.

## codes illustrate  
- constructor  
The constructor function of the contract, it used to call flash loan and flash swap.  

When it is deployed you need to pass the addresses of token0 and token1, one of them should be WETH, another one can be DAI/USDC/USDT, etc. In this example, we want to borrow WETH, so it requires we should set one of token0 or token1 to be WETH  

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
The callback interface of pool.flash. After we called pool.flash, uniswap V3 will loan a number of amount tokens to the caller depending on the value of token0 amount and token1 amount which is passed to the interface, and then call the caller's uniswapV3FlashCallback function to let the caller proceed to deal. When uniswapV3FlashCallback callback is over, uniswap V3 pool will check out whether the caller repay the correspondence amount + fee to the pool, if did then the flash loan can be successfully called, otherwise the calling of the flash loan will fail.  

We don't do further operations in demo contract, just repay amount + fee to the pool, when you actually use it, you can add correspondence dealing codes to it.  

```solidity
// callback function of uniswap V3's flash loan
    // _fee0: callback data, input by uniswapV3 automatically, which is used to repay for the borrow. which means, if you borrow 5 token0 , you need to repay "5 + _fee0"
    // _fee1: same as _fee0, which is used for token1
    // data: user input data when call pool.flash
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
The callback interface of the swap of uniswapV3 pool function. When we swap by uniswap v3 official webpage, it's actually calling swap interface of uniswap v3 router, meanwhile, uniswap v3 router had already implemented the uniswapV3SwapCallback, so the user won't feel anything about it. But if we do swap operation by call swap interface of uniswap v3 pool, the contract needs to implement uniswapV3SwapCallback, otherwise, the calling will fail.  

It's different with when uniswapV3FlashCallback is doing a callback that the amount param which passes to uniswap v3 pool callback is only the number of fee which need to be paid, the borrowed amount of user need to be dealt with by itself. But when callback in uniswapV3SwapCallback, the param to uniswap v3 pool is the token amount ( token0 and token1 ) need to repay for this swap.   

For example, if we want to use 10 WETH to exchange 20 DAI, when the callback of swap is succeeded, the pool will borrow 20 DAI to caller ( attention, at this moment we haven't transferred 10 WETH to the pool ), and then pass the amount of token0 or token1 which need repay for this swap, thus repay 10 WETH to the pool to finish this swap, or repay 20 DAI  to it ( equal to we don't do swap this time ). 

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

## Steps  
- Install dependencies  
```shell
yarn
```

- Config the envrioument  
```shell
cp .env.example .env
# set INFURA_ID , PRIVATE_KEY, ETHERSCAN_APIKEY in .env
```

- Start flashloan && swap callback    
```shell
npx hardhat run scripts/flashloan_and_swapcallback.js --network rinkeby  
```

## Reference link  
- Detail of flash loan：https://liaoph.com/uniswap-v3-6/   
- uniswap-flash-swapper： https://github.com/gebob19/uniswap-v3-flashswap           
- Get kovan Dai Token: https://docs.alchemist.wtf/copper/auction-creators/getting-test-tokens-for-balancer-lbps-on-the-kovan-testnet    
- WETH Token List: https://docs.uniswap.org/protocol/reference/deployments    
- uniswap v3 swap callback: https://github.com/makerdao/univ3-lp-oracle/blob/master/src/GUniLPOracle.t.sol  
- uniswap v3 pool: https://github.com/Uniswap/v3-core/blob/main/contracts/UniswapV3Pool.sol  