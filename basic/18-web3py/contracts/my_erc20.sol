pragma solidity ^0.8.0;

import "./erc20.sol";

contract MyToken is ERC20 {
    constructor(uint256 initialSupply) public ERC20("MyToken", "MT") {
        _mint(msg.sender, initialSupply);
    }
}