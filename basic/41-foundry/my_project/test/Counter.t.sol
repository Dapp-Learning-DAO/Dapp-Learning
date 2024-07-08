// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from 'forge-std/Test.sol';
import {Counter} from '../src/Counter.sol';

contract CounterTest is Test {
    Counter public counter;

    /// 可选函数 在运行每个测试用例之前调用
    function setUp() public {
        counter = new Counter();
        counter.setNumber(0);
    }

    function test_NumberIs0() public view {
        assertEq(counter.number(), 0);
    }

    function test_Increment() public {
        counter.increment();
        assertEq(counter.number(), 1);
    }

    /// 失败的测试用例 uint256 不得为负数
    function testFail_decrement() public {
        counter.decrement();
    }

    function testFuzz_SetNumber(uint256 x) public {
        counter.setNumber(x);
        assertEq(counter.number(), x);
    }

    function test_Example() public pure {
        assertTrue(true);
    }
}
