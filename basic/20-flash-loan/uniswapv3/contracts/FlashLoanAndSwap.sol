pragma solidity ^0.8.0;

import "./interfaces/IUniswapV3Pool.sol";
import "./interfaces/IUniswapV3Factory.sol";
import "./interfaces/IERC20.sol";
import "./libraries/TickMath.sol";
import "hardhat/console.sol";

contract FlashLoanAndSwap {

    IUniswapV3Factory public constant factory =
        IUniswapV3Factory(0x1F98431c8aD98523631AE4a59f267346ea31F984); // const value for all chains

    address public token0;
    address public token1;
    uint24[3] public v3Fees;

    // for this demo, suppose _token0 or _token1 is WETH
    constructor(address _token0, address _token1) {
        token0 = _token0;
        token1 = _token1;

        // pool fees that where be used to get the pool with largest liquidity
        v3Fees[0] = 500;
        v3Fees[1] = 3000;
        v3Fees[2] = 10000;
    }

    // interface to run flashloan
    // wethAmount: WETH amount to borrow from uniswapV3
    function runFlashLoan(uint wethAmount) external {
        // get the largest liquidity pool
        IUniswapV3Pool pool = getTargetPool();
        // get token symbole to decide which token is WETH
        string memory token0Symbol = string(IERC20(token0).symbol());
        uint token0Amont = keccak256(bytes(token0Symbol)) == keccak256('WETH') ? wethAmount : 0;

        // for this demo, we only borrow WETH , for the other token, the borrow amount is 0
        uint token1Amont = wethAmount - token0Amont;
        pool.flash(
            address(this),
            token0Amont,
            token1Amont, 
            // additional info for uniswapV3FlashCallback, can be customed by user
            abi.encode(token0Amont, token1Amont, address(pool))
        );

    }

    // interface to run swap
    function runSwap(int256 wethAmount) external {
        // get the largest liquidity pool
        IUniswapV3Pool pool = getTargetPool();
        // get current price
        (, int24 currentTick,,,,,) = IUniswapV3Pool(pool).slot0();
        // can't run flash swap with current price, so we need to input price that is a little lower than current price
        uint160 sqrtPriceX96 = TickMath.getSqrtRatioAtTick(currentTick - 1);
        // get token symbole to decide which token is WETH
        string memory token0Symbol = string(IERC20(token0).symbol());
        // zeroForOne: true means to borrow token0 , false means to borrow token1
        bool zeroForOne = keccak256(bytes(token0Symbol)) == keccak256('WETH');
        pool.swap(
            address(this),
            zeroForOne,
            wethAmount, 
            sqrtPriceX96,
             // additional info for uniswapV3SwapCallback, can be customed by user
            abi.encode(address(pool),zeroForOne)
        );

    }

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
            // wether token0 is WETH or not
            bool zeroForOne
        ) = abi.decode(data, (address,bool));
        // do your callback actions here
        console.log('[+] Do swap callback ');

        // token0 repay amount for swap. for this demo, we just repay token0 amount 
        // for example, you swap 10 WETH , and get 20 DAI, you can choose whether repay 10 WETH ( token0 ) or 20 DAI ( token1 ). here, we just repay WETH
        if (zeroForOne)
            IERC20(token0).transfer(msg.sender, uint256(amount0Delta));
        else
            IERC20(token1).transfer(msg.sender, uint256(amount1Delta));
    }

    // get the specific pool with the largest liquidity
    function getTargetPool() internal view returns(
        IUniswapV3Pool maxPool
    ) {

        uint128 poolLiquidity = 0;
        uint128 maxLiquidity = 0;

        for (uint256 i = 0; i < v3Fees.length; i++) {
            address pool = factory.getPool(token0, token1, v3Fees[i]);

            if (pool == address(0)) {
                continue;
            }

            poolLiquidity = IUniswapV3Pool(pool).liquidity();

            if (maxLiquidity < poolLiquidity) {
                maxLiquidity = poolLiquidity;
                maxPool = IUniswapV3Pool(pool);
            }
        }
    }

}
