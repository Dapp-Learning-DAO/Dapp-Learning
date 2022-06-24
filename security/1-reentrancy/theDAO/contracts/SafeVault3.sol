pragma solidity ^0.8.7;


import "./IVault.sol";

contract SafeVault3 is IVault {

    mapping(address=>uint256) public balances;
    
    function deposit() external override payable{
        balances[msg.sender] += msg.value;
    }

    function withdraw() external override {
        address payable target = payable(msg.sender);
        (bool success,) = target.call{gas:2300, value:balances[msg.sender]}("");
        require(success, "transfer failed!");
        balances[msg.sender] = 0;

        //Or use transfer:
        //target.transfer(balances[msg.sender]);
    }
}