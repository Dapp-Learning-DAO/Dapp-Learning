pragma solidity ^0.8.13;


contract TargetContract {

    uint256 public val;
    function setVal(uint256 a) external payable{
        val = a;
    }
}