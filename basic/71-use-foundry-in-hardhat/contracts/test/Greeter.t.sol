//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../Greeter.sol";
import "../lib/ds-test/src/test.sol";

contract GreeterTest is DSTest {
    Greeter private greeter;

    function setUp() public {
        greeter = new Greeter("Hello wplai!");
    }

    function testGreet() public {
        assertEq(
            greeter.greet(),
            "Hello wplai!"
        );
    }

    function testSetGreeting(string memory _greeting) public {
        greeter.setGreeting(_greeting);
        assertEq(
            greeter.greet(),
            _greeting
        );
    }
}
