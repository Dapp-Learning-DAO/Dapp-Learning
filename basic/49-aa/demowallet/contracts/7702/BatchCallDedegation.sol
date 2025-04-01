pragma solidity ^0.8.20;

contract BatchCallDelegation {
    event CallExecuted(address indexed to, uint256 indexed value, bytes data, bool success);

    struct Call {
        bytes data;
        address to;
        uint256 value;
    }

    function execute(Call[] calldata calls) external payable {
        require(msg.sender == address(this), "Only the contract owner can execute the calls");
        for (uint256 i = 0; i < calls.length; i++) {
            Call memory call = calls[i];
            (bool success, ) = call.to.call{value: call.value}(call.data);
            require(success, "call reverted");
            emit CallExecuted(call.to, call.value, call.data, success);
        }
    }
}