// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.10;

import {DSTestPlus} from "./utils/DSTestPlus.sol";

import {SafeCastLib} from "../utils/SafeCastLib.sol";

contract SafeCastLibTest is DSTestPlus {
    function testSafeCastTo248() public {
        assertEq(SafeCastLib.safeCastTo248(2.5e45), 2.5e45);
        assertEq(SafeCastLib.safeCastTo248(2.5e27), 2.5e27);
    }

    function testSafeCastTo224() public {
        assertEq(SafeCastLib.safeCastTo224(2.5e36), 2.5e36);
        assertEq(SafeCastLib.safeCastTo224(2.5e27), 2.5e27);
    }

    function testSafeCastTo192() public {
        assertEq(SafeCastLib.safeCastTo192(2.5e36), 2.5e36);
        assertEq(SafeCastLib.safeCastTo192(2.5e27), 2.5e27);
    }

    function testSafeCastTo160() public {
        assertEq(SafeCastLib.safeCastTo160(2.5e36), 2.5e36);
        assertEq(SafeCastLib.safeCastTo160(2.5e27), 2.5e27);
    }

    function testSafeCastTo128() public {
        assertEq(SafeCastLib.safeCastTo128(2.5e27), 2.5e27);
        assertEq(SafeCastLib.safeCastTo128(2.5e18), 2.5e18);
    }

    function testSafeCastTo96() public {
        assertEq(SafeCastLib.safeCastTo96(2.5e18), 2.5e18);
        assertEq(SafeCastLib.safeCastTo96(2.5e17), 2.5e17);
    }

    function testSafeCastTo64() public {
        assertEq(SafeCastLib.safeCastTo64(2.5e18), 2.5e18);
        assertEq(SafeCastLib.safeCastTo64(2.5e17), 2.5e17);
    }

    function testSafeCastTo32() public {
        assertEq(SafeCastLib.safeCastTo32(2.5e8), 2.5e8);
        assertEq(SafeCastLib.safeCastTo32(2.5e7), 2.5e7);
    }

    function testSafeCastTo8() public {
        assertEq(SafeCastLib.safeCastTo8(100), 100);
        assertEq(SafeCastLib.safeCastTo8(250), 250);
    }

    function testFailSafeCastTo248() public pure {
        SafeCastLib.safeCastTo248(type(uint248).max + 1);
    }

    function testFailSafeCastTo224() public pure {
        SafeCastLib.safeCastTo224(type(uint224).max + 1);
    }

    function testFailSafeCastTo192() public pure {
        SafeCastLib.safeCastTo192(type(uint192).max + 1);
    }

    function testFailSafeCastTo160() public pure {
        SafeCastLib.safeCastTo160(type(uint160).max + 1);
    }

    function testFailSafeCastTo128() public pure {
        SafeCastLib.safeCastTo128(type(uint128).max + 1);
    }

    function testFailSafeCastTo96() public pure {
        SafeCastLib.safeCastTo96(type(uint96).max + 1);
    }

    function testFailSafeCastTo64() public pure {
        SafeCastLib.safeCastTo64(type(uint64).max + 1);
    }

    function testFailSafeCastTo32() public pure {
        SafeCastLib.safeCastTo32(type(uint32).max + 1);
    }

    function testFailSafeCastTo8() public pure {
        SafeCastLib.safeCastTo8(type(uint8).max + 1);
    }

    function testSafeCastTo248(uint256 x) public {
        x = bound(x, 0, type(uint248).max);

        assertEq(SafeCastLib.safeCastTo248(x), x);
    }

    function testSafeCastTo224(uint256 x) public {
        x = bound(x, 0, type(uint224).max);

        assertEq(SafeCastLib.safeCastTo224(x), x);
    }

    function testSafeCastTo192(uint256 x) public {
        x = bound(x, 0, type(uint192).max);

        assertEq(SafeCastLib.safeCastTo192(x), x);
    }

    function testSafeCastTo160(uint256 x) public {
        x = bound(x, 0, type(uint160).max);

        assertEq(SafeCastLib.safeCastTo160(x), x);
    }

    function testSafeCastTo128(uint256 x) public {
        x = bound(x, 0, type(uint128).max);

        assertEq(SafeCastLib.safeCastTo128(x), x);
    }

    function testSafeCastTo96(uint256 x) public {
        x = bound(x, 0, type(uint96).max);

        assertEq(SafeCastLib.safeCastTo96(x), x);
    }

    function testSafeCastTo64(uint256 x) public {
        x = bound(x, 0, type(uint64).max);

        assertEq(SafeCastLib.safeCastTo64(x), x);
    }

    function testSafeCastTo32(uint256 x) public {
        x = bound(x, 0, type(uint32).max);

        assertEq(SafeCastLib.safeCastTo32(x), x);
    }

    function testSafeCastTo8(uint256 x) public {
        x = bound(x, 0, type(uint8).max);

        assertEq(SafeCastLib.safeCastTo8(x), x);
    }

    function testFailSafeCastTo248(uint256 x) public {
        x = bound(x, type(uint248).max + 1, type(uint256).max);

        SafeCastLib.safeCastTo248(x);
    }

    function testFailSafeCastTo224(uint256 x) public {
        x = bound(x, type(uint224).max + 1, type(uint256).max);

        SafeCastLib.safeCastTo224(x);
    }

    function testFailSafeCastTo192(uint256 x) public {
        x = bound(x, type(uint192).max + 1, type(uint256).max);

        SafeCastLib.safeCastTo192(x);
    }

    function testFailSafeCastTo160(uint256 x) public {
        x = bound(x, type(uint160).max + 1, type(uint256).max);

        SafeCastLib.safeCastTo160(x);
    }

    function testFailSafeCastTo128(uint256 x) public {
        x = bound(x, type(uint128).max + 1, type(uint256).max);

        SafeCastLib.safeCastTo128(x);
    }

    function testFailSafeCastTo96(uint256 x) public {
        x = bound(x, type(uint96).max + 1, type(uint256).max);

        SafeCastLib.safeCastTo96(x);
    }

    function testFailSafeCastTo64(uint256 x) public {
        x = bound(x, type(uint64).max + 1, type(uint256).max);

        SafeCastLib.safeCastTo64(x);
    }

    function testFailSafeCastTo32(uint256 x) public {
        x = bound(x, type(uint32).max + 1, type(uint256).max);

        SafeCastLib.safeCastTo32(x);
    }

    function testFailSafeCastTo8(uint256 x) public {
        x = bound(x, type(uint8).max + 1, type(uint256).max);

        SafeCastLib.safeCastTo8(x);
    }
}
