pragma solidity ^0.5.10;

interface IUniswapV2Pair {

    function name() external pure returns (string memory);

    function symbol() external pure returns (string memory);

    function decimals() external pure returns (uint8);

    function totalSupply() external view returns (uint);

    function balanceOf(address owner) external view returns (uint);

    function allowance(address owner, address spender) external view returns (uint);

    function approve(address spender, uint value) external returns (bool);

    function transfer(address to, uint value) external returns (bool);

    function transferFrom(address from, address to, uint value) external returns (bool);

    function factory() external view returns (address);

    function token0() external view returns (address);

    function token1() external view returns (address);

    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);

    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;
}

library SafeMath {
    function add(uint x, uint y) internal pure returns (uint z) {
        require((z = x + y) >= x, 'ds-math-add-overflow');
    }

    function sub(uint x, uint y) internal pure returns (uint z) {
        require((z = x - y) <= x, 'ds-math-sub-underflow');
    }

    function mul(uint x, uint y) internal pure returns (uint z) {
        require(y == 0 || (z = x * y) / y == x, 'ds-math-mul-overflow');
    }

    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        // Solidity only automatically asserts when dividing by 0
        require(b > 0, "SafeMath: division by zero");
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }

    function max(uint x, uint y) internal pure returns (uint z) {
        z = x > y ? x : y;
    }
}

interface IUniswapV2Callee {
    function uniswapV2Call(address sender, uint amount0, uint amount1, bytes calldata data) external;
}

interface IUniswapV2Router02 {
    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) external pure returns (uint amountIn);
}

interface IDoubleTool {
    function returnToken(address token, uint256 amount) external;
}

contract DoubleTool {

    function safeTransfer(address token, address to, uint256 value) internal {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0xa9059cbb, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TransferHelper: TRANSFER_FAILED');
    }

    function safeTransferFrom(address token, address from, address to, uint value) internal {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0x23b872dd, from, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TransferHelper: TRANSFER_FROM_FAILED');
    }

    function returnToken(address token, uint256 amount) public {
        safeTransfer(token, msg.sender, amount);
    }

}

contract FlashTest is IUniswapV2Callee {
    using SafeMath for uint;
    function safeApprove(address token, address to, uint value) internal {
        // bytes4(keccak256(bytes('approve(address,uint256)')));
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0x095ea7b3, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TransferHelper: APPROVE_FAILED');
    }

    function safeTransfer(address token, address to, uint256 value) internal {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0xa9059cbb, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TransferHelper: TRANSFER_FAILED');
    }

    function safeTransferFrom(address token, address from, address to, uint value) internal {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0x23b872dd, from, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TransferHelper: TRANSFER_FROM_FAILED');
    }

    IUniswapV2Router02 router = IUniswapV2Router02(0x0000000000000000000000000000000000000000);
    IUniswapV2Pair pair = IUniswapV2Pair(0x0000000000000000000000000000000000000000);
    IDoubleTool doubleTool = IDoubleTool(0x0000000000000000000000000000000000000000);
    address token0 = pair.token0();//token
    uint256 oneToken0Amount = 1e6;
    address token1 = pair.token1();//weth
    uint256 oneToken1Amount = 1e18;

    /*
        TODO
        部署
        先部署DoubleTool，往里面转一定量的两种币种，用于模拟套利得收益...
        上面3个地址需要替换，精度也需要对应的替换

        测试
        这里主要用于演示功能， 没有处理token1,token2顺序问题
        当前是借token0, 如需要token1，可自行修改，
        两种还款方式，就看哪种比较合适比较省手续费

        另外也可以同时借两种币，其中一种原金额返回，另外一种需要返回手续费， 两种都多返回得付两个份手续费

    */
    function uniswapV2Call(address sender, uint amount0, uint amount1, bytes calldata data) external {
        uint code = abi.decode(data, (uint));
        if (code == 1) {
            doubleTool.returnToken(token0, amount0 * 2);
            uint fee = amount0.mul(3).div(997).add(1);
            safeTransfer(token0, address(pair), amount0.add(fee));
        } else if (code == 2) {
            (uint112 _reserve0, uint112 _reserve1,) = pair.getReserves();
            uint256 amount1Return = router.getAmountIn(amount0, _reserve1, _reserve0);
            doubleTool.returnToken(token1, amount1Return.mul(2));
            safeTransfer(token1, address(pair), amount1Return);
        } else if (code == 3) {
            doubleTool.returnToken(token0, amount0 * 2);
            uint fee = amount0.mul(3).div(997).add(1);
            safeTransfer(token0, address(pair), amount0.add(fee));
            doubleTool.returnToken(token1, amount1 * 2);
            safeTransfer(token1, address(pair), amount1);
        }
    }
    //借token0，还token0
    function testOut0Fee0() public {
        //1、构建data data可以构建成当前合约直接执行， 这里只是放了一个数字区分两种信息
        //2、调用pair swap()
        uint amount = 100 * oneToken0Amount;
        pair.swap(amount, 0, address(this), abi.encodePacked(uint(1)));
        //3、执行当前的uniswapV2Call
        //4、将手续费要求转到pair
        //5、完成交易
    }
    //借token0,还token1
    function testOut0Fee1() public {
        uint amount = 100 * oneToken0Amount;
        pair.swap(amount, 0, address(this), abi.encodePacked(uint(2)));
    }
    //借token0,token1, 手续费还token0
    function testOut0and1Fee0() public {
        uint amount = 100 * oneToken0Amount;
        pair.swap(amount, amount, address(this), abi.encodePacked(uint(3)));
    }

}
