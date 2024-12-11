// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./IVault.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";

contract SafeVault1 is IVault, ReentrancyGuard {
    mapping(address => uint256) public balances;
    
    function deposit() external override payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external override nonReentrant {
        address payable target = payable(msg.sender);
        (bool success, ) = target.call{value: balances[msg.sender]}("");
        require(success, "Transfer failed");
        balances[msg.sender] = 0;
    }
}
