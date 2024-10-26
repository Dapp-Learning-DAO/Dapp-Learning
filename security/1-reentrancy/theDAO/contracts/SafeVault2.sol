// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./IVault.sol";
import "hardhat/console.sol";

contract SafeVault2 is IVault {
    mapping(address => uint256) public balances;
    
    function deposit() external override payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external override {
        // Checks
        require(balances[msg.sender] > 0, "Insufficient balance");

        // Effects
        uint256 amount = balances[msg.sender];
        balances[msg.sender] = 0;

        // Interact
        address payable target = payable(msg.sender);
        (bool success, ) = target.call{value: amount}("");
        require(success, "Transfer failed");
    }
}
