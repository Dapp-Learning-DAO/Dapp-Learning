pragma solidity ^0.8.17;

contract Target {
    uint256 private state;

    constructor(uint256 _state) {
        state = _state;
    }
}
