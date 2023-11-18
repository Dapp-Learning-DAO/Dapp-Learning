// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.10;

import {DSTestPlus} from "./utils/DSTestPlus.sol";

import {FixedPointMathLib} from "../utils/FixedPointMathLib.sol";

contract FixedPointMathLibTest is DSTestPlus {
    function testMulWadDown() public {
        assertEq(FixedPointMathLib.mulWadDown(2.5e18, 0.5e18), 1.25e18);
        assertEq(FixedPointMathLib.mulWadDown(3e18, 1e18), 3e18);
        assertEq(FixedPointMathLib.mulWadDown(369, 271), 0);
    }

    function testMulWadDownEdgeCases() public {
        assertEq(FixedPointMathLib.mulWadDown(0, 1e18), 0);
        assertEq(FixedPointMathLib.mulWadDown(1e18, 0), 0);
        assertEq(FixedPointMathLib.mulWadDown(0, 0), 0);
    }

    function testMulWadUp() public {
        assertEq(FixedPointMathLib.mulWadUp(2.5e18, 0.5e18), 1.25e18);
        assertEq(FixedPointMathLib.mulWadUp(3e18, 1e18), 3e18);
        assertEq(FixedPointMathLib.mulWadUp(369, 271), 1);
    }

    function testMulWadUpEdgeCases() public {
        assertEq(FixedPointMathLib.mulWadUp(0, 1e18), 0);
        assertEq(FixedPointMathLib.mulWadUp(1e18, 0), 0);
        assertEq(FixedPointMathLib.mulWadUp(0, 0), 0);
    }

    function testDivWadDown() public {
        assertEq(FixedPointMathLib.divWadDown(1.25e18, 0.5e18), 2.5e18);
        assertEq(FixedPointMathLib.divWadDown(3e18, 1e18), 3e18);
        assertEq(FixedPointMathLib.divWadDown(2, 100000000000000e18), 0);
    }

    function testDivWadDownEdgeCases() public {
        assertEq(FixedPointMathLib.divWadDown(0, 1e18), 0);
    }

    function testFailDivWadDownZeroDenominator() public pure {
        FixedPointMathLib.divWadDown(1e18, 0);
    }

    function testDivWadUp() public {
        assertEq(FixedPointMathLib.divWadUp(1.25e18, 0.5e18), 2.5e18);
        assertEq(FixedPointMathLib.divWadUp(3e18, 1e18), 3e18);
        assertEq(FixedPointMathLib.divWadUp(2, 100000000000000e18), 1);
    }

    function testDivWadUpEdgeCases() public {
        assertEq(FixedPointMathLib.divWadUp(0, 1e18), 0);
    }

    function testFailDivWadUpZeroDenominator() public pure {
        FixedPointMathLib.divWadUp(1e18, 0);
    }

    function testMulDivDown() public {
        assertEq(FixedPointMathLib.mulDivDown(2.5e27, 0.5e27, 1e27), 1.25e27);
        assertEq(FixedPointMathLib.mulDivDown(2.5e18, 0.5e18, 1e18), 1.25e18);
        assertEq(FixedPointMathLib.mulDivDown(2.5e8, 0.5e8, 1e8), 1.25e8);
        assertEq(FixedPointMathLib.mulDivDown(369, 271, 1e2), 999);

        assertEq(FixedPointMathLib.mulDivDown(1e27, 1e27, 2e27), 0.5e27);
        assertEq(FixedPointMathLib.mulDivDown(1e18, 1e18, 2e18), 0.5e18);
        assertEq(FixedPointMathLib.mulDivDown(1e8, 1e8, 2e8), 0.5e8);

        assertEq(FixedPointMathLib.mulDivDown(2e27, 3e27, 2e27), 3e27);
        assertEq(FixedPointMathLib.mulDivDown(3e18, 2e18, 3e18), 2e18);
        assertEq(FixedPointMathLib.mulDivDown(2e8, 3e8, 2e8), 3e8);
    }

    function testMulDivDownEdgeCases() public {
        assertEq(FixedPointMathLib.mulDivDown(0, 1e18, 1e18), 0);
        assertEq(FixedPointMathLib.mulDivDown(1e18, 0, 1e18), 0);
        assertEq(FixedPointMathLib.mulDivDown(0, 0, 1e18), 0);
    }

    function testFailMulDivDownZeroDenominator() public pure {
        FixedPointMathLib.mulDivDown(1e18, 1e18, 0);
    }

    function testMulDivUp() public {
        assertEq(FixedPointMathLib.mulDivUp(2.5e27, 0.5e27, 1e27), 1.25e27);
        assertEq(FixedPointMathLib.mulDivUp(2.5e18, 0.5e18, 1e18), 1.25e18);
        assertEq(FixedPointMathLib.mulDivUp(2.5e8, 0.5e8, 1e8), 1.25e8);
        assertEq(FixedPointMathLib.mulDivUp(369, 271, 1e2), 1000);

        assertEq(FixedPointMathLib.mulDivUp(1e27, 1e27, 2e27), 0.5e27);
        assertEq(FixedPointMathLib.mulDivUp(1e18, 1e18, 2e18), 0.5e18);
        assertEq(FixedPointMathLib.mulDivUp(1e8, 1e8, 2e8), 0.5e8);

        assertEq(FixedPointMathLib.mulDivUp(2e27, 3e27, 2e27), 3e27);
        assertEq(FixedPointMathLib.mulDivUp(3e18, 2e18, 3e18), 2e18);
        assertEq(FixedPointMathLib.mulDivUp(2e8, 3e8, 2e8), 3e8);
    }

    function testMulDivUpEdgeCases() public {
        assertEq(FixedPointMathLib.mulDivUp(0, 1e18, 1e18), 0);
        assertEq(FixedPointMathLib.mulDivUp(1e18, 0, 1e18), 0);
        assertEq(FixedPointMathLib.mulDivUp(0, 0, 1e18), 0);
    }

    function testFailMulDivUpZeroDenominator() public pure {
        FixedPointMathLib.mulDivUp(1e18, 1e18, 0);
    }

    function testRPow() public {
        assertEq(FixedPointMathLib.rpow(2e27, 2, 1e27), 4e27);
        assertEq(FixedPointMathLib.rpow(2e18, 2, 1e18), 4e18);
        assertEq(FixedPointMathLib.rpow(2e8, 2, 1e8), 4e8);
        assertEq(FixedPointMathLib.rpow(8, 3, 1), 512);
    }

    function testSqrt() public {
        assertEq(FixedPointMathLib.sqrt(0), 0);
        assertEq(FixedPointMathLib.sqrt(1), 1);
        assertEq(FixedPointMathLib.sqrt(2704), 52);
        assertEq(FixedPointMathLib.sqrt(110889), 333);
        assertEq(FixedPointMathLib.sqrt(32239684), 5678);
    }

    function testMulWadDown(uint256 x, uint256 y) public {
        // Ignore cases where x * y overflows.
        unchecked {
            if (x != 0 && (x * y) / x != y) return;
        }

        assertEq(FixedPointMathLib.mulWadDown(x, y), (x * y) / 1e18);
    }

    function testFailMulWadDownOverflow(uint256 x, uint256 y) public pure {
        // Ignore cases where x * y does not overflow.
        unchecked {
            if ((x * y) / x == y) revert();
        }

        FixedPointMathLib.mulWadDown(x, y);
    }

    function testMulWadUp(uint256 x, uint256 y) public {
        // Ignore cases where x * y overflows.
        unchecked {
            if (x != 0 && (x * y) / x != y) return;
        }

        assertEq(FixedPointMathLib.mulWadUp(x, y), x * y == 0 ? 0 : (x * y - 1) / 1e18 + 1);
    }

    function testFailMulWadUpOverflow(uint256 x, uint256 y) public pure {
        // Ignore cases where x * y does not overflow.
        unchecked {
            if ((x * y) / x == y) revert();
        }

        FixedPointMathLib.mulWadUp(x, y);
    }

    function testDivWadDown(uint256 x, uint256 y) public {
        // Ignore cases where x * WAD overflows or y is 0.
        unchecked {
            if (y == 0 || (x != 0 && (x * 1e18) / 1e18 != x)) return;
        }

        assertEq(FixedPointMathLib.divWadDown(x, y), (x * 1e18) / y);
    }

    function testFailDivWadDownOverflow(uint256 x, uint256 y) public pure {
        // Ignore cases where x * WAD does not overflow or y is 0.
        unchecked {
            if (y == 0 || (x * 1e18) / 1e18 == x) revert();
        }

        FixedPointMathLib.divWadDown(x, y);
    }

    function testFailDivWadDownZeroDenominator(uint256 x) public pure {
        FixedPointMathLib.divWadDown(x, 0);
    }

    function testDivWadUp(uint256 x, uint256 y) public {
        // Ignore cases where x * WAD overflows or y is 0.
        unchecked {
            if (y == 0 || (x != 0 && (x * 1e18) / 1e18 != x)) return;
        }

        assertEq(FixedPointMathLib.divWadUp(x, y), x == 0 ? 0 : (x * 1e18 - 1) / y + 1);
    }

    function testFailDivWadUpOverflow(uint256 x, uint256 y) public pure {
        // Ignore cases where x * WAD does not overflow or y is 0.
        unchecked {
            if (y == 0 || (x * 1e18) / 1e18 == x) revert();
        }

        FixedPointMathLib.divWadUp(x, y);
    }

    function testFailDivWadUpZeroDenominator(uint256 x) public pure {
        FixedPointMathLib.divWadUp(x, 0);
    }

    function testMulDivDown(
        uint256 x,
        uint256 y,
        uint256 denominator
    ) public {
        // Ignore cases where x * y overflows or denominator is 0.
        unchecked {
            if (denominator == 0 || (x != 0 && (x * y) / x != y)) return;
        }

        assertEq(FixedPointMathLib.mulDivDown(x, y, denominator), (x * y) / denominator);
    }

    function testFailMulDivDownOverflow(
        uint256 x,
        uint256 y,
        uint256 denominator
    ) public pure {
        // Ignore cases where x * y does not overflow or denominator is 0.
        unchecked {
            if (denominator == 0 || (x * y) / x == y) revert();
        }

        FixedPointMathLib.mulDivDown(x, y, denominator);
    }

    function testFailMulDivDownZeroDenominator(uint256 x, uint256 y) public pure {
        FixedPointMathLib.mulDivDown(x, y, 0);
    }

    function testMulDivUp(
        uint256 x,
        uint256 y,
        uint256 denominator
    ) public {
        // Ignore cases where x * y overflows or denominator is 0.
        unchecked {
            if (denominator == 0 || (x != 0 && (x * y) / x != y)) return;
        }

        assertEq(FixedPointMathLib.mulDivUp(x, y, denominator), x * y == 0 ? 0 : (x * y - 1) / denominator + 1);
    }

    function testFailMulDivUpOverflow(
        uint256 x,
        uint256 y,
        uint256 denominator
    ) public pure {
        // Ignore cases where x * y does not overflow or denominator is 0.
        unchecked {
            if (denominator == 0 || (x * y) / x == y) revert();
        }

        FixedPointMathLib.mulDivUp(x, y, denominator);
    }

    function testFailMulDivUpZeroDenominator(uint256 x, uint256 y) public pure {
        FixedPointMathLib.mulDivUp(x, y, 0);
    }

    function testSqrt(uint256 x) public {
        uint256 root = FixedPointMathLib.sqrt(x);
        uint256 next = root + 1;

        // Ignore cases where next * next overflows.
        unchecked {
            if (next * next < next) return;
        }

        assertTrue(root * root <= x && next * next > x);
    }
}
