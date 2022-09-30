// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SampleERC20 is ERC20 {

    constructor(uint256 initialSupply) ERC20("Sample", "SAMPLE"){
        _mint(msg.sender, initialSupply);
        
    }
}