pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/Create2.sol";
import "./DemoWallet.sol";

contract DemoWalletFactory {

    function createWallet(IEntryPoint entryPoint, bytes32 root, bytes32 salt) external returns(address sender){
        return new DemoWallet{salt: salt}(entryPoint, owner);
    }

}