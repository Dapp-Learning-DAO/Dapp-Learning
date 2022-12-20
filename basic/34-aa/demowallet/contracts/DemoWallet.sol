pragma solidity ^0.8.13;

import "../account-abstraction/contracts/interfaces/IWallet.sol";
import "../account-abstraction/contracts/interfaces/IEntryPoint.sol";


    //提供一个zk proof。
    //可以进行社交恢复。
    //即验证100个私钥中满足5个即可。
    //允许更替某一把验证私钥。
    //地址更替，那么链上的root也会更替，必须提交相关的证明

contract DemoWallet is IWallet{

    enum CallType {CALL, DELEGATECALL}

    IEntryPoint private entryPoint;
    uint256 private threshold;
    bytes32 root;

    modifier authorized() {
        require(msg.sender == address(this));
        _;
    }
    constructor(IEntryPoint _entryPoint, uint256 _threshold, bytes32 _root) {
        entryPoint = _entryPoint;
        threshold = _threshold;
        root = _root;
    }
    
    function validateUserOp(UserOperation calldata userOp, bytes32 requestId, address aggregator, uint256 missingWalletFunds)
    external returns (uint256 deadline) {
        //最基本的验证
        //从userOp的signatures字段里取出zk proof，用于校验threshold
        
    }
    
    //如何调用payable的接口？
    function execute(address to, CallType callType, bytes calldata data) external payable{
        //最基本的验证
        //从userOp的signatures字段里取出zk proof，用于校验threshold
        //如果失败怎么办,抛出错误还是返回false
        
        assembly {
            success := call()
        }
    }

    /**
    * 给钱包充钱
    */
    function deposit() external payable {
                
    }


    /**
    * 更新root，可否是internal的？或者说call可以调用internal的吗？
    */
    function updateRoot(bytes32 _newRoot) internal {
        require(root != _newRoot, "Invalid Root");
        root = _newRoot;
    }
}