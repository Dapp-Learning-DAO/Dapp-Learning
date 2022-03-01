// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";

contract SimpleToken is ERC20PresetMinterPauser {
    /**
     * @dev Constructor that gives msg.sender all of existing tokens.
     */

    uint8 private _decimals;
    uint256 public INITIAL_SUPPLY;

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initial_supply
    ) ERC20PresetMinterPauser(name, symbol) {
        _decimals = decimals_;
        INITIAL_SUPPLY = initial_supply * (10**uint256(decimals_));
        _mint(msg.sender, INITIAL_SUPPLY);
    }
}
