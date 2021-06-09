// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "OpenZeppelin/openzeppelin-contracts@4.1.0/contracts/token/ERC20/ERC20.sol";
import "OpenZeppelin/openzeppelin-contracts@4.1.0/contracts/access/AccessControl.sol";

contract MyTokenOpenZeppelin is ERC20 {
    constructor(uint256 initialSupply) public ERC20("MyTokenOpenZeppelin", "MTOZ") {
        _mint(msg.sender, initialSupply);
    }
}

// 仿照openzeppelin的官网教程，写一个可以铸币的合约
// 铸币权限是被特殊账户控制的
contract MyTokenMintable is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() ERC20("MyTokenMintable", "MTM") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
}