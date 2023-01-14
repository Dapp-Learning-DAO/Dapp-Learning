pragma solidity ^0.8.12;


//It takes a similar format of EIP-2470.
contract ERC4337Factory{
    
    function deploy(bytes memory _initCode, bytes32 _salt) external returns(address ret){
        assembly {
            ret := create2(0, add(_initCode, 32), mload(_initCode), _salt)
        }
        //Note:
        //1. 不要require(ret != address(0)),因为EP会检查ret是否大于0，然后抛出FailOp
        //2. sender创建后，需要一笔启动资金支付gas，不要在这里处理，而要配合Paymaster使用。如果在工厂存资金，因为任何人都能
        //调用deployAndFund，意味着资金会被薅干净
    }
}
