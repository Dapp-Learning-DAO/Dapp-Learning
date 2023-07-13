pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/Create2.sol";


contract ContractFactory {

    event Deployed(address addr);

    function deploy(bytes calldata initCode, bytes32 salt) external  {
        address deployed = Create2.deploy(0, salt,initCode);
        require(deployed != address(0), "deploy failed");
        emit Deployed(deployed);
    } 

    function computeAddress(bytes calldata initCode, bytes32 salt) external view returns(address) {
        bytes32 initCodeHash = keccak256(initCode);
        address addr = Create2.computeAddress(salt, initCodeHash);
        return addr;
    }

}