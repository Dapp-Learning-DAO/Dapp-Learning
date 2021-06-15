pragma solidity ^0.8.0;


interface IRandomNumberVRF  {

    function requestRandomNumber(uint256 userProvidedSeed) external returns (bytes32);

    function get()  external view  returns(uint256);

    function getById(bytes32 id)  external view  returns(uint256);

    function checkIdFulfilled(bytes32 id)  external view  returns(bool);

}