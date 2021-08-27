pragma solidity ^0.8.0;

import './DataContract.sol';
contract ControlContract {
    DataContract dataContract;

    constructor(address _dataContractAddr) public {
        dataContract = DataContract(_dataContractAddr);
    }

    function setBlance(address addr, uint256 v) public {
        dataContract.setBlance(addr,v);
    }

    function getBlance(address addr) public view returns (uint256) {
        return dataContract.getBlance(addr);
    }

}
