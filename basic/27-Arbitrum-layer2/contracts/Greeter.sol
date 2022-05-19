// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.6.11;

contract Greeter {
    string greeting;

    constructor(string memory _greeting) public {
        greeting = _greeting;
    }

    function greet() public view returns (string memory) {
        return greeting;
    }

    function setGreeting(string memory _greeting) public virtual {
        greeting = _greeting;
    }
}