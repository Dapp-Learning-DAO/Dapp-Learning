pragma solidity >=0.4.25 <0.7.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/SimpleToken.sol";

contract TestSimpleToken {

  function testInitialBalanceUsingDeployedContract() public {
    SimpleToken simpletoken = new SimpleToken("Hello","Token",1,10000);

    uint expected = 100000;

    Assert.equal(simpletoken.balanceOf(tx.origin), expected, "Owner should have 100000 initially");
  }

  function testTransfer() public {
    SimpleToken simpletoken = new SimpleToken("Hello","Token",1,10000);

    uint expected = 100;
    address target = 0xFE63eDdC467E3E7bB6804ab21eAA18289355d02b;
    simpletoken.transfer(target,expected);

    Assert.equal(expected, simpletoken.balanceOf(target), "Owner should have 100000 initially");
  }

}

