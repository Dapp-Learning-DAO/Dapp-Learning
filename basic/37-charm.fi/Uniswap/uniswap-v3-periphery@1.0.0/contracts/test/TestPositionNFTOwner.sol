// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.7.6;

import '../interfaces/external/IERC1271.sol';

contract TestPositionNFTOwner is IERC1271 {
    address public owner;

    function setOwner(address _owner) external {
        owner = _owner;
    }

    function isValidSignature(bytes32 hash, bytes memory signature) external view override returns (bytes4 magicValue) {
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            v := byte(0, mload(add(signature, 0x60)))
        }
        if (ecrecover(hash, v, r, s) == owner) {
            return bytes4(0x1626ba7e);
        } else {
            return bytes4(0);
        }
    }
}
