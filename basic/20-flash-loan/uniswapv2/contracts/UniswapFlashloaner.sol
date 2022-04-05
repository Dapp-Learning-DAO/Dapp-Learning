pragma solidity ^0.8.0;

import './lib/UniswapV2Library.sol';

interface IERC20 {
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Transfer(address indexed from, address indexed to, uint256 value);

    function name() external view returns (string memory);

    function symbol() external view returns (string memory);

    function decimals() external view returns (uint8);

    function totalSupply() external view returns (uint256);

    function balanceOf(address owner) external view returns (uint256);

    function allowance(address owner, address spender) external view returns (uint256);

    function approve(address spender, uint256 value) external returns (bool);

    function transfer(address to, uint256 value) external returns (bool);

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external returns (bool);
}

interface IWETH {
    function deposit() external payable;

    function transfer(address to, uint256 value) external returns (bool);

    function withdraw(uint256) external;
}

interface IUniswapV1Exchange {
    function balanceOf(address owner) external view returns (uint256);

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external returns (bool);

    function removeLiquidity(
        uint256,
        uint256,
        uint256,
        uint256
    ) external returns (uint256, uint256);

    function tokenToEthSwapInput(
        uint256,
        uint256,
        uint256
    ) external returns (uint256);

    function ethToTokenSwapInput(uint256, uint256) external payable returns (uint256);
}

interface IUniswapV1Factory {
    function getExchange(address) external view returns (address);
}

interface IUniswapV2Callee {
    function uniswapV2Call(
        address sender,
        uint256 amount0,
        uint256 amount1,
        bytes calldata data
    ) external;
}

contract UniswapFlashloaner is IUniswapV2Callee {
    IUniswapV1Factory immutable factoryV1;
    address immutable factory;
    IWETH immutable WETH; // weth 地址

    // address public WETHAddr = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    // address public WETHAddr = 0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619 //in matic

    /**
      _factory
      _factoryV1
      router
    **/
    constructor(
        address _factory,
        address _factoryV1,
        address router
    ) public {
        factory = _factory;
        factoryV1 = IUniswapV1Factory(_factoryV1);
        // WETH = IWETH(WETHAddr);
        WETH = IWETH(router);
    }

    // needs to accept ETH from any V1 exchange and WETH. ideally this could be enforced, as in the router,
    // but it's not possible because it requires a call to the v1 factory, which takes too much gas
    receive() external payable {}

    // gets tokens/WETH via a V2 flash swap, swaps for the ETH/tokens on V1, repays V2, and keeps the rest!
    function uniswapV2Call(
        address sender,
        uint256 amount0,
        uint256 amount1,
        bytes calldata data
    ) external override {
        address[] memory path = new address[](2);
        uint256 amountToken;
        uint256 amountETH;

        {
            // scope for token{0,1}, avoids stack too deep errors
            address token0 = IUniswapV2Pair(msg.sender).token0();
            address token1 = IUniswapV2Pair(msg.sender).token1();
            assert(msg.sender == UniswapV2Library.pairFor(factory, token0, token1)); // ensure that msg.sender is actually a V2 pair
            assert(amount0 == 0 || amount1 == 0); // this strategy is unidirectional
            path[0] = amount0 == 0 ? token0 : token1;
            path[1] = amount0 == 0 ? token1 : token0;
            amountToken = token0 == address(WETH) ? amount1 : amount0;
            amountETH = token0 == address(WETH) ? amount0 : amount1;
        }

        assert(path[0] == address(WETH) || path[1] == address(WETH)); // this strategy only works with a V2 WETH pair
        IERC20 token = IERC20(path[0] == address(WETH) ? path[1] : path[0]);

        // do actions here
        if (amountToken > 0) {
            // token.approve(address(exchangeV1), amountToken);
            // uint256 amountReceived = exchangeV1.tokenToEthSwapInput(amountToken, minETH, type(uint256).max);
            // uint256 amountRequired = UniswapV2Library.getAmountsIn(factory, amountToken, path)[0];
            // assert(amountReceived > amountRequired); // fail if we didn't get enough ETH back to repay our flash loan
            // WETH.deposit{value: amountRequired}();
            // assert(WETH.transfer(msg.sender, amountRequired)); // return WETH to V2 pair
            // (bool success, ) = sender.call{value: amountReceived - amountRequired}(new bytes(0)); // keep the rest! (ETH)
            // assert(success);
            token.transfer(msg.sender, amountToken); // return tokens to V2 pair
        } else {
            // WETH.withdraw(amountETH);
            // uint256 amountReceived = exchangeV1.ethToTokenSwapInput{value: amountETH}(minTokens, type(uint256).max);
            // uint256 amountRequired = UniswapV2Library.getAmountsIn(factory, amountETH, path)[0];
            // assert(amountReceived > amountRequired); // fail if we didn't get enough tokens back to repay our flash loan
            // assert(token.transfer(msg.sender, amountRequired)); // return tokens to V2 pair
            // assert(token.transfer(sender, amountReceived - amountRequired));
            WETH.transfer(msg.sender, amountETH); // return WETH to V2 pair
        }
    }
}
