pragma solidity ^0.4.25;
 
contract Calc{
  uint count;
  function add(uint a, uint b) returns(uint){
    count++;
    return count;
  }
  function getCount() returns (uint){
    return count;
  }
}
