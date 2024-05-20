// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.4.25 <=0.8.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/SimpleToken.sol";

contract TestSimpleToken {
    function testInitialBalanceUsingDeployedContract() public {
        SimpleToken simpletoken = new SimpleToken("Hello", "Token", 1, 10000);

        uint256 expected = 100000;

        Assert.equal(
            simpletoken.balanceOf(address(this)),
            expected,
            "Owner should have 100000 initially"
        );
    }

    function testTransfer() public {
        SimpleToken simpletoken = new SimpleToken("Hello", "Token", 1, 10000);

        uint256 expected = 100;
        address target = 0xFE63eDdC467E3E7bB6804ab21eAA18289355d02b;
        simpletoken.transfer(target, expected);

        Assert.equal(
            expected,
            simpletoken.balanceOf(target),
            "Owner should have 100 initially"
        );
    }
}
