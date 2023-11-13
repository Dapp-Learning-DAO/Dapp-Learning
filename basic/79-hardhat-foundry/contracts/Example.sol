// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "hardhat/console.sol";

contract Example {
    bytes32 constant STORAGE_POSITION = keccak256("diamond.example.storage");

    struct ExampleStorage {
        uint256 number;
    }

    function Storage() internal pure returns (ExampleStorage storage s) {
        bytes32 position = STORAGE_POSITION;
        assembly {
            s.slot := position
        }
        return s;
    }

    function setNumber(uint256 newNumber) public {
        console.log("\t setNumber:", newNumber);
        Storage().number = newNumber;
    }

    function getNumber() view public returns (uint256) {
        console.log("\t getNumber:", Storage().number);
        return Storage().number;
    }
}
