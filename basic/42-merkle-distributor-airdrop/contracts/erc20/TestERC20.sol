// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.6.11;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract TestERC20 is ERC20 {
    constructor (string memory name_, string memory symbol_, uint amountToMint) ERC20(name_, symbol_) public {
        setBalance(msg.sender, amountToMint);
    }

    // sets the balance of the address
    // this mints/burns the amount depending on the current balance
    function setBalance(address to, uint amount) public {
        uint old = balanceOf(to);
        if (old < amount) {
            _mint(to, amount - old);
        } else if (old > amount) {
            _burn(to, old - amount);
        }
    }
}