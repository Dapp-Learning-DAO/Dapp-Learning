pragma solidity ^0.8.17;

contract ExampleContract {
    uint public exampleVariable;

    constructor(uint _exampleParam) {
        exampleVariable = _exampleParam;
    }
}