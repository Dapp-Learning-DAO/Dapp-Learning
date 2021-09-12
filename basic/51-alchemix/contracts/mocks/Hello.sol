pragma solidity ^0.6.0;

contract Hello {
    uint256 public balance;

    function set(uint256 _newbalance) public {
        balance = _newbalance;
    }

    function get() public returns (uint256){
        return balance;
    }
}