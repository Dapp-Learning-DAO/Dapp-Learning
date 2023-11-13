// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

contract OverrideExample {

    uint256 public until;

    constructor(){
        until = block.timestamp;
    }

    function _blockTimestamp() internal view virtual returns (uint256) {
        return block.timestamp;
    }

    function transfer() public {
        require(until <= _blockTimestamp(), "Time has not yet come.");
        // TODO
    }
}
