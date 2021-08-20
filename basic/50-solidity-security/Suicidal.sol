pragma solidity ^0.5.13;
contract Suicidal{
    function kill() public{
        selfdestruct(msg.sender);
    }
}
