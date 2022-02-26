// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC1271.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract SmartWallet is Ownable, IERC1271 {
    constructor(address initialOwner) {
        transferOwnership(initialOwner);
    }

    function execute(address target, uint256 value, bytes memory data) external onlyOwner() returns (bytes memory) {
        (bool success, bytes memory returndata) = target.call{ value: value }(data);
        require(success);
        return returndata;
    }

    function isValidSignature(bytes32 hash, bytes memory signature) external view override returns (bytes4 magicValue) {
        require(owner() == ECDSA.recover(hash, signature));
        return this.isValidSignature.selector;
    }
}
