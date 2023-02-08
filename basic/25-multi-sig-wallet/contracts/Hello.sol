// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract Hello {
    uint256 public balance;

    function set(uint256 _newbalance) public {
        balance = _newbalance;
    }

    function get() public view returns (uint256){
        return balance;
    }
}
