// SPDX-License-Identifier: UNLICENSED
// All Rights Reserved © AaveCo

pragma solidity ^0.8.10;

/**
 * @title ATokenVaultStorage
 * @author Aave Protocol
 * @notice Contains storage variables for the ATokenVault.
 */
abstract contract ATokenVaultStorage {
    mapping(address => uint256) internal _sigNonces;

    struct Storage {
        // total aToken incl. fees
        uint128 lastVaultBalance;
        // fees accrued since last updated
        uint128 accumulatedFees;
        // Deprecated storage gap
        uint40 __deprecated_gap;
        // as a fraction of 1e18
        uint64 fee;
        // Reserved storage space to allow for layout changes in the future
        uint256[50] __gap;
    }

    Storage internal _s;
}