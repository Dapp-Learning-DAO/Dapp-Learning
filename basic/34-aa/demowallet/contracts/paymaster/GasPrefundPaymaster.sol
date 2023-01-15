pragma solidity ^0.8.12;

import "@account-abstraction/contracts/interfaces/IPaymaster.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../libs/EntryPointManager.sol";
contract GasPrefundPaymaster is IPaymaster, Ownable, EntryPointManager{

    address public sender;

    constructor(address _sender, address _entryPoint) EntryPointManager(_entryPoint){
        sender = _sender;
    }

    //用于证明自己真的愿意为这笔钱支付。启动资金的问题作为一道思考题，启发大家引出pm
    function validatePaymasterUserOp(UserOperation calldata userOp, bytes32 userOpHash, uint256 maxCost)
    external override returns (bytes memory context, uint256 sigTimeRange) {

        _requireEntryPoint();
        //大胆的报错，证明自己不想给这个人支付
        require(userOp.sender == sender, "This paymaster is not willing to pay you");

        (userOpHash, maxCost);
        //还可以做一些额外操作，例如支付sender一笔资金,让sender执行日常的业务操作
        require(userOp.sender.code.length > 0, "sender not existed");
        (bool success, ) = payable(userOp.sender).call{value: 10000}("");
        require(success, "business fund failed");
        return (new bytes(0), 0);
    }
    
    //Empty 
    function postOp(PostOpMode mode, bytes calldata context, uint256 actualGasCost) external override{
        _requireEntryPoint();
        (mode, context, actualGasCost);
    }

    //为自己充值gas，这笔钱在后面paymaster中会被扣掉
    function addDepositForSender() external payable onlyOwner {
        (bool success,) = entryPoint.call{value: msg.value}(abi.encodeWithSignature("depositTo(address)", address(this)));
        require(success, "Deposit failed");
    }

    //充值其他资金，用于给sender支付一些业务方面启动资金，这样后面sender里面可以直接转账了。
    receive() external payable{
        
    }
    function setSender(address _sender) public onlyOwner {
        sender = _sender;
    }
}