pragma solidity ^0.8.17;

import "./ExampleContract.sol";

contract ExampleContractFactory {

    event DeterministicContractDeployed(address contractAddress);

    function deployDeterministically(
        uint _exampleParam,
        uint _salt
    ) public returns (address) {
        ExampleContract deterministicContract = new ExampleContract{salt: bytes32(_salt)}(_exampleParam);
        address deterministicContractAddress = address(deterministicContract);

        emit DeterministicContractDeployed(deterministicContractAddress);
        return deterministicContractAddress;
    }

        function getAddress(
        bytes memory bytecode,
        uint _salt
    ) public view returns (address) {
        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), address(this), _salt, keccak256(bytecode))
        );

        // NOTE: cast last 20 bytes of hash to address
        return address(uint160(uint(hash)));
    }

    function getBytecode(uint _exampleParam) public pure returns (bytes memory) {
        bytes memory bytecode = type(ExampleContract).creationCode;

        return abi.encodePacked(bytecode, abi.encode(_exampleParam));
    }
}