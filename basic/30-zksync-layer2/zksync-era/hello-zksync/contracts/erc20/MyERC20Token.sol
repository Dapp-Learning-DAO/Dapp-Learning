// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/**
 * @title MyERC20Token
 * @dev This is a basic ERC20 token using the OpenZeppelin's ERC20PresetFixedSupply preset.
 * You can edit the default values as needed.
 */
contract MyERC20Token is ERC20Burnable {

    /**
     * @dev Constructor to initialize the token with default values.
     * You can edit these values as needed.
     */
    constructor() ERC20("DappLearning", "DL") {
        // Default initial supply of 1 million tokens (with 18 decimals)
        uint256 initialSupply = 1_000_000 * (10 ** 18);

        // The initial supply is minted to the deployer's address
        _mint(msg.sender, initialSupply);
    }

    // Additional functions or overrides can be added here if needed.
}
