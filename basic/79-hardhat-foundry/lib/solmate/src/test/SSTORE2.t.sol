// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.10;

import {DSTestPlus} from "./utils/DSTestPlus.sol";

import {SSTORE2} from "../utils/SSTORE2.sol";

contract SSTORE2Test is DSTestPlus {
    function testWriteRead() public {
        bytes memory testBytes = abi.encode("this is a test");

        address pointer = SSTORE2.write(testBytes);

        assertBytesEq(SSTORE2.read(pointer), testBytes);
    }

    function testWriteReadFullStartBound() public {
        assertBytesEq(SSTORE2.read(SSTORE2.write(hex"11223344"), 0), hex"11223344");
    }

    function testWriteReadCustomStartBound() public {
        assertBytesEq(SSTORE2.read(SSTORE2.write(hex"11223344"), 1), hex"223344");
    }

    function testWriteReadFullBoundedRead() public {
        bytes memory testBytes = abi.encode("this is a test");

        assertBytesEq(SSTORE2.read(SSTORE2.write(testBytes), 0, testBytes.length), testBytes);
    }

    function testWriteReadCustomBounds() public {
        assertBytesEq(SSTORE2.read(SSTORE2.write(hex"11223344"), 1, 3), hex"2233");
    }

    function testWriteReadEmptyBound() public {
        SSTORE2.read(SSTORE2.write(hex"11223344"), 3, 3);
    }

    function testFailReadInvalidPointer() public view {
        SSTORE2.read(DEAD_ADDRESS);
    }

    function testFailReadInvalidPointerCustomStartBound() public view {
        SSTORE2.read(DEAD_ADDRESS, 1);
    }

    function testFailReadInvalidPointerCustomBounds() public view {
        SSTORE2.read(DEAD_ADDRESS, 2, 4);
    }

    function testFailWriteReadOutOfStartBound() public {
        SSTORE2.read(SSTORE2.write(hex"11223344"), 41000);
    }

    function testFailWriteReadEmptyOutOfBounds() public {
        SSTORE2.read(SSTORE2.write(hex"11223344"), 42000, 42000);
    }

    function testFailWriteReadOutOfBounds() public {
        SSTORE2.read(SSTORE2.write(hex"11223344"), 41000, 42000);
    }

    function testWriteRead(bytes calldata testBytes, bytes calldata brutalizeWith)
        public
        brutalizeMemory(brutalizeWith)
    {
        assertBytesEq(SSTORE2.read(SSTORE2.write(testBytes)), testBytes);
    }

    function testWriteReadCustomStartBound(
        bytes calldata testBytes,
        uint256 startIndex,
        bytes calldata brutalizeWith
    ) public brutalizeMemory(brutalizeWith) {
        if (testBytes.length == 0) return;

        startIndex = bound(startIndex, 0, testBytes.length);

        assertBytesEq(SSTORE2.read(SSTORE2.write(testBytes), startIndex), bytes(testBytes[startIndex:]));
    }

    function testWriteReadCustomBounds(
        bytes calldata testBytes,
        uint256 startIndex,
        uint256 endIndex,
        bytes calldata brutalizeWith
    ) public brutalizeMemory(brutalizeWith) {
        if (testBytes.length == 0) return;

        endIndex = bound(endIndex, 0, testBytes.length);
        startIndex = bound(startIndex, 0, testBytes.length);

        if (startIndex > endIndex) return;

        assertBytesEq(
            SSTORE2.read(SSTORE2.write(testBytes), startIndex, endIndex),
            bytes(testBytes[startIndex:endIndex])
        );
    }

    function testFailReadInvalidPointer(address pointer, bytes calldata brutalizeWith)
        public
        view
        brutalizeMemory(brutalizeWith)
    {
        if (pointer.code.length > 0) revert();

        SSTORE2.read(pointer);
    }

    function testFailReadInvalidPointerCustomStartBound(
        address pointer,
        uint256 startIndex,
        bytes calldata brutalizeWith
    ) public view brutalizeMemory(brutalizeWith) {
        if (pointer.code.length > 0) revert();

        SSTORE2.read(pointer, startIndex);
    }

    function testFailReadInvalidPointerCustomBounds(
        address pointer,
        uint256 startIndex,
        uint256 endIndex,
        bytes calldata brutalizeWith
    ) public view brutalizeMemory(brutalizeWith) {
        if (pointer.code.length > 0) revert();

        SSTORE2.read(pointer, startIndex, endIndex);
    }

    function testFailWriteReadCustomStartBoundOutOfRange(
        bytes calldata testBytes,
        uint256 startIndex,
        bytes calldata brutalizeWith
    ) public brutalizeMemory(brutalizeWith) {
        startIndex = bound(startIndex, testBytes.length + 1, type(uint256).max);

        SSTORE2.read(SSTORE2.write(testBytes), startIndex);
    }

    function testFailWriteReadCustomBoundsOutOfRange(
        bytes calldata testBytes,
        uint256 startIndex,
        uint256 endIndex,
        bytes calldata brutalizeWith
    ) public brutalizeMemory(brutalizeWith) {
        endIndex = bound(endIndex, testBytes.length + 1, type(uint256).max);

        SSTORE2.read(SSTORE2.write(testBytes), startIndex, endIndex);
    }
}
