pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC777/ERC777.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";


contract ImBTCSimple is AccessControl, ERC777 {

    bytes32 public constant MINTER_ROLE = keccak256("minter");

    constructor() ERC777("ImBTC","ImBTC Simplified Version",new address[](0)){
        super._grantRole(MINTER_ROLE, msg.sender);
    }
    
    function mint(address recepient, uint256 amount, bytes memory userData, bytes memory operatorData) external onlyRole(MINTER_ROLE){
        _mint(recepient, amount, userData, operatorData);
    }
}