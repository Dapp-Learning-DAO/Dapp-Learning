// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./erc20.sol";
import "./openzeppelin/AccessControl.sol";

contract MyTokenOpenZeppelin is ERC20 {
    constructor(uint256 initialSupply) public ERC20("MyTokenOpenZeppelin", "MTOZ") {
        _mint(msg.sender, initialSupply);
    }
}


contract MyTokenMintable1 is ERC20, AccessControl {
    // Create a new role identifier for the minter role
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(address minter) ERC20("MyToken", "TKN") {
        // Grant the minter role to a specified account
        _setupRole(MINTER_ROLE, minter);
    }

    function mint(address to, uint256 amount) public {
        // Check that the calling account has the minter role
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter");
        _mint(to, amount);
    }
}


// 这个合约能够动态设置minter和burner，同时也可以取消权限
contract MyTokenMintable2 is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    constructor() ERC20("MyToken", "TKN") {
        // Grant the contract deployer the default admin role: it will be able
        // to grant and revoke any roles
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) public onlyRole(BURNER_ROLE) {
        _burn(from, amount);
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