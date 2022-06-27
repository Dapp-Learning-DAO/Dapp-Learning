// File: contracts/TokenIdentifiers.sol

pragma solidity 0.8.4;

/*
  DESIGN NOTES:
  Token ids are a concatenation of:
 * creator: hex address of the creator of the token. 160 bits
 * index: Index for this token (the regular ID), up to 2^56 - 1. 56 bits
 * supply: Supply cap for this token, up to 2^40 - 1 (1 trillion).  40 bits

*/
/**
 * @title TokenIdentifiers
 * support for authentication and metadata for token ids
 */
library TokenIdentifiers {
    uint8 constant ADDRESS_BITS = 160;
    uint8 constant INDEX_BITS = 56;
    uint8 constant SUPPLY_BITS = 40;

    uint256 constant SUPPLY_MASK = (uint256(1) << SUPPLY_BITS) - 1;
    uint256 constant INDEX_MASK =
        ((uint256(1) << INDEX_BITS) - 1) ^ SUPPLY_MASK;

    function tokenMaxSupply(uint256 _id) internal pure returns (uint256) {
        return _id & SUPPLY_MASK;
    }

    function tokenIndex(uint256 _id) internal pure returns (uint256) {
        return _id & INDEX_MASK;
    }

    function tokenCreator(uint256 _id) internal pure returns (address) {
        return address(uint160(_id >> (INDEX_BITS + SUPPLY_BITS)));
    }
}
