// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.10;

import {DSTestPlus} from "./utils/DSTestPlus.sol";

import {ReentrancyGuard} from "../utils/ReentrancyGuard.sol";

contract RiskyContract is ReentrancyGuard {
    uint256 public enterTimes;

    function unprotectedCall() public {
        enterTimes++;

        if (enterTimes > 1) return;

        protectedCall();
    }

    function protectedCall() public nonReentrant {
        enterTimes++;

        if (enterTimes > 1) return;

        protectedCall();
    }

    function overprotectedCall() public nonReentrant {}
}

contract ReentrancyGuardTest is DSTestPlus {
    RiskyContract riskyContract;

    function setUp() public {
        riskyContract = new RiskyContract();
    }

    function invariantReentrancyStatusAlways1() public {
        assertEq(uint256(hevm.load(address(riskyContract), 0)), 1);
    }

    function testFailUnprotectedCall() public {
        riskyContract.unprotectedCall();

        assertEq(riskyContract.enterTimes(), 1);
    }

    function testProtectedCall() public {
        try riskyContract.protectedCall() {
            fail("Reentrancy Guard Failed To Stop Attacker");
        } catch {}
    }

    function testNoReentrancy() public {
        riskyContract.overprotectedCall();
    }
}
