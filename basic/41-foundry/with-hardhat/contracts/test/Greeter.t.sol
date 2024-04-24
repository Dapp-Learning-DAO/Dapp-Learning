//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import '../Greeter.sol';
import {Test} from 'forge-std/Test.sol';

contract GreeterTest is Test {
    Greeter private greeter;

    function setUp() public {
        greeter = new Greeter('Hello wplai!');
    }

    function test_Greet() public view {
        assertEq(greeter.greet(), 'Hello wplai!');
    }

    function testFuzz_SetGreeting(string memory _greeting) public {
        greeter.setGreeting(_greeting);
        assertEq(greeter.greet(), _greeting);
    }
}
