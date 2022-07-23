pragma solidity 0.8.1;

import "@openzeppelin/contracts/utils/introspection/ERC1820Implementer.sol";

contract DemoImplementer is ERC1820Implementer {

    address private owner;
    constructor() {
        owner = msg.sender;
        _registerInterfaceForAddress(keccak256("callback(uint256)"), msg.sender);
    }
    event CallBack(address interfaceAddress, address caller, uint256 args);
    function callback(uint256 args) external {
        emit CallBack(owner, msg.sender, args);
    }
}