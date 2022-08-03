pragma solidity 0.8.1;

import "@openzeppelin/contracts/utils/introspection/IERC1820Registry.sol";
import "hardhat/console.sol";
contract DemoConsumer {

    IERC1820Registry internal constant _ERC1820_REGISTRY = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);

    function doSomething() external {
        //The magic is, we can call set function of msg.sender, regardless whether it is an EOA!
        address implementer = _ERC1820_REGISTRY.getInterfaceImplementer(msg.sender, keccak256("callback(uint256)"));
        require(implementer != address(0), "not register on erc1820 registry");
        (bool success,) = implementer.call(abi.encodeWithSignature("callback(uint256)", 0x666));
        require(success, "Call failed");
    }


}