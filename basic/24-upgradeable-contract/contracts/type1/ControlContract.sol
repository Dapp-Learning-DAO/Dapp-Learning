pragma solidity ^0.8.0;

import './DataContract.sol';
contract ControlContract {
    DataContract dataContract;

    constructor(address _dataContractAddr) public {
        dataContract = DataContract(_dataContractAddr);
    }

    function setBalance(address addr, uint256 v) public {
        dataContract.setBalance(addr,v);
    }

    function getBalance(address addr) public view returns (uint256) {
        return dataContract.getBalance(addr);
    }

}
