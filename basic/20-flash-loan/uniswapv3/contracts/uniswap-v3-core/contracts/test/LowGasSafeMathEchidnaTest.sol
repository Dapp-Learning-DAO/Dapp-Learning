// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.7.6;

import '../libraries/LowGasSafeMath.sol';

contract LowGasSafeMathEchidnaTest {
    function checkAdd(uint256 x, uint256 y) external pure {
        uint256 z = LowGasSafeMath.add(x, y);
        assert(z == x + y);
        assert(z >= x && z >= y);
    }

    function checkSub(uint256 x, uint256 y) external pure {
        uint256 z = LowGasSafeMath.sub(x, y);
        assert(z == x - y);
        assert(z <= x);
    }

    function checkMul(uint256 x, uint256 y) external pure {
        uint256 z = LowGasSafeMath.mul(x, y);
        assert(z == x * y);
        assert(x == 0 || y == 0 || (z >= x && z >= y));
    }

    function checkAddi(int256 x, int256 y) external pure {
        int256 z = LowGasSafeMath.add(x, y);
        assert(z == x + y);
        assert(y < 0 ? z < x : z >= x);
    }

    function checkSubi(int256 x, int256 y) external pure {
        int256 z = LowGasSafeMath.sub(x, y);
        assert(z == x - y);
        assert(y < 0 ? z > x : z <= x);
    }
}
