pragma solidity ^0.8.17;

contract ThrowCustomDemo {
    error CustomError(uint256 code, address caller, string description);

    function throwCustomError() external view{
        if (msg.sender != address(0xdeadbeaf)){
            revert CustomError(0xbb, msg.sender, "Invalid caller");
        }
    }
}
