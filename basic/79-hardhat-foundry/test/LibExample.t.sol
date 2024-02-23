// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {LibExample} from "../contracts/LibExample.sol";

contract LibExampleTest is Test {

    // 模糊测试: 测试小于type(uint160).max的参数值能正常转换
    function testFuzz_toUint160(uint256 n) public {
        // if n > type(uint160).max, skip
        vm.assume(n <= type(uint160).max);
        LibExample.toUint160(n);
    }

    // 模糊测试: 测试大于type(uint160).max的参数值抛出异常
    function testFailFuzz_toUint160_overflow(uint256 n) public {
        // if n < type(uint160).max, skip
        vm.assume(n > type(uint160).max);
        LibExample.toUint160(n);
    }
}
