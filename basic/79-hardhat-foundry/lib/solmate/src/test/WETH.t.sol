// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.10;

import {DSTestPlus} from "./utils/DSTestPlus.sol";
import {DSInvariantTest} from "./utils/DSInvariantTest.sol";

import {SafeTransferLib} from "../utils/SafeTransferLib.sol";

import {WETH} from "../tokens/WETH.sol";

contract WETHTest is DSTestPlus {
    WETH weth;

    function setUp() public {
        weth = new WETH();
    }

    function testDeposit() public {
        assertEq(weth.balanceOf(address(this)), 0);
        assertEq(weth.totalSupply(), 0);

        SafeTransferLib.safeTransferETH(address(weth), 1 ether);

        assertEq(weth.balanceOf(address(this)), 1 ether);
        assertEq(weth.totalSupply(), 1 ether);
    }

    function testFallbackDeposit() public {
        assertEq(weth.balanceOf(address(this)), 0);
        assertEq(weth.totalSupply(), 0);

        weth.deposit{value: 1 ether}();

        assertEq(weth.balanceOf(address(this)), 1 ether);
        assertEq(weth.totalSupply(), 1 ether);
    }

    function testWithdraw() public {
        uint256 startingBalance = address(this).balance;

        weth.deposit{value: 1 ether}();

        weth.withdraw(1 ether);

        uint256 balanceAfterWithdraw = address(this).balance;

        assertEq(balanceAfterWithdraw, startingBalance);
        assertEq(weth.balanceOf(address(this)), 0);
        assertEq(weth.totalSupply(), 0);
    }

    function testPartialWithdraw() public {
        weth.deposit{value: 1 ether}();

        uint256 balanceBeforeWithdraw = address(this).balance;

        weth.withdraw(0.5 ether);

        uint256 balanceAfterWithdraw = address(this).balance;

        assertEq(balanceAfterWithdraw, balanceBeforeWithdraw + 0.5 ether);
        assertEq(weth.balanceOf(address(this)), 0.5 ether);
        assertEq(weth.totalSupply(), 0.5 ether);
    }

    function testDeposit(uint256 amount) public {
        amount = bound(amount, 0, address(this).balance);

        assertEq(weth.balanceOf(address(this)), 0);
        assertEq(weth.totalSupply(), 0);

        SafeTransferLib.safeTransferETH(address(weth), amount);

        assertEq(weth.balanceOf(address(this)), amount);
        assertEq(weth.totalSupply(), amount);
    }

    function testFallbackDeposit(uint256 amount) public {
        amount = bound(amount, 0, address(this).balance);

        assertEq(weth.balanceOf(address(this)), 0);
        assertEq(weth.totalSupply(), 0);

        weth.deposit{value: amount}();

        assertEq(weth.balanceOf(address(this)), amount);
        assertEq(weth.totalSupply(), amount);
    }

    function testWithdraw(uint256 depositAmount, uint256 withdrawAmount) public {
        depositAmount = bound(depositAmount, 0, address(this).balance);
        withdrawAmount = bound(withdrawAmount, 0, depositAmount);

        weth.deposit{value: depositAmount}();

        uint256 balanceBeforeWithdraw = address(this).balance;

        weth.withdraw(withdrawAmount);

        uint256 balanceAfterWithdraw = address(this).balance;

        assertEq(balanceAfterWithdraw, balanceBeforeWithdraw + withdrawAmount);
        assertEq(weth.balanceOf(address(this)), depositAmount - withdrawAmount);
        assertEq(weth.totalSupply(), depositAmount - withdrawAmount);
    }

    receive() external payable {}
}

contract WETHInvariants is DSTestPlus, DSInvariantTest {
    WETHTester wethTester;
    WETH weth;

    function setUp() public {
        weth = new WETH();
        wethTester = new WETHTester{value: address(this).balance}(weth);

        addTargetContract(address(wethTester));
    }

    function invariantTotalSupplyEqualsBalance() public {
        assertEq(address(weth).balance, weth.totalSupply());
    }
}

contract WETHTester {
    WETH weth;

    constructor(WETH _weth) payable {
        weth = _weth;
    }

    function deposit(uint256 amount) public {
        weth.deposit{value: amount}();
    }

    function fallbackDeposit(uint256 amount) public {
        SafeTransferLib.safeTransferETH(address(weth), amount);
    }

    function withdraw(uint256 amount) public {
        weth.withdraw(amount);
    }

    receive() external payable {}
}
