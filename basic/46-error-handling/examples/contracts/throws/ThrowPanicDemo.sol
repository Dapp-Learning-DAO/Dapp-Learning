pragma solidity ^0.8.17;

contract ThrowPanicDemo {

    function panicByCondition() external view {
        assert (msg.sender == address(0xdeadbeaf));
    }

    function panicByOverflow() external pure{
        uint256 result = type(uint8).max + 1;
        //NOTE: these two operands add together, and then convert to uint256.
        //however, since it overflows before it's converted to uint256, it panics.
    }

    function panicByDivideByZero() external pure{
        uint256 a = 1;
        uint256 b = 0;
        uint256 result = a/b;
    }
}
