// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./IVault.sol";
import "hardhat/console.sol";

contract BuggyVault is IVault {
    mapping(address => uint256) public balances;

    function deposit() external override payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external override {
        address payable target = payable(msg.sender);
        
        (bool success,) = target.call{value:balances[msg.sender]}("");
        console.log(success);

        balances[msg.sender] = 0;        
    }
}
