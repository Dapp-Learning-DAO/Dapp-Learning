pragma solidity ^0.8.18;

import "./verifier.sol";

contract My is Verifier{

    bytes32 public dataHash;
    
    constructor(bytes32 _dataHash) {
        dataHash = _dataHash;
    }

    event Execute();

    function execute(bytes calldata zksnark) external{
        //Decode
        (uint[2] memory pA, uint[2][2] memory pB, uint[2] memory pC, uint[2] memory publicSignals)
        = abi.decode(zksnark, (uint[2], uint[2][2] , uint[2], uint[2]));
        //Verify zk
        bool success = verifyProof(pA, pB, pC, publicSignals);
        require(success, "zkProof verification failed");
        //Verify public signals
        bytes32 dataHashSignal = bytes32(publicSignals[1]);//Not zero, publicSignals[0]是输出信号
        require(dataHashSignal == dataHash, "Invalid data hash");


        //Execute
        emit Execute();
    }
}

