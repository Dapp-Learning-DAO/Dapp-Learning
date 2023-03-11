pragma solidity ^0.8.17;

contract ThrowErrorStringDemo {

    function requireWithReason() external view{
        require(msg.sender == address(0xdeadbeaf), "Invalid caller");    
    }


    function revertWithReason(uint256 input) external view{
        if (msg.sender != address(0xdeadbeaf)){
            revert("Invalid caller");
        }
    }

}
