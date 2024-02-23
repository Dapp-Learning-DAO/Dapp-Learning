// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

library LibExample {
    function toUint160(uint256 y) internal pure returns (uint160 z) {
        require((z = uint160(y)) == y);
    }
}
