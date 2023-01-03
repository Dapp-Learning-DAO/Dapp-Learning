pragma solidity ^0.8.12;

import "./DemoAccount.sol";

contract DemoWalletFactory {

    address public sender;
    
    constructor(address payable _entryPoint, uint8 _threshold, address _owner, bytes32 _nonce) {
        DemoAccount demoAccount = new DemoAccount{salt: _nonce}(_entryPoint, _threshold, _owner);
        sender = address(demoAccount);
    }
    
    function getAccount(address payable entryPoint, uint8 threshold, address owner) external returns(address){
        return sender;
    }

}