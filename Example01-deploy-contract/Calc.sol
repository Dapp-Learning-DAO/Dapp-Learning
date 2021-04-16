pragma solidity ^0.4.25;
contract Calc{
  /*区块链存储*/
  uint count;
  /*执行会写入数据，所以需要`transaction`的方式执行。*/
  function add(uint a, uint b) returns(uint64){
    count++;
    return count;
  }
  /*执行不会写入数据，所以允许`call`的方式执行。*/
  function getCount() constant returns (uint64){
    return count;
  }
}
