//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;


contract Greeter {

  event ValueChanged(address indexed author, string oldValue, string newValue);

  string greeting;

  constructor(string memory _greeting) public {
    emit ValueChanged(msg.sender, _greeting, greeting);
    greeting = _greeting;
  }

  function greet() public view returns (string memory) {
    return greeting;
  }

  function setGreeting(string memory _greeting) public {
    emit ValueChanged(msg.sender, _greeting, greeting);
    greeting = _greeting;
  }
}