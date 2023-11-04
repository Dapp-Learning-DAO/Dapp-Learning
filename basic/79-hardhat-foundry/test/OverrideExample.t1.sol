// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {OverrideExample} from "../contracts/OverrideExample.sol";

contract OverrideExampleTest1 is Test, OverrideExample {

    function setUp() public {
        // init
        until = 10 days;
    }

    // override
    function _blockTimestamp() internal view override returns (uint256) {
        return 10 days;
    }

    function test_transfer() public {
        transfer();
    }
}
