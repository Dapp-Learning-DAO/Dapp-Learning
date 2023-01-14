pragma solidity ^0.8.12;

import "@account-abstraction/contracts/interfaces/IPaymaster.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../libs/EntryPointManager.sol";
contract GasPrefundPaymaster is IPaymaster, Ownable, EntryPointManager{

    address public sender;

    constructor(address _sender, address _entryPoint) EntryPointManager(_entryPoint){
        sender = _sender;
    }

    //用于证明自己真的愿意为这笔钱支付
    function validatePaymasterUserOp(UserOperation calldata userOp, bytes32 userOpHash, uint256 maxCost)
    external override returns (bytes memory context, uint256 sigTimeRange) {

        _requireEntryPoint();
        require(userOp.sender == sender, "This paymaster is not willing to pay you");

        (userOpHash, maxCost);

        return (new bytes(0), 0);
    }
    
    //Empty 
    function postOp(PostOpMode mode, bytes calldata context, uint256 actualGasCost) external override{
        _requireEntryPoint();
        (mode, context, actualGasCost);
    }

    //为自己充值，这笔钱在后面paymaster中会被扣掉
    function addDepositForSender() external payable onlyOwner {
        (bool success,) = entryPoint.call{value: msg.value}(abi.encodeWithSignature("depositTo(address)", address(this)));
        require(success, "Deposit failed");
    }

    function setSender(address _sender) public onlyOwner {
        sender = _sender;
    }
}