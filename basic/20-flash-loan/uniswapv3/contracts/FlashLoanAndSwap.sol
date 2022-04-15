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

    constructor(address _token0, address _token1) {
        token0 = _token0;
        token1 = _token1;

        v3Fees[0] = 500;
        v3Fees[1] = 3000;
        v3Fees[2] = 10000;
    }

    function runFlashLoan(uint wethAmount) external {
        IUniswapV3Pool pool = getTargetPool();
        string memory token0Symbol = string(IERC20(token0).symbol());
        uint token0Amont = keccak256(bytes(token0Symbol)) == keccak256('WETH') ? wethAmount : 0;
        uint token1Amont = wethAmount - token0Amont;
            pool.flash(
            address(this),
            token0Amont,
            token1Amont, 
            abi.encode(token0Amont, token1Amont, address(pool))
            );

    }

    function runSwap(int256 wethAmount) external {
        IUniswapV3Pool pool = getTargetPool();
        // get current price
        (, int24 currentTick,,,,,) = IUniswapV3Pool(pool).slot0();
        // get swap price
        uint160 sqrtPriceX96 = TickMath.getSqrtRatioAtTick(currentTick - 1);
        string memory token0Symbol = string(IERC20(token0).symbol());
        bool zeroForOne = keccak256(bytes(token0Symbol)) == keccak256('WETH');
            pool.swap(
            address(this),
            zeroForOne,
            wethAmount, 
            sqrtPriceX96,
            abi.encode(address(pool))
            );

    }
    // callback function of uniswap V3's flash loan
    function uniswapV3FlashCallback(uint256 _fee0, uint256 _fee1, bytes calldata data) external {
        (
            uint256 amount0,
            uint256 amount1,
            address pool
        ) = abi.decode(data, (uint256, uint256,address));

        uint256 fee0 = _fee0;
        uint256 fee1 = _fee1;

        // launch attack
        {
           
            console.log('[+] Do flashloan attack ');

        }

        // repay flash
        IERC20(token0).transfer(pool, amount0 + fee0);
        IERC20(token1).transfer(pool, amount1 + fee1);
    }

    /// @notice Uniswap v3 callback fn, called back on pool.swap
    function uniswapV3SwapCallback(
        int256 amount0Delta,
        int256 amount1Delta,
        bytes calldata /*data*/
    ) external {
        // do your callback actions here
        console.log('[+] Do swap callback attack ');

        // pay tokens to swap with
        if (amount0Delta > 0)
            IERC20(token0).transfer(msg.sender, uint256(amount0Delta));
        else if (amount1Delta > 0)
            IERC20(token1).transfer(msg.sender, uint256(amount1Delta));
    }

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
