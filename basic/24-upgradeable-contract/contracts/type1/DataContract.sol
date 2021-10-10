pragma solidity ^0.8.0;

contract DataContract {
    mapping(address => uint256) private balanceOf;
    mapping(address => bool) private accessAllowed;

    constructor() public {
        accessAllowed[msg.sender] = true;
    }

    modifier platform() {
        require(accessAllowed[msg.sender] == true, "Not sufficient permission");
        _;
    }

    function allowAccess(address _addr) public platform {
        accessAllowed[_addr] = true;
    }

    function denyAccess(address _addr) public platform {
        accessAllowed[_addr] = false;
    }

    function setBalance(address _address, uint256 v) public platform {
        balanceOf[_address] = v;
    }

    function getBalance(address _address) public view returns (uint256) {
        return balanceOf[_address];
    }
}
