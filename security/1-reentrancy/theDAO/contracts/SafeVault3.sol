// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./IVault.sol";

contract SafeVault3 is IVault {
    mapping(address => uint256) public balances;
    
    function deposit() external override payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external override {
        address payable target = payable(msg.sender);
        uint256 amount = balances[msg.sender];
        
        // Interact
        (bool success, ) = target.call{gas: 2300, value: amount}("");
        require(success, "Transfer failed");

        // Effects
        balances[msg.sender] = 0;

        // Alternative using transfer:
        // target.transfer(amount);
    }
}
