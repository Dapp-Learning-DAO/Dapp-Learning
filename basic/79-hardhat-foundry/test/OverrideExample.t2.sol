// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {OverrideExample} from "../contracts/OverrideExample.sol";

contract OverrideExampleTest2 is Test, OverrideExample {

    function setUp() public {
        // init
        until = 10 days;
    }

    function testFail_transfer(uint256 x) public {
        transfer();
    }
}
